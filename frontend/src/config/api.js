import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let accessToken = '';

export const setAccessToken = (token) => {
  accessToken = token;
};

// Request interceptor to attach bearer token
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle silent refresh on 401
let failedQueue = [];
let isRefreshing = false;

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

    // If it's a 401 error and it's not the login or refresh endpoint
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url && 
      !originalRequest.url.includes('/auth/login') && 
      !originalRequest.url.includes('/auth/refresh')
    ) {
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
        // Call refresh endpoint to get new access token
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const { accessToken: newAccessToken } = refreshResponse.data.data;
        setAccessToken(newAccessToken);

        // Process any queued requests with the new token
        processQueue(null, newAccessToken);
        isRefreshing = false;

        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear token and reject queue
        processQueue(refreshError, null);
        setAccessToken('');
        isRefreshing = false;

        // Notify AuthContext (if global handler exists) to log out user
        if (window.handleGlobalLogout) {
          window.handleGlobalLogout();
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
