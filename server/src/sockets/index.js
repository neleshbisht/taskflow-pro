export function initSockets(io) {
  io.on("connection", (socket) => {
    // client will call: socket.emit("join", { workspaceId })
    socket.on("join", ({ workspaceId }) => {
      if (workspaceId) socket.join(`ws:${workspaceId}`);
    });

    socket.on("leave", ({ workspaceId }) => {
      if (workspaceId) socket.leave(`ws:${workspaceId}`);
    });

    socket.on("disconnect", () => {});
  });
}

// Helper to emit workspace events
export function emitToWorkspace(io, workspaceId, event, payload) {
  io.to(`ws:${workspaceId}`).emit(event, payload);
}