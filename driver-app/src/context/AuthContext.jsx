import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken, getUserData, setToken, setUserData, clearAll } from '../utils/storage';
import api from '../services/api';

/**
 * AuthContext
 *
 * Provides authentication state and actions to the entire app.
 * This replaces the polling approach in AppNavigator with instant
 * state propagation via React Context.
 *
 * Usage:
 *   const { user, login, logout, isAuthenticated, isLoading } = useAuth();
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true = bootstrapping

  // ─── Bootstrap: restore session on app start ─────────────────────────────
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [token, savedUser] = await Promise.all([getToken(), getUserData()]);
        if (token && savedUser) {
          setUser(savedUser);
        }
      } catch (_) {
        // Corrupted storage – start fresh
        await clearAll();
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  // ─── Login ─────────────────────────────────────────────────────────────────
  /**
   * Calls POST /api/auth/driver/login, persists token + user,
   * and updates context state — triggering instant navigation.
   */
  const login = useCallback(async (employeeId, password) => {
    const response = await api.post('/auth/driver/login', {
      employeeId: employeeId.trim(),
      password,
    });

    const { token, user: userData } = response.data;

    if (!token || !userData) {
      throw new Error('Invalid response from server.');
    }

    // Validate that this is a driver account
    if (userData.role !== 'driver') {
      throw new Error('Access denied. This app is for drivers only.');
    }

    // Persist to AsyncStorage
    await setToken(token);
    await setUserData(userData);

    // Update context state → AppNavigator re-renders immediately
    setUser(userData);

    return userData;
  }, []);

  // ─── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await clearAll();
    setUser(null); // triggers immediate re-render to Auth stack
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth hook — consume AuthContext in any component.
 * Throws if used outside AuthProvider.
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
};
