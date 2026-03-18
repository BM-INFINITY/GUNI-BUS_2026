// API Base URL — change this to your deployed server URL or local IP when testing on a physical device
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';
// Note: 10.0.2.2 is the Android Emulator's alias for localhost.
// For physical devices, replace with your machine's local IP e.g. http://192.168.x.x:5001/api

export const COLORS = {
  // Premium Web App Palette
  primary: '#667eea',       // Indigo (Primary buttons, headers)
  primaryDark: '#5568d3',   // Darker Indigo (Hover/Active states)
  secondary: '#20c997',     // Teal (Login background, accents)
  
  // Status Colors
  success: '#28a745',
  successBg: '#d4edda',
  warning: '#ffc107',
  danger: '#dc3545',
  errorBg: '#fee2e2',
  
  // Neutral/Surfaces (Light Theme to match Web Forms)
  background: '#f5f5f5',    // App background
  surface: '#ffffff',       // Cards/Boxes
  surfaceLight: '#f9f9f9',  // Light grey inputs/areas
  
  // Text
  text: '#333333',          // Primary text
  textSecondary: '#666666', // Secondary/Hints
  border: '#dddddd',        // Input borders
  
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
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
