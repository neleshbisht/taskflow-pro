import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await login(email, password);

const t = localStorage.getItem("tf_invite_token");
if (t) nav(`/invite/${t}`);
else nav("/dashboard");
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="brand"><span className="dot" /> TaskFlow Pro</div>
        <div className="muted small">Realtime Kanban • Teams • RBAC</div>
      </div>

      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Login</h2>
        <p className="muted">Sign in to your workspace.</p>

        {err && <div className="card" style={{ borderColor: "rgba(255,80,80,.4)" }}>{err}</div>}

        <form onSubmit={submit}>
          <label className="small muted">Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="small muted" style={{ marginTop: 10, display: "block" }}>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button className="btn" style={{ width: "100%", marginTop: 14 }}>Login</button>
        </form>

        <p className="muted small" style={{ marginTop: 12 }}>
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </div>
  );
}