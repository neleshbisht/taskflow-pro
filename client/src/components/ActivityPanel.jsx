import { useEffect, useState } from "react";
import API from "../api/api";
import { useSocket } from "../context/SocketContext";

function formatItem(a) {
  const name = a.actor?.name || "User";
  const t = new Date(a.createdAt).toLocaleString();

  if (a.type === "TASK_CREATED") {
    return `${name} created task “${a.meta?.title || ""}”`;
  }
  if (a.type === "TASK_MOVED") {
    return `${name} moved “${a.meta?.title || ""}” → ${a.meta?.toColumnId}`;
  }
  if (a.type === "COMMENT_ADDED") {
    return `${name} commented on “${a.meta?.taskTitle || ""}”`;
  }
  return `${name} did ${a.type}`;
}

export default function ActivityPanel({ workspaceId }) {
  const { socket } = useSocket();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await API.get(`/activity/workspace/${workspaceId}`);
      setItems(res.data.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // realtime: refresh when server says new activity happened
  useEffect(() => {
    if (!socket || !workspaceId) return;

    const onNew = () => {
      load().catch(() => {});
    };

    socket.on("activity:new", onNew);
    return () => socket.off("activity:new", onNew);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, workspaceId]);

  return (
    <div className="card" style={{ height: "fit-content" }}>
      <h3 style={{ marginTop: 0 }}>Activity</h3>
      <div className="muted small">Realtime audit log (last 50 events)</div>

      {loading && <div className="muted small" style={{ marginTop: 10 }}>Loading…</div>}

      <div style={{ marginTop: 12, display: "grid", gap: 10, maxHeight: 420, overflow: "auto" }}>
        {items.length === 0 && !loading ? (
          <div className="muted small">No activity yet.</div>
        ) : (
          items.map((a) => (
            <div
              key={a._id}
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,.10)",
                background: "rgba(255,255,255,.03)",
              }}
            >
              <div style={{ fontWeight: 900 }}>{formatItem(a)}</div>
              <div className="muted small" style={{ marginTop: 6 }}>
                {new Date(a.createdAt).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}