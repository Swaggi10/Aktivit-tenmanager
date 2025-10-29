import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// Axios Instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Token hinzufügen
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('authToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Fehlerbehandlung
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token ungültig - Logout
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API Request Helper
export const apiRequest = async <T>(
  method: 'get' | 'post' | 'patch' | 'delete',
  url: string,
  data?: unknown
): Promise<T> => {
  const response = await api.request<ApiResponse<T>>({
    method,
    url,
    data,
  });

  if (!response.data.success) {
    throw new Error(response.data.error || 'Request failed');
  }

  return response.data.data as T;
};

export default api;
