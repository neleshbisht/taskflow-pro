import { createContext, useContext, useEffect, useMemo, useState } from "react";
import API from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("tf_token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // simple boot: if token exists, decode user stored (we store both)
    const raw = localStorage.getItem("tf_user");
    if (raw) setUser(JSON.parse(raw));
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    localStorage.setItem("tf_token", res.data.token);
    localStorage.setItem("tf_user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (name, email, password, role = "member") => {
    const res = await API.post("/auth/register", { name, email, password, role });
    localStorage.setItem("tf_token", res.data.token);
    localStorage.setItem("tf_user", JSON.stringify(res.data.user));
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("tf_token");
    localStorage.removeItem("tf_user");
    setToken("");
    setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}