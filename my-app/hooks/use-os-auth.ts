'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface OSUser {
  propertyId: string;
  propertyName: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  property: {
    id: string;
    name: string;
    address: any;
    verificationStatus: string;
  };
}

interface UseOSAuthReturn {
  user: OSUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  extendSession: () => Promise<void>;
}

export function useOSAuth(): UseOSAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<OSUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = () => {
      const isLoggedIn = localStorage.getItem('os-logged-in') === 'true';
      const username = localStorage.getItem('os-username');
      const propertyId = localStorage.getItem('os-property-id');
      const propertyName = localStorage.getItem('os-property-name');

      if (isLoggedIn && username && propertyId && propertyName) {
        setUser({
          propertyId,
          propertyName,
          username,
          email: `${username}@baithakaghar.com`,
          role: 'Property Manager',
          permissions: ['dashboard', 'inventory', 'bookings', 'financial', 'staff', 'reports', 'settings'],
          property: {
            id: propertyId,
            name: propertyName,
            address: {},
            verificationStatus: 'approved'
          }
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    console.log('Login attempt:', { username });
    
    try {
      const response = await fetch('/api/os/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      const data = await response.json();
      console.log('Login response data:', data);
      
      if (data.success && data.data) {
        console.log('Login successful, storing data in localStorage');
        // Store authentication data
        localStorage.setItem('os-logged-in', 'true');
        localStorage.setItem('os-username', data.data.username);
        localStorage.setItem('os-property-id', data.data.propertyId);
        localStorage.setItem('os-property-name', data.data.propertyName);
        localStorage.setItem('os-login-time', Date.now().toString());
        
        // Set user state with actual property data
        const userData = {
          propertyId: data.data.propertyId,
          propertyName: data.data.propertyName,
          username: data.data.username,
          email: `${data.data.username}@baithakaghar.com`,
          role: data.data.role,
          permissions: data.data.permissions,
          property: data.data.property
        };
        console.log('Setting user data:', userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Redirect to property-specific dashboard
        const dashboardUrl = `/os/dashboard/${data.data.propertyId}`;
        console.log('Redirecting to:', dashboardUrl);
        
        // Use window.location.href for a full page reload to ensure state is properly refreshed
        // This is more reliable than router.push() for authentication redirects
        setTimeout(() => {
          console.log('Executing delayed redirect to:', dashboardUrl);
          window.location.href = dashboardUrl;
        }, 500);
        
        return true;
      } else {
        console.log('Login failed:', data.message || 'Unknown error');
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    console.log('Logging out user');
    // Clear authentication data
    localStorage.removeItem('os-logged-in');
    localStorage.removeItem('os-username');
    localStorage.removeItem('os-property-id');
    localStorage.removeItem('os-property-name');
    localStorage.removeItem('os-login-time');
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login with full page reload
    console.log('Redirecting to login page');
    window.location.href = '/os/login';
  }, []);

  const checkAuth = useCallback((): boolean => {
    const isLoggedIn = localStorage.getItem('os-logged-in') === 'true';
    const loginTime = localStorage.getItem('os-login-time');
    
    if (!isLoggedIn || !loginTime) {
      return false;
    }
    
    // Check if session has expired (30 minutes)
    const sessionDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
    const currentTime = Date.now();
    const loginTimestamp = parseInt(loginTime);
    
    if (currentTime - loginTimestamp > sessionDuration) {
      logout();
      return false;
    }
    
    return true;
  }, [logout]);

  const extendSession = useCallback(async (): Promise<void> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update login time
      localStorage.setItem('os-login-time', Date.now().toString());
    } catch (error) {
      console.error('Failed to extend session:', error);
      throw error;
    }
  }, []);

  // Auto-check authentication periodically
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        if (!checkAuth()) {
          logout();
        }
      }, 60000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, checkAuth, logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    extendSession
  };
}