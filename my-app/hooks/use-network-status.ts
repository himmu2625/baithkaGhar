import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  lastCheck: Date | null;
  error: string | null;
  retryCount: number;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  checkConnection: () => Promise<void>;
  resetRetryCount: () => void;
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnected: false,
    lastCheck: null,
    error: null,
    retryCount: 0
  });

  const checkConnection = useCallback(async () => {
    try {
      setStatus(prev => ({
        ...prev,
        error: null
      }));

      // Check if browser is online
      if (!navigator.onLine) {
        setStatus(prev => ({
          ...prev,
          isOnline: false,
          isConnected: false,
          lastCheck: new Date(),
          error: 'No internet connection'
        }));
        return;
      }

      // Test API connectivity
      const response = await fetch('/api/os/dashboard', {
        method: 'HEAD', // Just check if endpoint is reachable
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setStatus(prev => ({
          ...prev,
          isOnline: true,
          isConnected: true,
          lastCheck: new Date(),
          error: null
        }));
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      
      setStatus(prev => ({
        ...prev,
        isOnline: navigator.onLine,
        isConnected: false,
        lastCheck: new Date(),
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }));
    }
  }, []);

  const resetRetryCount = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      retryCount: 0
    }));
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: true,
        error: null
      }));
      // Re-check connection when coming back online
      checkConnection();
    };

    const handleOffline = () => {
      setStatus(prev => ({
        ...prev,
        isOnline: false,
        isConnected: false,
        error: 'No internet connection'
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  // Initial connection check
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  // Periodic connection checks (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      checkConnection();
    }, 30000);

    return () => clearInterval(interval);
  }, [checkConnection]);

  return {
    ...status,
    checkConnection,
    resetRetryCount
  };
} 