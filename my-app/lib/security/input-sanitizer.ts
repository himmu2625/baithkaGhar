// Input sanitization utilities

/**
 * Basic HTML sanitization - removes/escapes dangerous HTML
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * SQL injection prevention - basic escaping
 */
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/g, '')
    .replace(/sp_/g, '')
}

/**
 * NoSQL injection prevention
 */
export function sanitizeNoSQL(input: any): any {
  if (typeof input === 'string') {
    return input.replace(/[${}]/g, '')
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Skip dangerous operators
      if (key.startsWith('$') || key.includes('.')) {
        continue
      }
      sanitized[key] = sanitizeNoSQL(value)
    }
    return sanitized
  }
  
  return input
}

/**
 * XSS prevention
 */
export function sanitizeXSS(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/eval\(/gi, '')
    .replace(/expression\(/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
}

/**
 * Path traversal prevention
 */
export function sanitizePath(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/:/g, '')
    .replace(/\*/g, '')
    .replace(/\?/g, '')
    .replace(/"/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/\|/g, '')
}

/**
 * Email sanitization
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return ''
  
  // Basic email format validation and sanitization
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  const sanitized = email.toLowerCase().trim()
  
  return emailRegex.test(sanitized) ? sanitized : ''
}

/**
 * Phone number sanitization
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  // Remove all non-digit characters except + at the beginning
  return phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
}

/**
 * URL sanitization
 */
export function sanitizeURL(url: string): string {
  if (typeof url !== 'string') return ''
  
  try {
    const parsed = new URL(url)
    
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    
    // Reconstruct URL to remove any dangerous components
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}${parsed.search}`
  } catch {
    return ''
  }
}

/**
 * Alphanumeric sanitization - only letters, numbers, and safe characters
 */
export function sanitizeAlphanumeric(input: string, allowSpaces = true): string {
  if (typeof input !== 'string') return ''
  
  const pattern = allowSpaces ? /[^a-zA-Z0-9\s-_]/g : /[^a-zA-Z0-9-_]/g
  return input.replace(pattern, '')
}

/**
 * Numeric sanitization
 */
export function sanitizeNumber(input: string | number): number | null {
  if (typeof input === 'number') {
    return isNaN(input) || !isFinite(input) ? null : input
  }
  
  if (typeof input === 'string') {
    const num = parseFloat(input.replace(/[^0-9.-]/g, ''))
    return isNaN(num) || !isFinite(num) ? null : num
  }
  
  return null
}

/**
 * General input sanitization
 */
export function sanitizeInput(input: string, options: {
  maxLength?: number
  allowHTML?: boolean
  allowSQL?: boolean
  trim?: boolean
} = {}): string {
  if (typeof input !== 'string') return ''
  
  const {
    maxLength = 10000,
    allowHTML = false,
    allowSQL = false,
    trim = true
  } = options
  
  let sanitized = input
  
  // Trim whitespace
  if (trim) {
    sanitized = sanitized.trim()
  }
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength)
  }
  
  // HTML sanitization
  if (!allowHTML) {
    sanitized = sanitizeHTML(sanitized)
  }
  
  // SQL injection prevention
  if (!allowSQL) {
    sanitized = sanitizeXSS(sanitized)
  }
  
  return sanitized
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: any, maxDepth = 10): any {
  if (maxDepth <= 0) return null
  
  if (typeof obj === 'string') {
    return sanitizeInput(obj)
  }
  
  if (typeof obj === 'number') {
    return sanitizeNumber(obj)
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, maxDepth - 1))
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize key
      const sanitizedKey = sanitizeInput(key, { maxLength: 100 })
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(value, maxDepth - 1)
      }
    }
    
    return sanitized
  }
  
  return obj
}

export default {
  sanitizeHTML,
  sanitizeSQL,
  sanitizeNoSQL,
  sanitizeXSS,
  sanitizePath,
  sanitizeEmail,
  sanitizePhone,
  sanitizeURL,
  sanitizeAlphanumeric,
  sanitizeNumber,
  sanitizeInput,
  sanitizeObject
}