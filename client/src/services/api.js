import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Create central Axios instance pointing to server endpoints
const api = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api'),
  withCredentials: true
});

// Request Interceptor: Attach bearer accessToken to header
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle automated JWT Access Token rotations
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is due to expired access token (401 unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Prevent infinite loops on login/refresh calls
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send request to rotate tokens using secure refresh cookie
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data;

        // Save new access token to Zustand store
        useAuthStore.getState().setAccessToken(accessToken);

        // Process any queued request waiting during rotation
        processQueue(null, accessToken);

        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        isRefreshing = false;
        return api(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Invalidate state on refresh failure (Session expired)
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
