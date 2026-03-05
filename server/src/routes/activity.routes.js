import express from "express";
import Activity from "../models/Activity.js";
import Workspace from "../models/Workspace.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

async function canAccessWorkspace(userId, workspaceId) {
  const ws = await Workspace.findById(workspaceId).select("owner members");
  if (!ws) return { ok: false, ws: null };
  const isOwner = ws.owner.toString() === userId;
  const isMember = ws.members?.some((m) => m.user.toString() === userId);
  return { ok: isOwner || isMember, ws };
}

// GET /api/activity/workspace/:workspaceId
router.get("/workspace/:workspaceId", authRequired, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;

  const access = await canAccessWorkspace(userId, workspaceId);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  const items = await Activity.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "name email role");

  res.json({ items });
});

export default router;