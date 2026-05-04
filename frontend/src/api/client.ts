import axios from 'axios';
import { dispatchAuthUnauthorizedEvent } from '../auth/events';

const ENV_API_BASE_URL = import.meta.env.VITE_API_URL?.trim();
const PRODUCTION_API_BASE_URL = 'https://codon-backend.onrender.com/api/v1';
const LEGACY_API_HOSTS = ['mars-backend-2au4.onrender.com'];

const resolveApiBaseUrl = () => {
  if (ENV_API_BASE_URL && !LEGACY_API_HOSTS.some((host) => ENV_API_BASE_URL.includes(host))) {
    return ENV_API_BASE_URL;
  }

  return import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : PRODUCTION_API_BASE_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

export const getApiBaseUrl = () => API_BASE_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      dispatchAuthUnauthorizedEvent();
    }
    return Promise.reject(error);
  }
);
