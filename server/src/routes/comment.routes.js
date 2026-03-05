import express from "express";
import Comment from "../models/Comment.js";
import Task from "../models/Task.js";
import Board from "../models/Board.js";
import Workspace from "../models/Workspace.js";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

async function canAccessWorkspace(userId, workspaceId) {
  const ws = await Workspace.findById(workspaceId).select("owner members");
  if (!ws) return { ok: false, ws: null };
  const isOwner = ws.owner.toString() === userId;
  const isMember = ws.members?.some((m) => m.user.toString() === userId);
  return { ok: isOwner || isMember, ws };
}

// Get comments for a task
router.get("/task/:taskId", authRequired, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;

  const task = await Task.findById(taskId).select("workspace board");
  if (!task) return res.status(404).json({ message: "Task not found" });

  const access = await canAccessWorkspace(userId, task.workspace);
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  const comments = await Comment.find({ task: taskId })
    .sort({ createdAt: 1 })
    .populate("author", "name email role");

  res.json({ comments });
});

// Add a comment to a task
router.post("/task/:taskId", authRequired, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  const { text } = req.body;

  if (!text?.trim()) return res.status(400).json({ message: "Comment text required" });

  const task = await Task.findById(taskId).select("workspace board title");
  if (!task) return res.status(404).json({ message: "Task not found" });

  const access = await canAccessWorkspace(userId, task.workspace);
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  const comment = await Comment.create({
    workspace: task.workspace,
    board: task.board,
    task: taskId,
    author: userId,
    text: text.trim(),
  });

  const populated = await Comment.findById(comment._id).populate("author", "name email role");

  // Activity log
  await Activity.create({
    workspace: task.workspace,
    actor: userId,
    type: "COMMENT_ADDED",
    meta: { taskId, taskTitle: task.title, textPreview: text.trim().slice(0, 80) },
  });

  req.io?.to(`ws:${task.workspace}`).emit("activity:new");

  // realtime emit to workspace room
  req.io?.to(`ws:${task.workspace}`).emit("comment:added", {
    taskId,
    comment: populated,
  });

  res.status(201).json({ comment: populated });
});

export default router;