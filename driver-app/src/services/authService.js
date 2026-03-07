import api from './api';
import { setToken, setUserData, clearAll } from '../utils/storage';

/**
 * authService
 *
 * Note: The primary login() and logout() actions now live in
 * src/context/AuthContext.jsx so they can update React state instantly.
 *
 * These helpers remain here for any future use outside of AuthContext
 * (e.g. background token refresh, retry logic, etc.).
 */

/** Persist a new token received from the server */
export const persistToken = async (token, user) => {
  await setToken(token);
  await setUserData(user);
};

/** Clear all stored credentials */
export const clearCredentials = async () => {
  await clearAll();
};
