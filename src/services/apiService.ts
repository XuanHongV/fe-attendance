import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    let token = localStorage.getItem('accessToken');
    if (token)
      {
      token = token.replace(/"/g, '');
       config.headers.Authorization = `Bearer ${token}`;
      }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    // token hết hạn tthif tự động logout
    if (error.response?.status === 401) {
      console.error("Lỗi 401: Token không hợp lệ hoặc hết hạn");
    }
    return Promise.reject(error);
  }
);

export default api;
