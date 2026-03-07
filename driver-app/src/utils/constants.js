// API Base URL — change this to your deployed server URL or local IP when testing on a physical device
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';
// Note: 10.0.2.2 is the Android Emulator's alias for localhost.
// For physical devices, replace with your machine's local IP e.g. http://192.168.x.x:5001/api

export const COLORS = {
  primary: '#1A73E8',
  primaryDark: '#1557B0',
  secondary: '#34A853',
  danger: '#EA4335',
  warning: '#FBBC04',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceLight: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  border: '#334155',
  white: '#FFFFFF',
  black: '#000000',
  success: '#22C55E',
  successBg: '#14532D',
  errorBg: '#7F1D1D',
  cardBg: '#1E293B',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@guni_bus_driver_token',
  USER_DATA: '@guni_bus_driver_user',
};
