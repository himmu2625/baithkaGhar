/**
 * App Constants
 */

export const COLORS = {
  primary: '#1a1a1a',
  secondary: '#4a4a4a',
  accent: '#FF6B6B',
  background: '#ffffff',
  backgroundDark: '#1a1a1a',
  text: '#333333',
  textLight: '#666666',
  textDark: '#ffffff',
  border: '#e0e0e0',
  success: '#4CAF50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196F3',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
  ONBOARDING_COMPLETED: 'onboarding_completed',
} as const;

export * from './api';
