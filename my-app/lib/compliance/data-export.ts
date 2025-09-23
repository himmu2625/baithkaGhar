import { auditLogger } from '../security/audit-logger'
import { encryptionService } from '../security/encryption'
import { gdprService } from './gdpr-compliance'

export interface ExportRequest {
  id: string
  userId: string
  requestType: 'personal_data' | 'booking_history' | 'payment_records' | 'communication_history' | 'full_export'
  format: 'json' | 'csv' | 'pdf' | 'xml'
  dateRange?: {
    start: Date
    end: Date
  }
  includeDeleted: boolean
  includeEncrypted: boolean
  requestedAt: Date
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  completedAt?: Date
  downloadUrl?: string
  expiresAt?: Date
  fileSize?: number
  recordCount?: number
  error?: string
  ipAddress: string
  userAgent: string
}

export interface ExportedData {
  metadata: {
    exportId: string
    userId: string
    exportType: string
    exportedAt: Date
    recordCount: number
    dataVersion: string
    format: string
  }
  personalData?: {
    profile: any
    preferences: any
    documents: any[]
  }
  bookingHistory?: {
    bookings: any[]
    modifications: any[]
    cancellations: any[]
  }
  paymentRecords?: {
    transactions: any[]
    refunds: any[]
    disputes: any[]
  }
  communicationHistory?: {
    emails: any[]
    sms: any[]
    supportTickets: any[]
  }
  legalInformation?: {
    consentHistory: any[]
    privacyPolicyVersions: any[]
    dataProcessingActivities: any[]
  }
}

export interface ExportTemplate {
  id: string
  name: string
  description: string
  dataCategories: string[]
  format: 'json' | 'csv' | 'pdf' | 'xml'
  fields: Array<{
    path: string
    label: string
    type: 'string' | 'number' | 'date' | 'boolean' | 'object'
    required: boolean
    sensitive: boolean
  }>
  transformations: Array<{
    field: string
    transformation: 'mask' | 'encrypt' | 'hash' | 'format_date' | 'format_currency'
    parameters?: any
  }>
  filters: Array<{
    field: string
    condition: 'equals' | 'contains' | 'starts_with' | 'date_range'
    value: any
  }>
}

class DataExportService {
  private readonly maxFileSize = 100 * 1024 * 1024 // 100MB
  private readonly downloadExpiry = 7 * 24 * 60 * 60 * 1000 // 7 days
  private readonly maxRecords = 50000

  private exportRequests: Map<string, ExportRequest> = new Map()
  private exportTemplates: Map<string, ExportTemplate> = new Map()

  constructor() {
    this.initializeDefaultTemplates()
    this.startCleanupScheduler()
  }

  /**
   * Request data export for a user
   */
  async requestDataExport(
    userId: string,
    requestType: ExportRequest['requestType'],
    options: {
      format?: 'json' | 'csv' | 'pdf' | 'xml'
      dateRange?: { start: Date, end: Date }
      includeDeleted?: boolean
      includeEncrypted?: boolean
      ipAddress: string
      userAgent: string
    }
  ): Promise<ExportRequest> {
    try {
      // Check if user has pending exports
      const pendingExports = Array.from(this.exportRequests.values())
        .filter(req => req.userId === userId && ['pending', 'processing'].includes(req.status))

      if (pendingExports.length >= 3) {
        throw new Error('Too many pending export requests. Please wait for existing exports to complete.')
      }

      const exportRequest: ExportRequest = {
        id: `export_${Date.now()}_${encryptionService.generateToken(8)}`,
        userId,
        requestType,
        format: options.format || 'json',
        dateRange: options.dateRange,
        includeDeleted: options.includeDeleted || false,
        includeEncrypted: options.includeEncrypted || false,
        requestedAt: new Date(),
        status: 'pending',
        expiresAt: new Date(Date.now() + this.downloadExpiry),
        ipAddress: options.ipAddress,
        userAgent: options.userAgent
      }

      this.exportRequests.set(exportRequest.id, exportRequest)

      // Log export request
      await auditLogger.logComplianceEvent(
        {
          type: 'data_export',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId,
          userRole: 'guest',
          ipAddress: options.ipAddress,
          userAgent: options.userAgent
        }
      )

      // Start processing asynchronously
      this.processExportRequest(exportRequest.id)

      return exportRequest
    } catch (error) {
      console.error('Export request failed:', error)
      throw error
    }
  }

  /**
   * Get export request status
   */
  async getExportStatus(exportId: string, userId: string): Promise<ExportRequest | null> {
    const request = this.exportRequests.get(exportId)

    if (!request || request.userId !== userId) {
      return null
    }

    return request
  }

  /**
   * Download exported data
   */
  async downloadExport(exportId: string, userId: string): Promise<{
    success: boolean
    data?: any
    downloadUrl?: string
    error?: string
  }> {
    try {
      const request = this.exportRequests.get(exportId)

      if (!request || request.userId !== userId) {
        return {
          success: false,
          error: 'Export request not found'
        }
      }

      if (request.status !== 'completed') {
        return {
          success: false,
          error: `Export is ${request.status}`
        }
      }

      if (request.expiresAt && new Date() > request.expiresAt) {
        return {
          success: false,
          error: 'Download link has expired'
        }
      }

      // Log download access
      await auditLogger.logComplianceEvent(
        {
          type: 'data_access',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId,
          userRole: 'guest',
          ipAddress: 'unknown',
          userAgent: 'download-service'
        }
      )

      // In production, return secure download URL
      return {
        success: true,
        downloadUrl: request.downloadUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      }
    }
  }

  /**
   * Get available export templates
   */
  getExportTemplates(): ExportTemplate[] {
    return Array.from(this.exportTemplates.values())
  }

  /**
   * Create custom export template
   */
  async createExportTemplate(
    template: Omit<ExportTemplate, 'id'>,
    createdBy: string
  ): Promise<ExportTemplate> {
    const fullTemplate: ExportTemplate = {
      ...template,
      id: `template_${Date.now()}_${encryptionService.generateToken(8)}`
    }

    this.exportTemplates.set(fullTemplate.id, fullTemplate)

    await auditLogger.logUserAction({
      userId: createdBy,
      action: 'template_created',
      resource: 'export_template',
      resourceId: fullTemplate.id,
      ip: 'system',
      userAgent: 'export-service',
      details: {
        templateName: template.name,
        dataCategories: template.dataCategories
      }
    })

    return fullTemplate
  }

  /**
   * Process export request asynchronously
   */
  private async processExportRequest(exportId: string): Promise<void> {
    const request = this.exportRequests.get(exportId)
    if (!request) return

    try {
      request.status = 'processing'
      this.exportRequests.set(exportId, request)

      // Extract data based on request type
      const exportedData = await this.extractData(request)

      // Validate data size and record count
      const validation = await this.validateExportData(exportedData)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      // Format data according to requested format
      const formattedData = await this.formatData(exportedData, request.format)

      // Store exported data and create download URL
      const downloadUrl = await this.storeExportedData(exportId, formattedData)

      // Update request with completion details
      request.status = 'completed'
      request.completedAt = new Date()
      request.downloadUrl = downloadUrl
      request.fileSize = this.calculateDataSize(formattedData)
      request.recordCount = this.countRecords(exportedData)

      this.exportRequests.set(exportId, request)

      // Log completion
      await auditLogger.logComplianceEvent(
        {
          type: 'data_export',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId: request.userId,
          userRole: 'guest',
          ipAddress: request.ipAddress,
          userAgent: request.userAgent
        }
      )

    } catch (error) {
      request.status = 'failed'
      request.error = error instanceof Error ? error.message : 'Export processing failed'
      this.exportRequests.set(exportId, request)

      console.error(`Export ${exportId} failed:`, error)
    }
  }

  /**
   * Extract data based on export request
   */
  private async extractData(request: ExportRequest): Promise<ExportedData> {
    const exportedData: ExportedData = {
      metadata: {
        exportId: request.id,
        userId: request.userId,
        exportType: request.requestType,
        exportedAt: new Date(),
        recordCount: 0,
        dataVersion: '1.0',
        format: request.format
      }
    }

    switch (request.requestType) {
      case 'personal_data':
        exportedData.personalData = await this.extractPersonalData(request.userId)
        break

      case 'booking_history':
        exportedData.bookingHistory = await this.extractBookingHistory(request.userId, request.dateRange)
        break

      case 'payment_records':
        exportedData.paymentRecords = await this.extractPaymentRecords(request.userId, request.dateRange)
        break

      case 'communication_history':
        exportedData.communicationHistory = await this.extractCommunicationHistory(request.userId, request.dateRange)
        break

      case 'full_export':
        exportedData.personalData = await this.extractPersonalData(request.userId)
        exportedData.bookingHistory = await this.extractBookingHistory(request.userId, request.dateRange)
        exportedData.paymentRecords = await this.extractPaymentRecords(request.userId, request.dateRange)
        exportedData.communicationHistory = await this.extractCommunicationHistory(request.userId, request.dateRange)
        exportedData.legalInformation = await this.extractLegalInformation(request.userId)
        break

      default:
        throw new Error(`Unsupported export type: ${request.requestType}`)
    }

    exportedData.metadata.recordCount = this.countRecords(exportedData)
    return exportedData
  }

  /**
   * Extract personal data
   */
  private async extractPersonalData(userId: string): Promise<any> {
    // In production, query actual database
    return {
      profile: {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        createdAt: '2023-01-01T00:00:00Z',
        lastModified: '2024-01-01T00:00:00Z'
      },
      preferences: {
        language: 'en',
        currency: 'USD',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        marketing: {
          emailMarketing: false,
          smsMarketing: false
        }
      },
      documents: []
    }
  }

  /**
   * Extract booking history
   */
  private async extractBookingHistory(userId: string, dateRange?: { start: Date, end: Date }): Promise<any> {
    // Mock booking data
    const bookings = [
      {
        id: 'booking-001',
        confirmationNumber: 'BG-2024-001234',
        propertyId: 'prop-001',
        propertyName: 'Baithaka GHAR Downtown',
        checkInDate: '2024-01-15',
        checkOutDate: '2024-01-18',
        roomType: 'Deluxe King Suite',
        guests: 2,
        totalAmount: 750,
        currency: 'USD',
        status: 'completed',
        bookedAt: '2024-01-01T10:00:00Z'
      }
    ]

    return {
      bookings: dateRange ? this.filterByDateRange(bookings, dateRange, 'bookedAt') : bookings,
      modifications: [],
      cancellations: []
    }
  }

  /**
   * Extract payment records
   */
  private async extractPaymentRecords(userId: string, dateRange?: { start: Date, end: Date }): Promise<any> {
    const transactions = [
      {
        id: 'payment-001',
        bookingId: 'booking-001',
        amount: 750,
        currency: 'USD',
        method: 'credit_card',
        cardLast4: '4567',
        status: 'completed',
        processedAt: '2024-01-01T10:05:00Z'
      }
    ]

    return {
      transactions: dateRange ? this.filterByDateRange(transactions, dateRange, 'processedAt') : transactions,
      refunds: [],
      disputes: []
    }
  }

  /**
   * Extract communication history
   */
  private async extractCommunicationHistory(userId: string, dateRange?: { start: Date, end: Date }): Promise<any> {
    return {
      emails: [],
      sms: [],
      supportTickets: []
    }
  }

  /**
   * Extract legal information
   */
  private async extractLegalInformation(userId: string): Promise<any> {
    return {
      consentHistory: [],
      privacyPolicyVersions: [],
      dataProcessingActivities: []
    }
  }

  /**
   * Format data according to requested format
   */
  private async formatData(data: ExportedData, format: string): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2)

      case 'csv':
        return this.convertToCSV(data)

      case 'xml':
        return this.convertToXML(data)

      case 'pdf':
        return await this.generatePDF(data)

      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: ExportedData): string {
    const csvData = []

    // Add metadata
    csvData.push('Export Metadata')
    csvData.push(`Export ID,${data.metadata.exportId}`)
    csvData.push(`User ID,${data.metadata.userId}`)
    csvData.push(`Export Type,${data.metadata.exportType}`)
    csvData.push(`Exported At,${data.metadata.exportedAt}`)
    csvData.push('')

    // Add booking data if present
    if (data.bookingHistory?.bookings) {
      csvData.push('Booking History')
      csvData.push('ID,Confirmation Number,Property,Check In,Check Out,Total Amount,Status')

      for (const booking of data.bookingHistory.bookings) {
        csvData.push([
          booking.id,
          booking.confirmationNumber,
          booking.propertyName,
          booking.checkInDate,
          booking.checkOutDate,
          booking.totalAmount,
          booking.status
        ].join(','))
      }
      csvData.push('')
    }

    // Add payment data if present
    if (data.paymentRecords?.transactions) {
      csvData.push('Payment Records')
      csvData.push('ID,Booking ID,Amount,Currency,Method,Status,Processed At')

      for (const payment of data.paymentRecords.transactions) {
        csvData.push([
          payment.id,
          payment.bookingId,
          payment.amount,
          payment.currency,
          payment.method,
          payment.status,
          payment.processedAt
        ].join(','))
      }
    }

    return csvData.join('\n')
  }

  /**
   * Convert data to XML format
   */
  private convertToXML(data: ExportedData): string {
    // Simple XML conversion
    return `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <metadata>
    <exportId>${data.metadata.exportId}</exportId>
    <userId>${data.metadata.userId}</userId>
    <exportType>${data.metadata.exportType}</exportType>
    <exportedAt>${data.metadata.exportedAt}</exportedAt>
  </metadata>
  <data>${JSON.stringify(data)}</data>
</export>`
  }

  /**
   * Generate PDF document
   */
  private async generatePDF(data: ExportedData): Promise<string> {
    // In production, use actual PDF generation library
    return `PDF Export for User ${data.metadata.userId}`
  }

  /**
   * Validate export data
   */
  private async validateExportData(data: ExportedData): Promise<{ valid: boolean, error?: string }> {
    const recordCount = this.countRecords(data)
    const dataSize = this.calculateDataSize(data)

    if (recordCount > this.maxRecords) {
      return {
        valid: false,
        error: `Export contains too many records (${recordCount}). Maximum allowed: ${this.maxRecords}`
      }
    }

    if (dataSize > this.maxFileSize) {
      return {
        valid: false,
        error: `Export data too large (${Math.round(dataSize / 1024 / 1024)}MB). Maximum allowed: ${Math.round(this.maxFileSize / 1024 / 1024)}MB`
      }
    }

    return { valid: true }
  }

  /**
   * Store exported data and return download URL
   */
  private async storeExportedData(exportId: string, data: any): Promise<string> {
    // In production, store in secure location (S3, etc.)
    const downloadUrl = `https://secure-downloads.example.com/exports/${exportId}`
    return downloadUrl
  }

  /**
   * Count total records in exported data
   */
  private countRecords(data: ExportedData): number {
    let count = 0

    if (data.bookingHistory?.bookings) count += data.bookingHistory.bookings.length
    if (data.paymentRecords?.transactions) count += data.paymentRecords.transactions.length
    if (data.communicationHistory?.emails) count += data.communicationHistory.emails.length

    return count
  }

  /**
   * Calculate data size in bytes
   */
  private calculateDataSize(data: any): number {
    return new Blob([JSON.stringify(data)]).size
  }

  /**
   * Filter array by date range
   */
  private filterByDateRange(items: any[], dateRange: { start: Date, end: Date }, dateField: string): any[] {
    return items.filter(item => {
      const itemDate = new Date(item[dateField])
      return itemDate >= dateRange.start && itemDate <= dateRange.end
    })
  }

  /**
   * Initialize default export templates
   */
  private initializeDefaultTemplates(): void {
    const basicBookingTemplate: ExportTemplate = {
      id: 'basic_booking_export',
      name: 'Basic Booking Export',
      description: 'Standard booking information export',
      dataCategories: ['bookings', 'payments'],
      format: 'csv',
      fields: [
        { path: 'booking.id', label: 'Booking ID', type: 'string', required: true, sensitive: false },
        { path: 'booking.confirmationNumber', label: 'Confirmation', type: 'string', required: true, sensitive: false },
        { path: 'booking.checkInDate', label: 'Check-in Date', type: 'date', required: true, sensitive: false },
        { path: 'booking.totalAmount', label: 'Total Amount', type: 'number', required: true, sensitive: false }
      ],
      transformations: [
        { field: 'totalAmount', transformation: 'format_currency' }
      ],
      filters: []
    }

    this.exportTemplates.set(basicBookingTemplate.id, basicBookingTemplate)
  }

  /**
   * Start cleanup scheduler for expired exports
   */
  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanupExpiredExports()
    }, 24 * 60 * 60 * 1000) // Daily cleanup
  }

  /**
   * Clean up expired export requests
   */
  private async cleanupExpiredExports(): Promise<void> {
    const now = new Date()
    const expiredRequests = []

    for (const [id, request] of this.exportRequests.entries()) {
      if (request.expiresAt && now > request.expiresAt) {
        expiredRequests.push(id)
      }
    }

    for (const id of expiredRequests) {
      this.exportRequests.delete(id)
      // In production: also delete stored files
    }

    if (expiredRequests.length > 0) {
      console.log(`Cleaned up ${expiredRequests.length} expired export requests`)
    }
  }
}

export const dataExportService = new DataExportService()

// Convenience functions
export const requestExport = (userId: string, requestType: any, options: any) =>
  dataExportService.requestDataExport(userId, requestType, options)

export const getExportStatus = (exportId: string, userId: string) =>
  dataExportService.getExportStatus(exportId, userId)

export const downloadExport = (exportId: string, userId: string) =>
  dataExportService.downloadExport(exportId, userId)