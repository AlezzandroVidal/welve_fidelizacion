import axios from "axios";

// VITE_API_URL se incrusta en build time (Docker build-arg en producción, ver
// frontend/Dockerfile y DEPLOY.md). Sin ella, cae a una ruta relativa: sirve
// para dev (proxy de Vite, ver vite.config.ts) y para el docker-compose local
// donde nginx.conf reenvía /api/ al contenedor del backend. Con ella
// (deploy en Railway, dominios separados), pega directo al backend.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : "/api/v1";

const api = axios.create({
  baseURL: API_BASE,
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
