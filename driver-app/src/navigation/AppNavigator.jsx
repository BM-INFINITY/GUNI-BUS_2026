import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import DriverNavigator from './DriverNavigator';
import LoadingSpinner from '../components/LoadingSpinner';

/**
 * RootNavigator
 *
 * Reads auth state from AuthContext and renders the appropriate navigator:
 *   - isLoading  → splash / loading spinner (bootstrapping AsyncStorage)
 *   - isAuthenticated → DriverNavigator (Dashboard, Scan, Route)
 *   - !isAuthenticated → AuthNavigator (Login)
 *
 * Switching between stacks is instant because AuthContext.login() and
 * AuthContext.logout() update React state directly — no polling required.
 */
const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner message="Starting up..." />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <DriverNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

/**
 * AppNavigator
 *
 * Wraps RootNavigator with AuthProvider so that all screens and
 * navigators below have access to useAuth().
 */
const AppNavigator = () => (
  <AuthProvider>
    <RootNavigator />
  </AuthProvider>
);

export default AppNavigator;
