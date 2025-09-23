import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

// Custom error classes for booking operations
export class BookingError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(message: string, statusCode: number = 500, code: string = 'BOOKING_ERROR', details?: any) {
    super(message)
    this.name = 'BookingError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export class ValidationError extends BookingError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class AvailabilityError extends BookingError {
  constructor(message: string, conflicts?: any[]) {
    super(message, 409, 'AVAILABILITY_ERROR', { conflicts })
    this.name = 'AvailabilityError'
  }
}

export class PaymentError extends BookingError {
  constructor(message: string, paymentDetails?: any) {
    super(message, 402, 'PAYMENT_ERROR', paymentDetails)
    this.name = 'PaymentError'
  }
}

export class AuthorizationError extends BookingError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 403, 'AUTHORIZATION_ERROR')
    this.name = 'AuthorizationError'
  }
}

export class ResourceNotFoundError extends BookingError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`
    super(message, 404, 'RESOURCE_NOT_FOUND')
    this.name = 'ResourceNotFoundError'
  }
}

export class ConflictError extends BookingError {
  constructor(message: string, conflictData?: any) {
    super(message, 409, 'CONFLICT_ERROR', conflictData)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends BookingError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR', { retryAfter })
    this.name = 'RateLimitError'
  }
}

export class DatabaseError extends BookingError {
  constructor(message: string, operation?: string) {
    super(message, 500, 'DATABASE_ERROR', { operation })
    this.name = 'DatabaseError'
  }
}

export class ExternalServiceError extends BookingError {
  constructor(service: string, message: string, originalError?: any) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service, originalError })
    this.name = 'ExternalServiceError'
  }
}

// Error handling utilities
export class BookingErrorHandler {
  static handleZodError(error: ZodError): ValidationError {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }))

    return new ValidationError('Validation failed', {
      fields: formattedErrors,
      validationErrors: error.errors
    })
  }

  static handleDatabaseError(error: any, operation?: string): DatabaseError {
    let message = 'Database operation failed'
    let details: any = { operation }

    if (error.code === 11000) {
      // MongoDB duplicate key error
      const field = Object.keys(error.keyPattern)[0]
      message = `Duplicate ${field} already exists`
      details.duplicateField = field
      details.duplicateValue = error.keyValue
    } else if (error.name === 'CastError') {
      message = `Invalid ${error.path}: ${error.value}`
      details.invalidField = error.path
      details.invalidValue = error.value
    } else if (error.name === 'ValidationError') {
      message = 'Database validation failed'
      details.validationErrors = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message
      }))
    }

    return new DatabaseError(message, operation)
  }

  static handlePaymentError(error: any): PaymentError {
    let message = 'Payment processing failed'
    let details: any = {}

    // Handle different payment provider errors
    if (error.type === 'card_error') {
      message = `Card error: ${error.message}`
      details.cardError = true
      details.declineCode = error.decline_code
    } else if (error.type === 'invalid_request_error') {
      message = `Invalid payment request: ${error.message}`
      details.invalidRequest = true
    } else if (error.type === 'api_error') {
      message = 'Payment service temporarily unavailable'
      details.serviceError = true
    } else if (error.type === 'authentication_error') {
      message = 'Payment authentication failed'
      details.authError = true
    }

    return new PaymentError(message, details)
  }

  static async logError(error: Error, context: any = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...(error instanceof BookingError && {
          statusCode: error.statusCode,
          code: error.code,
          details: error.details
        })
      },
      context: {
        ...context,
        userAgent: context.request?.headers?.['user-agent'],
        ip: context.request?.ip,
        url: context.request?.url,
        method: context.request?.method
      }
    }

    // Log to console (in production, this would be sent to a logging service)
    console.error('Booking Error:', JSON.stringify(errorLog, null, 2))

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // await sendToMonitoringService(errorLog)
    }
  }

  static createErrorResponse(error: Error, requestId?: string): NextResponse {
    let statusCode = 500
    let errorCode = 'INTERNAL_SERVER_ERROR'
    let message = 'An unexpected error occurred'
    let details: any = undefined

    if (error instanceof BookingError) {
      statusCode = error.statusCode
      errorCode = error.code
      message = error.message
      details = error.details
    } else if (error instanceof ZodError) {
      const validationError = this.handleZodError(error)
      statusCode = validationError.statusCode
      errorCode = validationError.code
      message = validationError.message
      details = validationError.details
    } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
      const dbError = this.handleDatabaseError(error)
      statusCode = dbError.statusCode
      errorCode = dbError.code
      message = dbError.message
      details = dbError.details
    }

    // Don't expose internal errors in production
    if (process.env.NODE_ENV === 'production' && statusCode === 500) {
      message = 'Internal server error'
      details = undefined
    }

    const errorResponse = {
      success: false,
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
        ...(requestId && { requestId }),
        timestamp: new Date().toISOString()
      }
    }

    return NextResponse.json(errorResponse, { status: statusCode })
  }
}

// Decorator for API route error handling
export function withErrorHandling(handler: Function) {
  return async (request: Request, context?: any) => {
    const requestId = crypto.randomUUID()

    try {
      return await handler(request, context)
    } catch (error) {
      await BookingErrorHandler.logError(error as Error, {
        request: {
          url: request.url,
          method: request.method,
          headers: Object.fromEntries(request.headers.entries())
        },
        context,
        requestId
      })

      return BookingErrorHandler.createErrorResponse(error as Error, requestId)
    }
  }
}

// Retry mechanism for transient errors
export class RetryHandler {
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000,
    shouldRetry: (error: any) => boolean = (error) => error.statusCode >= 500
  ): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error

        if (attempt === maxRetries || !shouldRetry(error)) {
          throw error
        }

        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }

    throw lastError
  }
}

// Circuit breaker for external services
export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private monitoringPeriod: number = 300000 // 5 minutes
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new ExternalServiceError('Circuit Breaker', 'Service temporarily unavailable')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }

  private onFailure() {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    }
  }
}

// Health check utilities
export class HealthChecker {
  static async checkDatabaseHealth(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    const start = Date.now()

    try {
      const { connectToDatabase } = await import('@/lib/mongodb')
      await connectToDatabase()

      return {
        healthy: true,
        latency: Date.now() - start
      }
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : 'Database connection failed'
      }
    }
  }

  static async checkExternalServices(): Promise<Record<string, { healthy: boolean; latency?: number; error?: string }>> {
    const services = {
      payment: { url: process.env.PAYMENT_SERVICE_URL },
      email: { url: process.env.EMAIL_SERVICE_URL },
      sms: { url: process.env.SMS_SERVICE_URL }
    }

    const results: Record<string, any> = {}

    await Promise.allSettled(
      Object.entries(services).map(async ([name, config]) => {
        if (!config.url) {
          results[name] = { healthy: false, error: 'Service URL not configured' }
          return
        }

        const start = Date.now()
        try {
          const response = await fetch(`${config.url}/health`, {
            method: 'GET',
            timeout: 5000
          })

          results[name] = {
            healthy: response.ok,
            latency: Date.now() - start,
            ...(response.ok || { error: `HTTP ${response.status}` })
          }
        } catch (error) {
          results[name] = {
            healthy: false,
            error: error instanceof Error ? error.message : 'Service unreachable'
          }
        }
      })
    )

    return results
  }
}

// Error reporting utilities
export class ErrorReporter {
  static async reportCriticalError(error: Error, context: any = {}) {
    const report = {
      severity: 'critical',
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context,
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version
    }

    // In production, send to error tracking service (Sentry, Bugsnag, etc.)
    if (process.env.NODE_ENV === 'production') {
      // await sendToErrorTrackingService(report)
    }

    console.error('Critical Error Report:', JSON.stringify(report, null, 2))
  }

  static async reportPerformanceIssue(operation: string, duration: number, threshold: number = 5000) {
    if (duration > threshold) {
      const report = {
        type: 'performance',
        operation,
        duration,
        threshold,
        timestamp: new Date().toISOString()
      }

      console.warn('Performance Issue:', JSON.stringify(report, null, 2))
    }
  }
}

export type ErrorContext = {
  request?: Request
  user?: any
  booking?: any
  operation?: string
  requestId?: string
}