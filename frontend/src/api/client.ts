import axios from 'axios';

const ENV_API_BASE_URL = import.meta.env.VITE_API_URL?.trim();
// 默认策略：开发环境直连本地后端；生产环境走同源 /api/v1（可配合 Vercel rewrite）
const API_BASE_URL =
  ENV_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : '/api/v1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动附带 token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：清除过期 token，不自动跳转登录页（由各页面按需处理）
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
    }
    return Promise.reject(error);
  }
);
