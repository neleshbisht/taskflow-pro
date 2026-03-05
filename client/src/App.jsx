import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import BoardPage from "./pages/Board";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import InviteAccept from "./pages/InviteAccept";

function AppPage({ children }) {
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppPage><Dashboard /></AppPage>
          </ProtectedRoute>
        }
      />

      <Route
        path="/boards/:boardId"
        element={
          <ProtectedRoute>
            <AppPage><BoardPage /></AppPage>
          </ProtectedRoute>
        }
      />

      <Route path="/invite/:token" element={<InviteAccept />} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}