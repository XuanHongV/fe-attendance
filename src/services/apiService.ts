import axios from "axios";
import toastService from "./toastService";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem("accessToken");
    if (token) {
      token = token.replace(/"/g, "");
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Lỗi kết nối";
    console.error("API Error:", error.response?.data || error.message);
    // hiển thị toast lỗi
    try {
      toastService.error(Array.isArray(msg) ? msg.join(", ") : String(msg));
    } catch (e) {
      // ignore if toast not available
    }

    // token hết hạn thì tự động logout
    if (error.response?.status === 401) {
      console.error("Lỗi 401: Token không hợp lệ hoặc hết hạn");
    }
    return Promise.reject(error);
  }
);

export default api;
