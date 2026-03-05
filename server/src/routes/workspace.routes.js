import express from "express";
import Workspace from "../models/Workspace.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

// Get my workspaces
router.get("/", authRequired, async (req, res) => {
  const userId = req.user.id;

  const workspaces = await Workspace.find({
    $or: [{ owner: userId }, { "members.user": userId }],
  })
    .sort({ createdAt: -1 })
    .select("name owner members createdAt");

  res.json({ workspaces });
});

// Create workspace (owner becomes admin)
router.post("/", authRequired, async (req, res) => {
  const userId = req.user.id;
  const { name } = req.body;

  if (!name?.trim()) return res.status(400).json({ message: "Workspace name required" });

  const ws = await Workspace.create({
    name: name.trim(),
    owner: userId,
    members: [{ user: userId, role: "admin" }],
  });

  res.status(201).json({ workspace: ws });
});

export default router;