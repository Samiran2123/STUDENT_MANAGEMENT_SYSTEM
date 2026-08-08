import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      // Handle Unauthorized token expiration
      if (status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/login' || currentPath === '/register' || currentPath === '/';
        if (!isPublicPage) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
