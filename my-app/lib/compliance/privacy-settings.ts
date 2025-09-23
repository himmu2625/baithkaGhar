import { auditLogger } from '../security/audit-logger'
import { gdprService } from './gdpr-compliance'

export interface PrivacySettings {
  userId: string
  dataProcessing: {
    essential: boolean // Always true, cannot be disabled
    analytics: boolean
    marketing: boolean
    personalization: boolean
    advertising: boolean
    thirdPartySharing: boolean
  }
  communications: {
    emailMarketing: boolean
    smsMarketing: boolean
    pushNotifications: boolean
    serviceUpdates: boolean // Always true, cannot be disabled
    securityAlerts: boolean // Always true, cannot be disabled
    bookingConfirmations: boolean // Always true, cannot be disabled
  }
  cookies: {
    essential: boolean // Always true, cannot be disabled
    analytics: boolean
    marketing: boolean
    functional: boolean
    targeting: boolean
  }
  dataSharing: {
    internalAnalytics: boolean
    thirdPartyAnalytics: boolean
    marketingPartners: boolean
    serviceProviders: boolean // Always true for operational purposes
    legalRequirements: boolean // Always true, cannot be disabled
  }
  visibility: {
    profileVisibility: 'private' | 'limited' | 'public'
    activityTracking: boolean
    locationServices: boolean
    behaviorAnalysis: boolean
  }
  retention: {
    automaticDeletion: boolean
    customRetentionPeriod?: number
    archiveInsteadOfDelete: boolean
  }
  rights: {
    dataPortability: boolean
    accessRequests: boolean
    rectificationRequests: boolean
    erasureRequests: boolean
    restrictionRequests: boolean
    objectionRights: boolean
  }
  lastUpdated: Date
  version: string
  ipAddress?: string
  userAgent?: string
}

export interface PrivacySettingsHistory {
  id: string
  userId: string
  previousSettings: Partial<PrivacySettings>
  newSettings: Partial<PrivacySettings>
  changedFields: string[]
  reason: 'user_request' | 'policy_update' | 'legal_requirement' | 'system_update'
  updatedAt: Date
  updatedBy: string
  ipAddress: string
  userAgent: string
}

export interface CookieConsent {
  userId?: string
  sessionId: string
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
  targeting: boolean
  timestamp: Date
  version: string
  ipAddress: string
  userAgent: string
  method: 'banner' | 'settings' | 'implicit' | 'explicit'
  expiresAt: Date
}

export interface PrivacyNotice {
  id: string
  type: 'policy_update' | 'data_breach' | 'consent_required' | 'settings_change'
  title: string
  content: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  targetAudience: 'all_users' | 'eu_users' | 'specific_users'
  requiresAction: boolean
  actionRequired?: 'update_consent' | 'review_settings' | 'acknowledge' | 'opt_in'
  deadline?: Date
  createdAt: Date
  publishedAt?: Date
  expiresAt?: Date
  isActive: boolean
}

class PrivacySettingsService {
  private readonly defaultSettings: Omit<PrivacySettings, 'userId' | 'lastUpdated' | 'version'> = {
    dataProcessing: {
      essential: true,
      analytics: false,
      marketing: false,
      personalization: false,
      advertising: false,
      thirdPartySharing: false
    },
    communications: {
      emailMarketing: false,
      smsMarketing: false,
      pushNotifications: true,
      serviceUpdates: true,
      securityAlerts: true,
      bookingConfirmations: true
    },
    cookies: {
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
      targeting: false
    },
    dataSharing: {
      internalAnalytics: false,
      thirdPartyAnalytics: false,
      marketingPartners: false,
      serviceProviders: true,
      legalRequirements: true
    },
    visibility: {
      profileVisibility: 'private',
      activityTracking: false,
      locationServices: false,
      behaviorAnalysis: false
    },
    retention: {
      automaticDeletion: true,
      archiveInsteadOfDelete: false
    },
    rights: {
      dataPortability: true,
      accessRequests: true,
      rectificationRequests: true,
      erasureRequests: true,
      restrictionRequests: true,
      objectionRights: true
    }
  }

  private userSettings: Map<string, PrivacySettings> = new Map()
  private settingsHistory: Map<string, PrivacySettingsHistory[]> = new Map()
  private cookieConsents: Map<string, CookieConsent> = new Map()
  private privacyNotices: Map<string, PrivacyNotice> = new Map()

  constructor() {
    this.initializeDefaultNotices()
  }

  /**
   * Get privacy settings for a user
   */
  async getPrivacySettings(userId: string): Promise<PrivacySettings> {
    let settings = this.userSettings.get(userId)

    if (!settings) {
      // Create default settings for new user
      settings = {
        ...this.defaultSettings,
        userId,
        lastUpdated: new Date(),
        version: '1.0'
      }

      this.userSettings.set(userId, settings)
    }

    return settings
  }

  /**
   * Update privacy settings for a user
   */
  async updatePrivacySettings(
    userId: string,
    updates: Partial<PrivacySettings>,
    context: {
      updatedBy: string
      reason: PrivacySettingsHistory['reason']
      ipAddress: string
      userAgent: string
    }
  ): Promise<PrivacySettings> {
    const currentSettings = await this.getPrivacySettings(userId)
    const previousSettings = { ...currentSettings }

    // Validate updates
    const validatedUpdates = this.validateSettingsUpdates(updates)

    // Apply updates
    const newSettings: PrivacySettings = {
      ...currentSettings,
      ...validatedUpdates,
      lastUpdated: new Date(),
      version: this.incrementVersion(currentSettings.version),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }

    // Track changes
    const changedFields = this.getChangedFields(previousSettings, newSettings)

    // Store updated settings
    this.userSettings.set(userId, newSettings)

    // Record history
    await this.recordSettingsHistory(userId, previousSettings, newSettings, changedFields, context)

    // Update consent records if necessary
    await this.updateConsentRecords(userId, changedFields, context)

    // Log privacy settings change
    await auditLogger.logComplianceEvent(
      {
        type: 'privacy_setting_changed',
        dataType: 'personal'
      },
      {
        userId,
        userRole: 'guest',
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    )

    return newSettings
  }

  /**
   * Record cookie consent
   */
  async recordCookieConsent(
    consent: Omit<CookieConsent, 'timestamp' | 'expiresAt'>,
    expiryDays: number = 365
  ): Promise<CookieConsent> {
    const fullConsent: CookieConsent = {
      ...consent,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    }

    const consentKey = consent.userId || consent.sessionId
    this.cookieConsents.set(consentKey, fullConsent)

    // If user is logged in, update their privacy settings
    if (consent.userId) {
      await this.updatePrivacySettings(
        consent.userId,
        {
          cookies: {
            essential: consent.essential,
            analytics: consent.analytics,
            marketing: consent.marketing,
            functional: consent.functional,
            targeting: consent.targeting
          }
        },
        {
          updatedBy: consent.userId,
          reason: 'user_request',
          ipAddress: consent.ipAddress,
          userAgent: consent.userAgent
        }
      )
    }

    await auditLogger.logComplianceEvent(
      {
        type: 'consent_given',
        dataType: 'personal'
      },
      {
        userId: consent.userId || 'anonymous',
        userRole: 'guest',
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent
      }
    )

    return fullConsent
  }

  /**
   * Get cookie consent status
   */
  async getCookieConsent(identifier: string): Promise<CookieConsent | null> {
    const consent = this.cookieConsents.get(identifier)

    if (!consent) return null

    // Check if consent has expired
    if (new Date() > consent.expiresAt) {
      this.cookieConsents.delete(identifier)
      return null
    }

    return consent
  }

  /**
   * Withdraw consent for specific purposes
   */
  async withdrawConsent(
    userId: string,
    purposes: Array<keyof PrivacySettings['dataProcessing'] | keyof PrivacySettings['communications']>,
    context: {
      ipAddress: string
      userAgent: string
    }
  ): Promise<PrivacySettings> {
    const updates: Partial<PrivacySettings> = {}

    // Build updates object
    for (const purpose of purposes) {
      if (purpose in this.defaultSettings.dataProcessing) {
        if (!updates.dataProcessing) updates.dataProcessing = {}
        ;(updates.dataProcessing as any)[purpose] = false
      } else if (purpose in this.defaultSettings.communications) {
        if (!updates.communications) updates.communications = {}
        ;(updates.communications as any)[purpose] = false
      }
    }

    // Record individual consent withdrawals with GDPR service
    for (const purpose of purposes) {
      await gdprService.withdrawConsent(userId, purpose as any, context)
    }

    return await this.updatePrivacySettings(userId, updates, {
      updatedBy: userId,
      reason: 'user_request',
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    })
  }

  /**
   * Get privacy settings history for a user
   */
  async getSettingsHistory(userId: string): Promise<PrivacySettingsHistory[]> {
    return this.settingsHistory.get(userId) || []
  }

  /**
   * Create privacy notice
   */
  async createPrivacyNotice(
    notice: Omit<PrivacyNotice, 'id' | 'createdAt' | 'isActive'>
  ): Promise<PrivacyNotice> {
    const fullNotice: PrivacyNotice = {
      ...notice,
      id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      createdAt: new Date(),
      isActive: true
    }

    this.privacyNotices.set(fullNotice.id, fullNotice)

    return fullNotice
  }

  /**
   * Get active privacy notices for a user
   */
  async getActiveNotices(userId: string): Promise<PrivacyNotice[]> {
    const now = new Date()
    const notices = Array.from(this.privacyNotices.values())

    return notices.filter(notice => {
      if (!notice.isActive) return false
      if (notice.expiresAt && now > notice.expiresAt) return false
      if (notice.publishedAt && now < notice.publishedAt) return false

      // Filter by target audience
      if (notice.targetAudience === 'all_users') return true
      if (notice.targetAudience === 'eu_users') {
        // In production, check if user is from EU
        return false
      }
      if (notice.targetAudience === 'specific_users') {
        // In production, check if user is in specific target list
        return false
      }

      return true
    })
  }

  /**
   * Export privacy settings and history
   */
  async exportPrivacyData(userId: string): Promise<{
    currentSettings: PrivacySettings
    settingsHistory: PrivacySettingsHistory[]
    cookieConsents: CookieConsent[]
    notices: PrivacyNotice[]
  }> {
    const currentSettings = await this.getPrivacySettings(userId)
    const settingsHistory = await this.getSettingsHistory(userId)
    const cookieConsents = Array.from(this.cookieConsents.values())
      .filter(consent => consent.userId === userId)
    const notices = await this.getActiveNotices(userId)

    await auditLogger.logComplianceEvent(
      {
        type: 'data_export',
        dataType: 'personal'
      },
      {
        userId,
        userRole: 'guest',
        ipAddress: 'system',
        userAgent: 'privacy-service'
      }
    )

    return {
      currentSettings,
      settingsHistory,
      cookieConsents,
      notices
    }
  }

  /**
   * Check if user has valid consent for a specific purpose
   */
  async hasValidConsent(userId: string, purpose: string): Promise<boolean> {
    const settings = await this.getPrivacySettings(userId)

    switch (purpose) {
      case 'analytics':
        return settings.dataProcessing.analytics || false
      case 'marketing':
        return settings.dataProcessing.marketing || false
      case 'email_marketing':
        return settings.communications.emailMarketing || false
      case 'sms_marketing':
        return settings.communications.smsMarketing || false
      case 'personalization':
        return settings.dataProcessing.personalization || false
      case 'third_party_sharing':
        return settings.dataProcessing.thirdPartySharing || false
      default:
        return false
    }
  }

  /**
   * Bulk update privacy settings for policy changes
   */
  async bulkUpdateForPolicyChange(
    policyVersion: string,
    updates: Partial<PrivacySettings>,
    affectedUsers: string[] = []
  ): Promise<{
    updated: number
    failed: number
    errors: string[]
  }> {
    let updated = 0
    let failed = 0
    const errors: string[] = []

    const usersToUpdate = affectedUsers.length > 0
      ? affectedUsers
      : Array.from(this.userSettings.keys())

    for (const userId of usersToUpdate) {
      try {
        await this.updatePrivacySettings(userId, updates, {
          updatedBy: 'system',
          reason: 'policy_update',
          ipAddress: 'system',
          userAgent: 'privacy-service'
        })
        updated++
      } catch (error) {
        failed++
        errors.push(`Failed to update settings for user ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return { updated, failed, errors }
  }

  // Private helper methods

  private validateSettingsUpdates(updates: Partial<PrivacySettings>): Partial<PrivacySettings> {
    const validated = { ...updates }

    // Ensure essential settings cannot be disabled
    if (validated.dataProcessing) {
      validated.dataProcessing.essential = true
    }

    if (validated.communications) {
      validated.communications.serviceUpdates = true
      validated.communications.securityAlerts = true
      validated.communications.bookingConfirmations = true
    }

    if (validated.cookies) {
      validated.cookies.essential = true
    }

    if (validated.dataSharing) {
      validated.dataSharing.serviceProviders = true
      validated.dataSharing.legalRequirements = true
    }

    if (validated.rights) {
      // Rights cannot be disabled under GDPR
      validated.rights = this.defaultSettings.rights
    }

    return validated
  }

  private getChangedFields(previous: PrivacySettings, current: PrivacySettings): string[] {
    const changes: string[] = []

    // Deep comparison of nested objects
    this.compareObjects(previous.dataProcessing, current.dataProcessing, 'dataProcessing', changes)
    this.compareObjects(previous.communications, current.communications, 'communications', changes)
    this.compareObjects(previous.cookies, current.cookies, 'cookies', changes)
    this.compareObjects(previous.dataSharing, current.dataSharing, 'dataSharing', changes)
    this.compareObjects(previous.visibility, current.visibility, 'visibility', changes)
    this.compareObjects(previous.retention, current.retention, 'retention', changes)

    return changes
  }

  private compareObjects(prev: any, curr: any, prefix: string, changes: string[]): void {
    for (const key in curr) {
      if (prev[key] !== curr[key]) {
        changes.push(`${prefix}.${key}`)
      }
    }
  }

  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.')
    const minor = parseInt(parts[1] || '0')
    return `${parts[0]}.${minor + 1}`
  }

  private async recordSettingsHistory(
    userId: string,
    previousSettings: PrivacySettings,
    newSettings: PrivacySettings,
    changedFields: string[],
    context: {
      updatedBy: string
      reason: PrivacySettingsHistory['reason']
      ipAddress: string
      userAgent: string
    }
  ): Promise<void> {
    const historyRecord: PrivacySettingsHistory = {
      id: `history_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      previousSettings,
      newSettings,
      changedFields,
      reason: context.reason,
      updatedAt: new Date(),
      updatedBy: context.updatedBy,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }

    let history = this.settingsHistory.get(userId) || []
    history.push(historyRecord)

    // Keep only last 100 records
    if (history.length > 100) {
      history = history.slice(-100)
    }

    this.settingsHistory.set(userId, history)
  }

  private async updateConsentRecords(
    userId: string,
    changedFields: string[],
    context: {
      ipAddress: string
      userAgent: string
    }
  ): Promise<void> {
    // Update GDPR consent records for changed purposes
    for (const field of changedFields) {
      if (field.includes('marketing')) {
        await gdprService.recordConsent(
          userId,
          'marketing',
          'consent',
          true, // Assuming opt-in, would check actual value
          {
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            consentMethod: 'checkbox',
            policyVersion: '1.0'
          }
        )
      }
    }
  }

  private initializeDefaultNotices(): void {
    const defaultNotice: PrivacyNotice = {
      id: 'welcome_notice',
      type: 'policy_update',
      title: 'Welcome to Baithaka GHAR Privacy Center',
      content: 'Manage your privacy settings and data preferences here.',
      severity: 'low',
      targetAudience: 'all_users',
      requiresAction: false,
      createdAt: new Date(),
      publishedAt: new Date(),
      isActive: true
    }

    this.privacyNotices.set(defaultNotice.id, defaultNotice)
  }
}

export const privacySettingsService = new PrivacySettingsService()

// Convenience functions
export const getPrivacySettings = (userId: string) =>
  privacySettingsService.getPrivacySettings(userId)

export const updatePrivacySettings = (userId: string, updates: any, context: any) =>
  privacySettingsService.updatePrivacySettings(userId, updates, context)

export const recordCookieConsent = (consent: any, expiryDays?: number) =>
  privacySettingsService.recordCookieConsent(consent, expiryDays)

export const hasValidConsent = (userId: string, purpose: string) =>
  privacySettingsService.hasValidConsent(userId, purpose)