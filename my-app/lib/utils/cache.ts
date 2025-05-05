/**
 * Cache utilities for the application
 */

// LRU Cache implementation
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;
  
  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    // Get and remove value
    const value = this.cache.get(key);
    
    // Put back to mark as recently used
    this.cache.delete(key);
    this.cache.set(key, value!);
    
    return value;
  }
  
  put(key: K, value: V): void {
    // Remove if exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    // Add new value
    this.cache.set(key, value);
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  size(): number {
    return this.cache.size;
  }
  
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
  
  values(): IterableIterator<V> {
    return this.cache.values();
  }
}

// Create a global cache for the application
let globalCache: Map<string, any>;

// Declare the global app cache
declare global {
  namespace NodeJS {
    interface Global {
      appCache: Map<string, any>;
    }
  }
}

// Window interface extension for client-side
interface CustomWindow extends Window {
  _appCache?: Map<string, any>;
}

// Initialize the global cache in a server-side safe way
if (typeof window === 'undefined') {
  // Server-side: Use a module-level variable
  const globalObj = global as unknown as { appCache?: Map<string, any> };
  
  if (!globalObj.appCache) {
    globalObj.appCache = new Map<string, any>();
  }
  globalCache = globalObj.appCache;
} else {
  // Client-side: Use window object
  const win = window as CustomWindow;
  
  if (!win._appCache) {
    win._appCache = new Map<string, any>();
  }
  globalCache = win._appCache;
}

// Cache a value with an optional TTL
export function cacheSet(key: string, value: any, ttlMs?: number): void {
  const item = {
    value,
    expiry: ttlMs ? Date.now() + ttlMs : undefined,
  };
  
  globalCache.set(key, item);
}

// Get a cached value, returns undefined if expired or not found
export function cacheGet(key: string): any {
  const item = globalCache.get(key);
  
  if (!item) return undefined;
  
  // Check if expired
  if (item.expiry && Date.now() > item.expiry) {
    globalCache.delete(key);
    return undefined;
  }
  
  return item.value;
}

// Delete a cached value
export function cacheDelete(key: string): void {
  globalCache.delete(key);
}

// Clear the entire cache
export function cacheClear(): void {
  globalCache.clear();
}

// Export the LRUCache class for direct usage
export { LRUCache }; 