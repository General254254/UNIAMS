import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Global refresh promise to prevent race conditions
let refreshPromise = null;

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If a refresh is already in progress, wait for it
      if (refreshPromise) {
        try {
          await refreshPromise;
          const token = localStorage.getItem('access_token');
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }

      refreshPromise = (async () => {
        try {
          const refresh = localStorage.getItem('refresh_token');
          if (!refresh) throw new Error('No refresh token');

          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/auth/token/refresh/`,
            { refresh }
          );

          localStorage.setItem('access_token', data.access);
          return data.access;
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          throw err;
        } finally {
          refreshPromise = null;
        }
      })();

      try {
        const access = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
