// src/utils/api.js
// Centralized API layer with automatic logout on 401/403 responses
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("[API] Unauthorized/Forbidden - forcing logout");
      forceLogout();
    }
    return Promise.reject(error);
  }
);

export function forceLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  
  if (window.location.pathname !== "/login" && window.location.pathname !== "/") {
    window.location.href = "/login?session=expired";
  }
}

export function getImageUrl(imgPath) {
  if (!imgPath) return null;
  if (imgPath.startsWith("http")) return imgPath;
  return `${API_URL}${imgPath}`;
}

export function setupGlobalAxiosInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.warn("[Global Axios] Unauthorized/Forbidden - forcing logout");
        forceLogout();
      }
      return Promise.reject(error);
    }
  );
}

export default api;
