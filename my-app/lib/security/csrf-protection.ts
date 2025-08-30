import crypto from 'crypto'

interface CSRFToken {
  token: string
  ip: string
  expires: number
}

class CSRFProtection {
  private tokens: Map<string, CSRFToken> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60 * 60 * 1000)
  }

  /**
   * Generate a new CSRF token
   */
  generateToken(ip: string): string {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = Date.now() + (2 * 60 * 60 * 1000) // 2 hours

    this.tokens.set(token, { token, ip, expires })

    return token
  }

  /**
   * Validate a CSRF token
   */
  validateToken(token: string, ip: string): boolean {
    const storedToken = this.tokens.get(token)

    if (!storedToken) {
      return false
    }

    // Check if token has expired
    if (storedToken.expires < Date.now()) {
      this.tokens.delete(token)
      return false
    }

    // Check if IP matches (optional, can be disabled for load balancers)
    if (storedToken.ip !== ip) {
      return false
    }

    // Token is valid, remove it (one-time use)
    this.tokens.delete(token)
    return true
  }

  private cleanup(): void {
    const now = Date.now()
    
    this.tokens.forEach((data, token) => {
      if (data.expires < now) {
        this.tokens.delete(token)
      }
    })
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.tokens.clear()
  }
}

const csrfProtection = new CSRFProtection()

export const generateCSRF = (ip: string): string => csrfProtection.generateToken(ip)
export const validateCSRF = (token: string, ip: string): boolean => csrfProtection.validateToken(token, ip)

export default csrfProtection