import { NextRequest, NextResponse } from 'next/server'
import { BookingErrorHandler, BookingError } from '@/lib/errors/booking-error-handler'

export class ErrorHandlerMiddleware {
  static async handle(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const requestId = crypto.randomUUID()
    const startTime = Date.now()

    try {
      // Add request tracking headers
      const response = await handler(request)

      // Add performance monitoring
      const duration = Date.now() - startTime
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Response-Time', `${duration}ms`)

      // Log slow requests
      if (duration > 5000) {
        console.warn(`Slow request detected: ${request.method} ${request.url} took ${duration}ms`)
      }

      return response
    } catch (error) {
      // Log the error with context
      await BookingErrorHandler.logError(error as Error, {
        requestId,
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: request.ip || request.headers.get('x-forwarded-for'),
        duration: Date.now() - startTime
      })

      // Create error response
      const errorResponse = BookingErrorHandler.createErrorResponse(error as Error, requestId)
      errorResponse.headers.set('X-Request-ID', requestId)

      return errorResponse
    }
  }
}

// Rate limiting middleware
export class RateLimitMiddleware {
  private static cache = new Map<string, { count: number; resetTime: number }>()

  static async handle(
    request: NextRequest,
    limit: number = 100,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): Promise<NextResponse | null> {
    const key = this.getClientKey(request)
    const now = Date.now()

    const client = this.cache.get(key) || { count: 0, resetTime: now + windowMs }

    if (now > client.resetTime) {
      client.count = 0
      client.resetTime = now + windowMs
    }

    client.count++
    this.cache.set(key, client)

    if (client.count > limit) {
      const resetTime = Math.ceil((client.resetTime - now) / 1000)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests',
            retryAfter: resetTime
          }
        },
        {
          status: 429,
          headers: {
            'Retry-After': resetTime.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': Math.max(0, limit - client.count).toString(),
            'X-RateLimit-Reset': client.resetTime.toString()
          }
        }
      )
    }

    return null // Continue to next middleware
  }

  private static getClientKey(request: NextRequest): string {
    return request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  }
}

// Input validation middleware
export class ValidationMiddleware {
  static async validateRequestBody<T>(
    request: NextRequest,
    schema: any
  ): Promise<{ data: T; error: NextResponse | null }> {
    try {
      const body = await request.json()
      const data = await schema.parseAsync(body)

      return { data, error: null }
    } catch (error) {
      const errorResponse = BookingErrorHandler.createErrorResponse(error as Error)
      return { data: null as any, error: errorResponse }
    }
  }

  static async validateQueryParams<T>(
    request: NextRequest,
    schema: any
  ): Promise<{ data: T; error: NextResponse | null }> {
    try {
      const { searchParams } = new URL(request.url)
      const params = Object.fromEntries(searchParams)

      // Convert string values to appropriate types
      Object.keys(params).forEach(key => {
        if (params[key] === 'true') params[key] = true
        else if (params[key] === 'false') params[key] = false
        else if (!isNaN(Number(params[key])) && params[key] !== '') {
          params[key] = Number(params[key])
        }
      })

      const data = await schema.parseAsync(params)
      return { data, error: null }
    } catch (error) {
      const errorResponse = BookingErrorHandler.createErrorResponse(error as Error)
      return { data: null as any, error: errorResponse }
    }
  }
}

// Authentication middleware
export class AuthMiddleware {
  static async validateApiKey(request: NextRequest): Promise<{ valid: boolean; error?: NextResponse }> {
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_API_KEY',
              message: 'API key is required'
            }
          },
          { status: 401 }
        )
      }
    }

    // Validate API key (implement your own logic)
    const isValid = await this.verifyApiKey(apiKey)

    if (!isValid) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_API_KEY',
              message: 'Invalid API key'
            }
          },
          { status: 401 }
        )
      }
    }

    return { valid: true }
  }

  private static async verifyApiKey(apiKey: string): Promise<boolean> {
    // Implement your API key validation logic
    // This could check against a database or validate JWT tokens
    return apiKey === process.env.API_KEY || false
  }
}

// Request logging middleware
export class LoggingMiddleware {
  static async log(request: NextRequest, response?: NextResponse): Promise<void> {
    const log = {
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      userAgent: request.headers.get('user-agent'),
      ip: request.ip || request.headers.get('x-forwarded-for'),
      ...(response && {
        status: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries())
      })
    }

    console.log('Request Log:', JSON.stringify(log, null, 2))
  }
}

// CORS middleware
export class CorsMiddleware {
  static handle(
    request: NextRequest,
    response: NextResponse,
    options: {
      origin?: string | string[]
      methods?: string[]
      allowedHeaders?: string[]
    } = {}
  ): NextResponse {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders = ['Content-Type', 'Authorization', 'X-API-Key']
    } = options

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': allowedHeaders.join(', '),
          'Access-Control-Max-Age': '3600'
        }
      })
    }

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin)
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
    response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))

    return response
  }
}

// Compose multiple middlewares
export function createApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>,
  middlewares: {
    rateLimit?: { limit: number; windowMs: number }
    auth?: boolean
    cors?: { origin?: string | string[]; methods?: string[]; allowedHeaders?: string[] }
    logging?: boolean
  } = {}
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    try {
      // Rate limiting
      if (middlewares.rateLimit) {
        const rateLimitResponse = await RateLimitMiddleware.handle(
          request,
          middlewares.rateLimit.limit,
          middlewares.rateLimit.windowMs
        )

        if (rateLimitResponse) {
          return rateLimitResponse
        }
      }

      // Authentication
      if (middlewares.auth) {
        const authResult = await AuthMiddleware.validateApiKey(request)

        if (!authResult.valid && authResult.error) {
          return authResult.error
        }
      }

      // Logging
      if (middlewares.logging) {
        await LoggingMiddleware.log(request)
      }

      // Execute main handler with error handling
      const response = await ErrorHandlerMiddleware.handle(request, handler)

      // CORS
      if (middlewares.cors) {
        return CorsMiddleware.handle(request, response, middlewares.cors)
      }

      return response

    } catch (error) {
      return BookingErrorHandler.createErrorResponse(error as Error)
    }
  }
}