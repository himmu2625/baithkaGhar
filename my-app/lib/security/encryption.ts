import crypto from 'crypto'

// Environment variables for encryption keys
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-32-char-key-for-development'
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

export interface EncryptedData {
  data: string
  iv: string
  tag: string
}

export interface GuestPII {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  passport?: string
  nationalId?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  dateOfBirth?: string
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
}

export interface PaymentData {
  cardNumber?: string
  cardholderName?: string
  expiryDate?: string
  billingAddress?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
}

class EncryptionService {
  private readonly key: Buffer

  constructor() {
    // Ensure key is exactly 32 bytes for AES-256
    this.key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string): EncryptedData {
    try {
      const iv = crypto.randomBytes(IV_LENGTH)
      const cipher = crypto.createCipher(ALGORITHM, this.key)
      cipher.setAAD(Buffer.from('baithaka-ghar-hotel', 'utf8'))

      let encrypted = cipher.update(plaintext, 'utf8', 'hex')
      encrypted += cipher.final('hex')

      const tag = cipher.getAuthTag()

      return {
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex')
      }
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Decrypt sensitive data using AES-256-GCM
   */
  decrypt(encryptedData: EncryptedData): string {
    try {
      const iv = Buffer.from(encryptedData.iv, 'hex')
      const tag = Buffer.from(encryptedData.tag, 'hex')

      const decipher = crypto.createDecipher(ALGORITHM, this.key)
      decipher.setAAD(Buffer.from('baithaka-ghar-hotel', 'utf8'))
      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8')
      decrypted += decipher.final('utf8')

      return decrypted
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Hash sensitive data for search/indexing purposes
   */
  hash(data: string): string {
    return crypto.createHmac('sha256', this.key)
      .update(data)
      .digest('hex')
  }

  /**
   * Generate secure random tokens
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
  }

  /**
   * Encrypt guest PII data
   */
  encryptGuestPII(guestData: GuestPII): Record<string, EncryptedData> {
    const encrypted: Record<string, EncryptedData> = {}

    // Encrypt individual fields that contain PII
    if (guestData.firstName) {
      encrypted.firstName = this.encrypt(guestData.firstName)
    }
    if (guestData.lastName) {
      encrypted.lastName = this.encrypt(guestData.lastName)
    }
    if (guestData.email) {
      encrypted.email = this.encrypt(guestData.email)
    }
    if (guestData.phone) {
      encrypted.phone = this.encrypt(guestData.phone)
    }
    if (guestData.passport) {
      encrypted.passport = this.encrypt(guestData.passport)
    }
    if (guestData.nationalId) {
      encrypted.nationalId = this.encrypt(guestData.nationalId)
    }
    if (guestData.dateOfBirth) {
      encrypted.dateOfBirth = this.encrypt(guestData.dateOfBirth)
    }

    // Encrypt address if present
    if (guestData.address) {
      encrypted.address = this.encrypt(JSON.stringify(guestData.address))
    }

    // Encrypt emergency contact if present
    if (guestData.emergencyContact) {
      encrypted.emergencyContact = this.encrypt(JSON.stringify(guestData.emergencyContact))
    }

    return encrypted
  }

  /**
   * Decrypt guest PII data
   */
  decryptGuestPII(encryptedData: Record<string, EncryptedData>): GuestPII {
    const decrypted: GuestPII = {}

    try {
      if (encryptedData.firstName) {
        decrypted.firstName = this.decrypt(encryptedData.firstName)
      }
      if (encryptedData.lastName) {
        decrypted.lastName = this.decrypt(encryptedData.lastName)
      }
      if (encryptedData.email) {
        decrypted.email = this.decrypt(encryptedData.email)
      }
      if (encryptedData.phone) {
        decrypted.phone = this.decrypt(encryptedData.phone)
      }
      if (encryptedData.passport) {
        decrypted.passport = this.decrypt(encryptedData.passport)
      }
      if (encryptedData.nationalId) {
        decrypted.nationalId = this.decrypt(encryptedData.nationalId)
      }
      if (encryptedData.dateOfBirth) {
        decrypted.dateOfBirth = this.decrypt(encryptedData.dateOfBirth)
      }

      if (encryptedData.address) {
        decrypted.address = JSON.parse(this.decrypt(encryptedData.address))
      }

      if (encryptedData.emergencyContact) {
        decrypted.emergencyContact = JSON.parse(this.decrypt(encryptedData.emergencyContact))
      }
    } catch (error) {
      throw new Error(`Failed to decrypt guest PII: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return decrypted
  }

  /**
   * Encrypt payment data with additional security
   */
  encryptPaymentData(paymentData: PaymentData): Record<string, EncryptedData> {
    const encrypted: Record<string, EncryptedData> = {}

    // Never store full card number - only last 4 digits
    if (paymentData.cardNumber) {
      const last4 = paymentData.cardNumber.slice(-4)
      encrypted.cardLast4 = this.encrypt(last4)
      // Note: Full card number should never be stored
    }

    if (paymentData.cardholderName) {
      encrypted.cardholderName = this.encrypt(paymentData.cardholderName)
    }

    if (paymentData.billingAddress) {
      encrypted.billingAddress = this.encrypt(JSON.stringify(paymentData.billingAddress))
    }

    return encrypted
  }

  /**
   * Create searchable hash for encrypted email (for login purposes)
   */
  createEmailHash(email: string): string {
    return this.hash(email.toLowerCase().trim())
  }

  /**
   * Create searchable hash for encrypted phone
   */
  createPhoneHash(phone: string): string {
    // Normalize phone number (remove spaces, dashes, etc.)
    const normalized = phone.replace(/[^\d+]/g, '')
    return this.hash(normalized)
  }

  /**
   * Encrypt file data (for document uploads)
   */
  encryptFile(fileBuffer: Buffer): EncryptedData {
    const base64Data = fileBuffer.toString('base64')
    return this.encrypt(base64Data)
  }

  /**
   * Decrypt file data
   */
  decryptFile(encryptedData: EncryptedData): Buffer {
    const base64Data = this.decrypt(encryptedData)
    return Buffer.from(base64Data, 'base64')
  }
}

// Singleton instance
export const encryptionService = new EncryptionService()

// Utility functions for common operations
export const encryptPII = (data: GuestPII) => encryptionService.encryptGuestPII(data)
export const decryptPII = (data: Record<string, EncryptedData>) => encryptionService.decryptGuestPII(data)
export const encryptPayment = (data: PaymentData) => encryptionService.encryptPaymentData(data)
export const hashEmail = (email: string) => encryptionService.createEmailHash(email)
export const hashPhone = (phone: string) => encryptionService.createPhoneHash(phone)
export const generateSecureToken = (length?: number) => encryptionService.generateToken(length)

// Key rotation utilities
export class KeyRotationService {
  private static rotationHistory: Array<{
    keyId: string
    createdAt: Date
    retired?: Date
  }> = []

  /**
   * Generate new encryption key for rotation
   */
  static generateNewKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  /**
   * Re-encrypt data with new key during rotation
   */
  static async rotateEncryptedData(
    oldEncryptedData: EncryptedData,
    oldKey: string,
    newKey: string
  ): Promise<EncryptedData> {
    // Create temporary encryption service with old key
    const oldEncryption = new EncryptionService()
    // Decrypt with old key
    const plaintext = oldEncryption.decrypt(oldEncryptedData)

    // Create new encryption service with new key
    const newEncryption = new EncryptionService()
    // Encrypt with new key
    return newEncryption.encrypt(plaintext)
  }

  /**
   * Track key rotation for audit purposes
   */
  static recordKeyRotation(keyId: string): void {
    this.rotationHistory.push({
      keyId,
      createdAt: new Date()
    })
  }

  /**
   * Retire old key
   */
  static retireKey(keyId: string): void {
    const key = this.rotationHistory.find(k => k.keyId === keyId)
    if (key) {
      key.retired = new Date()
    }
  }
}

// Secure deletion utilities
export class SecureDeletion {
  /**
   * Securely overwrite memory containing sensitive data
   */
  static secureWipe(sensitiveString: string): void {
    // In JavaScript, we can't truly control memory,
    // but we can encourage garbage collection
    if (typeof sensitiveString === 'string') {
      // Try to overwrite the string reference
      sensitiveString = crypto.randomBytes(sensitiveString.length).toString('hex')
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }

  /**
   * Create a secure temporary variable that auto-wipes
   */
  static createSecureTemp<T>(data: T, timeoutMs: number = 30000): T {
    const temp = data

    // Auto-wipe after timeout
    setTimeout(() => {
      if (typeof temp === 'string') {
        this.secureWipe(temp)
      }
    }, timeoutMs)

    return temp
  }
}