import axios from 'axios';
import { getToken } from '../utils/storage';

// ─── Base URL ───────────────────────────────────────────────────────────────
// Set EXPO_PUBLIC_API_URL in your .env file.
//   Android Emulator : http://10.0.2.2:5001/api
//   iOS Simulator    : http://localhost:5001/api
//   Physical device  : http://<your-local-IP>:5001/api
//   Production       : https://your-api.com/api
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!BASE_URL) {
  // Fail loudly during development rather than silently hitting the wrong server
  console.error(
    '[api.js] EXPO_PUBLIC_API_URL is not set.\n' +
    'Create a .env file in driver-app/ and add:\n' +
    '  EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api'
  );
}

// ─── Axios Instance ─────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
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

