import { auditLogger } from '../security/audit-logger'
import { encryptionService } from '../security/encryption'

export interface DataSubject {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: Date
  nationality?: string
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
  }
  createdAt: Date
  lastModified: Date
}

export interface ConsentRecord {
  id: string
  dataSubjectId: string
  purpose: 'booking' | 'marketing' | 'analytics' | 'support' | 'legal'
  legalBasis: 'consent' | 'contract' | 'legal_obligation' | 'vital_interests' | 'public_task' | 'legitimate_interest'
  consentGiven: boolean
  consentDate: Date
  withdrawnDate?: Date
  ipAddress: string
  userAgent: string
  consentMethod: 'checkbox' | 'button' | 'verbal' | 'written' | 'implied'
  version: string // Version of privacy policy when consent was given
  metadata?: Record<string, any>
}

export interface ProcessingActivity {
  id: string
  purpose: string
  legalBasis: string
  dataCategories: string[]
  dataSubjects: string[]
  recipients: string[]
  retentionPeriod: string
  securityMeasures: string[]
  dataProtectionOfficer: string
  createdAt: Date
}

export interface DataProcessingRequest {
  id: string
  type: 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection'
  dataSubjectId: string
  requestDate: Date
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  description: string
  requestedData?: string[]
  completionDate?: Date
  response?: string
  responseData?: any
  processedBy?: string
  rejectionReason?: string
}

export interface PrivacyImpactAssessment {
  id: string
  title: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  processingType: string
  dataTypes: string[]
  risks: Array<{
    description: string
    likelihood: 'low' | 'medium' | 'high'
    impact: 'low' | 'medium' | 'high'
    mitigation: string
  }>
  safeguards: string[]
  approvedBy: string
  approvalDate: Date
  reviewDate: Date
  status: 'draft' | 'under_review' | 'approved' | 'requires_consultation'
}

class GDPRComplianceService {
  private readonly retentionPolicies: Record<string, number> = {
    bookings: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
    marketing: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
    analytics: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
    support: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
    audit_logs: 7 * 365 * 24 * 60 * 60 * 1000 // 7 years
  }

  private readonly slaTimeLimits = {
    access: 30 * 24 * 60 * 60 * 1000, // 30 days
    rectification: 30 * 24 * 60 * 60 * 1000, // 30 days
    erasure: 30 * 24 * 60 * 60 * 1000, // 30 days
    restriction: 30 * 24 * 60 * 60 * 1000, // 30 days
    portability: 30 * 24 * 60 * 60 * 1000, // 30 days
    objection: 30 * 24 * 60 * 60 * 1000 // 30 days
  }

  /**
   * Record consent from a data subject
   */
  async recordConsent(
    dataSubjectId: string,
    purpose: ConsentRecord['purpose'],
    legalBasis: ConsentRecord['legalBasis'],
    consentGiven: boolean,
    context: {
      ipAddress: string
      userAgent: string
      consentMethod: ConsentRecord['consentMethod']
      policyVersion: string
      metadata?: Record<string, any>
    }
  ): Promise<ConsentRecord> {
    const consentRecord: ConsentRecord = {
      id: `consent_${Date.now()}_${encryptionService.generateToken(8)}`,
      dataSubjectId,
      purpose,
      legalBasis,
      consentGiven,
      consentDate: new Date(),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      consentMethod: context.consentMethod,
      version: context.policyVersion,
      metadata: context.metadata
    }

    // Store consent record
    await this.storeConsentRecord(consentRecord)

    // Log consent action
    await auditLogger.logComplianceEvent(
      {
        type: consentGiven ? 'consent_given' : 'consent_withdrawn',
        dataType: 'personal',
        legalBasis
      },
      {
        userId: dataSubjectId,
        userRole: 'guest',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    )

    return consentRecord
  }

  /**
   * Withdraw consent for a specific purpose
   */
  async withdrawConsent(
    dataSubjectId: string,
    purpose: ConsentRecord['purpose'],
    context: {
      ipAddress: string
      userAgent: string
    }
  ): Promise<void> {
    const existingConsent = await this.getActiveConsent(dataSubjectId, purpose)

    if (existingConsent) {
      existingConsent.consentGiven = false
      existingConsent.withdrawnDate = new Date()

      await this.updateConsentRecord(existingConsent)

      // Stop processing based on withdrawn consent
      await this.handleConsentWithdrawal(dataSubjectId, purpose)

      await auditLogger.logComplianceEvent(
        {
          type: 'consent_withdrawn',
          dataType: 'personal',
          legalBasis: existingConsent.legalBasis
        },
        {
          userId: dataSubjectId,
          userRole: 'guest',
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      )
    }
  }

  /**
   * Process a data subject request (Article 15-22)
   */
  async processDataSubjectRequest(
    request: Omit<DataProcessingRequest, 'id' | 'requestDate' | 'status'>
  ): Promise<DataProcessingRequest> {
    const fullRequest: DataProcessingRequest = {
      ...request,
      id: `dsr_${Date.now()}_${encryptionService.generateToken(8)}`,
      requestDate: new Date(),
      status: 'pending'
    }

    // Store request
    await this.storeDataSubjectRequest(fullRequest)

    // Determine priority based on request type
    fullRequest.priority = this.determineRequestPriority(fullRequest.type)

    // Auto-process certain types of requests
    if (fullRequest.type === 'access' || fullRequest.type === 'portability') {
      await this.autoProcessDataRequest(fullRequest)
    }

    await auditLogger.logComplianceEvent(
      {
        type: 'data_access',
        dataType: 'personal'
      },
      {
        userId: fullRequest.dataSubjectId,
        userRole: 'guest',
        ipAddress: 'unknown',
        userAgent: 'dsr-service'
      }
    )

    return fullRequest
  }

  /**
   * Process right to access (Article 15)
   */
  async processAccessRequest(dataSubjectId: string): Promise<{
    personalData: any
    processingPurposes: string[]
    dataCategories: string[]
    recipients: string[]
    retentionPeriods: Record<string, string>
    rights: string[]
    consentHistory: ConsentRecord[]
  }> {
    const personalData = await this.getPersonalData(dataSubjectId)
    const consentHistory = await this.getConsentHistory(dataSubjectId)
    const processingActivities = await this.getProcessingActivities(dataSubjectId)

    await auditLogger.logComplianceEvent(
      {
        type: 'data_access',
        dataType: 'personal',
        legalBasis: 'legal_obligation'
      },
      {
        userId: dataSubjectId,
        userRole: 'guest',
        ipAddress: 'system',
        userAgent: 'gdpr-service'
      }
    )

    return {
      personalData: this.sanitizePersonalData(personalData),
      processingPurposes: processingActivities.map(a => a.purpose),
      dataCategories: Array.from(new Set(processingActivities.flatMap(a => a.dataCategories))),
      recipients: Array.from(new Set(processingActivities.flatMap(a => a.recipients))),
      retentionPeriods: this.getRetentionPeriods(),
      rights: [
        'Right to rectification',
        'Right to erasure',
        'Right to restrict processing',
        'Right to data portability',
        'Right to object',
        'Right to withdraw consent'
      ],
      consentHistory
    }
  }

  /**
   * Process right to rectification (Article 16)
   */
  async processRectificationRequest(
    dataSubjectId: string,
    corrections: Record<string, any>
  ): Promise<{
    success: boolean
    updatedFields: string[]
    errors: string[]
  }> {
    const updatedFields: string[] = []
    const errors: string[] = []

    try {
      // Update personal data
      for (const [field, value] of Object.entries(corrections)) {
        if (this.isValidPersonalDataField(field)) {
          await this.updatePersonalDataField(dataSubjectId, field, value)
          updatedFields.push(field)
        } else {
          errors.push(`Invalid field: ${field}`)
        }
      }

      await auditLogger.logComplianceEvent(
        {
          type: 'data_access',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId: dataSubjectId,
          userRole: 'guest',
          ipAddress: 'system',
          userAgent: 'gdpr-service'
        }
      )

      return {
        success: errors.length === 0,
        updatedFields,
        errors
      }
    } catch (error) {
      errors.push(`Rectification failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        success: false,
        updatedFields,
        errors
      }
    }
  }

  /**
   * Process right to erasure (Article 17)
   */
  async processErasureRequest(
    dataSubjectId: string,
    reason: 'withdrawal' | 'no_longer_necessary' | 'unlawful_processing' | 'compliance' | 'objection'
  ): Promise<{
    success: boolean
    deletedData: string[]
    retainedData: string[]
    reasons: string[]
  }> {
    const deletedData: string[] = []
    const retainedData: string[] = []
    const reasons: string[] = []

    try {
      // Check if erasure is possible for each data category
      const personalData = await this.getPersonalData(dataSubjectId)
      const processingActivities = await this.getProcessingActivities(dataSubjectId)

      for (const activity of processingActivities) {
        const canErase = await this.canEraseForActivity(activity, reason)

        if (canErase) {
          // Delete data for this activity
          for (const dataCategory of activity.dataCategories) {
            await this.deleteDataCategory(dataSubjectId, dataCategory)
            deletedData.push(dataCategory)
          }
        } else {
          // Retain data with reason
          retainedData.push(...activity.dataCategories)
          reasons.push(`Data retained for ${activity.purpose} - legal obligation`)
        }
      }

      // Special handling for audit logs (usually cannot be deleted)
      retainedData.push('audit_logs')
      reasons.push('Audit logs retained for regulatory compliance')

      await auditLogger.logComplianceEvent(
        {
          type: 'data_deletion',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId: dataSubjectId,
          userRole: 'guest',
          ipAddress: 'system',
          userAgent: 'gdpr-service'
        }
      )

      return {
        success: true,
        deletedData: Array.from(new Set(deletedData)),
        retainedData: Array.from(new Set(retainedData)),
        reasons: Array.from(new Set(reasons))
      }
    } catch (error) {
      return {
        success: false,
        deletedData,
        retainedData,
        reasons: [`Erasure failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Process right to data portability (Article 20)
   */
  async processPortabilityRequest(dataSubjectId: string, format: 'json' | 'csv' | 'xml' = 'json'): Promise<{
    success: boolean
    data?: any
    format: string
    downloadUrl?: string
    expiresAt?: Date
  }> {
    try {
      const personalData = await this.getPersonalData(dataSubjectId)
      const portableData = await this.extractPortableData(personalData)

      let formattedData: any
      switch (format) {
        case 'csv':
          formattedData = this.convertToCSV(portableData)
          break
        case 'xml':
          formattedData = this.convertToXML(portableData)
          break
        default:
          formattedData = portableData
      }

      // Generate secure download URL
      const downloadToken = encryptionService.generateToken(32)
      const downloadUrl = await this.createSecureDownloadUrl(downloadToken, formattedData)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await auditLogger.logComplianceEvent(
        {
          type: 'data_export',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId: dataSubjectId,
          userRole: 'guest',
          ipAddress: 'system',
          userAgent: 'gdpr-service'
        }
      )

      return {
        success: true,
        data: format === 'json' ? formattedData : undefined,
        format,
        downloadUrl,
        expiresAt
      }
    } catch (error) {
      return {
        success: false,
        format
      }
    }
  }

  /**
   * Check consent status for a data subject and purpose
   */
  async checkConsent(dataSubjectId: string, purpose: ConsentRecord['purpose']): Promise<{
    hasConsent: boolean
    consentDate?: Date
    legalBasis?: string
    version?: string
  }> {
    const consent = await this.getActiveConsent(dataSubjectId, purpose)

    if (!consent) {
      return { hasConsent: false }
    }

    return {
      hasConsent: consent.consentGiven,
      consentDate: consent.consentDate,
      legalBasis: consent.legalBasis,
      version: consent.version
    }
  }

  /**
   * Run automated data retention cleanup
   */
  async runRetentionCleanup(): Promise<{
    processed: number
    deleted: number
    errors: string[]
  }> {
    let processed = 0
    let deleted = 0
    const errors: string[] = []

    try {
      // Get all data subjects
      const dataSubjects = await this.getAllDataSubjects()

      for (const subject of dataSubjects) {
        processed++

        try {
          const activities = await this.getProcessingActivities(subject.id)

          for (const activity of activities) {
            const retentionPeriod = this.retentionPolicies[activity.purpose] || this.retentionPolicies.bookings
            const retentionDate = new Date(Date.now() - retentionPeriod)

            if (subject.lastModified < retentionDate) {
              // Check if data can be deleted
              const hasActiveBookings = await this.hasActiveBookings(subject.id)
              const hasLegalObligations = await this.hasLegalObligations(subject.id)

              if (!hasActiveBookings && !hasLegalObligations) {
                await this.deleteExpiredData(subject.id, activity.purpose)
                deleted++
              }
            }
          }
        } catch (error) {
          errors.push(`Failed to process subject ${subject.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      await auditLogger.logComplianceEvent(
        {
          type: 'data_deletion',
          dataType: 'personal',
          legalBasis: 'legal_obligation'
        },
        {
          userId: 'system',
          userRole: 'system',
          ipAddress: 'localhost',
          userAgent: 'retention-service'
        }
      )

      return { processed, deleted, errors }
    } catch (error) {
      errors.push(`Retention cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { processed, deleted, errors }
    }
  }

  /**
   * Generate GDPR compliance report
   */
  async generateComplianceReport(period: 'month' | 'quarter' | 'year' = 'month'): Promise<{
    period: string
    dataSubjectRequests: {
      total: number
      byType: Record<string, number>
      avgProcessingTime: number
      slaCompliance: number
    }
    consentManagement: {
      totalConsents: number
      activeConsents: number
      withdrawnConsents: number
      byPurpose: Record<string, number>
    }
    dataBreaches: {
      total: number
      reportedToAuthority: number
      notifiedDataSubjects: number
    }
    retentionCompliance: {
      dataSubjectsProcessed: number
      dataDeleted: number
      retentionViolations: number
    }
    privacyImpactAssessments: {
      total: number
      completed: number
      pending: number
    }
  }> {
    const startDate = this.getPeriodStartDate(period)
    const endDate = new Date()

    // Generate mock report data
    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      dataSubjectRequests: {
        total: 45,
        byType: {
          access: 20,
          rectification: 8,
          erasure: 12,
          portability: 3,
          objection: 2
        },
        avgProcessingTime: 15.5, // days
        slaCompliance: 96.8 // percentage
      },
      consentManagement: {
        totalConsents: 1250,
        activeConsents: 1180,
        withdrawnConsents: 70,
        byPurpose: {
          booking: 1180,
          marketing: 650,
          analytics: 800,
          support: 400
        }
      },
      dataBreaches: {
        total: 0,
        reportedToAuthority: 0,
        notifiedDataSubjects: 0
      },
      retentionCompliance: {
        dataSubjectsProcessed: 500,
        dataDeleted: 45,
        retentionViolations: 0
      },
      privacyImpactAssessments: {
        total: 3,
        completed: 3,
        pending: 0
      }
    }
  }

  // Private helper methods

  private async storeConsentRecord(consent: ConsentRecord): Promise<void> {
    // Store in database
    console.log(`Storing consent record: ${consent.id}`)
  }

  private async updateConsentRecord(consent: ConsentRecord): Promise<void> {
    // Update in database
    console.log(`Updating consent record: ${consent.id}`)
  }

  private async getActiveConsent(dataSubjectId: string, purpose: ConsentRecord['purpose']): Promise<ConsentRecord | null> {
    // Query database for active consent
    return null
  }

  private async handleConsentWithdrawal(dataSubjectId: string, purpose: ConsentRecord['purpose']): Promise<void> {
    // Stop processing activities based on withdrawn consent
    switch (purpose) {
      case 'marketing':
        await this.stopMarketingCommunications(dataSubjectId)
        break
      case 'analytics':
        await this.excludeFromAnalytics(dataSubjectId)
        break
    }
  }

  private async stopMarketingCommunications(dataSubjectId: string): Promise<void> {
    // Remove from marketing lists
    console.log(`Stopping marketing for ${dataSubjectId}`)
  }

  private async excludeFromAnalytics(dataSubjectId: string): Promise<void> {
    // Add to analytics exclusion list
    console.log(`Excluding from analytics: ${dataSubjectId}`)
  }

  private async storeDataSubjectRequest(request: DataProcessingRequest): Promise<void> {
    // Store in database
    console.log(`Storing DSR: ${request.id}`)
  }

  private determineRequestPriority(type: DataProcessingRequest['type']): 'low' | 'medium' | 'high' | 'urgent' {
    switch (type) {
      case 'erasure':
        return 'high'
      case 'access':
      case 'portability':
        return 'medium'
      default:
        return 'low'
    }
  }

  private async autoProcessDataRequest(request: DataProcessingRequest): Promise<void> {
    // Auto-process simple requests
    if (request.type === 'access') {
      request.status = 'in_progress'
      const response = await this.processAccessRequest(request.dataSubjectId)
      request.responseData = response
      request.status = 'completed'
      request.completionDate = new Date()
    }
  }

  private async getPersonalData(dataSubjectId: string): Promise<any> {
    // Get all personal data for data subject
    return {
      profile: {},
      bookings: [],
      payments: [],
      communications: []
    }
  }

  private async getConsentHistory(dataSubjectId: string): Promise<ConsentRecord[]> {
    // Get consent history
    return []
  }

  private async getProcessingActivities(dataSubjectId: string): Promise<ProcessingActivity[]> {
    // Get processing activities for data subject
    return []
  }

  private sanitizePersonalData(data: any): any {
    // Remove sensitive fields from export
    return data
  }

  private getRetentionPeriods(): Record<string, string> {
    return {
      bookings: '7 years',
      marketing: '3 years',
      analytics: '2 years',
      support: '5 years'
    }
  }

  private isValidPersonalDataField(field: string): boolean {
    const validFields = ['firstName', 'lastName', 'email', 'phone', 'address']
    return validFields.includes(field)
  }

  private async updatePersonalDataField(dataSubjectId: string, field: string, value: any): Promise<void> {
    // Update field in database
    console.log(`Updating ${field} for ${dataSubjectId}`)
  }

  private async canEraseForActivity(activity: ProcessingActivity, reason: string): Promise<boolean> {
    // Check if data can be erased for this activity
    // Cannot erase if legal obligation or legitimate interest
    return activity.legalBasis === 'consent' || reason === 'withdrawal'
  }

  private async deleteDataCategory(dataSubjectId: string, category: string): Promise<void> {
    // Delete specific data category
    console.log(`Deleting ${category} for ${dataSubjectId}`)
  }

  private async extractPortableData(personalData: any): Promise<any> {
    // Extract only data provided by the user or generated by their activity
    return personalData
  }

  private convertToCSV(data: any): string {
    // Convert to CSV format
    return JSON.stringify(data)
  }

  private convertToXML(data: any): string {
    // Convert to XML format
    return JSON.stringify(data)
  }

  private async createSecureDownloadUrl(token: string, data: any): Promise<string> {
    // Create secure download URL
    return `https://api.example.com/gdpr/download/${token}`
  }

  private async getAllDataSubjects(): Promise<DataSubject[]> {
    // Get all data subjects
    return []
  }

  private async hasActiveBookings(dataSubjectId: string): Promise<boolean> {
    // Check for active bookings
    return false
  }

  private async hasLegalObligations(dataSubjectId: string): Promise<boolean> {
    // Check for legal obligations to retain data
    return false
  }

  private async deleteExpiredData(dataSubjectId: string, purpose: string): Promise<void> {
    // Delete expired data
    console.log(`Deleting expired ${purpose} data for ${dataSubjectId}`)
  }

  private getPeriodStartDate(period: 'month' | 'quarter' | 'year'): Date {
    const now = new Date()
    switch (period) {
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1)
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3)
        return new Date(now.getFullYear(), quarter * 3, 1)
      case 'year':
        return new Date(now.getFullYear(), 0, 1)
    }
  }
}

export const gdprService = new GDPRComplianceService()

// Convenience functions
export const recordConsent = (dataSubjectId: string, purpose: any, legalBasis: any, consentGiven: boolean, context: any) =>
  gdprService.recordConsent(dataSubjectId, purpose, legalBasis, consentGiven, context)

export const checkConsent = (dataSubjectId: string, purpose: any) =>
  gdprService.checkConsent(dataSubjectId, purpose)

export const processDataRequest = (request: any) =>
  gdprService.processDataSubjectRequest(request)