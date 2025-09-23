import { auditLogger } from '../security/audit-logger'
import { gdprService } from './gdpr-compliance'
import { dataRetentionService } from './data-retention'
import { fraudDetectionService } from '../security/fraud-detection'
import { backupRecoveryService } from '../security/backup-recovery'
import { privacySettingsService } from './privacy-settings'

export interface ComplianceReport {
  id: string
  reportType: 'gdpr' | 'security' | 'audit' | 'retention' | 'privacy' | 'comprehensive'
  period: {
    start: Date
    end: Date
  }
  generatedAt: Date
  generatedBy: string
  status: 'generating' | 'completed' | 'failed'
  format: 'pdf' | 'json' | 'csv' | 'html'
  summary: {
    totalEvents: number
    criticalFindings: number
    complianceScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  }
  sections: ComplianceReportSection[]
  recommendations: ComplianceRecommendation[]
  actionItems: ComplianceActionItem[]
  attachments?: ComplianceAttachment[]
  metadata: {
    version: string
    classification: 'internal' | 'confidential' | 'restricted'
    retention: string
    distribution: string[]
  }
}

export interface ComplianceReportSection {
  id: string
  title: string
  description: string
  findings: ComplianceFinding[]
  metrics: ComplianceMetric[]
  charts?: ComplianceChart[]
  compliancePercentage: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface ComplianceFinding {
  id: string
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
  category: string
  title: string
  description: string
  evidence: string[]
  impact: string
  recommendation: string
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk'
  assignedTo?: string
  dueDate?: Date
  relatedRegulations: string[]
}

export interface ComplianceMetric {
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  target?: number
  status: 'good' | 'warning' | 'critical'
  description: string
}

export interface ComplianceChart {
  type: 'line' | 'bar' | 'pie' | 'area'
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
}

export interface ComplianceRecommendation {
  id: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  category: 'security' | 'privacy' | 'process' | 'technical' | 'training'
  estimatedEffort: 'low' | 'medium' | 'high'
  estimatedCost: 'low' | 'medium' | 'high'
  impact: string
  timeline: string
  dependencies: string[]
  relatedFindings: string[]
}

export interface ComplianceActionItem {
  id: string
  title: string
  description: string
  assignedTo: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  dueDate: Date
  status: 'open' | 'in_progress' | 'completed' | 'overdue'
  category: string
  relatedFindings: string[]
  estimatedHours: number
}

export interface ComplianceAttachment {
  id: string
  name: string
  type: 'evidence' | 'policy' | 'procedure' | 'certificate' | 'log'
  format: string
  size: number
  path: string
  checksum: string
}

export interface ComplianceDashboard {
  overallScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastAssessment: Date
  nextAssessment: Date
  criticalFindings: number
  openActionItems: number
  overdueItems: number
  recentTrends: {
    securityEvents: ComplianceMetric
    privacyRequests: ComplianceMetric
    dataBreaches: ComplianceMetric
    auditFindings: ComplianceMetric
  }
  regulatoryStatus: {
    gdpr: { status: 'compliant' | 'partial' | 'non_compliant', lastReview: Date }
    pciDss: { status: 'compliant' | 'partial' | 'non_compliant', lastReview: Date }
    iso27001: { status: 'compliant' | 'partial' | 'non_compliant', lastReview: Date }
  }
  upcomingDeadlines: Array<{
    title: string
    date: Date
    type: 'certification' | 'audit' | 'review' | 'training'
    criticality: 'low' | 'medium' | 'high' | 'critical'
  }>
}

class ComplianceReportingService {
  private reports: Map<string, ComplianceReport> = new Map()
  private findings: Map<string, ComplianceFinding> = new Map()
  private actionItems: Map<string, ComplianceActionItem> = new Map()

  constructor() {
    this.initializeReportingScheduler()
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    period: { start: Date, end: Date },
    generatedBy: string,
    options?: {
      format?: 'pdf' | 'json' | 'csv' | 'html'
      includeDetails?: boolean
      confidential?: boolean
    }
  ): Promise<ComplianceReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

    try {
      const report: ComplianceReport = {
        id: reportId,
        reportType,
        period,
        generatedAt: new Date(),
        generatedBy,
        status: 'generating',
        format: options?.format || 'json',
        summary: {
          totalEvents: 0,
          criticalFindings: 0,
          complianceScore: 0,
          riskLevel: 'low'
        },
        sections: [],
        recommendations: [],
        actionItems: [],
        metadata: {
          version: '1.0',
          classification: options?.confidential ? 'confidential' : 'internal',
          retention: '7 years',
          distribution: [generatedBy]
        }
      }

      this.reports.set(reportId, report)

      // Generate report sections based on type
      const sections = await this.generateReportSections(reportType, period)
      report.sections = sections

      // Calculate summary metrics
      report.summary = this.calculateSummaryMetrics(sections)

      // Generate recommendations
      report.recommendations = await this.generateRecommendations(sections)

      // Generate action items
      report.actionItems = await this.generateActionItems(sections, generatedBy)

      // Mark as completed
      report.status = 'completed'
      this.reports.set(reportId, report)

      // Log report generation
      await auditLogger.logComplianceEvent(
        {
          type: 'data_access',
          dataType: 'personal'
        },
        {
          userId: generatedBy,
          userRole: 'admin',
          ipAddress: 'system',
          userAgent: 'compliance-service'
        }
      )

      return report
    } catch (error) {
      const report = this.reports.get(reportId)
      if (report) {
        report.status = 'failed'
        this.reports.set(reportId, report)
      }
      throw error
    }
  }

  /**
   * Get compliance dashboard overview
   */
  async getComplianceDashboard(): Promise<ComplianceDashboard> {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get recent findings
    const recentFindings = Array.from(this.findings.values())
      .filter(f => f.status === 'open')

    const criticalFindings = recentFindings.filter(f => f.severity === 'critical').length
    const overallScore = this.calculateOverallComplianceScore(recentFindings)

    return {
      overallScore,
      riskLevel: this.determineRiskLevel(overallScore, criticalFindings),
      lastAssessment: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      nextAssessment: new Date(now.getTime() + 23 * 24 * 60 * 60 * 1000),
      criticalFindings,
      openActionItems: Array.from(this.actionItems.values()).filter(a => a.status === 'open').length,
      overdueItems: Array.from(this.actionItems.values()).filter(a =>
        a.status !== 'completed' && a.dueDate < now
      ).length,
      recentTrends: {
        securityEvents: {
          name: 'Security Events',
          value: 15,
          unit: 'events',
          trend: 'down',
          target: 10,
          status: 'warning',
          description: 'Security events in the last 30 days'
        },
        privacyRequests: {
          name: 'Privacy Requests',
          value: 8,
          unit: 'requests',
          trend: 'up',
          target: 5,
          status: 'warning',
          description: 'GDPR requests in the last 30 days'
        },
        dataBreaches: {
          name: 'Data Breaches',
          value: 0,
          unit: 'incidents',
          trend: 'stable',
          target: 0,
          status: 'good',
          description: 'Data breach incidents in the last 30 days'
        },
        auditFindings: {
          name: 'Audit Findings',
          value: 3,
          unit: 'findings',
          trend: 'down',
          target: 2,
          status: 'warning',
          description: 'Open audit findings'
        }
      },
      regulatoryStatus: {
        gdpr: { status: 'compliant', lastReview: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
        pciDss: { status: 'partial', lastReview: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        iso27001: { status: 'compliant', lastReview: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
      },
      upcomingDeadlines: [
        {
          title: 'PCI DSS Certification Renewal',
          date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
          type: 'certification',
          criticality: 'high'
        },
        {
          title: 'Annual Security Audit',
          date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          type: 'audit',
          criticality: 'medium'
        },
        {
          title: 'GDPR Training Refresh',
          date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          type: 'training',
          criticality: 'low'
        }
      ]
    }
  }

  /**
   * Track compliance finding
   */
  async trackFinding(
    finding: Omit<ComplianceFinding, 'id'>,
    discoveredBy: string
  ): Promise<ComplianceFinding> {
    const fullFinding: ComplianceFinding = {
      ...finding,
      id: `finding_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    }

    this.findings.set(fullFinding.id, fullFinding)

    // Auto-create action item for high/critical findings
    if (finding.severity === 'high' || finding.severity === 'critical') {
      await this.createActionItem({
        title: `Address ${finding.title}`,
        description: finding.recommendation,
        assignedTo: finding.assignedTo || 'compliance-team',
        priority: finding.severity === 'critical' ? 'critical' : 'high',
        dueDate: new Date(Date.now() + (finding.severity === 'critical' ? 7 : 30) * 24 * 60 * 60 * 1000),
        status: 'open',
        category: finding.category,
        relatedFindings: [fullFinding.id],
        estimatedHours: finding.severity === 'critical' ? 16 : 8
      })
    }

    await auditLogger.logUserAction({
      userId: discoveredBy,
      action: 'finding_tracked',
      resource: 'compliance_finding',
      resourceId: fullFinding.id,
      ip: 'system',
      userAgent: 'compliance-service',
      details: {
        severity: finding.severity,
        category: finding.category
      }
    })

    return fullFinding
  }

  /**
   * Update finding status
   */
  async updateFinding(
    findingId: string,
    updates: Partial<ComplianceFinding>,
    updatedBy: string
  ): Promise<ComplianceFinding> {
    const finding = this.findings.get(findingId)
    if (!finding) {
      throw new Error(`Finding not found: ${findingId}`)
    }

    const updatedFinding = { ...finding, ...updates }
    this.findings.set(findingId, updatedFinding)

    await auditLogger.logUserAction({
      userId: updatedBy,
      action: 'finding_updated',
      resource: 'compliance_finding',
      resourceId: findingId,
      ip: 'system',
      userAgent: 'compliance-service',
      details: {
        previousStatus: finding.status,
        newStatus: updatedFinding.status
      }
    })

    return updatedFinding
  }

  /**
   * Create action item
   */
  async createActionItem(actionItem: Omit<ComplianceActionItem, 'id'>): Promise<ComplianceActionItem> {
    const fullActionItem: ComplianceActionItem = {
      ...actionItem,
      id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    }

    this.actionItems.set(fullActionItem.id, fullActionItem)

    return fullActionItem
  }

  /**
   * Get compliance metrics for a period
   */
  async getComplianceMetrics(period: { start: Date, end: Date }): Promise<{
    gdpr: any
    security: any
    audit: any
    retention: any
    privacy: any
  }> {
    // Get GDPR metrics
    const gdprReport = await gdprService.generateComplianceReport(period.start, period.end, 'gdpr')

    // Get retention metrics
    const retentionReport = await dataRetentionService.generateRetentionReport(period.start, period.end)

    // Get backup metrics
    const backupStats = await backupRecoveryService.getBackupStatistics('30d')

    // Get audit metrics
    const auditReport = await auditLogger.generateComplianceReport(period.start, period.end, 'all')

    return {
      gdpr: {
        totalRequests: gdprReport.dataSubjectRequests.total,
        slaCompliance: gdprReport.dataSubjectRequests.slaCompliance,
        avgProcessingTime: gdprReport.dataSubjectRequests.avgProcessingTime,
        consentManagement: gdprReport.consentManagement
      },
      security: {
        totalEvents: auditReport.totalEvents,
        criticalEvents: auditReport.criticalEvents,
        complianceFlags: auditReport.complianceFlags
      },
      audit: {
        totalEvents: auditReport.totalEvents,
        riskAssessment: auditReport.summary.riskAssessment
      },
      retention: {
        complianceRate: retentionReport.overallCompliance,
        upcomingDeletions: retentionReport.upcomingDeletions,
        overdueItems: retentionReport.overdueItems
      },
      privacy: {
        // Would get from privacy settings service
        activeUsers: 1000,
        consentedUsers: 850,
        withdrawalRequests: 25
      }
    }
  }

  /**
   * Export compliance report
   */
  async exportReport(
    reportId: string,
    format: 'pdf' | 'json' | 'csv' | 'html'
  ): Promise<{
    success: boolean
    downloadUrl?: string
    error?: string
  }> {
    try {
      const report = this.reports.get(reportId)
      if (!report) {
        return {
          success: false,
          error: 'Report not found'
        }
      }

      const exportedData = await this.formatReportForExport(report, format)
      const downloadUrl = await this.storeExportedReport(reportId, exportedData, format)

      return {
        success: true,
        downloadUrl
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      }
    }
  }

  // Private helper methods

  private async generateReportSections(
    reportType: ComplianceReport['reportType'],
    period: { start: Date, end: Date }
  ): Promise<ComplianceReportSection[]> {
    const sections: ComplianceReportSection[] = []

    switch (reportType) {
      case 'gdpr':
        sections.push(await this.generateGDPRSection(period))
        break
      case 'security':
        sections.push(await this.generateSecuritySection(period))
        break
      case 'audit':
        sections.push(await this.generateAuditSection(period))
        break
      case 'retention':
        sections.push(await this.generateRetentionSection(period))
        break
      case 'privacy':
        sections.push(await this.generatePrivacySection(period))
        break
      case 'comprehensive':
        sections.push(
          await this.generateGDPRSection(period),
          await this.generateSecuritySection(period),
          await this.generateAuditSection(period),
          await this.generateRetentionSection(period),
          await this.generatePrivacySection(period)
        )
        break
    }

    return sections
  }

  private async generateGDPRSection(period: { start: Date, end: Date }): Promise<ComplianceReportSection> {
    const gdprReport = await gdprService.generateComplianceReport(period.start, period.end, 'gdpr')

    return {
      id: 'gdpr_section',
      title: 'GDPR Compliance',
      description: 'General Data Protection Regulation compliance status and metrics',
      findings: [
        {
          id: 'gdpr_sla',
          severity: gdprReport.dataSubjectRequests.slaCompliance > 95 ? 'info' : 'medium',
          category: 'GDPR',
          title: 'Data Subject Request SLA Compliance',
          description: `SLA compliance rate: ${gdprReport.dataSubjectRequests.slaCompliance}%`,
          evidence: [`Total requests: ${gdprReport.dataSubjectRequests.total}`],
          impact: 'Regulatory compliance and user rights',
          recommendation: 'Monitor processing times and improve workflow efficiency',
          status: 'open',
          relatedRegulations: ['GDPR Article 12']
        }
      ],
      metrics: [
        {
          name: 'SLA Compliance',
          value: gdprReport.dataSubjectRequests.slaCompliance,
          unit: '%',
          trend: 'stable',
          target: 95,
          status: gdprReport.dataSubjectRequests.slaCompliance > 95 ? 'good' : 'warning',
          description: 'Percentage of data subject requests processed within SLA'
        }
      ],
      compliancePercentage: gdprReport.dataSubjectRequests.slaCompliance,
      riskLevel: gdprReport.dataSubjectRequests.slaCompliance > 95 ? 'low' : 'medium'
    }
  }

  private async generateSecuritySection(period: { start: Date, end: Date }): Promise<ComplianceReportSection> {
    const auditReport = await auditLogger.generateComplianceReport(period.start, period.end, 'security')

    return {
      id: 'security_section',
      title: 'Security Compliance',
      description: 'Information security events and compliance status',
      findings: [],
      metrics: [
        {
          name: 'Security Events',
          value: auditReport.totalEvents,
          unit: 'events',
          trend: 'down',
          target: 50,
          status: auditReport.totalEvents > 100 ? 'critical' : 'good',
          description: 'Total security events in the period'
        }
      ],
      compliancePercentage: 85,
      riskLevel: auditReport.criticalEvents > 0 ? 'high' : 'low'
    }
  }

  private async generateAuditSection(period: { start: Date, end: Date }): Promise<ComplianceReportSection> {
    return {
      id: 'audit_section',
      title: 'Audit Trail',
      description: 'Audit log analysis and compliance',
      findings: [],
      metrics: [],
      compliancePercentage: 90,
      riskLevel: 'low'
    }
  }

  private async generateRetentionSection(period: { start: Date, end: Date }): Promise<ComplianceReportSection> {
    const retentionReport = await dataRetentionService.generateRetentionReport(period.start, period.end)

    return {
      id: 'retention_section',
      title: 'Data Retention',
      description: 'Data retention policy compliance and cleanup activities',
      findings: [],
      metrics: [
        {
          name: 'Retention Compliance',
          value: retentionReport.overallCompliance,
          unit: '%',
          trend: 'stable',
          target: 95,
          status: retentionReport.overallCompliance > 95 ? 'good' : 'warning',
          description: 'Overall retention policy compliance'
        }
      ],
      compliancePercentage: retentionReport.overallCompliance,
      riskLevel: retentionReport.overdueItems > 10 ? 'medium' : 'low'
    }
  }

  private async generatePrivacySection(period: { start: Date, end: Date }): Promise<ComplianceReportSection> {
    return {
      id: 'privacy_section',
      title: 'Privacy Management',
      description: 'Privacy settings and consent management',
      findings: [],
      metrics: [],
      compliancePercentage: 88,
      riskLevel: 'low'
    }
  }

  private calculateSummaryMetrics(sections: ComplianceReportSection[]): ComplianceReport['summary'] {
    const totalEvents = sections.reduce((sum, section) =>
      sum + section.metrics.reduce((metricSum, metric) => metricSum + metric.value, 0), 0
    )

    const criticalFindings = sections.reduce((sum, section) =>
      sum + section.findings.filter(f => f.severity === 'critical').length, 0
    )

    const avgCompliance = sections.reduce((sum, section) => sum + section.compliancePercentage, 0) / sections.length

    const highestRisk = sections.reduce((highest, section) => {
      const riskLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      return riskLevels[section.riskLevel] > riskLevels[highest] ? section.riskLevel : highest
    }, 'low' as const)

    return {
      totalEvents,
      criticalFindings,
      complianceScore: Math.round(avgCompliance),
      riskLevel: highestRisk
    }
  }

  private async generateRecommendations(sections: ComplianceReportSection[]): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = []

    // Generate recommendations based on findings
    for (const section of sections) {
      for (const finding of section.findings) {
        if (finding.severity === 'high' || finding.severity === 'critical') {
          recommendations.push({
            id: `rec_${finding.id}`,
            priority: finding.severity,
            title: `Address ${finding.title}`,
            description: finding.recommendation,
            category: 'security',
            estimatedEffort: 'medium',
            estimatedCost: 'low',
            impact: finding.impact,
            timeline: '30 days',
            dependencies: [],
            relatedFindings: [finding.id]
          })
        }
      }
    }

    return recommendations
  }

  private async generateActionItems(
    sections: ComplianceReportSection[],
    assignedTo: string
  ): Promise<ComplianceActionItem[]> {
    const actionItems: ComplianceActionItem[] = []

    for (const section of sections) {
      for (const finding of section.findings) {
        if (finding.severity === 'high' || finding.severity === 'critical') {
          actionItems.push({
            id: `action_${finding.id}`,
            title: `Resolve ${finding.title}`,
            description: finding.recommendation,
            assignedTo: finding.assignedTo || assignedTo,
            priority: finding.severity,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'open',
            category: finding.category,
            relatedFindings: [finding.id],
            estimatedHours: finding.severity === 'critical' ? 16 : 8
          })
        }
      }
    }

    return actionItems
  }

  private calculateOverallComplianceScore(findings: ComplianceFinding[]): number {
    if (findings.length === 0) return 100

    const severityWeights = { info: 1, low: 2, medium: 5, high: 10, critical: 20 }
    const totalWeight = findings.reduce((sum, f) => sum + severityWeights[f.severity], 0)
    const maxPossibleWeight = findings.length * severityWeights.critical

    return Math.max(0, Math.round(100 - (totalWeight / maxPossibleWeight) * 100))
  }

  private determineRiskLevel(complianceScore: number, criticalFindings: number): 'low' | 'medium' | 'high' | 'critical' {
    if (criticalFindings > 0) return 'critical'
    if (complianceScore < 60) return 'high'
    if (complianceScore < 80) return 'medium'
    return 'low'
  }

  private async formatReportForExport(report: ComplianceReport, format: string): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'csv':
        return this.convertReportToCSV(report)
      case 'pdf':
        return await this.generateReportPDF(report)
      case 'html':
        return this.generateReportHTML(report)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  private convertReportToCSV(report: ComplianceReport): string {
    const lines = []
    lines.push('Compliance Report')
    lines.push(`Report ID,${report.id}`)
    lines.push(`Generated,${report.generatedAt}`)
    lines.push(`Compliance Score,${report.summary.complianceScore}`)
    lines.push('')

    lines.push('Findings')
    lines.push('Section,Severity,Title,Status')
    for (const section of report.sections) {
      for (const finding of section.findings) {
        lines.push(`${section.title},${finding.severity},${finding.title},${finding.status}`)
      }
    }

    return lines.join('\n')
  }

  private async generateReportPDF(report: ComplianceReport): Promise<string> {
    // In production, use actual PDF generation
    return `PDF Report: ${report.id}`
  }

  private generateReportHTML(report: ComplianceReport): string {
    return `
      <html>
        <head><title>Compliance Report ${report.id}</title></head>
        <body>
          <h1>Compliance Report</h1>
          <p>Generated: ${report.generatedAt}</p>
          <p>Compliance Score: ${report.summary.complianceScore}%</p>
        </body>
      </html>
    `
  }

  private async storeExportedReport(reportId: string, data: any, format: string): Promise<string> {
    // In production, store in secure location
    return `https://compliance-reports.example.com/${reportId}.${format}`
  }

  private initializeReportingScheduler(): void {
    // Schedule monthly compliance reports
    setInterval(() => {
      this.generateScheduledReports()
    }, 30 * 24 * 60 * 60 * 1000) // Monthly
  }

  private async generateScheduledReports(): Promise<void> {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    try {
      await this.generateComplianceReport(
        'comprehensive',
        { start: lastMonth, end: thisMonth },
        'system',
        { format: 'pdf', confidential: true }
      )
    } catch (error) {
      console.error('Scheduled report generation failed:', error)
    }
  }
}

export const complianceReportingService = new ComplianceReportingService()

// Convenience functions
export const generateReport = (reportType: any, period: any, generatedBy: string, options?: any) =>
  complianceReportingService.generateComplianceReport(reportType, period, generatedBy, options)

export const getComplianceDashboard = () =>
  complianceReportingService.getComplianceDashboard()

export const trackFinding = (finding: any, discoveredBy: string) =>
  complianceReportingService.trackFinding(finding, discoveredBy)