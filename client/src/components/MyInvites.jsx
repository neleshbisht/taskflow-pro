import { useEffect, useState } from "react";
import API from "../api/api";

export default function MyInvites({ onAccepted }) {
  const [invites, setInvites] = useState([]);
  const [err, setErr] = useState("");

  const load = async () => {
    const res = await API.get("/invites/mine");
    setInvites(res.data.invites || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const accept = async (id) => {
    setErr("");
    try {
      await API.post(`/invites/${id}/accept`);
      await load();
      onAccepted?.();
    } catch (e) {
      setErr(e?.response?.data?.message || "Accept failed");
    }
  };

  const decline = async (id) => {
    setErr("");
    try {
      await API.post(`/invites/${id}/decline`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Decline failed");
    }
  };

  return (
    <div className="card" style={{ height: "fit-content" }}>
      <h3 style={{ marginTop: 0 }}>My Invites</h3>
      <div className="muted small">Pending workspace invites for your email</div>

      {err && (
        <div className="card" style={{ marginTop: 12, borderColor: "rgba(255,80,80,.4)" }}>
          {err}
        </div>
      )}

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        {invites.length === 0 ? (
          <div className="muted small">No pending invites.</div>
        ) : (
          invites.map((i) => (
            <div key={i._id} className="card" style={{ background: "rgba(255,255,255,.03)" }}>
              <div style={{ fontWeight: 900 }}>{i.workspace?.name || "Workspace"}</div>
              <div className="muted small">Role: {i.role}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn" onClick={() => accept(i._id)}>Accept</button>
                <button className="btn" onClick={() => decline(i._id)}>Decline</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}