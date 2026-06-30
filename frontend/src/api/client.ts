import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Inyecta el JWT en cada request si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("welve_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Expulsa al usuario si el token expira
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("welve_token");
      localStorage.removeItem("welve_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
