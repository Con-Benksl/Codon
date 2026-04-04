import axios from 'axios';
import { dispatchAuthUnauthorizedEvent } from '../auth/events';

const ENV_API_BASE_URL = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL =
  ENV_API_BASE_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000/api/v1' : '/api/v1');

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
