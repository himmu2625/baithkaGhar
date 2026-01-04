/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { api } from './api';
import { storage } from './storage';
import { API_ENDPOINTS } from '@/constants';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
}

interface VerifyOTPData {
  email: string;
  otp: string;
}

class AuthService {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );

      if (response.token) {
        await storage.saveAuthToken(response.token);
      }

      if (response.user) {
        await storage.saveUserData(response.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verify OTP
   */
  async verifyOTP(data: VerifyOTPData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.VERIFY_OTP,
        data
      );

      if (response.token) {
        await storage.saveAuthToken(response.token);
      }

      if (response.user) {
        await storage.saveUserData(response.user);
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.RESEND_OTP,
        { email }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      await api.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear storage regardless of API success
      await storage.clearAll();
    }
  }

  /**
   * Forgot password
   */
  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { email, otp, newPassword }
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await storage.getAuthToken();
    return !!token;
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<any | null> {
    return await storage.getUserData();
  }
}

export const authService = new AuthService();
