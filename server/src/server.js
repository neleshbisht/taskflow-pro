import inviteRoutes from "./routes/invite.routes.js";
import activityRoutes from "./routes/activity.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import taskRoutes from "./routes/task.routes.js";
import boardRoutes from "./routes/board.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.js";
import authRoutes from "./routes/auth.routes.js";
import { initSockets } from "./sockets/index.js";

dotenv.config();

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get("/", (req, res) => res.json({ ok: true, name: "TaskFlow Pro API" }));


app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/invites", inviteRoutes);

// (we will add workspace/board/task routes next)
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

initSockets(io);

await connectDB(process.env.MONGO_URI);

server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});