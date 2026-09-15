import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  let token = null;
  try {
    const raw = localStorage.getItem("winterstore_auth");
    if (raw) token = JSON.parse(raw).token;
  } catch {
    token = null;
  }

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;