import axios from "axios";

export const API_BASE = "http://localhost:5000";

const API = axios.create({
  baseURL: `${API_BASE}/api`,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("tf_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;