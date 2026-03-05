import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/api";
import { useAuth } from "../context/AuthContext";

export default function InviteAccept() {
  const { token } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await API.get(`/invites/token/${token}`);
    setInvite(res.data.invite);
  };

  useEffect(() => {
    setLoading(true);
    load()
      .catch((e) => setErr(e?.response?.data?.message || "Invite not found"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const accept = async () => {
    setErr("");
    // If not logged in, send to login and come back
    if (!user) {
      localStorage.setItem("tf_invite_token", token);
      nav("/login");
      return;
    }

    try {
      await API.post(`/invites/token/${token}/accept`);
      localStorage.removeItem("tf_invite_token");
      nav("/dashboard");
    } catch (e) {
      setErr(e?.response?.data?.message || "Accept failed");
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">Loading invite…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="container">
        <div className="card" style={{ borderColor: "rgba(255,80,80,.4)" }}>
          {err}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 720, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>You’re invited 🎉</h2>

        <div className="card" style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900 }}>Workspace: {invite?.workspace?.name}</div>
          <div className="muted small">Invited email: {invite?.email}</div>
          <div className="muted small">Role: {invite?.role}</div>
          <div className="muted small">
            Expires: {invite?.expiresAt ? new Date(invite.expiresAt).toLocaleString() : "-"}
          </div>
        </div>

        {user && (
          <div className="muted small" style={{ marginTop: 12 }}>
            Logged in as: <b>{user.email}</b>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button className="btn" onClick={accept}>
            Accept Invite
          </button>
          <button className="btn" onClick={() => nav("/dashboard")}>
            Go to Dashboard
          </button>
        </div>

        <div className="muted small" style={{ marginTop: 10 }}>
          If you’re not logged in, clicking Accept will take you to login first.
        </div>
      </div>
    </div>
  );
}