interface RateLimitConfig {
  windowMs: number
  max: number
  skipSuccessfulRequests?: boolean
  burstLimit?: number
  costPerRequest?: number
  whitelistedIPs?: string[]
  bypassOnTrustedUser?: boolean
}

interface RateLimitResult {
  allowed: boolean
  requests: number
  retryAfter: number
  cost?: number
  remainingTokens?: number
  warningThreshold?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
  windowStart: number
  tokens?: number
  lastRefill?: number
}

interface BookingRateLimitConfig {
  search: RateLimitConfig
  create: RateLimitConfig
  modify: RateLimitConfig
  cancel: RateLimitConfig
  payment: RateLimitConfig
}

export type RequestType = 'search' | 'create' | 'modify' | 'cancel' | 'payment'

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout
  private suspiciousIPs: Set<string> = new Set()
  private trustedUsers: Set<string> = new Set()

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  async check(identifier: string, config: RateLimitConfig, userInfo?: {
    userId?: string
    ip: string
    isTrusted?: boolean
  }): Promise<RateLimitResult> {
    const now = Date.now()

    // Check if IP is whitelisted
    if (config.whitelistedIPs?.includes(userInfo?.ip || '')) {
      return {
        allowed: true,
        requests: 0,
        retryAfter: 0
      }
    }

    // Bypass for trusted users if configured
    if (config.bypassOnTrustedUser && userInfo?.isTrusted) {
      return {
        allowed: true,
        requests: 0,
        retryAfter: 0
      }
    }

    // Apply stricter limits for suspicious IPs
    let effectiveConfig = config
    if (userInfo?.ip && this.suspiciousIPs.has(userInfo.ip)) {
      effectiveConfig = {
        ...config,
        max: Math.ceil(config.max * 0.5), // Reduce limit by 50%
        windowMs: config.windowMs * 2 // Double the window
      }
    }

    const windowStart = now - (now % effectiveConfig.windowMs)
    const resetTime = windowStart + effectiveConfig.windowMs

    let entry = this.store.get(identifier)

    // Create new entry if doesn't exist or window has expired
    if (!entry || entry.windowStart < windowStart) {
      entry = {
        count: 0,
        resetTime,
        windowStart,
        tokens: effectiveConfig.burstLimit || effectiveConfig.max,
        lastRefill: now
      }
    }

    // Token bucket algorithm for burst handling
    if (effectiveConfig.burstLimit) {
      this.refillTokens(entry, effectiveConfig, now)
    }

    const cost = effectiveConfig.costPerRequest || 1
    const allowed = effectiveConfig.burstLimit
      ? (entry.tokens || 0) >= cost
      : entry.count < effectiveConfig.max

    if (allowed) {
      entry.count++
      if (effectiveConfig.burstLimit && entry.tokens) {
        entry.tokens -= cost
      }
    }

    this.store.set(identifier, entry)

    // Track suspicious behavior
    if (!allowed && userInfo?.ip) {
      this.trackSuspiciousActivity(userInfo.ip, entry.count)
    }

    const retryAfter = Math.ceil((resetTime - now) / 1000)
    const warningThreshold = entry.count > (effectiveConfig.max * 0.8)

    return {
      allowed,
      requests: entry.count,
      retryAfter: retryAfter > 0 ? retryAfter : 0,
      cost,
      remainingTokens: entry.tokens,
      warningThreshold
    }
  }

  private refillTokens(entry: RateLimitEntry, config: RateLimitConfig, now: number): void {
    if (!entry.lastRefill || !entry.tokens || !config.burstLimit) return

    const timePassed = now - entry.lastRefill
    const refillRate = config.burstLimit / config.windowMs // tokens per ms
    const tokensToAdd = Math.floor(timePassed * refillRate)

    if (tokensToAdd > 0) {
      entry.tokens = Math.min(config.burstLimit, entry.tokens + tokensToAdd)
      entry.lastRefill = now
    }
  }

  private trackSuspiciousActivity(ip: string, attempts: number): void {
    // Mark IP as suspicious after excessive attempts
    if (attempts > 100) {
      this.suspiciousIPs.add(ip)
      // Auto-remove after 1 hour
      setTimeout(() => {
        this.suspiciousIPs.delete(ip)
      }, 60 * 60 * 1000)
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

export class BookingRateLimiter extends RateLimiter {
  private readonly bookingConfigs: BookingRateLimitConfig = {
    search: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 searches per minute
      burstLimit: 10, // Allow burst of 10 requests
      costPerRequest: 1,
      skipSuccessfulRequests: false
    },
    create: {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 bookings per minute
      burstLimit: 3,
      costPerRequest: 2, // Creating costs more
      skipSuccessfulRequests: true,
      bypassOnTrustedUser: true
    },
    modify: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 modifications per minute
      burstLimit: 5,
      costPerRequest: 1,
      skipSuccessfulRequests: true
    },
    cancel: {
      windowMs: 60 * 1000, // 1 minute
      max: 3, // 3 cancellations per minute
      burstLimit: 2,
      costPerRequest: 2,
      skipSuccessfulRequests: true
    },
    payment: {
      windowMs: 60 * 1000, // 1 minute
      max: 3, // 3 payment attempts per minute
      burstLimit: 1, // No burst for payments
      costPerRequest: 5, // High cost for payment attempts
      skipSuccessfulRequests: true
    }
  }

  async checkBookingRequest(
    requestType: RequestType,
    userIdentifier: string,
    userInfo?: {
      userId?: string
      ip: string
      isTrusted?: boolean
      isAuthenticated?: boolean
    }
  ): Promise<RateLimitResult & {
    blocked?: boolean
    reason?: string
    escalated?: boolean
  }> {
    const config = this.bookingConfigs[requestType]
    const identifier = `booking:${requestType}:${userIdentifier}`

    // Enhanced protection for payment requests
    if (requestType === 'payment') {
      // Require authentication for payments
      if (!userInfo?.isAuthenticated) {
        return {
          allowed: false,
          blocked: true,
          reason: 'Authentication required for payment requests',
          requests: 0,
          retryAfter: 0
        }
      }

      // Additional IP-based limiting for payments
      const ipResult = await this.check(
        `payment:ip:${userInfo.ip}`,
        {
          ...config,
          max: Math.ceil(config.max / 2) // Stricter IP-based limit
        },
        userInfo
      )

      if (!ipResult.allowed) {
        return {
          ...ipResult,
          blocked: true,
          reason: 'Too many payment attempts from this IP address',
          escalated: true
        }
      }
    }

    const result = await this.check(identifier, config, userInfo)

    // Enhanced monitoring for booking creation
    if (requestType === 'create' && !result.allowed) {
      // Log potential booking abuse
      console.warn(`Booking creation rate limit exceeded for ${userIdentifier}`)

      return {
        ...result,
        blocked: true,
        reason: 'Too many booking creation attempts',
        escalated: result.requests > config.max * 2
      }
    }

    // Special handling for search abuse
    if (requestType === 'search' && result.requests > config.max * 0.9) {
      return {
        ...result,
        reason: 'Approaching search rate limit',
        warningThreshold: true
      }
    }

    return result
  }

  async checkCompositeBookingFlow(
    userId: string,
    ip: string,
    flow: RequestType[]
  ): Promise<{
    allowed: boolean
    blockedAt?: RequestType
    results: Record<RequestType, RateLimitResult>
  }> {
    const results: Record<RequestType, RateLimitResult> = {} as any

    for (const requestType of flow) {
      const result = await this.checkBookingRequest(requestType, userId, {
        userId,
        ip,
        isAuthenticated: true
      })

      results[requestType] = result

      if (!result.allowed) {
        return {
          allowed: false,
          blockedAt: requestType,
          results
        }
      }
    }

    return {
      allowed: true,
      results
    }
  }

  async getBookingLimitStatus(
    userIdentifier: string,
    requestType?: RequestType
  ): Promise<{
    requestType: RequestType
    current: number
    limit: number
    resetTime: Date
    warningLevel: 'green' | 'yellow' | 'red'
  }[]> {
    const statuses = []
    const types: RequestType[] = requestType ? [requestType] : ['search', 'create', 'modify', 'cancel', 'payment']

    for (const type of types) {
      const config = this.bookingConfigs[type]
      const identifier = `booking:${type}:${userIdentifier}`
      const entry = this.store.get(identifier)

      const current = entry?.count || 0
      const limit = config.max
      const resetTime = entry?.resetTime ? new Date(entry.resetTime) : new Date()

      let warningLevel: 'green' | 'yellow' | 'red' = 'green'
      if (current > limit * 0.8) warningLevel = 'red'
      else if (current > limit * 0.6) warningLevel = 'yellow'

      statuses.push({
        requestType: type,
        current,
        limit,
        resetTime,
        warningLevel
      })
    }

    return statuses
  }

  addTrustedUser(userId: string): void {
    this.trustedUsers.add(userId)
  }

  removeTrustedUser(userId: string): void {
    this.trustedUsers.delete(userId)
  }

  isTrustedUser(userId: string): boolean {
    return this.trustedUsers.has(userId)
  }

  markIPSuspicious(ip: string, reason: string = 'Manual flag'): void {
    this.suspiciousIPs.add(ip)
    console.warn(`IP ${ip} marked as suspicious: ${reason}`)
  }

  clearIPSuspicion(ip: string): void {
    this.suspiciousIPs.delete(ip)
  }

  getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousIPs)
  }

  updateBookingLimits(requestType: RequestType, newLimits: Partial<RateLimitConfig>): void {
    this.bookingConfigs[requestType] = {
      ...this.bookingConfigs[requestType],
      ...newLimits
    }
  }

  getBookingLimits(): BookingRateLimitConfig {
    return { ...this.bookingConfigs }
  }
}

export const rateLimit = new RateLimiter()
export const bookingRateLimit = new BookingRateLimiter()

export default rateLimit