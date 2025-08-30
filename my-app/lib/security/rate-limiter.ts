interface RateLimitConfig {
  windowMs: number
  max: number
  skipSuccessfulRequests?: boolean
}

interface RateLimitResult {
  allowed: boolean
  requests: number
  retryAfter: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  windowStart: number
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  async check(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - (now % config.windowMs)
    const resetTime = windowStart + config.windowMs

    let entry = this.store.get(identifier)

    // Create new entry if doesn't exist or window has expired
    if (!entry || entry.windowStart < windowStart) {
      entry = {
        count: 0,
        resetTime,
        windowStart
      }
    }

    entry.count++
    this.store.set(identifier, entry)

    const allowed = entry.count <= config.max
    const retryAfter = Math.ceil((resetTime - now) / 1000)

    return {
      allowed,
      requests: entry.count,
      retryAfter: retryAfter > 0 ? retryAfter : 0
    }
  }

  private cleanup(): void {
    const now = Date.now()
    
    this.store.forEach((entry, identifier) => {
      if (entry.resetTime < now) {
        this.store.delete(identifier)
      }
    })
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

export const rateLimit = new RateLimiter()
export default rateLimit