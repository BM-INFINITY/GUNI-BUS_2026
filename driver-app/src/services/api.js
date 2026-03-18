import axios from 'axios';
import { getToken } from '../utils/storage';
import { API_BASE_URL } from '../utils/constants';

// ─── Axios Instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach JWT token ───────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: normalize error messages ─────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status — surface the server message
      const message =
        error.response.data?.message ||
        `Server error (${error.response.status})`;
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      // Request was made but no response received (network issue / timeout)
      return Promise.reject(
        new Error('Unable to reach the server. Please check your connection.')
      );
    }

    // Unexpected error (e.g. config issue)
    return Promise.reject(error);
  }
);

export default api;

