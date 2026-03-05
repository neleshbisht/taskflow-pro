import { useEffect, useState } from "react";
import API from "../api/api";
import { useSocket } from "../context/SocketContext";

export default function TaskModal({ task, onClose }) {
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const load = async () => {
    const res = await API.get(`/comments/task/${task._id}`);
    setComments(res.data.comments || []);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task._id]);

  // realtime: new comments
  useEffect(() => {
    if (!socket) return;

    const onAdded = ({ taskId, comment }) => {
      if (taskId !== task._id) return;
      setComments((prev) => [...prev, comment]);
    };

    socket.on("comment:added", onAdded);
    return () => socket.off("comment:added", onAdded);
  }, [socket, task._id]);

  const send = async (e) => {
    e.preventDefault();
    setErr("");
    if (!text.trim()) return;

    try {
      const res = await API.post(`/comments/task/${task._id}`, { text });
      setText("");
      // server emits realtime; but add too (safe)
      setComments((prev) => [...prev, res.data.comment]);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to comment");
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div className="card" style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.head}>
          <div>
            <h3 style={{ margin: 0 }}>{task.title}</h3>
            <div className="muted small" style={{ marginTop: 6 }}>
              Task ID: {task._id}
            </div>
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <b>Comments</b>
          <div className="muted small" style={{ marginTop: 6 }}>
            Realtime updates enabled
          </div>

          <div style={{ marginTop: 10, maxHeight: 260, overflow: "auto", display: "grid", gap: 10 }}>
            {comments.length === 0 ? (
              <div className="muted small">No comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c._id} style={styles.comment}>
                  <div style={{ fontWeight: 900 }}>
                    {c.author?.name || "User"}{" "}
                    <span className="muted small" style={{ fontWeight: 700 }}>
                      • {new Date(c.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="muted" style={{ marginTop: 6 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>

          {err && (
            <div className="card" style={{ marginTop: 10, borderColor: "rgba(255,80,80,.4)" }}>
              {err}
            </div>
          )}

          <form onSubmit={send} style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <input
              className="input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
            />
            <button className="btn">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,.55)",
    display: "grid",
    placeItems: "center",
    padding: 18,
    zIndex: 9999,
  },
  modal: {
    width: "min(820px, 96vw)",
    borderRadius: 18,
  },
  head: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "start",
  },
  comment: {
    padding: 12,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.10)",
    background: "rgba(255,255,255,.03)",
  },
};