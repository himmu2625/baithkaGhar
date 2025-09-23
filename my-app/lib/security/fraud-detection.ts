import { auditLogger } from './audit-logger'
import { encryptionService } from './encryption'

export interface PaymentTransaction {
  id: string
  userId: string
  bookingId: string
  amount: number
  currency: string
  paymentMethod: string
  cardLast4?: string
  expiryMonth?: number
  expiryYear?: number
  billingCountry?: string
  billingZip?: string
  ip: string
  userAgent: string
  timestamp: Date
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  gatewayResponse?: any
}

export interface FraudRiskFactors {
  velocityRisk: number
  locationRisk: number
  deviceRisk: number
  behavioralRisk: number
  paymentMethodRisk: number
  amountRisk: number
  timeRisk: number
  blacklistRisk: number
}

export interface FraudAssessment {
  transactionId: string
  riskScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  decision: 'approve' | 'review' | 'decline' | 'challenge'
  factors: FraudRiskFactors
  rules: Array<{
    rule: string
    triggered: boolean
    weight: number
    description: string
  }>
  recommendations: string[]
  requiresManualReview: boolean
  challengeType?: 'sms' | 'email' | '3ds' | 'captcha'
}

export interface UserBehaviorProfile {
  userId: string
  averageTransactionAmount: number
  typicalPaymentMethods: string[]
  usualCountries: string[]
  usualTimeZones: string[]
  transactionFrequency: number
  riskHistory: Array<{
    date: Date
    riskScore: number
    outcome: 'approved' | 'declined' | 'fraud_confirmed'
  }>
  deviceFingerprints: string[]
  lastActivity: Date
}

class FraudDetectionService {
  private readonly riskThresholds = {
    low: 30,
    medium: 60,
    high: 80,
    critical: 95
  }

  private readonly fraudRules = {
    highVelocity: { weight: 25, threshold: 5 }, // 5+ transactions in 10 minutes
    foreignCard: { weight: 15, threshold: 1 },
    unusualAmount: { weight: 20, threshold: 3 }, // 3x typical amount
    newDevice: { weight: 10, threshold: 1 },
    vpnDetected: { weight: 15, threshold: 1 },
    blacklistedCard: { weight: 100, threshold: 1 },
    unusualTime: { weight: 10, threshold: 1 }, // Outside normal hours
    repeatedDeclines: { weight: 30, threshold: 3 }
  }

  private userProfiles: Map<string, UserBehaviorProfile> = new Map()
  private blacklistedCards: Set<string> = new Set()
  private blacklistedIPs: Set<string> = new Set()
  private suspiciousDevices: Set<string> = new Set()

  constructor() {
    // Load blacklists and user profiles on startup
    this.initializeBlacklists()
    this.loadUserProfiles()
  }

  /**
   * Assess fraud risk for a payment transaction
   */
  async assessTransaction(transaction: PaymentTransaction): Promise<FraudAssessment> {
    try {
      await auditLogger.logSecurityEvent({
        type: 'fraud_assessment_started',
        severity: 'medium',
        ip: transaction.ip,
        userAgent: transaction.userAgent,
        userId: transaction.userId,
        details: {
          transactionId: transaction.id,
          amount: transaction.amount,
          currency: transaction.currency
        }
      })

      // Calculate individual risk factors
      const factors = await this.calculateRiskFactors(transaction)

      // Apply fraud rules
      const ruleResults = await this.applyFraudRules(transaction, factors)

      // Calculate overall risk score
      const riskScore = this.calculateOverallRiskScore(factors, ruleResults)

      // Determine risk level and decision
      const riskLevel = this.determineRiskLevel(riskScore)
      const decision = this.makeDecision(riskScore, ruleResults)

      // Generate recommendations
      const recommendations = this.generateRecommendations(factors, ruleResults, decision)

      // Determine if manual review is required
      const requiresManualReview = this.requiresManualReview(riskScore, ruleResults)

      // Determine challenge type if needed
      const challengeType = decision === 'challenge' ? this.selectChallengeType(factors) : undefined

      const assessment: FraudAssessment = {
        transactionId: transaction.id,
        riskScore,
        riskLevel,
        decision,
        factors,
        rules: ruleResults,
        recommendations,
        requiresManualReview,
        challengeType
      }

      // Log assessment
      await auditLogger.logSecurityEvent({
        type: 'fraud_assessment_completed',
        severity: riskLevel === 'critical' ? 'critical' : 'medium',
        ip: transaction.ip,
        userAgent: transaction.userAgent,
        userId: transaction.userId,
        details: {
          transactionId: transaction.id,
          riskScore,
          riskLevel,
          decision,
          requiresManualReview
        }
      })

      // Update user behavior profile
      await this.updateUserProfile(transaction, assessment)

      return assessment

    } catch (error) {
      console.error('Fraud assessment error:', error)

      // Return safe default on error
      return {
        transactionId: transaction.id,
        riskScore: 100,
        riskLevel: 'critical',
        decision: 'decline',
        factors: {} as FraudRiskFactors,
        rules: [],
        recommendations: ['System error during fraud assessment - manual review required'],
        requiresManualReview: true
      }
    }
  }

  /**
   * Report confirmed fraud for learning
   */
  async reportFraud(transactionId: string, fraudType: 'chargeback' | 'stolen_card' | 'synthetic_identity' | 'account_takeover'): Promise<void> {
    try {
      await auditLogger.logSecurityEvent({
        type: 'fraud_confirmed',
        severity: 'critical',
        ip: 'system',
        userAgent: 'fraud-detection',
        details: {
          transactionId,
          fraudType,
          reportedAt: new Date()
        }
      })

      // Add to blacklists based on fraud type
      await this.updateBlacklistsFromFraud(transactionId, fraudType)

      // Update ML models (placeholder for ML integration)
      await this.updateFraudModels(transactionId, fraudType)

    } catch (error) {
      console.error('Error reporting fraud:', error)
    }
  }

  /**
   * Calculate individual risk factors
   */
  private async calculateRiskFactors(transaction: PaymentTransaction): Promise<FraudRiskFactors> {
    const velocityRisk = await this.calculateVelocityRisk(transaction)
    const locationRisk = await this.calculateLocationRisk(transaction)
    const deviceRisk = await this.calculateDeviceRisk(transaction)
    const behavioralRisk = await this.calculateBehavioralRisk(transaction)
    const paymentMethodRisk = await this.calculatePaymentMethodRisk(transaction)
    const amountRisk = await this.calculateAmountRisk(transaction)
    const timeRisk = await this.calculateTimeRisk(transaction)
    const blacklistRisk = await this.calculateBlacklistRisk(transaction)

    return {
      velocityRisk,
      locationRisk,
      deviceRisk,
      behavioralRisk,
      paymentMethodRisk,
      amountRisk,
      timeRisk,
      blacklistRisk
    }
  }

  private async calculateVelocityRisk(transaction: PaymentTransaction): Promise<number> {
    // Check transaction velocity for user and IP
    const recentTransactions = await this.getRecentTransactions(transaction.userId, 10 * 60 * 1000) // 10 minutes
    const ipTransactions = await this.getRecentIPTransactions(transaction.ip, 10 * 60 * 1000)

    let risk = 0

    // User velocity
    if (recentTransactions.length >= 5) risk += 40
    else if (recentTransactions.length >= 3) risk += 20
    else if (recentTransactions.length >= 2) risk += 10

    // IP velocity
    if (ipTransactions.length >= 10) risk += 30
    else if (ipTransactions.length >= 5) risk += 15

    // Amount velocity
    const totalAmount = recentTransactions.reduce((sum, t) => sum + t.amount, 0)
    if (totalAmount > 10000) risk += 30
    else if (totalAmount > 5000) risk += 15

    return Math.min(risk, 100)
  }

  private async calculateLocationRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    // Get user's typical locations
    const userProfile = this.userProfiles.get(transaction.userId)

    if (userProfile) {
      // Check if transaction is from unusual country
      const geoData = await this.getGeoLocation(transaction.ip)

      if (geoData && !userProfile.usualCountries.includes(geoData.country)) {
        risk += 25
      }

      // VPN/Proxy detection
      if (await this.isVPNOrProxy(transaction.ip)) {
        risk += 30
      }
    } else {
      // New user - moderate risk
      risk += 15
    }

    // High-risk countries (placeholder - would use actual risk data)
    const highRiskCountries = ['XX', 'YY'] // ISO codes
    const geoData = await this.getGeoLocation(transaction.ip)
    if (geoData && highRiskCountries.includes(geoData.country)) {
      risk += 40
    }

    return Math.min(risk, 100)
  }

  private async calculateDeviceRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    const deviceFingerprint = this.generateDeviceFingerprint(transaction)
    const userProfile = this.userProfiles.get(transaction.userId)

    if (userProfile) {
      // Check if device is new for this user
      if (!userProfile.deviceFingerprints.includes(deviceFingerprint)) {
        risk += 20
      }
    } else {
      // New user with new device
      risk += 10
    }

    // Check if device is flagged as suspicious
    if (this.suspiciousDevices.has(deviceFingerprint)) {
      risk += 50
    }

    // Browser/user agent analysis
    if (this.isSuspiciousUserAgent(transaction.userAgent)) {
      risk += 25
    }

    return Math.min(risk, 100)
  }

  private async calculateBehavioralRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    const userProfile = this.userProfiles.get(transaction.userId)

    if (!userProfile) {
      return 20 // New user - moderate risk
    }

    // Check against typical payment methods
    if (!userProfile.typicalPaymentMethods.includes(transaction.paymentMethod)) {
      risk += 15
    }

    // Check transaction timing patterns
    const hourOfDay = transaction.timestamp.getHours()
    const dayOfWeek = transaction.timestamp.getDay()

    // Unusual time patterns (placeholder - would analyze historical data)
    if (hourOfDay < 6 || hourOfDay > 23) {
      risk += 10
    }

    // Check recent risk history
    const recentHighRiskTransactions = userProfile.riskHistory
      .filter(h => h.date > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .filter(h => h.riskScore > 70)

    if (recentHighRiskTransactions.length > 0) {
      risk += 20
    }

    return Math.min(risk, 100)
  }

  private async calculatePaymentMethodRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    // Check if card is blacklisted
    if (transaction.cardLast4 && this.blacklistedCards.has(transaction.cardLast4)) {
      return 100
    }

    // BIN (Bank Identification Number) analysis
    if (transaction.paymentMethod.startsWith('4') || transaction.paymentMethod.startsWith('5')) {
      // Visa/Mastercard - generally lower risk
      risk += 5
    } else {
      // Other cards - slightly higher risk
      risk += 10
    }

    // Card country vs billing country mismatch
    if (transaction.billingCountry) {
      const cardCountry = await this.getCardCountry(transaction.paymentMethod)
      if (cardCountry && cardCountry !== transaction.billingCountry) {
        risk += 25
      }
    }

    return Math.min(risk, 100)
  }

  private async calculateAmountRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    const userProfile = this.userProfiles.get(transaction.userId)

    if (userProfile) {
      // Check against user's typical transaction amounts
      const amountRatio = transaction.amount / userProfile.averageTransactionAmount

      if (amountRatio > 5) risk += 40
      else if (amountRatio > 3) risk += 25
      else if (amountRatio > 2) risk += 15
    }

    // Absolute amount thresholds
    if (transaction.amount > 10000) risk += 30
    else if (transaction.amount > 5000) risk += 20
    else if (transaction.amount > 2000) risk += 10

    // Round number amounts (often fraudulent)
    if (transaction.amount % 100 === 0 && transaction.amount > 500) {
      risk += 10
    }

    return Math.min(risk, 100)
  }

  private async calculateTimeRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    const hour = transaction.timestamp.getHours()
    const dayOfWeek = transaction.timestamp.getDay()

    // High-risk time periods
    if (hour >= 2 && hour <= 6) {
      risk += 20 // Late night/early morning
    }

    // Weekend activity patterns
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      risk += 5
    }

    // Check for rapid successive transactions
    const recentTransactions = await this.getRecentTransactions(transaction.userId, 60 * 1000) // 1 minute
    if (recentTransactions.length > 0) {
      risk += 30
    }

    return Math.min(risk, 100)
  }

  private async calculateBlacklistRisk(transaction: PaymentTransaction): Promise<number> {
    let risk = 0

    // Check IP blacklist
    if (this.blacklistedIPs.has(transaction.ip)) {
      risk += 100
    }

    // Check card blacklist
    if (transaction.cardLast4 && this.blacklistedCards.has(transaction.cardLast4)) {
      risk += 100
    }

    // Check device blacklist
    const deviceFingerprint = this.generateDeviceFingerprint(transaction)
    if (this.suspiciousDevices.has(deviceFingerprint)) {
      risk += 80
    }

    return Math.min(risk, 100)
  }

  private async applyFraudRules(transaction: PaymentTransaction, factors: FraudRiskFactors): Promise<Array<{
    rule: string
    triggered: boolean
    weight: number
    description: string
  }>> {
    const rules = []

    // High velocity rule
    rules.push({
      rule: 'high_velocity',
      triggered: factors.velocityRisk >= this.fraudRules.highVelocity.threshold * 20,
      weight: this.fraudRules.highVelocity.weight,
      description: 'Multiple transactions in short time period'
    })

    // Foreign card rule
    rules.push({
      rule: 'foreign_card',
      triggered: factors.locationRisk >= this.fraudRules.foreignCard.threshold * 25,
      weight: this.fraudRules.foreignCard.weight,
      description: 'Transaction from unusual location'
    })

    // Unusual amount rule
    rules.push({
      rule: 'unusual_amount',
      triggered: factors.amountRisk >= this.fraudRules.unusualAmount.threshold * 15,
      weight: this.fraudRules.unusualAmount.weight,
      description: 'Transaction amount significantly higher than normal'
    })

    // Blacklist rule
    rules.push({
      rule: 'blacklisted',
      triggered: factors.blacklistRisk >= this.fraudRules.blacklistedCard.threshold * 80,
      weight: this.fraudRules.blacklistedCard.weight,
      description: 'Card, IP, or device is blacklisted'
    })

    return rules
  }

  private calculateOverallRiskScore(factors: FraudRiskFactors, rules: any[]): number {
    // Weighted average of risk factors
    const factorScore = (
      factors.velocityRisk * 0.25 +
      factors.locationRisk * 0.15 +
      factors.deviceRisk * 0.15 +
      factors.behavioralRisk * 0.15 +
      factors.paymentMethodRisk * 0.10 +
      factors.amountRisk * 0.10 +
      factors.timeRisk * 0.05 +
      factors.blacklistRisk * 0.30
    )

    // Add triggered rule weights
    const ruleScore = rules
      .filter(r => r.triggered)
      .reduce((sum, r) => sum + r.weight, 0)

    const totalScore = Math.min(factorScore + (ruleScore * 0.5), 100)

    return Math.round(totalScore)
  }

  private determineRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.riskThresholds.critical) return 'critical'
    if (riskScore >= this.riskThresholds.high) return 'high'
    if (riskScore >= this.riskThresholds.medium) return 'medium'
    return 'low'
  }

  private makeDecision(riskScore: number, rules: any[]): 'approve' | 'review' | 'decline' | 'challenge' {
    // Auto-decline for critical risk or blacklisted items
    if (riskScore >= this.riskThresholds.critical) return 'decline'

    // Check for specific high-risk rules
    const blacklistRule = rules.find(r => r.rule === 'blacklisted' && r.triggered)
    if (blacklistRule) return 'decline'

    // Challenge for high risk
    if (riskScore >= this.riskThresholds.high) return 'challenge'

    // Review for medium risk
    if (riskScore >= this.riskThresholds.medium) return 'review'

    // Approve for low risk
    return 'approve'
  }

  private generateRecommendations(factors: FraudRiskFactors, rules: any[], decision: string): string[] {
    const recommendations = []

    if (decision === 'decline') {
      recommendations.push('Transaction declined due to high fraud risk')
    }

    if (factors.velocityRisk > 50) {
      recommendations.push('Monitor user for velocity abuse')
    }

    if (factors.locationRisk > 50) {
      recommendations.push('Verify transaction with cardholder')
    }

    if (factors.blacklistRisk > 0) {
      recommendations.push('Review blacklist status')
    }

    if (decision === 'challenge') {
      recommendations.push('Additional authentication required')
    }

    return recommendations
  }

  private requiresManualReview(riskScore: number, rules: any[]): boolean {
    return riskScore >= this.riskThresholds.medium ||
           rules.some(r => r.triggered && r.weight >= 25)
  }

  private selectChallengeType(factors: FraudRiskFactors): 'sms' | 'email' | '3ds' | 'captcha' {
    if (factors.deviceRisk > 50) return '3ds'
    if (factors.velocityRisk > 50) return 'sms'
    if (factors.locationRisk > 50) return 'email'
    return 'captcha'
  }

  // Helper methods (mock implementations)

  private async getRecentTransactions(userId: string, timeWindow: number): Promise<PaymentTransaction[]> {
    // Mock implementation - would query actual transaction database
    return []
  }

  private async getRecentIPTransactions(ip: string, timeWindow: number): Promise<PaymentTransaction[]> {
    // Mock implementation
    return []
  }

  private async getGeoLocation(ip: string): Promise<{ country: string, region: string } | null> {
    // Mock implementation - would use GeoIP service
    return { country: 'US', region: 'CA' }
  }

  private async isVPNOrProxy(ip: string): Promise<boolean> {
    // Mock implementation - would use VPN detection service
    return Math.random() > 0.9
  }

  private generateDeviceFingerprint(transaction: PaymentTransaction): string {
    // Simple fingerprint based on user agent and IP
    return encryptionService.hash(`${transaction.userAgent}:${transaction.ip}`)
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = ['bot', 'crawler', 'scraper', 'automation']
    return suspiciousPatterns.some(pattern =>
      userAgent.toLowerCase().includes(pattern)
    )
  }

  private async getCardCountry(paymentMethod: string): Promise<string | null> {
    // Mock implementation - would use BIN database
    return 'US'
  }

  private async updateUserProfile(transaction: PaymentTransaction, assessment: FraudAssessment): Promise<void> {
    // Update user behavior profile based on transaction
    let profile = this.userProfiles.get(transaction.userId)

    if (!profile) {
      profile = {
        userId: transaction.userId,
        averageTransactionAmount: transaction.amount,
        typicalPaymentMethods: [transaction.paymentMethod],
        usualCountries: [],
        usualTimeZones: [],
        transactionFrequency: 1,
        riskHistory: [],
        deviceFingerprints: [],
        lastActivity: transaction.timestamp
      }
    }

    // Update profile
    profile.lastActivity = transaction.timestamp
    profile.riskHistory.push({
      date: transaction.timestamp,
      riskScore: assessment.riskScore,
      outcome: assessment.decision === 'approve' ? 'approved' : 'declined'
    })

    // Keep only recent history
    profile.riskHistory = profile.riskHistory.slice(-50)

    this.userProfiles.set(transaction.userId, profile)
  }

  private async initializeBlacklists(): Promise<void> {
    // Load blacklists from database or external sources
    // Mock implementation
  }

  private async loadUserProfiles(): Promise<void> {
    // Load user behavior profiles from database
    // Mock implementation
  }

  private async updateBlacklistsFromFraud(transactionId: string, fraudType: string): Promise<void> {
    // Update blacklists based on confirmed fraud
    // Mock implementation
  }

  private async updateFraudModels(transactionId: string, fraudType: string): Promise<void> {
    // Update ML models with fraud feedback
    // Mock implementation
  }
}

export const fraudDetectionService = new FraudDetectionService()

// Convenience functions
export const assessFraud = (transaction: PaymentTransaction) =>
  fraudDetectionService.assessTransaction(transaction)

export const reportFraud = (transactionId: string, fraudType: any) =>
  fraudDetectionService.reportFraud(transactionId, fraudType)