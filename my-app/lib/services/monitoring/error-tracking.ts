import { connectToDatabase } from '@/lib/db/enhanced-mongodb'
import { ObjectId } from 'mongodb'

export interface ErrorReport {
  id?: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'critical'
  category: 'system' | 'api' | 'database' | 'external' | 'user' | 'security'
  message: string
  details?: any
  stack?: string
  userId?: string
  propertyId?: string
  userAgent?: string
  ip?: string
  url?: string
  method?: string
  statusCode?: number
  responseTime?: number
  resolved?: boolean
  resolvedBy?: string
  resolvedAt?: Date
  tags?: string[]
  context?: {
    [key: string]: any
  }
}

export interface SystemMetrics {
  timestamp: Date
  cpu: {
    usage: number
    load: number[]
  }
  memory: {
    used: number
    free: number
    total: number
    percentage: number
  }
  disk: {
    used: number
    free: number
    total: number
    percentage: number
  }
  database: {
    connections: number
    responseTime: number
    status: 'healthy' | 'degraded' | 'down'
  }
  api: {
    requestsPerMinute: number
    averageResponseTime: number
    errorRate: number
  }
  uptime: number
}

export interface AlertRule {
  id?: string
  name: string
  description: string
  condition: {
    metric: string
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte'
    threshold: number
    window: number // minutes
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  channels: ('email' | 'sms' | 'webhook')[]
  recipients: string[]
  cooldown: number // minutes
  lastTriggered?: Date
  triggerCount: number
}

export class ErrorTrackingService {
  private static instance: ErrorTrackingService
  private errorQueue: ErrorReport[] = []
  private metricsQueue: SystemMetrics[] = []
  private alertRules: AlertRule[] = []
  private isProcessing = false
  
  private constructor() {
    // Process queues every 30 seconds
    setInterval(() => this.processQueues(), 30000)
    // Collect system metrics every minute
    setInterval(() => this.collectSystemMetrics(), 60000)
    // Initialize default alert rules
    this.initializeDefaultAlertRules()
  }
  
  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService()
    }
    return ErrorTrackingService.instance
  }

  /**
   * Log an error or event
   */
  async logError(error: Omit<ErrorReport, 'id' | 'timestamp'>): Promise<void> {
    const errorReport: ErrorReport = {
      ...error,
      timestamp: new Date()
    }
    
    // Add to queue for batch processing
    this.errorQueue.push(errorReport)
    
    // If critical, process immediately
    if (error.level === 'critical') {
      await this.processErrorReport(errorReport)
      await this.checkAlerts(errorReport)
    }
    
    // Log to console for immediate visibility
    this.logToConsole(errorReport)
  }

  /**
   * Get error reports with filtering and pagination
   */
  async getErrorReports(filters: {
    level?: string[]
    category?: string[]
    resolved?: boolean
    startDate?: Date
    endDate?: Date
    userId?: string
    propertyId?: string
    page?: number
    limit?: number
  } = {}): Promise<{
    errors: ErrorReport[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
    summary: {
      total: number
      byLevel: { [key: string]: number }
      byCategory: { [key: string]: number }
      resolved: number
      unresolved: number
    }
  }> {
    try {
      await connectToDatabase()
      
      const { page = 1, limit = 50, ...filterOptions } = filters
      
      // Build MongoDB query
      const query: any = {}
      
      if (filterOptions.level && filterOptions.level.length > 0) {
        query.level = { $in: filterOptions.level }
      }
      
      if (filterOptions.category && filterOptions.category.length > 0) {
        query.category = { $in: filterOptions.category }
      }
      
      if (filterOptions.resolved !== undefined) {
        query.resolved = filterOptions.resolved
      }
      
      if (filterOptions.startDate || filterOptions.endDate) {
        query.timestamp = {}
        if (filterOptions.startDate) {
          query.timestamp.$gte = filterOptions.startDate
        }
        if (filterOptions.endDate) {
          query.timestamp.$lte = filterOptions.endDate
        }
      }
      
      if (filterOptions.userId) {
        query.userId = filterOptions.userId
      }
      
      if (filterOptions.propertyId) {
        query.propertyId = filterOptions.propertyId
      }

      const skip = (page - 1) * limit
      
      // This would use a dedicated ErrorReport collection in production
      // For now, we'll simulate the structure
      const mockErrors: ErrorReport[] = []
      
      // Generate some mock data for demonstration
      for (let i = 0; i < 10; i++) {
        mockErrors.push({
          id: new ObjectId().toString(),
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          level: ['info', 'warn', 'error', 'critical'][Math.floor(Math.random() * 4)] as any,
          category: ['system', 'api', 'database', 'external'][Math.floor(Math.random() * 4)] as any,
          message: `Sample error message ${i + 1}`,
          resolved: Math.random() > 0.7,
          tags: ['sample', 'mock']
        })
      }
      
      const total = mockErrors.length
      const errors = mockErrors.slice(skip, skip + limit)
      
      // Calculate summary
      const summary = {
        total,
        byLevel: this.groupBy(mockErrors, 'level'),
        byCategory: this.groupBy(mockErrors, 'category'),
        resolved: mockErrors.filter(e => e.resolved).length,
        unresolved: mockErrors.filter(e => !e.resolved).length
      }
      
      return {
        errors,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary
      }
    } catch (error) {
      console.error('Error fetching error reports:', error)
      throw error
    }
  }

  /**
   * Get system metrics and performance data
   */
  async getSystemMetrics(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    current: SystemMetrics
    historical: SystemMetrics[]
    alerts: {
      active: any[]
      recent: any[]
    }
    health: {
      overall: 'healthy' | 'degraded' | 'critical'
      components: {
        [component: string]: 'healthy' | 'degraded' | 'critical'
      }
    }
  }> {
    try {
      // Generate current metrics (in production, this would come from actual system monitoring)
      const current: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 100,
          load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
        },
        memory: {
          used: Math.random() * 8000,
          free: Math.random() * 4000,
          total: 16000,
          percentage: Math.random() * 80
        },
        disk: {
          used: Math.random() * 500,
          free: Math.random() * 500,
          total: 1000,
          percentage: Math.random() * 50
        },
        database: {
          connections: Math.floor(Math.random() * 50) + 5,
          responseTime: Math.random() * 100 + 10,
          status: 'healthy'
        },
        api: {
          requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
          averageResponseTime: Math.random() * 500 + 50,
          errorRate: Math.random() * 5
        },
        uptime: Date.now() - (Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
      
      // Generate historical data
      const historical: SystemMetrics[] = []
      const points = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30
      
      for (let i = 0; i < points; i++) {
        const timestamp = new Date(Date.now() - i * this.getTimeInterval(timeframe))
        historical.unshift({
          ...current,
          timestamp,
          cpu: { ...current.cpu, usage: Math.random() * 100 },
          memory: { ...current.memory, percentage: Math.random() * 80 }
        })
      }
      
      // Determine health status
      const health = this.calculateHealthStatus(current)
      
      return {
        current,
        historical,
        alerts: {
          active: [],
          recent: []
        },
        health
      }
    } catch (error) {
      console.error('Error getting system metrics:', error)
      throw error
    }
  }

  /**
   * Resolve an error report
   */
  async resolveError(errorId: string, resolvedBy: string, resolution?: string): Promise<boolean> {
    try {
      // In production, this would update the database
      console.log(`Error ${errorId} resolved by ${resolvedBy}`)
      return true
    } catch (error) {
      console.error('Error resolving error report:', error)
      return false
    }
  }

  /**
   * Add or update alert rule
   */
  async updateAlertRule(rule: AlertRule): Promise<boolean> {
    try {
      const existingIndex = this.alertRules.findIndex(r => r.id === rule.id)
      
      if (existingIndex >= 0) {
        this.alertRules[existingIndex] = rule
      } else {
        rule.id = new ObjectId().toString()
        this.alertRules.push(rule)
      }
      
      return true
    } catch (error) {
      console.error('Error updating alert rule:', error)
      return false
    }
  }

  /**
   * Get alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    return this.alertRules
  }

  // Private methods

  private async processQueues(): Promise<void> {
    if (this.isProcessing || (this.errorQueue.length === 0 && this.metricsQueue.length === 0)) {
      return
    }
    
    this.isProcessing = true
    
    try {
      // Process error reports
      if (this.errorQueue.length > 0) {
        const errors = this.errorQueue.splice(0)
        await this.batchProcessErrors(errors)
      }
      
      // Process metrics
      if (this.metricsQueue.length > 0) {
        const metrics = this.metricsQueue.splice(0)
        await this.batchProcessMetrics(metrics)
      }
    } catch (error) {
      console.error('Error processing queues:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private async processErrorReport(error: ErrorReport): Promise<void> {
    try {
      // In production, save to database
      console.log('Processing error report:', error.message)
    } catch (err) {
      console.error('Error processing error report:', err)
    }
  }

  private async batchProcessErrors(errors: ErrorReport[]): Promise<void> {
    try {
      // In production, batch insert to database
      console.log(`Processing ${errors.length} error reports`)
      
      for (const error of errors) {
        if (error.level === 'critical' || error.level === 'error') {
          await this.checkAlerts(error)
        }
      }
    } catch (error) {
      console.error('Error batch processing errors:', error)
    }
  }

  private async batchProcessMetrics(metrics: SystemMetrics[]): Promise<void> {
    try {
      // In production, batch insert to database
      console.log(`Processing ${metrics.length} metrics reports`)
    } catch (error) {
      console.error('Error batch processing metrics:', error)
    }
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // In production, collect actual system metrics
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu: {
          usage: Math.random() * 100,
          load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
        },
        memory: {
          used: Math.random() * 8000,
          free: Math.random() * 4000,
          total: 16000,
          percentage: Math.random() * 80
        },
        disk: {
          used: Math.random() * 500,
          free: Math.random() * 500,
          total: 1000,
          percentage: Math.random() * 50
        },
        database: {
          connections: Math.floor(Math.random() * 50) + 5,
          responseTime: Math.random() * 100 + 10,
          status: 'healthy'
        },
        api: {
          requestsPerMinute: Math.floor(Math.random() * 1000) + 100,
          averageResponseTime: Math.random() * 500 + 50,
          errorRate: Math.random() * 5
        },
        uptime: Date.now()
      }
      
      this.metricsQueue.push(metrics)
    } catch (error) {
      console.error('Error collecting system metrics:', error)
    }
  }

  private async checkAlerts(errorOrMetric: ErrorReport | SystemMetrics): Promise<void> {
    try {
      for (const rule of this.alertRules) {
        if (!rule.enabled) continue
        
        const shouldTrigger = this.evaluateAlertCondition(rule, errorOrMetric)
        
        if (shouldTrigger && this.canTriggerAlert(rule)) {
          await this.triggerAlert(rule, errorOrMetric)
        }
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }
  }

  private evaluateAlertCondition(rule: AlertRule, data: ErrorReport | SystemMetrics): boolean {
    // Simplified alert evaluation
    // In production, this would be more sophisticated
    return Math.random() > 0.95 // Trigger 5% of the time for demo
  }

  private canTriggerAlert(rule: AlertRule): boolean {
    if (!rule.lastTriggered) return true
    
    const cooldownMs = rule.cooldown * 60 * 1000
    return Date.now() - rule.lastTriggered.getTime() > cooldownMs
  }

  private async triggerAlert(rule: AlertRule, data: ErrorReport | SystemMetrics): Promise<void> {
    try {
      console.log(`🚨 ALERT: ${rule.name}`)
      
      rule.lastTriggered = new Date()
      rule.triggerCount++
      
      // In production, send notifications via configured channels
      for (const channel of rule.channels) {
        await this.sendNotification(channel, rule, data)
      }
    } catch (error) {
      console.error('Error triggering alert:', error)
    }
  }

  private async sendNotification(channel: string, rule: AlertRule, data: any): Promise<void> {
    // In production, implement actual notification sending
    console.log(`Sending ${channel} notification for alert: ${rule.name}`)
  }

  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: new ObjectId().toString(),
        name: 'High Error Rate',
        description: 'API error rate exceeds 10%',
        condition: {
          metric: 'api.errorRate',
          operator: 'gt',
          threshold: 10,
          window: 5
        },
        severity: 'high',
        enabled: true,
        channels: ['email'],
        recipients: ['admin@example.com'],
        cooldown: 30,
        triggerCount: 0
      },
      {
        id: new ObjectId().toString(),
        name: 'Database Connection Issues',
        description: 'Database response time exceeds 1000ms',
        condition: {
          metric: 'database.responseTime',
          operator: 'gt',
          threshold: 1000,
          window: 5
        },
        severity: 'critical',
        enabled: true,
        channels: ['email', 'sms'],
        recipients: ['admin@example.com'],
        cooldown: 15,
        triggerCount: 0
      }
    ]
  }

  private logToConsole(error: ErrorReport): void {
    const prefix = `[${error.level.toUpperCase()}] ${error.category}`
    const message = `${prefix}: ${error.message}`
    
    switch (error.level) {
      case 'critical':
      case 'error':
        console.error(message, error.details)
        break
      case 'warn':
        console.warn(message, error.details)
        break
      default:
        console.log(message, error.details)
    }
  }

  private groupBy(items: any[], key: string): { [key: string]: number } {
    return items.reduce((acc, item) => {
      const value = item[key]
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {})
  }

  private getTimeInterval(timeframe: string): number {
    switch (timeframe) {
      case '1h':
        return 60 * 1000 // 1 minute
      case '24h':
        return 60 * 60 * 1000 // 1 hour
      case '7d':
        return 24 * 60 * 60 * 1000 // 1 day
      case '30d':
        return 24 * 60 * 60 * 1000 // 1 day
      default:
        return 60 * 60 * 1000
    }
  }

  private calculateHealthStatus(metrics: SystemMetrics): {
    overall: 'healthy' | 'degraded' | 'critical'
    components: { [component: string]: 'healthy' | 'degraded' | 'critical' }
  } {
    const components = {
      cpu: metrics.cpu.usage < 80 ? 'healthy' : metrics.cpu.usage < 95 ? 'degraded' : 'critical' as const,
      memory: metrics.memory.percentage < 80 ? 'healthy' : metrics.memory.percentage < 95 ? 'degraded' : 'critical' as const,
      disk: metrics.disk.percentage < 80 ? 'healthy' : metrics.disk.percentage < 95 ? 'degraded' : 'critical' as const,
      database: metrics.database.status,
      api: metrics.api.errorRate < 5 ? 'healthy' : metrics.api.errorRate < 10 ? 'degraded' : 'critical' as const
    }
    
    const componentStatuses = Object.values(components)
    const overall = componentStatuses.includes('critical') ? 'critical' :
                   componentStatuses.includes('degraded') ? 'degraded' : 'healthy'
    
    return { overall, components }
  }
}

// Export singleton instance
export const errorTracker = ErrorTrackingService.getInstance()
export default errorTracker