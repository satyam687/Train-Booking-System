import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('railbook_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle responses and expired tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If 401 on authenticated endpoint, clear token
      const isAuthUrl = error.config.url.includes('/auth/login/') || error.config.url.includes('/auth/register/');
      if (!isAuthUrl) {
        localStorage.removeItem('railbook_token');
        localStorage.removeItem('railbook_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
