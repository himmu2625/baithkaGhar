/**
 * Optimized data fetching hook with advanced caching and performance monitoring
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { advancedCache, CacheLayer } from '@/lib/cache/advanced-cache';

// Fetch configuration
export interface FetchConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cacheKey?: string;
  cacheTTL?: number;
  cacheLayer?: CacheLayer;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  enabled?: boolean;
  tags?: string[];
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// Fetch state
export interface FetchState<T = any> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isStale: boolean;
  retryCount: number;
  lastFetched: number | null;
}

// Performance metrics
export interface FetchMetrics {
  requestTime: number;
  cacheHit: boolean;
  retryCount: number;
  networkRequests: number;
  memoryUsage: number;
}

/**
 * Optimized fetch hook with caching and performance monitoring
 */
export function useOptimizedFetch<T = any>(
  config: FetchConfig
) {
  const {
    url,
    method = 'GET',
    headers = {},
    body,
    cacheKey,
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    cacheLayer = 'memory',
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
    enabled = true,
    tags = [],
    onSuccess,
    onError,
  } = config;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
    isStale: false,
    retryCount: 0,
    lastFetched: null,
  });

  const [metrics, setMetrics] = useState<FetchMetrics>({
    requestTime: 0,
    cacheHit: false,
    retryCount: 0,
    networkRequests: 0,
    memoryUsage: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate cache key if not provided
  const effectiveCacheKey = cacheKey || `${method}_${url}_${JSON.stringify(body || {})}`;

  // Fetch data with caching
  const fetchData = useCallback(async (forceRefresh = false): Promise<T | null> => {
    if (!enabled) return null;

    const startTime = performance.now();
    let currentRetryCount = 0;

    const attemptFetch = async (): Promise<T | null> => {
      try {
        // Check cache first (unless force refresh)
        if (!forceRefresh && effectiveCacheKey) {
          const cached = await advancedCache.get<T>(effectiveCacheKey, cacheLayer);
          if (cached) {
            setState(prev => ({
              ...prev,
              data: cached,
              isLoading: false,
              error: null,
              isStale: false,
            }));
            setMetrics(prev => ({
              ...prev,
              cacheHit: true,
              requestTime: performance.now() - startTime,
            }));
            onSuccess?.(cached);
            return cached;
          }
        }

        // Create abort controller for timeout
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Set timeout
        timeoutRef.current = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, timeout);

        // Prepare request
        const requestConfig: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal,
        };

        if (body && method !== 'GET') {
          requestConfig.body = JSON.stringify(body);
        }

        // Make request
        const response = await fetch(url, requestConfig);

        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Cache the result
        if (effectiveCacheKey) {
          await advancedCache.set(effectiveCacheKey, data, {
            ttl: cacheTTL,
            layer: cacheLayer,
            tags,
          });
        }

        // Update state
        setState(prev => ({
          ...prev,
          data,
          isLoading: false,
          error: null,
          isStale: false,
          lastFetched: Date.now(),
        }));

        setMetrics(prev => ({
          ...prev,
          cacheHit: false,
          requestTime: performance.now() - startTime,
          networkRequests: prev.networkRequests + 1,
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        }));

        onSuccess?.(data);
        return data;

      } catch (error) {
        // Clear timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        const fetchError = error as Error;

        // Handle abort
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        // Retry logic
        if (currentRetryCount < retryCount) {
          currentRetryCount++;
          setMetrics(prev => ({ ...prev, retryCount: currentRetryCount }));
          
          await new Promise(resolve => setTimeout(resolve, retryDelay * currentRetryCount));
          return attemptFetch();
        }

        // Final error
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: fetchError,
          retryCount: currentRetryCount,
        }));

        setMetrics(prev => ({
          ...prev,
          requestTime: performance.now() - startTime,
        }));

        onError?.(fetchError);
        throw fetchError;
      }
    };

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    return attemptFetch();
  }, [
    enabled,
    url,
    method,
    headers,
    body,
    effectiveCacheKey,
    cacheTTL,
    cacheLayer,
    retryCount,
    retryDelay,
    timeout,
    tags,
    onSuccess,
    onError,
  ]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }

    return () => {
      // Cleanup
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, url, method, JSON.stringify(body)]);

  // Refresh function
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache
  const invalidateCache = useCallback(async () => {
    if (effectiveCacheKey) {
      await advancedCache.delete(effectiveCacheKey);
    }
    if (tags.length > 0) {
      await advancedCache.invalidateByTags(tags);
    }
  }, [effectiveCacheKey, tags]);

  // Prefetch data
  const prefetch = useCallback(async () => {
    if (!enabled || state.data) return;
    
    try {
      await fetchData();
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [enabled, state.data, fetchData]);

  // Check if data is stale
  const isStale = useCallback(() => {
    if (!state.lastFetched) return true;
    return Date.now() - state.lastFetched > cacheTTL;
  }, [state.lastFetched, cacheTTL]);

  // Update stale state
  useEffect(() => {
    if (state.data && isStale()) {
      setState(prev => ({ ...prev, isStale: true }));
    }
  }, [state.data, isStale]);

  return {
    ...state,
    refresh,
    invalidateCache,
    prefetch,
    isStale: isStale(),
    metrics,
  };
}

/**
 * Optimized fetch with automatic background refresh
 */
export function useOptimizedFetchWithRefresh<T = any>(
  config: FetchConfig & { refreshInterval?: number }
) {
  const { refreshInterval = 30000, ...fetchConfig } = config;
  const fetchResult = useOptimizedFetch<T>(fetchConfig);

  // Background refresh
  useEffect(() => {
    if (!refreshInterval || !fetchResult.data) return;

    const interval = setInterval(() => {
      if (fetchResult.isStale) {
        fetchResult.refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchResult.data, fetchResult.isStale, fetchResult.refresh]);

  return fetchResult;
}

/**
 * Optimized fetch with optimistic updates
 */
export function useOptimizedFetchWithOptimistic<T = any>(
  config: FetchConfig & { 
    optimisticUpdate?: (data: T, update: Partial<T>) => T;
  }
) {
  const { optimisticUpdate, ...fetchConfig } = config;
  const fetchResult = useOptimizedFetch<T>(fetchConfig);

  const optimisticUpdateData = useCallback((update: Partial<T>) => {
    if (!fetchResult.data || !optimisticUpdate) return;

    const optimisticData = optimisticUpdate(fetchResult.data, update);
    setState(prev => ({ ...prev, data: optimisticData }));
  }, [fetchResult.data, optimisticUpdate]);

  return {
    ...fetchResult,
    optimisticUpdate: optimisticUpdateData,
  };
}

/**
 * Batch fetch multiple resources
 */
export function useBatchFetch<T extends Record<string, any>>(
  configs: Record<keyof T, FetchConfig>
) {
  const [results, setResults] = useState<Partial<T>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof T, Error>>>({});

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setErrors({});

    const promises = Object.entries(configs).map(async ([key, config]) => {
      try {
        const result = await useOptimizedFetch(config);
        return { key, result };
      } catch (error) {
        return { key, error: error as Error };
      }
    });

    const results = await Promise.allSettled(promises);
    
    const newResults: Partial<T> = {};
    const newErrors: Partial<Record<keyof T, Error>> = {};

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { key, result: fetchResult, error } = result.value;
        if (error) {
          newErrors[key as keyof T] = error;
        } else {
          newResults[key as keyof T] = fetchResult.data;
        }
      }
    });

    setResults(newResults);
    setErrors(newErrors);
    setIsLoading(false);
  }, [configs]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    data: results,
    isLoading,
    errors,
    refetch: fetchAll,
  };
} 