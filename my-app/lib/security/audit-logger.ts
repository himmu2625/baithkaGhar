import { connectToDatabase } from '@/lib/db/enhanced-mongodb'

export interface SecurityEvent {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  userAgent: string
  url?: string
  method?: string
  userId?: string
  propertyId?: string
  details?: any
  error?: string
  timestamp?: Date
}

export interface AuditLog {
  id?: string
  timestamp: Date
  eventType: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  userAgent: string
  userId?: string
  propertyId?: string
  url?: string
  method?: string
  details: any
  resolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
}

class AuditLogger {
  private eventQueue: SecurityEvent[] = []
  private isProcessing = false

  constructor() {
    // Process audit queue every 30 seconds
    setInterval(() => {
      this.processQueue()
    }, 30000)
  }

  /**
   * Log a security event
   */
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditEvent: SecurityEvent = {
      ...event,
      timestamp: new Date()
    }

    // Add to queue for batch processing
    this.eventQueue.push(auditEvent)

    // If critical, process immediately
    if (event.severity === 'critical') {
      await this.processSecurityEvent(auditEvent)
      await this.sendAlert(auditEvent)
    }

    // Also log to console for immediate visibility
    this.logToConsole(auditEvent)
  }

  /**
   * Log user action for audit trail
   */
  async logUserAction(action: {
    userId: string
    action: string
    resource: string
    resourceId?: string
    ip: string
    userAgent: string
    details?: any
  }): Promise<void> {
    await this.logSecurityEvent({
      type: 'user_action',
      severity: 'low',
      ip: action.ip,
      userAgent: action.userAgent,
      userId: action.userId,
      details: {
        action: action.action,
        resource: action.resource,
        resourceId: action.resourceId,
        ...action.details
      }
    })
  }

  /**
   * Log authentication events
   */
  async logAuthEvent(event: {
    type: 'login_success' | 'login_failure' | 'logout' | 'password_change' | 'account_locked'
    userId?: string
    ip: string
    userAgent: string
    details?: any
  }): Promise<void> {
    const severity = event.type === 'login_failure' ? 'medium' : 'low'

    await this.logSecurityEvent({
      type: event.type,
      severity,
      ip: event.ip,
      userAgent: event.userAgent,
      userId: event.userId,
      details: event.details
    })
  }

  /**
   * Log data access events
   */
  async logDataAccess(access: {
    userId: string
    dataType: string
    dataId?: string
    action: 'read' | 'create' | 'update' | 'delete'
    ip: string
    userAgent: string
    sensitive?: boolean
  }): Promise<void> {
    const severity = access.sensitive ? 'medium' : 'low'

    await this.logSecurityEvent({
      type: 'data_access',
      severity,
      ip: access.ip,
      userAgent: access.userAgent,
      userId: access.userId,
      details: {
        dataType: access.dataType,
        dataId: access.dataId,
        action: access.action,
        sensitive: access.sensitive
      }
    })
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    startDate?: Date
    endDate?: Date
    eventType?: string[]
    severity?: string[]
    userId?: string
    ip?: string
    resolved?: boolean
    page?: number
    limit?: number
  } = {}): Promise<{
    logs: AuditLog[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
    summary: {
      total: number
      bySeverity: { [key: string]: number }
      byType: { [key: string]: number }
      resolved: number
      unresolved: number
    }
  }> {
    try {
      await connectToDatabase()

      const { page = 1, limit = 50 } = filters

      // In production, this would query the actual audit logs collection
      // For now, generate mock data
      const mockLogs: AuditLog[] = []

      for (let i = 0; i < 25; i++) {
        mockLogs.push({
          id: `audit_${i}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          eventType: ['login_success', 'data_access', 'user_action', 'rate_limit_exceeded'][Math.floor(Math.random() * 4)],
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Sample User Agent)',
          userId: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
          details: { sample: true },
          resolved: Math.random() > 0.7
        })
      }

      const total = mockLogs.length
      const skip = (page - 1) * limit
      const logs = mockLogs.slice(skip, skip + limit)

      const summary = {
        total,
        bySeverity: this.groupBy(mockLogs, 'severity'),
        byType: this.groupBy(mockLogs, 'eventType'),
        resolved: mockLogs.filter(l => l.resolved).length,
        unresolved: mockLogs.filter(l => !l.resolved).length
      }

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(timeframe: '24h' | '7d' | '30d' = '24h'): Promise<{
    timeframe: string
    summary: {
      totalEvents: number
      criticalEvents: number
      topThreats: Array<{
        type: string
        count: number
        severity: string
      }>
      topIPs: Array<{
        ip: string
        events: number
        severity: string
      }>
    }
    metrics: {
      authFailures: number
      rateLimitViolations: number
      suspiciousRequests: number
      dataAccessEvents: number
    }
    recommendations: string[]
  }> {
    try {
      // In production, this would analyze actual audit data
      const mockReport = {
        timeframe,
        summary: {
          totalEvents: Math.floor(Math.random() * 1000) + 100,
          criticalEvents: Math.floor(Math.random() * 10),
          topThreats: [
            { type: 'rate_limit_exceeded', count: 45, severity: 'medium' },
            { type: 'login_failure', count: 32, severity: 'medium' },
            { type: 'suspicious_request', count: 18, severity: 'high' }
          ],
          topIPs: [
            { ip: '192.168.1.100', events: 67, severity: 'medium' },
            { ip: '10.0.0.50', events: 34, severity: 'low' },
            { ip: '172.16.0.25', events: 21, severity: 'high' }
          ]
        },
        metrics: {
          authFailures: Math.floor(Math.random() * 50),
          rateLimitViolations: Math.floor(Math.random() * 100),
          suspiciousRequests: Math.floor(Math.random() * 30),
          dataAccessEvents: Math.floor(Math.random() * 500)
        },
        recommendations: [
          'Implement additional rate limiting for high-traffic endpoints',
          'Review and update CSRF protection mechanisms',
          'Enable two-factor authentication for admin accounts',
          'Implement IP whitelisting for admin endpoints',
          'Review and update security headers configuration'
        ]
      }

      return mockReport
    } catch (error) {
      console.error('Error generating security report:', error)
      throw error
    }
  }

  // Private methods

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) {
      return
    }

    this.isProcessing = true

    try {
      const events = this.eventQueue.splice(0)
      await this.batchProcessEvents(events)
    } catch (error) {
      console.error('Error processing audit queue:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private async processSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // In production, save to database
      console.log('Processing security event:', event.type)
    } catch (error) {
      console.error('Error processing security event:', error)
    }
  }

  private async batchProcessEvents(events: SecurityEvent[]): Promise<void> {
    try {
      // In production, batch insert to database
      console.log(`Processing ${events.length} audit events`)

      // Check for patterns that might indicate attacks
      await this.analyzeSecurityPatterns(events)
    } catch (error) {
      console.error('Error batch processing events:', error)
    }
  }

  private async analyzeSecurityPatterns(events: SecurityEvent[]): Promise<void> {
    try {
      // Group events by IP
      const eventsByIP: { [ip: string]: SecurityEvent[] } = {}
      
      for (const event of events) {
        if (!eventsByIP[event.ip]) {
          eventsByIP[event.ip] = []
        }
        eventsByIP[event.ip].push(event)
      }

      // Check for suspicious patterns
      for (const [ip, ipEvents] of Object.entries(eventsByIP)) {
        // Multiple failures from same IP
        const failures = ipEvents.filter(e => 
          e.type.includes('failure') || e.type.includes('exceeded')
        )

        if (failures.length >= 5) {
          await this.logSecurityEvent({
            type: 'potential_attack_pattern',
            severity: 'high',
            ip,
            userAgent: failures[0].userAgent,
            details: {
              pattern: 'multiple_failures',
              count: failures.length,
              events: failures.map(f => f.type)
            }
          })
        }

        // Suspicious user agent patterns
        const suspiciousUA = ipEvents.filter(e => 
          e.userAgent.toLowerCase().includes('bot') ||
          e.userAgent.toLowerCase().includes('crawler') ||
          e.userAgent.toLowerCase().includes('scanner')
        )

        if (suspiciousUA.length > 0) {
          await this.logSecurityEvent({
            type: 'suspicious_user_agent',
            severity: 'medium',
            ip,
            userAgent: suspiciousUA[0].userAgent,
            details: {
              pattern: 'bot_like_activity',
              count: suspiciousUA.length
            }
          })
        }
      }
    } catch (error) {
      console.error('Error analyzing security patterns:', error)
    }
  }

  private async sendAlert(event: SecurityEvent): Promise<void> {
    try {
      // In production, send alerts via email/SMS/webhook
      console.log(`🚨 SECURITY ALERT: ${event.type} - ${event.severity}`)
    } catch (error) {
      console.error('Error sending security alert:', error)
    }
  }

  private logToConsole(event: SecurityEvent): void {
    const prefix = `[${event.severity.toUpperCase()}] AUDIT`
    const message = `${prefix}: ${event.type} from ${event.ip}`

    switch (event.severity) {
      case 'critical':
      case 'high':
        console.error(message, event.details)
        break
      case 'medium':
        console.warn(message, event.details)
        break
      default:
        console.log(message, event.details)
    }
  }

  private groupBy(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const value = item[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }
}

export const auditLogger = new AuditLogger()
export default auditLogger