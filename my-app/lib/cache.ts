// In-memory cache with TTL for API responses
class CacheManager {
  private cache = new Map<
    string,
    {
      data: any
      expires: number
      hits: number
    }
  >()

  private maxSize = 1000 // Maximum number of cached items
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
  }

  set(key: string, data: any, ttlSeconds: number = 60) {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
      hits: 0,
    })

    this.stats.sets++
  }

  get(key: string): any | null {
    const item = this.cache.get(key)

    if (!item) {
      this.stats.misses++
      return null
    }

    // Check if expired
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update hit count
    item.hits++
    this.stats.hits++

    return item.data
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    if (!item) return false

    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
    }
  }

  clearExpired(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key)
        cleared++
      }
    }

    return cleared
  }

  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate:
        this.stats.hits + this.stats.misses > 0
          ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
          : 0,
    }
  }

  // Get all keys matching a pattern
  getKeysByPattern(pattern: RegExp): string[] {
    return Array.from(this.cache.keys()).filter((key) => pattern.test(key))
  }

  // Delete all keys matching a pattern
  deleteByPattern(pattern: RegExp): number {
    let deleted = 0
    const keysToDelete = this.getKeysByPattern(pattern)

    keysToDelete.forEach((key) => {
      if (this.cache.delete(key)) {
        deleted++
      }
    })

    return deleted
  }
}

// Global cache instance
export const apiCache = new CacheManager()

// Cleanup expired entries every 5 minutes
if (typeof window === "undefined") {
  // Server-side only
  setInterval(() => {
    const cleared = apiCache.clearExpired()
    if (cleared > 0) {
      console.log(`[Cache] Cleared ${cleared} expired entries`)
    }
  }, 5 * 60 * 1000)
}

// Cache key generators
export const cacheKeys = {
  properties: {
    list: (query: Record<string, any>) =>
      `properties:list:${JSON.stringify(query)}`,
    byId: (id: string) => `properties:${id}`,
    byCity: (city: string) => `properties:city:${city}`,
  },
  bookings: {
    list: (userId: string, query: Record<string, any>) =>
      `bookings:${userId}:${JSON.stringify(query)}`,
    byId: (id: string) => `bookings:${id}`,
  },
  pricing: {
    query: (propertyId: string, params: Record<string, any>) =>
      `pricing:${propertyId}:${JSON.stringify(params)}`,
    matrix: (propertyId: string, category: string) =>
      `pricing:matrix:${propertyId}:${category}`,
  },
  analytics: {
    revenue: (startDate: string, endDate: string) =>
      `analytics:revenue:${startDate}:${endDate}`,
  },
}

// Utility to invalidate related caches
export const invalidateCache = {
  property: (propertyId: string) => {
    apiCache.delete(cacheKeys.properties.byId(propertyId))
    apiCache.deleteByPattern(new RegExp(`^properties:list:`))
    apiCache.deleteByPattern(new RegExp(`^pricing:${propertyId}:`))
  },
  booking: (bookingId: string, userId: string) => {
    apiCache.delete(cacheKeys.bookings.byId(bookingId))
    apiCache.deleteByPattern(new RegExp(`^bookings:${userId}:`))
  },
  city: (city: string) => {
    apiCache.delete(cacheKeys.properties.byCity(city))
    apiCache.deleteByPattern(new RegExp(`^properties:city:${city}`))
  },
  all: () => {
    apiCache.clear()
  },
}

// Cache decorator for API route handlers
export function withCache(
  handler: Function,
  options: {
    keyGenerator: (req: any) => string
    ttl?: number // TTL in seconds
    invalidateOnMutation?: boolean
  }
) {
  const { keyGenerator, ttl = 60, invalidateOnMutation = false } = options

  return async (req: any, ...args: any[]) => {
    const method = req.method || "GET"
    const cacheKey = keyGenerator(req)

    // Only cache GET requests
    if (method === "GET") {
      const cached = apiCache.get(cacheKey)

      if (cached) {
        console.log(`[Cache] Hit: ${cacheKey}`)
        return cached
      }
    }

    // Execute handler
    const result = await handler(req, ...args)

    // Cache successful GET responses
    if (method === "GET" && result.ok !== false) {
      apiCache.set(cacheKey, result, ttl)
      console.log(`[Cache] Set: ${cacheKey} (TTL: ${ttl}s)`)
    }

    // Invalidate cache on mutations if configured
    if (invalidateOnMutation && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      // Extract entity type from key
      const entityMatch = cacheKey.match(/^(\w+):/)
      if (entityMatch) {
        const entity = entityMatch[1]
        apiCache.deleteByPattern(new RegExp(`^${entity}:`))
        console.log(`[Cache] Invalidated: ${entity}:*`)
      }
    }

    return result
  }
}

// Example usage:
/*
export const GET = withCache(
  async (request: NextRequest) => {
    const data = await fetchProperties()
    return NextResponse.json(data)
  },
  {
    keyGenerator: (req) =>
      cacheKeys.properties.list(Object.fromEntries(req.nextUrl.searchParams)),
    ttl: 300, // 5 minutes
  }
)
*/
