/**
 * Performance utility functions to improve application responsiveness
 */

// Cache storage for memoized function results
const memoCache = new Map<string, any>();

/**
 * Memoize a function result for improved performance
 * @param fn Function to memoize
 * @param keyFn Function to generate a unique key from arguments
 * @param ttl Time-to-live in milliseconds (optional)
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyFn?: (...args: Parameters<T>) => string,
  ttl?: number
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    
    if (memoCache.has(key)) {
      const { value, expires } = memoCache.get(key);
      if (!expires || expires > Date.now()) {
        return value;
      }
      // Expired
      memoCache.delete(key);
    }
    
    const result = fn(...args);
    
    // Store result in cache
    memoCache.set(key, {
      value: result,
      expires: ttl ? Date.now() + ttl : undefined,
    });
    
    return result;
  };
}

/**
 * Debounce a function to prevent frequent calls
 * @param fn Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>): void => {
    if (timer) clearTimeout(timer);
    
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Clear all performance caches
 */
export function clearCaches(): void {
  memoCache.clear();
} 