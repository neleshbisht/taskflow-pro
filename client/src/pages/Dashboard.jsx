import MyInvites from "../components/MyInvites";
import InviteManager from "../components/InviteManager";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import ActivityPanel from "../components/ActivityPanel";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const nav = useNavigate();

  const canManage = user?.role === "admin" || user?.role === "manager";

  const [workspaces, setWorkspaces] = useState([]);
  const [wsName, setWsName] = useState("");
  const [activeWs, setActiveWs] = useState(null);

  const [boards, setBoards] = useState([]);
  const [boardName, setBoardName] = useState("");

  const [err, setErr] = useState("");

  const loadWorkspaces = async () => {
    const res = await API.get("/workspaces");
    setWorkspaces(res.data.workspaces || []);
  };

  const loadBoards = async (workspaceId) => {
    const res = await API.get(`/boards/workspace/${workspaceId}`);
    setBoards(res.data.boards || []);
  };

  useEffect(() => {
    loadWorkspaces().catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeWs?._id) return;

    loadBoards(activeWs._id).catch(() => {});
    if (socket) socket.emit("join", { workspaceId: activeWs._id });

    return () => {
      if (socket) socket.emit("leave", { workspaceId: activeWs._id });
    };
  }, [socket, activeWs]);

  const createWorkspace = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const res = await API.post("/workspaces", { name: wsName });
      setWsName("");
      await loadWorkspaces();
      setActiveWs(res.data.workspace);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Failed to create workspace");
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!activeWs?._id) return;
    setErr("");
    try {
      await API.post(`/boards/workspace/${activeWs._id}`, { name: boardName });
      setBoardName("");
      await loadBoards(activeWs._id);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Only admin/manager can create boards");
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="brand">
          <span className="dot" /> TaskFlow Pro
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div className="muted small">
            {user?.name} • <b>{user?.role}</b>
          </div>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {err && (
        <div className="card" style={{ borderColor: "rgba(255,80,80,.4)", marginBottom: 14 }}>
          {err}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1.25fr .9fr .95fr", gap: 14 }}>
        {/* Workspaces */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Workspaces</h2>
          <p className="muted small">Create a workspace and start collaborating.</p>

          <form onSubmit={createWorkspace}>
            <label className="small muted">Workspace name</label>
            <input
              className="input"
              value={wsName}
              onChange={(e) => setWsName(e.target.value)}
              placeholder="e.g. Product Team"
            />
            <button className="btn" style={{ width: "100%", marginTop: 12 }}>
              Create Workspace
            </button>
          </form>

          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            {workspaces.length === 0 && <div className="muted small">No workspaces yet.</div>}

            {workspaces.map((ws) => (
              <button
                key={ws._id}
                className="btn"
                style={{
                  textAlign: "left",
                  padding: 14,
                  background:
                    activeWs?._id === ws._id ? "rgba(106,227,255,.12)" : "rgba(255,255,255,.06)",
                }}
                onClick={() => setActiveWs(ws)}
              >
                <div style={{ fontWeight: 900 }}>{ws.name}</div>
                <div className="muted small">Click to load boards</div>
              </button>
            ))}
          </div>
        </div>

        {/* Boards */}
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Boards</h2>
          <div className="muted small">
            Active workspace: <b>{activeWs ? activeWs.name : "None"}</b>
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>
            Socket connected: {socket ? "Yes" : "No"}
          </div>

          {!activeWs && (
            <div className="card" style={{ marginTop: 14 }}>
              <b>Select a workspace</b>
              <div className="muted small">Then open a board.</div>
            </div>
          )}

          {activeWs && (
            <>
              {!canManage && (
                <div className="card" style={{ marginTop: 14 }}>
                  <b>Read-only mode</b>
                  <div className="muted small">Members can view boards and comment on tasks.</div>
                </div>
              )}

              {canManage && (
                <form onSubmit={createBoard} style={{ marginTop: 14 }}>
                  <label className="small muted">Board name</label>
                  <input
                    className="input"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="e.g. Sprint Board"
                  />
                  <button className="btn" style={{ width: "100%", marginTop: 12 }}>
                    Create Board
                  </button>
                </form>
              )}

              <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
                {boards.length === 0 && <div className="muted small">No boards yet.</div>}

                {boards.map((b) => (
                  <div key={b._id} className="card">
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div>
                        <div style={{ fontWeight: 900 }}>{b.name}</div>
                        <div className="muted small">
                          Columns: {b.columns?.map((c) => c.title).join(" • ")}
                        </div>
                      </div>

                      <button className="btn" onClick={() => nav(`/boards/${b._id}`)}>
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Activity */}
        <ActivityPanel workspaceId={activeWs?._id} />

        <MyInvites onAccepted={() => loadWorkspaces()} />
<InviteManager workspaceId={activeWs?._id} canManage={canManage} />
      </div>
    </div>
  );
}