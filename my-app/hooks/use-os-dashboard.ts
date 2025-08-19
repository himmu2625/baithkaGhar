import { useState, useEffect, useCallback, useRef } from 'react';

interface DashboardMetrics {
  totalProperties: number;
  occupiedProperties: number;
  occupancyRate: number;
  todayRevenue: number;
  revenueChange: number;
  todayBookings: number;
  arrivals: number;
  departures: number;
}

interface Booking {
  _id: string;
  propertyId: {
    _id: string;
    title: string;
    address: any;
    images: string[];
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  dateFrom: string;
  dateTo: string;
  totalPrice: number;
  status: string;
  guests: number;
}

interface Alert {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  count: number;
}

interface DashboardData {
  metrics: DashboardMetrics;
  bookings: {
    today: Booking[];
    arrivals: Booking[];
    departures: Booking[];
    recent: Booking[];
  };
  alerts: Alert[];
  timestamp: string;
}

interface UseOSDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
  isOffline: boolean;
  retryCount: number;
  maxRetries: number;
}

export function useOSDashboard(): UseOSDashboardReturn {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchDashboardData = useCallback(async (isRetry = false) => {
    try {
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // Check if we're offline
      if (!navigator.onLine) {
        setIsOffline(true);
        setError('No internet connection. Please check your network and try again.');
        setLoading(false);
        return;
      }

      setIsOffline(false);

      const response = await fetch('/api/os/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. You do not have permission to view this data.');
        } else if (response.status === 404) {
          throw new Error('Dashboard service not found. Please contact support.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(`Request failed with status ${response.status}`);
        }
      }

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        setRetryCount(0); // Reset retry count on success
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Error fetching OS dashboard data:', err);

      // Increment retry count for network errors
      if (isRetry && retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  }, [retryCount, maxRetries]);

  // Initial fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds (only when online and no errors)
  useEffect(() => {
    if (isOffline || error) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchDashboardData, isOffline, error]);

  // Retry logic with exponential backoff
  useEffect(() => {
    if (error && retryCount < maxRetries && !isOffline) {
      const timeout = setTimeout(() => {
        fetchDashboardData(true);
      }, Math.pow(2, retryCount) * 1000); // Exponential backoff: 1s, 2s, 4s

      return () => clearTimeout(timeout);
    }
  }, [error, retryCount, maxRetries, isOffline, fetchDashboardData]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setError(null);
      // Retry immediately when coming back online
      fetchDashboardData();
    };

    const handleOffline = () => {
      setIsOffline(true);
      setError('No internet connection. Please check your network and try again.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchDashboardData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    setRetryCount(0); // Reset retry count on manual refetch
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    data,
    loading,
    error,
    refetch,
    lastUpdated,
    isOffline,
    retryCount,
    maxRetries,
  };
} 