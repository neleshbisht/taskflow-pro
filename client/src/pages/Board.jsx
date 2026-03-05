import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useParams, Link } from "react-router-dom";
import API from "../api/api";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import TaskModal from "../components/TaskModal";

export default function BoardPage() {
  const { boardId } = useParams();
  const { socket } = useSocket();
  const { user } = useAuth();

  const canManage = user?.role === "admin" || user?.role === "manager";

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [activeTask, setActiveTask] = useState(null);

  const byColumn = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      map[t.columnId] = map[t.columnId] || [];
      map[t.columnId].push(t);
    }
    Object.keys(map).forEach((k) => map[k].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    return map;
  }, [tasks]);

  const load = async () => {
    const res = await API.get(`/tasks/board/${boardId}`);
    setBoard(res.data.board);
    setTasks(res.data.tasks || []);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  // realtime: task created/moved
  useEffect(() => {
    if (!socket) return;

    const onCreated = ({ task }) => {
      if (task.board !== boardId) return;
      setTasks((prev) => [...prev, task]);
    };

    const onMoved = ({ task }) => {
      if (task.board !== boardId) return;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };

    socket.on("task:created", onCreated);
    socket.on("task:moved", onMoved);

    return () => {
      socket.off("task:created", onCreated);
      socket.off("task:moved", onMoved);
    };
  }, [socket, boardId]);

  const createTask = async (colId) => {
    if (!canManage) return;
    if (!title.trim()) return;

    try {
      const res = await API.post(`/tasks/board/${boardId}`, { title, columnId: colId });
      setTitle("");
      setTasks((prev) => [...prev, res.data.task]);
    } catch (e) {
      alert(e?.response?.data?.message || "Not allowed");
    }
  };

  const onDragEnd = async (result) => {
    if (!canManage) return;

    const { destination, source, draggableId } = result;
    if (!destination) return;

    const fromCol = source.droppableId;
    const toCol = destination.droppableId;
    const toIndex = destination.index;

    if (fromCol === toCol && source.index === toIndex) return;

    // optimistic
    setTasks((prev) => {
      const copy = [...prev];
      const t = copy.find((x) => x._id === draggableId);
      if (!t) return prev;
      t.columnId = toCol;
      t.order = toIndex;
      return copy;
    });

    try {
      await API.patch(`/tasks/${draggableId}/move`, { toColumnId: toCol, toIndex });
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || "Not allowed");
      await load();
    }
  };

  if (!board) {
    return (
      <div className="container">
        <div className="card">Loading board…</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="brand">
          <span className="dot" /> {board.name}
        </div>
        <div className="muted small">
          <Link to="/dashboard" style={{ textDecoration: "none" }}>← Back</Link>
        </div>
      </div>

      {!canManage && (
        <div className="card" style={{ marginBottom: 14 }}>
          <b>Read-only mode</b>
          <div className="muted small">Members can view + comment. Managers/Admins can create/move tasks.</div>
        </div>
      )}

      {canManage && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="muted small">Create task (adds to Todo)</div>
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title…" />
            <button className="btn" onClick={() => createTask("todo")}>Add</button>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {board.columns.map((col) => (
            <div key={col.id} className="card">
              <div style={{ fontWeight: 900, marginBottom: 10 }}>{col.title}</div>

              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={{ minHeight: 120 }}>
                    {(byColumn[col.id] || []).map((t, idx) => (
                      <Draggable
                        key={t._id}
                        draggableId={t._id}
                        index={idx}
                        isDragDisabled={!canManage}
                      >
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className="card"
                            onClick={() => setActiveTask(t)}
                            style={{
                              marginBottom: 10,
                              padding: 12,
                              borderColor: "rgba(255,255,255,.12)",
                              background: "rgba(255,255,255,.05)",
                              cursor: "pointer",
                              opacity: !canManage ? 0.92 : 1,
                              ...p.draggableProps.style,
                            }}
                          >
                            <div style={{ fontWeight: 800 }}>{t.title}</div>
                            <div className="muted small">
                              {canManage ? "Drag to move • Click for comments" : "Click for comments"}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              {canManage && (
                <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={() => createTask(col.id)}>
                  Add to {col.title}
                </button>
              )}
            </div>
          ))}
        </div>
      </DragDropContext>

      {activeTask && <TaskModal task={activeTask} onClose={() => setActiveTask(null)} />}
    </div>
  );
}