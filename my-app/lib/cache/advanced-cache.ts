/**
 * Advanced caching system with multiple layers and intelligent invalidation
 */

import { LRUCache } from '../utils/cache';

// Cache layer types
export type CacheLayer = 'memory' | 'session' | 'local' | 'redis';

// Cache entry with metadata
export interface CacheEntry<T = any> {
  value: T;
  timestamp: number;
  ttl: number;
  layer: CacheLayer;
  tags?: string[];
  version?: string;
}

// Cache configuration
export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  enableRedis: boolean;
  redisUrl?: string;
  enableCompression: boolean;
  enableEncryption: boolean;
}

// Cache statistics
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  memoryUsage: number;
}

/**
 * Advanced Cache Manager with multiple layers
 */
export class AdvancedCacheManager {
  private memoryCache: LRUCache<string, CacheEntry>;
  private sessionCache: Map<string, CacheEntry>;
  private config: CacheConfig;
  private stats: CacheStats;
  private redisClient?: any;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      enableRedis: false,
      enableCompression: true,
      enableEncryption: false,
      ...config,
    };

    this.memoryCache = new LRUCache(this.config.maxSize);
    this.sessionCache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      memoryUsage: 0,
    };

    this.initializeRedis();
    this.startCleanupInterval();
  }

  /**
   * Initialize Redis connection if enabled
   */
  private async initializeRedis(): Promise<void> {
    if (!this.config.enableRedis || !this.config.redisUrl) return;

    try {
      // Dynamic import to avoid bundling Redis in client
      const Redis = await import('ioredis');
      this.redisClient = new Redis.default(this.config.redisUrl);
      
      this.redisClient.on('error', (err: Error) => {
        console.warn('Redis connection error:', err);
      });
    } catch (error) {
      console.warn('Redis not available, falling back to memory cache:', error);
    }
  }

  /**
   * Set a value in cache with intelligent layer selection
   */
  async set<T>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      layer?: CacheLayer;
      tags?: string[];
      version?: string;
    } = {}
  ): Promise<void> {
    const { ttl = this.config.defaultTTL, layer = 'memory', tags = [], version } = options;
    
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      ttl,
      layer,
      tags,
      version,
    };

    // Store in appropriate layer
    switch (layer) {
      case 'memory':
        this.memoryCache.put(key, entry);
        break;
      case 'session':
        this.sessionCache.set(key, entry);
        break;
      case 'local':
        if (typeof window !== 'undefined') {
          try {
            const serialized = this.serialize(entry);
            localStorage.setItem(`cache_${key}`, serialized);
          } catch (error) {
            console.warn('Failed to store in localStorage:', error);
          }
        }
        break;
      case 'redis':
        if (this.redisClient) {
          try {
            const serialized = this.serialize(entry);
            await this.redisClient.setex(key, Math.ceil(ttl / 1000), serialized);
          } catch (error) {
            console.warn('Redis set failed, falling back to memory:', error);
            this.memoryCache.put(key, entry);
          }
        }
        break;
    }

    this.stats.sets++;
    this.updateStats();
  }

  /**
   * Get a value from cache with fallback layers
   */
  async get<T>(key: string, layer?: CacheLayer): Promise<T | null> {
    // Try specified layer first, then fallback to others
    const layers: CacheLayer[] = layer ? [layer] : ['memory', 'session', 'local', 'redis'];

    for (const currentLayer of layers) {
      const entry = await this.getFromLayer<T>(key, currentLayer);
      
      if (entry && !this.isExpired(entry)) {
        this.stats.hits++;
        this.updateStats();
        return entry.value;
      }
    }

    this.stats.misses++;
    this.updateStats();
    return null;
  }

  /**
   * Get value from specific cache layer
   */
  private async getFromLayer<T>(key: string, layer: CacheLayer): Promise<CacheEntry<T> | null> {
    try {
      switch (layer) {
        case 'memory':
          return this.memoryCache.get(key) || null;
        
        case 'session':
          return this.sessionCache.get(key) || null;
        
        case 'local':
          if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(`cache_${key}`);
            return stored ? this.deserialize(stored) : null;
          }
          return null;
        
        case 'redis':
          if (this.redisClient) {
            const stored = await this.redisClient.get(key);
            return stored ? this.deserialize(stored) : null;
          }
          return null;
        
        default:
          return null;
      }
    } catch (error) {
      console.warn(`Error reading from ${layer} cache:`, error);
      return null;
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  /**
   * Delete cache entry from all layers
   */
  async delete(key: string): Promise<void> {
    // Delete from all layers
    this.memoryCache.delete(key);
    this.sessionCache.delete(key);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_${key}`);
    }
    
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        console.warn('Redis delete failed:', error);
      }
    }

    this.stats.deletes++;
    this.updateStats();
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];

    // Check memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    // Check session cache
    for (const [key, entry] of this.sessionCache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    // Delete all matching keys
    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Clear all caches
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    this.sessionCache.clear();
    
    if (typeof window !== 'undefined') {
      // Clear localStorage cache entries
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    }
    
    if (this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch (error) {
        console.warn('Redis clear failed:', error);
      }
    }

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      memoryUsage: 0,
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update cache statistics
   */
  private updateStats(): void {
    this.stats.size = this.memoryCache.size() + this.sessionCache.size;
    this.stats.memoryUsage = this.calculateMemoryUsage();
  }

  /**
   * Calculate memory usage
   */
  private calculateMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Serialize cache entry
   */
  private serialize(entry: CacheEntry): string {
    return JSON.stringify(entry);
  }

  /**
   * Deserialize cache entry
   */
  private deserialize<T>(data: string): CacheEntry<T> {
    return JSON.parse(data);
  }

  /**
   * Start cleanup interval for expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 60000); // Cleanup every minute
  }

  /**
   * Cleanup expired cache entries
   */
  private cleanupExpired(): void {
    const now = Date.now();

    // Cleanup memory cache
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
      }
    }

    // Cleanup session cache
    for (const [key, entry] of this.sessionCache.entries()) {
      if (this.isExpired(entry)) {
        this.sessionCache.delete(key);
      }
    }

    // Cleanup localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('cache_')) {
          try {
            const entry = this.deserialize(localStorage.getItem(key)!);
            if (this.isExpired(entry)) {
              localStorage.removeItem(key);
            }
          } catch (error) {
            // Invalid entry, remove it
            localStorage.removeItem(key);
          }
        }
      }
    }
  }

  /**
   * Prefetch data for better performance
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number;
      layer?: CacheLayer;
      tags?: string[];
    } = {}
  ): Promise<T> {
    // Check if already cached
    const cached = await this.get<T>(key);
    if (cached) return cached;

    // Fetch and cache
    const data = await fetcher();
    await this.set(key, data, options);
    return data;
  }
}

// Global cache instance
export const advancedCache = new AdvancedCacheManager({
  maxSize: 2000,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  enableRedis: process.env.REDIS_URL ? true : false,
  redisUrl: process.env.REDIS_URL,
  enableCompression: true,
  enableEncryption: false,
});

// Cache decorator for functions
export function cached<T extends (...args: any[]) => any>(
  keyFn: (...args: Parameters<T>) => string,
  options: {
    ttl?: number;
    layer?: CacheLayer;
    tags?: string[];
  } = {}
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const key = keyFn(...args);
      const cached = await advancedCache.get(key);
      
      if (cached) return cached;

      const result = await originalMethod.apply(this, args);
      await advancedCache.set(key, result, options);
      return result;
    };

    return descriptor;
  };
} 