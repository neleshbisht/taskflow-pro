import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
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
      setErr(e2?.response?.data?.message || "Register failed");
    }
  };

  return (
    <div className="container">
      <div className="nav">
        <div className="brand"><span className="dot" /> TaskFlow Pro</div>
        <div className="muted small">Create your account</div>
      </div>

      <div className="card" style={{ maxWidth: 520, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Register</h2>
        <p className="muted">Pick role now (we’ll restrict later with invites).</p>

        {err && <div className="card" style={{ borderColor: "rgba(255,80,80,.4)" }}>{err}</div>}

        <form onSubmit={submit}>
          <label className="small muted">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />

          <label className="small muted" style={{ marginTop: 10, display: "block" }}>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label className="small muted" style={{ marginTop: 10, display: "block" }}>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="member">member</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>

          <label className="small muted" style={{ marginTop: 10, display: "block" }}>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button className="btn" style={{ width: "100%", marginTop: 14 }}>Create account</button>
        </form>

        <p className="muted small" style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}