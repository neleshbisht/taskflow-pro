import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

import connectDB from "./config/db.js";

// routes (adjust names if your files differ)
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import boardRoutes from "./routes/board.routes.js";
import taskRoutes from "./routes/task.routes.js";
import inviteRoutes from "./routes/invite.routes.js";
import activityRoutes from "./routes/activity.routes.js";

dotenv.config();

const app = express();

// ✅ Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ CORS for Vercel + Local
const allowedOrigins = [
  process.env.CLIENT_URL,       // Vercel URL (set later)
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // Postman/no-origin
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  })
);

// ✅ Create HTTP server + Socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

// ✅ Socket rooms
io.on("connection", (socket) => {
  socket.on("join", ({ workspaceId }) => {
    if (workspaceId) socket.join(`ws:${workspaceId}`);
  });

  socket.on("leave", ({ workspaceId }) => {
    if (workspaceId) socket.leave(`ws:${workspaceId}`);
  });
});

// ✅ Make io available in routes (req.io)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ✅ Routes
app.get("/", (req, res) => res.send("TaskFlow Pro API running"));
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/invites", inviteRoutes);
app.use("/api/activity", activityRoutes);

// ✅ Start
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  });