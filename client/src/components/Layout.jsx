import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const loc = useLocation();

  const item = (to, label) => (
    <Link
      to={to}
      className="sideItem"
      style={{
        background: loc.pathname.startsWith(to) ? "rgba(106,227,255,.12)" : "transparent",
      }}
    >
      {label}
    </Link>
  );

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="sideBrand">
          <span className="dot" /> TaskFlow Pro
        </div>

        <div className="sideUser">
          <div style={{ fontWeight: 900 }}>{user?.name}</div>
          <div className="muted small">{user?.role}</div>
        </div>

        <div className="sideNav">
          {item("/dashboard", "Dashboard")}
        </div>

        <button className="btn" style={{ width: "100%", marginTop: "auto" }} onClick={logout}>
          Logout
        </button>

        <div className="muted small" style={{ marginTop: 10, opacity: 0.8 }}>
          Realtime Kanban • Invites • RBAC
        </div>
      </aside>

      <main className="mainArea">
        {children}
      </main>
    </div>
  );
}