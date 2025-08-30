export interface ChannelCredentials {
  [key: string]: any
}

export interface ChannelConfiguration {
  [key: string]: any
}

export interface SyncData {
  property: any
  rooms?: any[]
  availability?: any[]
  credentials: ChannelCredentials
  configuration?: ChannelConfiguration
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ChannelSyncResult {
  success: boolean
  message: string
  syncedRooms?: number
  syncedRates?: number
  syncedInventory?: number
  errors?: string[]
  warnings?: string[]
  details?: any
}

export interface ConnectionTestResult {
  success: boolean
  message: string
  details?: any
}

export abstract class BaseOTAChannel {
  protected channelId: string
  protected channelName: string
  protected baseUrl: string
  protected timeout: number = 30000 // 30 seconds default

  constructor(channelId: string, channelName: string, baseUrl: string) {
    this.channelId = channelId
    this.channelName = channelName
    this.baseUrl = baseUrl
  }

  /**
   * Test connection to the OTA channel
   */
  abstract testConnection(credentials: ChannelCredentials): Promise<ConnectionTestResult>

  /**
   * Sync property inventory (rooms, room types) with the channel
   */
  abstract syncInventory(data: SyncData): Promise<ChannelSyncResult>

  /**
   * Sync rates and pricing with the channel
   */
  abstract syncRates(data: SyncData): Promise<ChannelSyncResult>

  /**
   * Sync availability and restrictions with the channel
   */
  abstract syncAvailability(data: SyncData): Promise<ChannelSyncResult>

  /**
   * Retrieve bookings from the channel
   */
  abstract getBookings(credentials: ChannelCredentials, dateRange: { start: Date, end: Date }): Promise<any[]>

  /**
   * Push booking modifications to the channel
   */
  abstract updateBooking(credentials: ChannelCredentials, bookingId: string, updates: any): Promise<ChannelSyncResult>

  /**
   * Make HTTP request with error handling and retry logic
   */
  protected async makeRequest(
    endpoint: string, 
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      headers?: { [key: string]: string }
      body?: any
      timeout?: number
      retries?: number
    } = {}
  ): Promise<any> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = 3
    } = options

    const url = `${this.baseUrl}${endpoint}`
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Baithaka-GHAR-OS/1.0',
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body)
    }

    let lastError: Error

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions)
        
        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }

        // Try to parse as JSON, fallback to text
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return await response.json()
        } else {
          return await response.text()
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error')
        
        // Don't retry on authentication errors or client errors (4xx)
        if (lastError.message.includes('401') || lastError.message.includes('403') || 
            lastError.message.includes('400') || lastError.message.includes('404')) {
          break
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000) // Max 10 seconds
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }

  /**
   * Validate required credentials
   */
  protected validateCredentials(credentials: ChannelCredentials, requiredFields: string[]): void {
    const missing = requiredFields.filter(field => !credentials[field])
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`)
    }
  }

  /**
   * Log channel operations
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString()
    const prefix = `[${this.channelName}] ${timestamp}`
    
    switch (level) {
      case 'info':
        console.log(`${prefix} INFO: ${message}`, data || '')
        break
      case 'warn':
        console.warn(`${prefix} WARN: ${message}`, data || '')
        break
      case 'error':
        console.error(`${prefix} ERROR: ${message}`, data || '')
        break
    }
  }

  /**
   * Parse date in various formats
   */
  protected parseDate(dateString: string | Date): Date {
    if (dateString instanceof Date) {
      return dateString
    }
    
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateString}`)
    }
    
    return date
  }

  /**
   * Format date for API requests
   */
  protected formatDate(date: Date, format: 'ISO' | 'YYYY-MM-DD' | 'timestamp' = 'YYYY-MM-DD'): string {
    switch (format) {
      case 'ISO':
        return date.toISOString()
      case 'YYYY-MM-DD':
        return date.toISOString().split('T')[0]
      case 'timestamp':
        return Math.floor(date.getTime() / 1000).toString()
      default:
        return date.toISOString()
    }
  }

  /**
   * Rate limiting helper
   */
  protected async rateLimit(requestsPerMinute: number = 60): Promise<void> {
    const delay = Math.ceil(60000 / requestsPerMinute) // Convert to milliseconds
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Sanitize and validate room data
   */
  protected sanitizeRoomData(rooms: any[]): any[] {
    return rooms.map(room => ({
      id: room._id?.toString() || room.id,
      roomNumber: room.roomNumber || room.number,
      roomType: room.roomType || room.type,
      maxOccupancy: room.maxOccupancy || room.capacity || 2,
      baseRate: room.baseRate || room.rate || 0,
      amenities: room.amenities || [],
      description: room.description || '',
      size: room.size || 0,
      status: room.status || 'available'
    }))
  }

  /**
   * Build error response
   */
  protected buildErrorResult(message: string, errors?: string[]): ChannelSyncResult {
    return {
      success: false,
      message,
      errors: errors || [message],
      syncedRooms: 0,
      syncedRates: 0,
      syncedInventory: 0
    }
  }

  /**
   * Build success response
   */
  protected buildSuccessResult(
    message: string, 
    counts: { rooms?: number, rates?: number, inventory?: number } = {},
    warnings?: string[]
  ): ChannelSyncResult {
    return {
      success: true,
      message,
      syncedRooms: counts.rooms || 0,
      syncedRates: counts.rates || 0,
      syncedInventory: counts.inventory || 0,
      warnings
    }
  }
}

export default BaseOTAChannel