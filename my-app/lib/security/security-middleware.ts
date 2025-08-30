import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimit } from './rate-limiter'
import { validateCSRF } from './csrf-protection'
import { sanitizeInput } from './input-sanitizer'
import { auditLogger } from './audit-logger'

export interface SecurityConfig {
  rateLimit: {
    windowMs: number
    max: number
    skipSuccessfulRequests?: boolean
  }
  csrf: boolean
  sanitization: boolean
  audit: boolean
  cors: {
    origin: string | string[]
    methods: string[]
    allowedHeaders: string[]
  }
  helmet: {
    contentSecurityPolicy: boolean
    hsts: boolean
    noSniff: boolean
    xssFilter: boolean
    referrerPolicy: string
  }
}

const defaultSecurityConfig: SecurityConfig = {
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    skipSuccessfulRequests: false
  },
  csrf: true,
  sanitization: true,
  audit: true,
  cors: {
    origin: [
      'http://localhost:3000',
      'https://yourdomain.com',
      'https://www.yourdomain.com'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-CSRF-Token'
    ]
  },
  helmet: {
    contentSecurityPolicy: true,
    hsts: true,
    noSniff: true,
    xssFilter: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  }
}

export class SecurityMiddleware {
  private config: SecurityConfig

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultSecurityConfig, ...config }
  }

  /**
   * Main security middleware handler
   */
  async handle(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Apply CORS headers
      const corsResponse = this.applyCORS(request)
      if (corsResponse) return corsResponse

      // Rate limiting
      const rateLimitResponse = await this.applyRateLimit(request)
      if (rateLimitResponse) return rateLimitResponse

      // CSRF protection for state-changing operations
      if (this.config.csrf && this.isStateChangingRequest(request)) {
        const csrfResponse = await this.applyCSRFProtection(request)
        if (csrfResponse) return csrfResponse
      }

      // Input sanitization
      if (this.config.sanitization) {
        await this.sanitizeRequestData(request)
      }

      // Security headers
      const response = this.applySecurityHeaders(NextResponse.next())

      // Audit logging
      if (this.config.audit) {
        await this.auditRequest(request)
      }

      return response

    } catch (error) {
      console.error('Security middleware error:', error)
      
      // Log security incident
      await auditLogger.logSecurityEvent({
        type: 'security_middleware_error',
        severity: 'high',
        ip: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        url: request.url,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }

  /**
   * Apply CORS headers
   */
  private applyCORS(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin')
    const method = request.method

    // Handle preflight requests
    if (method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 200 })
      
      // Check if origin is allowed
      if (this.isOriginAllowed(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin!)
        response.headers.set('Access-Control-Allow-Credentials', 'true')
        response.headers.set('Access-Control-Allow-Methods', this.config.cors.methods.join(', '))
        response.headers.set('Access-Control-Allow-Headers', this.config.cors.allowedHeaders.join(', '))
        response.headers.set('Access-Control-Max-Age', '86400') // 24 hours
      }
      
      return response
    }

    // For actual requests, add CORS headers
    if (this.isOriginAllowed(origin)) {
      // Headers will be added in applySecurityHeaders
      return null
    }

    // Block requests from disallowed origins
    if (origin && !this.isOriginAllowed(origin)) {
      return NextResponse.json(
        { error: 'CORS policy violation' },
        { status: 403 }
      )
    }

    return null
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
    const clientIP = this.getClientIP(request)
    const identifier = clientIP + ':' + request.nextUrl.pathname

    const result = await rateLimit.check(identifier, this.config.rateLimit)

    if (!result.allowed) {
      // Log rate limit violation
      await auditLogger.logSecurityEvent({
        type: 'rate_limit_exceeded',
        severity: 'medium',
        ip: clientIP,
        userAgent: request.headers.get('user-agent') || '',
        url: request.url,
        details: {
          limit: this.config.rateLimit.max,
          window: this.config.rateLimit.windowMs,
          requests: result.requests
        }
      })

      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: result.retryAfter 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': result.retryAfter.toString(),
            'X-RateLimit-Limit': this.config.rateLimit.max.toString(),
            'X-RateLimit-Remaining': Math.max(0, this.config.rateLimit.max - result.requests).toString(),
            'X-RateLimit-Reset': new Date(Date.now() + this.config.rateLimit.windowMs).toISOString()
          }
        }
      )
    }

    return null
  }

  /**
   * Apply CSRF protection
   */
  private async applyCSRFProtection(request: NextRequest): Promise<NextResponse | null> {
    const token = request.headers.get('x-csrf-token') || 
                  request.headers.get('csrf-token') ||
                  request.nextUrl.searchParams.get('csrf_token')

    if (!token) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      )
    }

    const isValid = await validateCSRF(token, this.getClientIP(request))
    
    if (!isValid) {
      await auditLogger.logSecurityEvent({
        type: 'csrf_validation_failed',
        severity: 'high',
        ip: this.getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        url: request.url,
        details: { token }
      })

      return NextResponse.json(
        { error: 'CSRF token invalid' },
        { status: 403 }
      )
    }

    return null
  }

  /**
   * Sanitize request data
   */
  private async sanitizeRequestData(request: NextRequest): Promise<void> {
    try {
      // Sanitize URL parameters
      const url = new URL(request.url)
      for (const [key, value] of url.searchParams.entries()) {
        const sanitized = sanitizeInput(value)
        if (sanitized !== value) {
          url.searchParams.set(key, sanitized)
        }
      }

      // For POST/PUT requests, sanitize body
      if (request.method === 'POST' || request.method === 'PUT') {
        const contentType = request.headers.get('content-type')
        
        if (contentType?.includes('application/json')) {
          // Clone request to avoid modifying the original
          const clonedRequest = request.clone()
          const body = await clonedRequest.json()
          const sanitizedBody = this.sanitizeObject(body)
          
          // Note: In a real implementation, you'd need to reconstruct the request
          // with the sanitized body, which is complex in Next.js middleware
        }
      }
    } catch (error) {
      console.error('Error sanitizing request data:', error)
    }
  }

  /**
   * Apply security headers
   */
  private applySecurityHeaders(response: NextResponse): NextResponse {
    const origin = response.headers.get('origin')

    // CORS headers
    if (this.isOriginAllowed(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin!)
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    // Security headers (Helmet-style)
    if (this.config.helmet.contentSecurityPolicy) {
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self' data:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none';"
      )
    }

    if (this.config.helmet.hsts) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      )
    }

    if (this.config.helmet.noSniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff')
    }

    if (this.config.helmet.xssFilter) {
      response.headers.set('X-XSS-Protection', '1; mode=block')
    }

    response.headers.set('Referrer-Policy', this.config.helmet.referrerPolicy)
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), location=()')

    // Remove server information
    response.headers.delete('Server')
    response.headers.delete('X-Powered-By')

    return response
  }

  /**
   * Audit request for security monitoring
   */
  private async auditRequest(request: NextRequest): Promise<void> {
    const clientIP = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const method = request.method
    const url = request.url

    // Log suspicious patterns
    if (this.isSuspiciousRequest(request)) {
      await auditLogger.logSecurityEvent({
        type: 'suspicious_request',
        severity: 'medium',
        ip: clientIP,
        userAgent,
        url,
        method,
        details: {
          reason: 'Suspicious patterns detected'
        }
      })
    }

    // Log admin/sensitive endpoints
    if (this.isSensitiveEndpoint(request)) {
      await auditLogger.logSecurityEvent({
        type: 'sensitive_endpoint_access',
        severity: 'low',
        ip: clientIP,
        userAgent,
        url,
        method
      })
    }
  }

  // Helper methods

  private isOriginAllowed(origin: string | null): boolean {
    if (!origin) return true // Same-origin requests
    
    const allowedOrigins = Array.isArray(this.config.cors.origin) 
      ? this.config.cors.origin 
      : [this.config.cors.origin]
    
    return allowedOrigins.includes(origin)
  }

  private isStateChangingRequest(request: NextRequest): boolean {
    return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)
  }

  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || remoteAddr || 'unknown'
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? sanitizeInput(obj) : obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item))
    }

    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value)
    }
    return sanitized
  }

  private isSuspiciousRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''
    const url = request.url.toLowerCase()

    // Check for bot patterns
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper']
    if (botPatterns.some(pattern => userAgent.includes(pattern))) {
      return true
    }

    // Check for malicious URL patterns
    const maliciousPatterns = [
      '/wp-admin', '/admin', '/.env', '/config',
      'script>', 'javascript:', 'eval(', 'union select'
    ]
    if (maliciousPatterns.some(pattern => url.includes(pattern))) {
      return true
    }

    return false
  }

  private isSensitiveEndpoint(request: NextRequest): boolean {
    const pathname = request.nextUrl.pathname
    const sensitivePatterns = ['/api/admin', '/api/os', '/api/auth']
    
    return sensitivePatterns.some(pattern => pathname.startsWith(pattern))
  }
}

export default SecurityMiddleware