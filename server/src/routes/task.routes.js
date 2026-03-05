import express from "express";
import Task from "../models/Task.js";
import Board from "../models/Board.js";
import Activity from "../models/Activity.js";
import { authRequired } from "../middleware/auth.js";
import { getWorkspaceRole, requireWorkspaceRole } from "../utils/workspaceAccess.js";

const router = express.Router();

// List tasks for a board (member+ allowed)
router.get("/board/:boardId", authRequired, async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;

  const board = await Board.findById(boardId).select("workspace columns name");
  if (!board) return res.status(404).json({ message: "Board not found" });

  const access = await getWorkspaceRole(userId, board.workspace);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  const tasks = await Task.find({ board: boardId }).sort({ order: 1, createdAt: -1 });
  res.json({ board, tasks });
});

// Create task (admin/manager only)
router.post("/board/:boardId", authRequired, async (req, res) => {
  const { boardId } = req.params;
  const userId = req.user.id;
  const { title, columnId = "todo" } = req.body;

  const board = await Board.findById(boardId).select("workspace columns name");
  if (!board) return res.status(404).json({ message: "Board not found" });

  const access = await getWorkspaceRole(userId, board.workspace);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  if (!requireWorkspaceRole("manager")(access.role)) {
    return res.status(403).json({ message: "Only admin/manager can create tasks" });
  }

  if (!title?.trim()) return res.status(400).json({ message: "Title required" });

  const countInColumn = await Task.countDocuments({ board: boardId, columnId });

  const task = await Task.create({
    workspace: board.workspace,
    board: boardId,
    title: title.trim(),
    columnId,
    order: countInColumn,
  });

  await Activity.create({
    workspace: board.workspace,
    actor: userId,
    type: "TASK_CREATED",
    meta: {
      boardId,
      boardName: board.name,
      taskId: task._id.toString(),
      title: task.title,
      columnId,
    },
  });

  req.io?.to(`ws:${board.workspace}`).emit("task:created", { task });
  req.io?.to(`ws:${board.workspace}`).emit("activity:new");

  res.status(201).json({ task });
});

// Move task (admin/manager only)
router.patch("/:taskId/move", authRequired, async (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  const { toColumnId, toIndex } = req.body;

  const task = await Task.findById(taskId);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const board = await Board.findById(task.board).select("workspace columns name");
  if (!board) return res.status(404).json({ message: "Board not found" });

  const access = await getWorkspaceRole(userId, board.workspace);
  if (!access.ws) return res.status(404).json({ message: "Workspace not found" });
  if (!access.ok) return res.status(403).json({ message: "Forbidden" });

  if (!requireWorkspaceRole("manager")(access.role)) {
    return res.status(403).json({ message: "Only admin/manager can move tasks" });
  }

  const fromColumnId = task.columnId;

  const destTasks = await Task.find({ board: task.board, columnId: toColumnId }).sort({ order: 1 });
  const fromTasks = await Task.find({ board: task.board, columnId: fromColumnId }).sort({ order: 1 });

  const fromFiltered = fromTasks.filter((t) => t._id.toString() !== taskId);
  const destFiltered = destTasks.filter((t) => t._id.toString() !== taskId);

  const idx = Math.max(0, Math.min(Number(toIndex ?? 0), destFiltered.length));
  destFiltered.splice(idx, 0, task);

  task.columnId = toColumnId;
  await task.save();

  await Promise.all(fromFiltered.map((t, i) => Task.updateOne({ _id: t._id }, { $set: { order: i } })));
  await Promise.all(
    destFiltered.map((t, i) =>
      Task.updateOne({ _id: t._id }, { $set: { order: i, columnId: toColumnId } })
    )
  );

  const updated = await Task.findById(taskId);

  await Activity.create({
    workspace: board.workspace,
    actor: userId,
    type: "TASK_MOVED",
    meta: {
      boardId: board._id.toString(),
      boardName: board.name,
      taskId,
      title: updated.title,
      fromColumnId,
      toColumnId,
      toIndex: idx,
    },
  });

  req.io?.to(`ws:${board.workspace}`).emit("task:moved", { task: updated });
  req.io?.to(`ws:${board.workspace}`).emit("activity:new");

  res.json({ task: updated });
});

export default router;