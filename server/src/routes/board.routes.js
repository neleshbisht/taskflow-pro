import express from "express";
import Board from "../models/Board.js";
import { authRequired } from "../middleware/auth.js";
import { getWorkspaceRole, requireWorkspaceRole } from "../utils/workspaceAccess.js";

const router = express.Router();

// List boards for a workspace (member+ allowed)
router.get("/workspace/:workspaceId", authRequired, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;

  const access = await getWorkspaceRole(userId, workspaceId);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  const boards = await Board.find({ workspace: workspaceId })
    .sort({ createdAt: -1 })
    .select("name columns createdAt");

  res.json({ boards });
});

// Create board (admin/manager only)
router.post("/workspace/:workspaceId", authRequired, async (req, res) => {
  const { workspaceId } = req.params;
  const userId = req.user.id;
  const { name } = req.body;

  const access = await getWorkspaceRole(userId, workspaceId);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  if (!requireWorkspaceRole("manager")(access.role)) {
    return res.status(403).json({ message: "Only admin/manager can create boards" });
  }

  if (!name?.trim()) return res.status(400).json({ message: "Board name required" });

  const board = await Board.create({
    workspace: workspaceId,
    name: name.trim(),
  });

  res.status(201).json({ board });
});

export default router;