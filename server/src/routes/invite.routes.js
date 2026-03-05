import express from "express";
import crypto from "crypto";
import Invite from "../models/Invite.js";
import Workspace from "../models/Workspace.js";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";
import { getWorkspaceRole, requireWorkspaceRole } from "../utils/workspaceAccess.js";

const router = express.Router();

// List invites sent for a workspace (admin/manager)
router.get("/workspace/:workspaceId", authRequired, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;

  const access = await getWorkspaceRole(userId, workspaceId);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  if (!requireWorkspaceRole("manager")(access.role)) {
    return res.status(403).json({ message: "Only admin/manager can view invites" });
  }

  const invites = await Invite.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("invitedBy", "name email role");

  res.json({ invites });
});

// Create invite (admin/manager)
router.post("/workspace/:workspaceId", authRequired, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;
  const { email, role } = req.body;

  const access = await getWorkspaceRole(userId, workspaceId);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  if (!requireWorkspaceRole("manager")(access.role)) {
    return res.status(403).json({ message: "Only admin/manager can invite" });
  }

  const cleanEmail = (email || "").toLowerCase().trim();
  if (!cleanEmail) return res.status(400).json({ message: "Email required" });

  const inviteRole = role === "manager" ? "manager" : "member";

  // if already member -> block
  const ws = await Workspace.findById(workspaceId).select("members owner");
  const isMember =
    ws.owner.toString() === userId ||
    ws.members.some((m) => m.user.toString() === userId) ||
    ws.members.some((m) => m.user?.email === cleanEmail);

  // We cannot reliably match user by email from workspace members (they store userId), so we only prevent duplicate pending.
  const existingPending = await Invite.findOne({ workspace: workspaceId, email: cleanEmail, status: "pending" });
  if (existingPending) return res.status(409).json({ message: "Invite already pending for this email" });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const invite = await Invite.create({
    workspace: workspaceId,
    email: cleanEmail,
    role: inviteRole,
    invitedBy: userId,
    token,
    expiresAt,
  });

  await Activity.create({
    workspace: workspaceId,
    actor: userId,
    type: "INVITE_SENT",
    meta: { email: cleanEmail, role: inviteRole },
  });

  req.io?.to(`ws:${workspaceId}`).emit("activity:new");

  // In real product we'd email a link. For portfolio: show token/link in UI.
  res.status(201).json({ invite });
});

// My pending invites (by my logged-in email)
router.get("/mine", authRequired, async (req, res) => {
  const myEmail = (req.user.email || "").toLowerCase().trim();
  if (!myEmail) return res.json({ invites: [] });

  const invites = await Invite.find({
    email: myEmail,
    status: "pending",
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .populate("workspace", "name");

  res.json({ invites });
});

// Accept invite
router.post("/:inviteId/accept", authRequired, async (req, res) => {
  const { inviteId } = req.params;
  const userId = req.user.id;
  const myEmail = (req.user.email || "").toLowerCase().trim();

  const invite = await Invite.findById(inviteId);
  if (!invite) return res.status(404).json({ message: "Invite not found" });
  if (invite.status !== "pending") return res.status(400).json({ message: "Invite not pending" });
  if (invite.expiresAt <= new Date()) return res.status(400).json({ message: "Invite expired" });
  if (invite.email !== myEmail) return res.status(403).json({ message: "This invite is not for your email" });

  const ws = await Workspace.findById(invite.workspace);
  if (!ws) return res.status(404).json({ message: "Workspace not found" });

  const already = ws.members.some((m) => m.user.toString() === userId);
  if (!already) ws.members.push({ user: userId, role: invite.role });
  await ws.save();

  invite.status = "accepted";
  await invite.save();

  await Activity.create({
    workspace: invite.workspace,
    actor: userId,
    type: "INVITE_ACCEPTED",
    meta: { workspaceId: invite.workspace.toString() },
  });

  req.io?.to(`ws:${invite.workspace}`).emit("activity:new");

  res.json({ ok: true });
});

// Decline invite
router.post("/:inviteId/decline", authRequired, async (req, res) => {
  const { inviteId } = req.params;
  const myEmail = (req.user.email || "").toLowerCase().trim();

  const invite = await Invite.findById(inviteId);
  if (!invite) return res.status(404).json({ message: "Invite not found" });
  if (invite.status !== "pending") return res.status(400).json({ message: "Invite not pending" });
  if (invite.email !== myEmail) return res.status(403).json({ message: "This invite is not for your email" });

  invite.status = "declined";
  await invite.save();

  res.json({ ok: true });
});

// Get invite by token (public-ish, but still requires auth in our app flow if you want)
// We'll allow GET without auth so user can see workspace name before accepting.
// (No sensitive info here.)
router.get("/token/:token", async (req, res) => {
  const { token } = req.params;

  const invite = await Invite.findOne({ token })
    .populate("workspace", "name")
    .select("email role status expiresAt workspace");

  if (!invite) return res.status(404).json({ message: "Invite not found" });
  if (invite.status !== "pending") return res.status(400).json({ message: "Invite is not pending" });
  if (invite.expiresAt <= new Date()) return res.status(400).json({ message: "Invite expired" });

  res.json({
    invite: {
      email: invite.email,
      role: invite.role,
      status: invite.status,
      expiresAt: invite.expiresAt,
      workspace: invite.workspace,
    },
  });
});

// Accept invite by token (requires auth)
router.post("/token/:token/accept", authRequired, async (req, res) => {
  const { token } = req.params;
  const userId = req.user.id;
  const myEmail = (req.user.email || "").toLowerCase().trim();

  const invite = await Invite.findOne({ token });
  if (!invite) return res.status(404).json({ message: "Invite not found" });
  if (invite.status !== "pending") return res.status(400).json({ message: "Invite not pending" });
  if (invite.expiresAt <= new Date()) return res.status(400).json({ message: "Invite expired" });
  if (invite.email !== myEmail) return res.status(403).json({ message: "This invite is not for your email" });

  const ws = await Workspace.findById(invite.workspace);
  if (!ws) return res.status(404).json({ message: "Workspace not found" });

  const already = ws.members.some((m) => m.user.toString() === userId);
  if (!already) ws.members.push({ user: userId, role: invite.role });
  await ws.save();

  invite.status = "accepted";
  await invite.save();

  await Activity.create({
    workspace: invite.workspace,
    actor: userId,
    type: "INVITE_ACCEPTED",
    meta: { via: "token", workspaceId: invite.workspace.toString() },
  });

  req.io?.to(`ws:${invite.workspace}`).emit("activity:new");

  res.json({ ok: true });
});

export default router;