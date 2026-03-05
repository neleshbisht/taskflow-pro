import { useEffect, useState } from "react";
import API from "../api/api";

export default function InviteManager({ workspaceId, canManage }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [invites, setInvites] = useState([]);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    if (!workspaceId || !canManage) return;
    const res = await API.get(`/invites/workspace/${workspaceId}`);
    setInvites(res.data.invites || []);
  };

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, canManage]);

  const send = async (e) => {
    e.preventDefault();
    if (!workspaceId) return;
    setErr("");
    setMsg("");
    try {
      const res = await API.post(`/invites/workspace/${workspaceId}`, { email, role });
      setEmail("");
      setRole("member");
      setMsg("Invite created. (Portfolio mode: invite is delivered by matching email on the account.)");
      await load();
      // show token for debugging/demo
      if (res.data.invite?.token) {
  const link = `${window.location.origin}/invite/${res.data.invite.token}`;
  setMsg(`Invite link: ${link}`);
}
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Invite failed");
    }
  };

  if (!workspaceId) return null;

  return (
    <div className="card" style={{ height: "fit-content" }}>
      <h3 style={{ marginTop: 0 }}>Invites</h3>
      <div className="muted small">Invite teammates by email (admin/manager only)</div>

      {!canManage && (
        <div className="card" style={{ marginTop: 12 }}>
          <b>Read-only</b>
          <div className="muted small">You don’t have permission to invite.</div>
        </div>
      )}

      {canManage && (
        <form onSubmit={send} style={{ marginTop: 12 }}>
          <label className="small muted">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@gmail.com" />

          <label className="small muted" style={{ marginTop: 10, display: "block" }}>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">member</option>
            <option value="manager">manager</option>
          </select>

          <button className="btn" style={{ width: "100%", marginTop: 12 }}>Send Invite</button>
        </form>
      )}

      {err && (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,80,80,.4)" }}>
          {err}
        </div>
      )}

      {msg && (
        <div className="card" style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      {canManage && (
        <div style={{ marginTop: 12, display: "grid", gap: 10, maxHeight: 260, overflow: "auto" }}>
          {invites.length === 0 ? (
            <div className="muted small">No invites yet.</div>
          ) : (
            invites.map((i) => (
              <div key={i._id} className="card" style={{ background: "rgba(255,255,255,.03)" }}>
                <div style={{ fontWeight: 900 }}>{i.email}</div>
                <div className="muted small">Role: {i.role} • Status: {i.status}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}