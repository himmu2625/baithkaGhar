import { connectToDatabase } from '@/lib/mongodb'

export interface LoyaltyMember {
  id: string
  userId: string
  email: string
  name: string
  phone?: string
  joinedDate: Date
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  status: 'active' | 'inactive' | 'suspended'

  // Points and rewards
  totalPoints: number
  availablePoints: number
  lifetimePoints: number
  tierProgress: {
    currentTierThreshold: number
    nextTierThreshold: number
    progressPercentage: number
  }

  // Stay statistics
  totalStays: number
  totalNights: number
  totalSpent: number
  averageSpending: number
  lastStayDate?: Date
  favoriteProperties: string[]

  // Preferences
  preferences: {
    roomType?: string
    bedPreference?: string
    floorPreference?: 'low' | 'middle' | 'high'
    smokingPreference?: 'smoking' | 'non-smoking'
    amenities?: string[]
    dietaryRestrictions?: string[]
    specialRequests?: string[]
  }

  // Communication preferences
  communicationPreferences: {
    email: boolean
    sms: boolean
    whatsapp: boolean
    phone: boolean
    promotionalEmails: boolean
    birthdayOffers: boolean
    anniversaryOffers: boolean
  }

  // Personal information
  personalInfo: {
    dateOfBirth?: Date
    anniversary?: Date
    nationality?: string
    language: string
    profession?: string
    company?: string
  }

  // Redemption history
  redemptionHistory: Array<{
    id: string
    rewardId: string
    rewardName: string
    pointsUsed: number
    redeemedAt: Date
    usedAt?: Date
    expiresAt?: Date
    status: 'active' | 'used' | 'expired' | 'cancelled'
  }>

  // Earned rewards
  earnedRewards: Array<{
    id: string
    rewardId: string
    rewardName: string
    earnedAt: Date
    expiresAt?: Date
    usedAt?: Date
    status: 'available' | 'used' | 'expired'
  }>
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  type: 'discount' | 'upgrade' | 'free_night' | 'amenity' | 'service' | 'experience'
  category: 'room' | 'dining' | 'spa' | 'transport' | 'experience' | 'merchandise'

  // Redemption details
  pointsRequired: number
  cashValue?: number
  discountPercentage?: number

  // Availability
  isActive: boolean
  validFrom: Date
  validTo?: Date
  expiryDays?: number

  // Usage restrictions
  restrictions: {
    minimumTier?: string
    maximumUsesPerYear?: number
    blackoutDates?: Date[]
    applicableProperties?: string[]
    minimumSpend?: number
    minimumNights?: number
  }

  // Terms and conditions
  termsAndConditions: string[]
  redemptionInstructions: string
}

export interface PointsTransaction {
  id: string
  memberId: string
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted' | 'bonus'
  points: number
  description: string

  // Related booking/activity
  bookingId?: string
  rewardId?: string
  referenceId?: string

  // Transaction details
  transactionDate: Date
  expiryDate?: Date

  // Metadata
  source: 'booking' | 'review' | 'referral' | 'promotion' | 'adjustment' | 'bonus'
  multiplier?: number
  basePoints?: number
}

export interface LoyaltyAnalytics {
  totalMembers: number
  activeMembers: number
  tierDistribution: {
    bronze: number
    silver: number
    gold: number
    platinum: number
    diamond: number
  }
  averagePointsPerMember: number
  totalPointsIssued: number
  totalPointsRedeemed: number
  redemptionRate: number
  topRewards: Array<{
    reward: string
    redemptions: number
  }>
  membershipGrowth: Array<{
    month: string
    newMembers: number
    totalMembers: number
  }>
}

export class GuestLoyaltyService {
  // Tier thresholds (points required)
  private static readonly TIER_THRESHOLDS = {
    bronze: 0,
    silver: 2500,
    gold: 7500,
    platinum: 15000,
    diamond: 30000
  }

  // Points earning rules
  private static readonly POINTS_RULES = {
    basePointsPerRupee: 1, // 1 point per ₹1 spent
    bonusPointsPerNight: 100,
    reviewPoints: 250,
    referralPoints: 1000,
    birthdayBonus: 500,
    anniversaryBonus: 1000
  }

  static async createOrUpdateMember(userId: string, bookingData?: any): Promise<LoyaltyMember> {
    try {
      await connectToDatabase()

      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_members')

      // Check if member already exists
      let member = await collection.findOne({ userId }) as LoyaltyMember | null

      if (!member) {
        // Create new member
        const User = (await import('@/models/User')).default
        const user = await User.findById(userId)

        if (!user) throw new Error('User not found')

        const memberId = `LM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

        member = {
          id: memberId,
          userId,
          email: user.email,
          name: user.name,
          phone: user.phone,
          joinedDate: new Date(),
          tier: 'bronze',
          status: 'active',
          totalPoints: 0,
          availablePoints: 0,
          lifetimePoints: 0,
          tierProgress: this.calculateTierProgress(0),
          totalStays: 0,
          totalNights: 0,
          totalSpent: 0,
          averageSpending: 0,
          favoriteProperties: [],
          preferences: {},
          communicationPreferences: {
            email: true,
            sms: true,
            whatsapp: false,
            phone: false,
            promotionalEmails: true,
            birthdayOffers: true,
            anniversaryOffers: true
          },
          personalInfo: {
            language: 'en'
          },
          redemptionHistory: [],
          earnedRewards: []
        }

        await collection.insertOne(member)

        // Send welcome email
        await this.sendWelcomeEmail(member)
      }

      await client.close()
      return member

    } catch (error) {
      console.error('Error creating/updating loyalty member:', error)
      throw error
    }
  }

  static async addPointsFromBooking(bookingId: string): Promise<void> {
    try {
      await connectToDatabase()

      const Booking = (await import('@/models/Booking')).default
      const booking = await Booking.findById(bookingId).populate('userId')

      if (!booking) throw new Error('Booking not found')

      const member = await this.createOrUpdateMember(booking.userId._id.toString())

      // Calculate points
      const basePoints = Math.floor(booking.totalAmount * this.POINTS_RULES.basePointsPerRupee)
      const nightsBonus = booking.nights * this.POINTS_RULES.bonusPointsPerNight
      const totalPoints = basePoints + nightsBonus

      // Add tier multiplier
      const tierMultiplier = this.getTierMultiplier(member.tier)
      const finalPoints = Math.floor(totalPoints * tierMultiplier)

      // Record transaction
      await this.addPointsTransaction({
        memberId: member.id,
        type: 'earned',
        points: finalPoints,
        description: `Points earned from booking ${bookingId}`,
        bookingId,
        source: 'booking',
        multiplier: tierMultiplier,
        basePoints: totalPoints
      })

      // Update member statistics
      await this.updateMemberStats(member.id, {
        totalStays: member.totalStays + 1,
        totalNights: member.totalNights + booking.nights,
        totalSpent: member.totalSpent + booking.totalAmount,
        lastStayDate: booking.checkOut,
        propertyId: booking.propertyId.toString()
      })

    } catch (error) {
      console.error('Error adding points from booking:', error)
    }
  }

  static async addPointsTransaction(transaction: Omit<PointsTransaction, 'id' | 'transactionDate'>): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const transactionsCollection = db.collection('loyalty_transactions')
      const membersCollection = db.collection('loyalty_members')

      const transactionId = `PT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      const fullTransaction: PointsTransaction = {
        ...transaction,
        id: transactionId,
        transactionDate: new Date(),
        expiryDate: transaction.type === 'earned'
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
          : undefined
      }

      await transactionsCollection.insertOne(fullTransaction)

      // Update member points
      const member = await membersCollection.findOne({ id: transaction.memberId }) as LoyaltyMember

      if (member) {
        const pointsChange = transaction.type === 'redeemed' ? -transaction.points : transaction.points
        const newAvailablePoints = member.availablePoints + pointsChange
        const newTotalPoints = member.totalPoints + (transaction.type !== 'redeemed' ? transaction.points : 0)
        const newLifetimePoints = member.lifetimePoints + (transaction.type === 'earned' ? transaction.points : 0)

        const newTier = this.calculateTier(newTotalPoints)
        const tierProgress = this.calculateTierProgress(newTotalPoints)

        await membersCollection.updateOne(
          { id: transaction.memberId },
          {
            $set: {
              availablePoints: Math.max(0, newAvailablePoints),
              totalPoints: newTotalPoints,
              lifetimePoints: newLifetimePoints,
              tier: newTier,
              tierProgress
            }
          }
        )

        // Check for tier upgrade
        if (newTier !== member.tier) {
          await this.handleTierUpgrade(member.id, member.tier, newTier)
        }
      }

      await client.close()

    } catch (error) {
      console.error('Error adding points transaction:', error)
    }
  }

  static async redeemReward(memberId: string, rewardId: string): Promise<{ success: boolean; error?: string; redemptionId?: string }> {
    try {
      const member = await this.getMember(memberId)
      const reward = await this.getReward(rewardId)

      if (!member) return { success: false, error: 'Member not found' }
      if (!reward) return { success: false, error: 'Reward not found' }

      // Check if member has enough points
      if (member.availablePoints < reward.pointsRequired) {
        return { success: false, error: 'Insufficient points' }
      }

      // Check tier restrictions
      if (reward.restrictions.minimumTier) {
        const requiredTierLevel = this.getTierLevel(reward.restrictions.minimumTier as any)
        const memberTierLevel = this.getTierLevel(member.tier)
        if (memberTierLevel < requiredTierLevel) {
          return { success: false, error: 'Tier requirement not met' }
        }
      }

      // Check usage limits
      if (reward.restrictions.maximumUsesPerYear) {
        const currentYear = new Date().getFullYear()
        const usesThisYear = member.redemptionHistory.filter(r =>
          r.rewardId === rewardId && r.redeemedAt.getFullYear() === currentYear
        ).length

        if (usesThisYear >= reward.restrictions.maximumUsesPerYear) {
          return { success: false, error: 'Annual usage limit exceeded' }
        }
      }

      const redemptionId = `RD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Deduct points
      await this.addPointsTransaction({
        memberId,
        type: 'redeemed',
        points: reward.pointsRequired,
        description: `Redeemed: ${reward.name}`,
        rewardId,
        referenceId: redemptionId,
        source: 'booking'
      })

      // Add to redemption history
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_members')

      const redemption = {
        id: redemptionId,
        rewardId,
        rewardName: reward.name,
        pointsUsed: reward.pointsRequired,
        redeemedAt: new Date(),
        expiresAt: reward.expiryDays ? new Date(Date.now() + reward.expiryDays * 24 * 60 * 60 * 1000) : undefined,
        status: 'active' as const
      }

      await collection.updateOne(
        { id: memberId },
        { $push: { redemptionHistory: redemption } }
      )

      await client.close()

      // Send redemption confirmation
      await this.sendRedemptionConfirmation(member, reward, redemption)

      return { success: true, redemptionId }

    } catch (error) {
      console.error('Error redeeming reward:', error)
      return { success: false, error: 'Failed to redeem reward' }
    }
  }

  static async getMember(memberId: string): Promise<LoyaltyMember | null> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_members')
      const member = await collection.findOne({ id: memberId })

      await client.close()

      return member as LoyaltyMember | null

    } catch (error) {
      console.error('Error fetching member:', error)
      return null
    }
  }

  static async getMemberByUserId(userId: string): Promise<LoyaltyMember | null> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_members')
      const member = await collection.findOne({ userId })

      await client.close()

      return member as LoyaltyMember | null

    } catch (error) {
      console.error('Error fetching member by user ID:', error)
      return null
    }
  }

  static async getReward(rewardId: string): Promise<LoyaltyReward | null> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_rewards')
      const reward = await collection.findOne({ id: rewardId })

      await client.close()

      return reward as LoyaltyReward | null

    } catch (error) {
      console.error('Error fetching reward:', error)
      return null
    }
  }

  static async getAvailableRewards(memberId: string): Promise<LoyaltyReward[]> {
    try {
      const member = await this.getMember(memberId)
      if (!member) return []

      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_rewards')

      const now = new Date()
      const query: any = {
        isActive: true,
        validFrom: { $lte: now },
        $or: [
          { validTo: { $exists: false } },
          { validTo: { $gte: now } }
        ],
        pointsRequired: { $lte: member.availablePoints }
      }

      // Filter by tier if restrictions exist
      const memberTierLevel = this.getTierLevel(member.tier)
      query.$or.push({
        'restrictions.minimumTier': { $exists: false }
      })

      const rewards = await collection.find(query).toArray()

      await client.close()

      return rewards.filter(reward => {
        if (reward.restrictions?.minimumTier) {
          const requiredTierLevel = this.getTierLevel(reward.restrictions.minimumTier)
          return memberTierLevel >= requiredTierLevel
        }
        return true
      }) as LoyaltyReward[]

    } catch (error) {
      console.error('Error fetching available rewards:', error)
      return []
    }
  }

  static async getLoyaltyAnalytics(propertyId?: string): Promise<LoyaltyAnalytics> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const membersCollection = db.collection('loyalty_members')

      const query: any = { status: 'active' }

      const members = await membersCollection.find(query).toArray() as LoyaltyMember[]

      const analytics: LoyaltyAnalytics = {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.status === 'active').length,
        tierDistribution: {
          bronze: members.filter(m => m.tier === 'bronze').length,
          silver: members.filter(m => m.tier === 'silver').length,
          gold: members.filter(m => m.tier === 'gold').length,
          platinum: members.filter(m => m.tier === 'platinum').length,
          diamond: members.filter(m => m.tier === 'diamond').length
        },
        averagePointsPerMember: members.reduce((sum, m) => sum + m.totalPoints, 0) / members.length || 0,
        totalPointsIssued: members.reduce((sum, m) => sum + m.lifetimePoints, 0),
        totalPointsRedeemed: members.reduce((sum, m) => sum + (m.lifetimePoints - m.availablePoints), 0),
        redemptionRate: 0,
        topRewards: [],
        membershipGrowth: []
      }

      analytics.redemptionRate = analytics.totalPointsIssued > 0
        ? (analytics.totalPointsRedeemed / analytics.totalPointsIssued) * 100
        : 0

      await client.close()

      return analytics

    } catch (error) {
      console.error('Error calculating loyalty analytics:', error)
      throw error
    }
  }

  private static calculateTier(points: number): LoyaltyMember['tier'] {
    if (points >= this.TIER_THRESHOLDS.diamond) return 'diamond'
    if (points >= this.TIER_THRESHOLDS.platinum) return 'platinum'
    if (points >= this.TIER_THRESHOLDS.gold) return 'gold'
    if (points >= this.TIER_THRESHOLDS.silver) return 'silver'
    return 'bronze'
  }

  private static calculateTierProgress(points: number): LoyaltyMember['tierProgress'] {
    const tier = this.calculateTier(points)
    const currentThreshold = this.TIER_THRESHOLDS[tier]

    let nextTierThreshold: number
    switch (tier) {
      case 'bronze': nextTierThreshold = this.TIER_THRESHOLDS.silver; break
      case 'silver': nextTierThreshold = this.TIER_THRESHOLDS.gold; break
      case 'gold': nextTierThreshold = this.TIER_THRESHOLDS.platinum; break
      case 'platinum': nextTierThreshold = this.TIER_THRESHOLDS.diamond; break
      case 'diamond': nextTierThreshold = this.TIER_THRESHOLDS.diamond; break
    }

    const progress = tier === 'diamond' ? 100 :
      ((points - currentThreshold) / (nextTierThreshold - currentThreshold)) * 100

    return {
      currentTierThreshold: currentThreshold,
      nextTierThreshold,
      progressPercentage: Math.min(100, Math.max(0, progress))
    }
  }

  private static getTierMultiplier(tier: LoyaltyMember['tier']): number {
    const multipliers = {
      bronze: 1.0,
      silver: 1.25,
      gold: 1.5,
      platinum: 1.75,
      diamond: 2.0
    }
    return multipliers[tier]
  }

  private static getTierLevel(tier: LoyaltyMember['tier']): number {
    const levels = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5
    }
    return levels[tier]
  }

  private static async updateMemberStats(memberId: string, stats: {
    totalStays: number
    totalNights: number
    totalSpent: number
    lastStayDate: Date
    propertyId: string
  }): Promise<void> {
    try {
      const { MongoClient } = await import('mongodb')
      const client = new MongoClient(process.env.MONGODB_URI!)
      await client.connect()

      const db = client.db()
      const collection = db.collection('loyalty_members')

      const member = await collection.findOne({ id: memberId }) as LoyaltyMember

      if (member) {
        const averageSpending = stats.totalSpent / stats.totalStays

        // Update favorite properties
        const favoriteProperties = [...member.favoriteProperties]
        if (!favoriteProperties.includes(stats.propertyId)) {
          favoriteProperties.push(stats.propertyId)
        }

        await collection.updateOne(
          { id: memberId },
          {
            $set: {
              totalStays: stats.totalStays,
              totalNights: stats.totalNights,
              totalSpent: stats.totalSpent,
              averageSpending,
              lastStayDate: stats.lastStayDate,
              favoriteProperties
            }
          }
        )
      }

      await client.close()

    } catch (error) {
      console.error('Error updating member stats:', error)
    }
  }

  private static async handleTierUpgrade(memberId: string, oldTier: string, newTier: string): Promise<void> {
    try {
      const member = await this.getMember(memberId)
      if (!member) return

      // Send tier upgrade notification
      const EmailService = (await import('./email-service')).EmailService

      const subject = `Congratulations! You've been upgraded to ${newTier.toUpperCase()} tier!`
      const message = `
        Dear ${member.name},

        Congratulations! You have been upgraded from ${oldTier.toUpperCase()} to ${newTier.toUpperCase()} tier in our loyalty program!

        Your new benefits include:
        - ${this.getTierMultiplier(newTier as any)}x points on all stays
        - Priority check-in and check-out
        - Complimentary room upgrades (subject to availability)
        - Exclusive member-only offers

        Thank you for your continued loyalty!

        Best regards,
        The Loyalty Team
      `

      await EmailService.sendEmail({
        to: member.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

      // Add tier upgrade bonus points
      const bonusPoints = this.getTierLevel(newTier as any) * 500

      await this.addPointsTransaction({
        memberId,
        type: 'bonus',
        points: bonusPoints,
        description: `Tier upgrade bonus: ${oldTier} to ${newTier}`,
        source: 'promotion'
      })

    } catch (error) {
      console.error('Error handling tier upgrade:', error)
    }
  }

  private static async sendWelcomeEmail(member: LoyaltyMember): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      const subject = 'Welcome to our Loyalty Program!'
      const message = `
        Dear ${member.name},

        Welcome to our exclusive loyalty program! We're thrilled to have you as a member.

        Your membership details:
        - Member ID: ${member.id}
        - Current Tier: ${member.tier.toUpperCase()}
        - Points Balance: ${member.availablePoints}

        As a member, you'll enjoy:
        - Earn points on every stay
        - Exclusive member rates and offers
        - Priority customer service
        - Tier upgrades and bonuses
        - Special rewards and experiences

        Start earning points with your next booking!

        Best regards,
        The Loyalty Team
      `

      await EmailService.sendEmail({
        to: member.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending welcome email:', error)
    }
  }

  private static async sendRedemptionConfirmation(member: LoyaltyMember, reward: LoyaltyReward, redemption: any): Promise<void> {
    try {
      const EmailService = (await import('./email-service')).EmailService

      const subject = 'Reward Redemption Confirmation'
      const message = `
        Dear ${member.name},

        Your reward has been successfully redeemed!

        Redemption Details:
        - Reward: ${reward.name}
        - Points Used: ${reward.pointsRequired}
        - Redemption ID: ${redemption.id}
        ${redemption.expiresAt ? `- Expires: ${redemption.expiresAt.toDateString()}` : ''}

        Instructions:
        ${reward.redemptionInstructions}

        Your remaining points balance: ${member.availablePoints - reward.pointsRequired}

        Thank you for being a valued member!

        Best regards,
        The Loyalty Team
      `

      await EmailService.sendEmail({
        to: member.email,
        subject,
        html: message.replace(/\n/g, '<br>'),
        text: message
      })

    } catch (error) {
      console.error('Error sending redemption confirmation:', error)
    }
  }
}