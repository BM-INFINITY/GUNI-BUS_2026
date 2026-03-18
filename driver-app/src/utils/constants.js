// API Base URL — change this to your deployed server URL or local IP when testing on a physical device
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:5001/api';
// Note: 10.0.2.2 is the Android Emulator's alias for localhost.
// For physical devices, replace with your machine's local IP e.g. http://192.168.x.x:5001/api

export const COLORS = {
  // Primary brand — deep navy indigo with teal accent
  primary: '#4F46E5',       // Indigo-600 — buttons, active states, highlights
  primaryLight: '#E0E7FF',  // Indigo-100 — backgrounds, badges
  primaryDark: '#3730A3',   // Indigo-800 — pressed states, dark headers
  accent: '#0EA5E9',        // Sky-500 — secondary highlights

  // Status
  success: '#16A34A',       // Green-600
  successLight: '#DCFCE7',  // Green-100
  warning: '#D97706',       // Amber-600
  warningLight: '#FEF3C7',  // Amber-100
  danger: '#DC2626',        // Red-600
  dangerLight: '#FEE2E2',   // Red-100
  info: '#0891B2',          // Cyan-600
  infoLight: '#CFFAFE',     // Cyan-100

  // Neutrals — used for surfaces and text
  background: '#F8FAFC',    // Slate-50 — app background
  surface: '#FFFFFF',       // Pure white cards
  surfaceAlt: '#F1F5F9',    // Slate-100 — alternating rows, disabled areas
  border: '#E2E8F0',        // Slate-200 — card borders, dividers

  // Text — high contrast on light background
  textPrimary: '#0F172A',   // Slate-900 — headings, important values
  textSecondary: '#475569', // Slate-600 — labels, secondary info
  textMuted: '#94A3B8',     // Slate-400 — hints, footer text
  textOnPrimary: '#FFFFFF', // White — text on primary colored backgrounds

  // Legacy aliases for backward compat
  text: '#0F172A',
  textSecondary2: '#475569',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // "secondary" for login background (Teal from web)
  secondary: '#0EA5E9',
};

export const FONTS = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 50,
};

export const SHADOW = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'driver_auth_token',
  USER_DATA: 'driver_user_data',
};
