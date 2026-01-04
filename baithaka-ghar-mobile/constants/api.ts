/**
 * API Configuration
 * Central configuration for all API endpoints
 */

export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
} as const;

/**
 * API Endpoints
 * All API routes used by the mobile app
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    VERIFY_OTP: '/api/auth/verify-otp',
    RESEND_OTP: '/api/auth/resend-otp',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    REFRESH_TOKEN: '/api/auth/refresh',
  },

  // User
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/update',
    UPLOAD_AVATAR: '/api/user/avatar',
  },

  // Properties
  PROPERTIES: {
    LIST: '/api/properties',
    DETAIL: (id: string) => `/api/properties/${id}`,
    SEARCH: '/api/properties/search',
    FEATURED: '/api/properties/featured',
    NEARBY: '/api/properties/nearby',
  },

  // Bookings
  BOOKINGS: {
    LIST: '/api/bookings',
    DETAIL: (id: string) => `/api/bookings/${id}`,
    CREATE: '/api/bookings/create',
    CANCEL: (id: string) => `/api/bookings/${id}/cancel`,
    CHECK_AVAILABILITY: '/api/bookings/check-availability',
  },

  // Payments
  PAYMENTS: {
    CREATE_ORDER: '/api/payments/razorpay/create-order',
    VERIFY: '/api/payments/razorpay/verify',
    DETAILS: '/api/payments/razorpay/details',
    REFUND: '/api/payments/razorpay/refund',
    METHODS: '/api/payments/methods',
  },

  // Reviews
  REVIEWS: {
    LIST: (propertyId: string) => `/api/reviews/${propertyId}`,
    CREATE: '/api/reviews/create',
    UPDATE: (id: string) => `/api/reviews/${id}`,
  },

  // Favorites
  FAVORITES: {
    LIST: '/api/favorites',
    ADD: '/api/favorites/add',
    REMOVE: (id: string) => `/api/favorites/${id}`,
  },
} as const;
