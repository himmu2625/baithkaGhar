import { auditLogger } from '../security/audit-logger'
import { gdprService } from './gdpr-compliance'

export interface RetentionPolicy {
  id: string
  name: string
  description: string
  dataCategory: string
  retentionPeriod: number // in milliseconds
  retentionBasis: 'legal_requirement' | 'business_need' | 'consent' | 'contract'
  legalReference?: string
  autoDelete: boolean
  archiveBeforeDelete: boolean
  notificationBeforeDelete: boolean
  approvalRequired: boolean
  exceptions: string[]
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface RetentionSchedule {
  id: string
  policyId: string
  dataSubjectId: string
  dataCategory: string
  createdAt: Date
  retentionExpiry: Date
  status: 'active' | 'archived' | 'deleted' | 'extended' | 'exception'
  lastReviewed?: Date
  reviewedBy?: string
  deletionDate?: Date
  extensionReason?: string
  exceptionReason?: string
}

export interface DataDeletionJob {
  id: string
  scheduleId: string
  policyId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
  scheduledDate: Date
  executedDate?: Date
  executedBy?: string
  itemsToDelete: number
  itemsDeleted: number
  errors: string[]
  backupCreated: boolean
  approvedBy?: string
  approvalDate?: Date
}

export interface RetentionReport {
  id: string
  generatedAt: Date
  period: { start: Date, end: Date }
  policies: Array<{
    policyId: string
    policyName: string
    itemsScheduled: number
    itemsDeleted: number
    itemsArchived: number
    exceptions: number
    complianceRate: number
  }>
  overallCompliance: number
  upcomingDeletions: number
  overdueItems: number
  exceptions: number
}

class DataRetentionService {
  private readonly defaultPolicies: RetentionPolicy[] = [
    {
      id: 'policy_guest_data',
      name: 'Guest Personal Data',
      description: 'Personal information of hotel guests including name, contact details, and preferences',
      dataCategory: 'guest_personal_data',
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      retentionBasis: 'legal_requirement',
      legalReference: 'Tax and accounting regulations require 7-year retention',
      autoDelete: false,
      archiveBeforeDelete: true,
      notificationBeforeDelete: true,
      approvalRequired: true,
      exceptions: ['active_legal_case', 'audit_in_progress'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_booking_data',
      name: 'Booking Records',
      description: 'Hotel booking information including dates, rates, and services',
      dataCategory: 'booking_records',
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      retentionBasis: 'legal_requirement',
      legalReference: 'Financial record keeping requirements',
      autoDelete: false,
      archiveBeforeDelete: true,
      notificationBeforeDelete: false,
      approvalRequired: true,
      exceptions: ['tax_audit', 'dispute_pending'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_payment_data',
      name: 'Payment Information',
      description: 'Payment transaction records and receipts',
      dataCategory: 'payment_records',
      retentionPeriod: 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
      retentionBasis: 'legal_requirement',
      legalReference: 'PCI DSS and financial regulations',
      autoDelete: false,
      archiveBeforeDelete: true,
      notificationBeforeDelete: true,
      approvalRequired: true,
      exceptions: ['fraud_investigation', 'chargeback_dispute'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_marketing_data',
      name: 'Marketing Communications',
      description: 'Marketing preferences and communication history',
      dataCategory: 'marketing_data',
      retentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
      retentionBasis: 'consent',
      autoDelete: true,
      archiveBeforeDelete: false,
      notificationBeforeDelete: true,
      approvalRequired: false,
      exceptions: ['consent_withdrawn'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_analytics_data',
      name: 'Analytics and Usage Data',
      description: 'Website usage analytics and behavior data',
      dataCategory: 'analytics_data',
      retentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
      retentionBasis: 'business_need',
      autoDelete: true,
      archiveBeforeDelete: false,
      notificationBeforeDelete: false,
      approvalRequired: false,
      exceptions: ['performance_analysis'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_audit_logs',
      name: 'Audit and Security Logs',
      description: 'System audit logs and security events',
      dataCategory: 'audit_logs',
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      retentionBasis: 'legal_requirement',
      legalReference: 'Security and compliance regulations',
      autoDelete: false,
      archiveBeforeDelete: true,
      notificationBeforeDelete: false,
      approvalRequired: true,
      exceptions: ['security_investigation', 'regulatory_inquiry'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    },
    {
      id: 'policy_support_data',
      name: 'Customer Support Records',
      description: 'Support tickets, communications, and resolutions',
      dataCategory: 'support_records',
      retentionPeriod: 5 * 365 * 24 * 60 * 60 * 1000, // 5 years
      retentionBasis: 'business_need',
      autoDelete: false,
      archiveBeforeDelete: true,
      notificationBeforeDelete: true,
      approvalRequired: false,
      exceptions: ['ongoing_issue', 'escalated_complaint'],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    }
  ]

  private retentionSchedules: Map<string, RetentionSchedule> = new Map()
  private deletionJobs: Map<string, DataDeletionJob> = new Map()

  constructor() {
    // Initialize retention monitoring
    this.initializeRetentionMonitoring()
  }

  /**
   * Create retention schedule for new data
   */
  async createRetentionSchedule(
    dataSubjectId: string,
    dataCategory: string,
    createdAt: Date = new Date()
  ): Promise<RetentionSchedule> {
    const policy = this.getPolicyByCategory(dataCategory)
    if (!policy) {
      throw new Error(`No retention policy found for category: ${dataCategory}`)
    }

    const schedule: RetentionSchedule = {
      id: `retention_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      policyId: policy.id,
      dataSubjectId,
      dataCategory,
      createdAt,
      retentionExpiry: new Date(createdAt.getTime() + policy.retentionPeriod),
      status: 'active'
    }

    this.retentionSchedules.set(schedule.id, schedule)

    await auditLogger.logComplianceEvent(
      {
        type: 'privacy_setting_changed',
        dataType: 'personal',
        retentionPeriod: `${policy.retentionPeriod / (365 * 24 * 60 * 60 * 1000)} years`
      },
      {
        userId: dataSubjectId,
        userRole: 'guest',
        ipAddress: 'system',
        userAgent: 'retention-service'
      }
    )

    return schedule
  }

  /**
   * Get items due for deletion
   */
  async getItemsDueForDeletion(
    beforeDate: Date = new Date()
  ): Promise<Array<{
    schedule: RetentionSchedule
    policy: RetentionPolicy
    daysOverdue: number
  }>> {
    const dueItems = []

    for (const schedule of this.retentionSchedules.values()) {
      if (schedule.status === 'active' && schedule.retentionExpiry <= beforeDate) {
        const policy = this.getPolicyById(schedule.policyId)
        if (policy) {
          const daysOverdue = Math.ceil(
            (beforeDate.getTime() - schedule.retentionExpiry.getTime()) / (24 * 60 * 60 * 1000)
          )

          dueItems.push({
            schedule,
            policy,
            daysOverdue
          })
        }
      }
    }

    return dueItems.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }

  /**
   * Execute data deletion for expired items
   */
  async executeDeletion(
    scheduleIds: string[],
    executedBy: string,
    approvedBy?: string
  ): Promise<{
    jobId: string
    scheduled: number
    failed: number
    errors: string[]
  }> {
    const errors: string[] = []
    let scheduled = 0
    let failed = 0

    try {
      for (const scheduleId of scheduleIds) {
        const schedule = this.retentionSchedules.get(scheduleId)
        const policy = schedule ? this.getPolicyById(schedule.policyId) : null

        if (!schedule || !policy) {
          errors.push(`Schedule or policy not found for ID: ${scheduleId}`)
          failed++
          continue
        }

        // Check if approval is required
        if (policy.approvalRequired && !approvedBy) {
          errors.push(`Approval required for deletion of ${schedule.dataCategory}`)
          failed++
          continue
        }

        // Check for exceptions
        const hasExceptions = await this.checkExceptions(schedule)
        if (hasExceptions.length > 0) {
          errors.push(`Exceptions prevent deletion: ${hasExceptions.join(', ')}`)
          failed++
          continue
        }

        // Create deletion job
        const job = await this.createDeletionJob(schedule, policy, executedBy, approvedBy)
        scheduled++

        // Execute deletion if auto-delete is enabled
        if (policy.autoDelete) {
          await this.executeDeletionJob(job.id)
        }
      }

      return {
        jobId: `batch_${Date.now()}`,
        scheduled,
        failed,
        errors
      }
    } catch (error) {
      errors.push(`Deletion execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return {
        jobId: `batch_${Date.now()}`,
        scheduled,
        failed,
        errors
      }
    }
  }

  /**
   * Extend retention period for specific data
   */
  async extendRetention(
    scheduleId: string,
    extensionPeriod: number,
    reason: string,
    extendedBy: string
  ): Promise<RetentionSchedule> {
    const schedule = this.retentionSchedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Retention schedule not found: ${scheduleId}`)
    }

    const newExpiry = new Date(schedule.retentionExpiry.getTime() + extensionPeriod)

    schedule.retentionExpiry = newExpiry
    schedule.status = 'extended'
    schedule.extensionReason = reason
    schedule.lastReviewed = new Date()
    schedule.reviewedBy = extendedBy

    this.retentionSchedules.set(scheduleId, schedule)

    await auditLogger.logComplianceEvent(
      {
        type: 'privacy_setting_changed',
        dataType: 'personal'
      },
      {
        userId: schedule.dataSubjectId,
        userRole: 'admin',
        ipAddress: 'system',
        userAgent: 'retention-service'
      }
    )

    return schedule
  }

  /**
   * Mark data as exception (not for deletion)
   */
  async markAsException(
    scheduleId: string,
    reason: string,
    markedBy: string
  ): Promise<RetentionSchedule> {
    const schedule = this.retentionSchedules.get(scheduleId)
    if (!schedule) {
      throw new Error(`Retention schedule not found: ${scheduleId}`)
    }

    schedule.status = 'exception'
    schedule.exceptionReason = reason
    schedule.lastReviewed = new Date()
    schedule.reviewedBy = markedBy

    this.retentionSchedules.set(scheduleId, schedule)

    await auditLogger.logComplianceEvent(
      {
        type: 'privacy_setting_changed',
        dataType: 'personal'
      },
      {
        userId: schedule.dataSubjectId,
        userRole: 'admin',
        ipAddress: 'system',
        userAgent: 'retention-service'
      }
    )

    return schedule
  }

  /**
   * Generate retention compliance report
   */
  async generateRetentionReport(
    startDate: Date,
    endDate: Date
  ): Promise<RetentionReport> {
    const policies = []
    let totalScheduled = 0
    let totalDeleted = 0
    let totalArchived = 0
    let totalExceptions = 0

    for (const policy of this.defaultPolicies) {
      const policySchedules = Array.from(this.retentionSchedules.values())
        .filter(s => s.policyId === policy.id)

      const scheduled = policySchedules.length
      const deleted = policySchedules.filter(s => s.status === 'deleted').length
      const archived = policySchedules.filter(s => s.status === 'archived').length
      const exceptions = policySchedules.filter(s => s.status === 'exception').length

      const complianceRate = scheduled > 0 ? ((deleted + archived) / scheduled) * 100 : 100

      policies.push({
        policyId: policy.id,
        policyName: policy.name,
        itemsScheduled: scheduled,
        itemsDeleted: deleted,
        itemsArchived: archived,
        exceptions,
        complianceRate
      })

      totalScheduled += scheduled
      totalDeleted += deleted
      totalArchived += archived
      totalExceptions += exceptions
    }

    const overallCompliance = totalScheduled > 0
      ? ((totalDeleted + totalArchived) / totalScheduled) * 100
      : 100

    const upcomingDeletions = Array.from(this.retentionSchedules.values())
      .filter(s => s.status === 'active' && s.retentionExpiry <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .length

    const overdueItems = Array.from(this.retentionSchedules.values())
      .filter(s => s.status === 'active' && s.retentionExpiry < new Date())
      .length

    return {
      id: `report_${Date.now()}`,
      generatedAt: new Date(),
      period: { start: startDate, end: endDate },
      policies,
      overallCompliance,
      upcomingDeletions,
      overdueItems,
      exceptions: totalExceptions
    }
  }

  /**
   * Get retention status for a data subject
   */
  async getRetentionStatus(dataSubjectId: string): Promise<Array<{
    dataCategory: string
    retentionExpiry: Date
    status: string
    daysRemaining: number
    canExtend: boolean
    canMarkException: boolean
  }>> {
    const schedules = Array.from(this.retentionSchedules.values())
      .filter(s => s.dataSubjectId === dataSubjectId)

    return schedules.map(schedule => {
      const policy = this.getPolicyById(schedule.policyId)
      const now = new Date()
      const daysRemaining = Math.ceil(
        (schedule.retentionExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      return {
        dataCategory: schedule.dataCategory,
        retentionExpiry: schedule.retentionExpiry,
        status: schedule.status,
        daysRemaining,
        canExtend: policy?.approvalRequired || false,
        canMarkException: policy?.exceptions.length ? policy.exceptions.length > 0 : false
      }
    })
  }

  // Private helper methods

  private initializeRetentionMonitoring(): void {
    // Run retention check daily
    setInterval(() => {
      this.runDailyRetentionCheck()
    }, 24 * 60 * 60 * 1000)

    // Send notifications weekly
    setInterval(() => {
      this.sendRetentionNotifications()
    }, 7 * 24 * 60 * 60 * 1000)
  }

  private async runDailyRetentionCheck(): Promise<void> {
    try {
      const dueItems = await this.getItemsDueForDeletion()

      for (const item of dueItems) {
        if (item.policy.autoDelete && item.daysOverdue > 0) {
          await this.executeDeletion([item.schedule.id], 'system')
        }
      }

      await auditLogger.logUserAction({
        userId: 'system',
        action: 'retention_check',
        resource: 'data_retention',
        ip: 'localhost',
        userAgent: 'retention-service',
        details: {
          itemsChecked: dueItems.length,
          autoDeletedItems: dueItems.filter(i => i.policy.autoDelete).length
        }
      })
    } catch (error) {
      console.error('Daily retention check failed:', error)
    }
  }

  private async sendRetentionNotifications(): Promise<void> {
    // Send notifications for upcoming deletions
    const upcomingItems = Array.from(this.retentionSchedules.values())
      .filter(s => {
        const daysUntilExpiry = (s.retentionExpiry.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        return s.status === 'active' && daysUntilExpiry <= 30 && daysUntilExpiry > 0
      })

    if (upcomingItems.length > 0) {
      console.log(`Sending retention notifications for ${upcomingItems.length} items`)
      // In production: send actual notifications
    }
  }

  private getPolicyByCategory(category: string): RetentionPolicy | null {
    return this.defaultPolicies.find(p => p.dataCategory === category && p.isActive) || null
  }

  private getPolicyById(id: string): RetentionPolicy | null {
    return this.defaultPolicies.find(p => p.id === id) || null
  }

  private async checkExceptions(schedule: RetentionSchedule): Promise<string[]> {
    const policy = this.getPolicyById(schedule.policyId)
    if (!policy) return []

    const activeExceptions: string[] = []

    // Check each exception type
    for (const exception of policy.exceptions) {
      const hasException = await this.hasActiveException(schedule.dataSubjectId, exception)
      if (hasException) {
        activeExceptions.push(exception)
      }
    }

    return activeExceptions
  }

  private async hasActiveException(dataSubjectId: string, exceptionType: string): Promise<boolean> {
    // Check for active exceptions
    switch (exceptionType) {
      case 'active_legal_case':
        return await this.hasActiveLegalCase(dataSubjectId)
      case 'audit_in_progress':
        return await this.hasActiveAudit(dataSubjectId)
      case 'fraud_investigation':
        return await this.hasFraudInvestigation(dataSubjectId)
      default:
        return false
    }
  }

  private async hasActiveLegalCase(dataSubjectId: string): Promise<boolean> {
    // Check for active legal cases
    return false // Mock implementation
  }

  private async hasActiveAudit(dataSubjectId: string): Promise<boolean> {
    // Check for active audits
    return false // Mock implementation
  }

  private async hasFraudInvestigation(dataSubjectId: string): Promise<boolean> {
    // Check for fraud investigations
    return false // Mock implementation
  }

  private async createDeletionJob(
    schedule: RetentionSchedule,
    policy: RetentionPolicy,
    executedBy: string,
    approvedBy?: string
  ): Promise<DataDeletionJob> {
    const job: DataDeletionJob = {
      id: `deletion_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      scheduleId: schedule.id,
      policyId: policy.id,
      status: 'pending',
      scheduledDate: new Date(),
      itemsToDelete: 1, // Simplified - in practice would count actual data items
      itemsDeleted: 0,
      errors: [],
      backupCreated: false,
      executedBy,
      approvedBy
    }

    this.deletionJobs.set(job.id, job)
    return job
  }

  private async executeDeletionJob(jobId: string): Promise<void> {
    const job = this.deletionJobs.get(jobId)
    if (!job) {
      throw new Error(`Deletion job not found: ${jobId}`)
    }

    try {
      job.status = 'in_progress'
      job.executedDate = new Date()

      const schedule = this.retentionSchedules.get(job.scheduleId)
      const policy = this.getPolicyById(job.policyId)

      if (!schedule || !policy) {
        throw new Error('Schedule or policy not found')
      }

      // Create backup if required
      if (policy.archiveBeforeDelete) {
        await this.createDataArchive(schedule.dataSubjectId, schedule.dataCategory)
        job.backupCreated = true
      }

      // Perform actual deletion
      await this.deleteData(schedule.dataSubjectId, schedule.dataCategory)

      // Update schedule status
      schedule.status = 'deleted'
      schedule.deletionDate = new Date()
      this.retentionSchedules.set(schedule.id, schedule)

      job.status = 'completed'
      job.itemsDeleted = job.itemsToDelete

      await auditLogger.logComplianceEvent(
        {
          type: 'data_deletion',
          dataType: 'personal'
        },
        {
          userId: schedule.dataSubjectId,
          userRole: 'system',
          ipAddress: 'localhost',
          userAgent: 'retention-service'
        }
      )
    } catch (error) {
      job.status = 'failed'
      job.errors.push(error instanceof Error ? error.message : 'Unknown error')
      console.error(`Deletion job ${jobId} failed:`, error)
    }

    this.deletionJobs.set(jobId, job)
  }

  private async createDataArchive(dataSubjectId: string, dataCategory: string): Promise<void> {
    // Create archive of data before deletion
    console.log(`Creating archive for ${dataCategory} data of ${dataSubjectId}`)
  }

  private async deleteData(dataSubjectId: string, dataCategory: string): Promise<void> {
    // Perform actual data deletion
    console.log(`Deleting ${dataCategory} data for ${dataSubjectId}`)
  }
}

export const dataRetentionService = new DataRetentionService()

// Convenience functions
export const createRetentionSchedule = (dataSubjectId: string, dataCategory: string, createdAt?: Date) =>
  dataRetentionService.createRetentionSchedule(dataSubjectId, dataCategory, createdAt)

export const getItemsDueForDeletion = (beforeDate?: Date) =>
  dataRetentionService.getItemsDueForDeletion(beforeDate)

export const generateRetentionReport = (startDate: Date, endDate: Date) =>
  dataRetentionService.generateRetentionReport(startDate, endDate)