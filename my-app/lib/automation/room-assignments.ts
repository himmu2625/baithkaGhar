export interface RoomAssignmentConfig {
  propertyId: string
  enabled: boolean
  assignmentRules: AssignmentRule[]
  preferences: AssignmentPreferences
  constraints: AssignmentConstraints
  notifications: NotificationConfig
  automation: AutomationSettings
  overrides: OverrideSettings
}

export interface AssignmentRule {
  id: string
  name: string
  description: string
  priority: number
  conditions: RuleCondition[]
  assignments: RoomAssignment[]
  active: boolean
  schedule?: RuleSchedule
}

export interface RuleCondition {
  type: 'guest_type' | 'booking_value' | 'room_preference' | 'accessibility' | 'loyalty_tier' | 'party_size' | 'length_of_stay' | 'arrival_time'
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'between'
  value: any
  weight: number
}

export interface RoomAssignment {
  roomTypeId: string
  specific?: string[]
  preferences: RoomPreferences
  upgrades: UpgradePolicy
  fallbacks: FallbackOption[]
}

export interface RoomPreferences {
  floor?: FloorPreference
  view?: ViewPreference
  location?: LocationPreference
  amenities?: string[]
  accessibility?: AccessibilityFeatures
  quietZone?: boolean
  smoking?: boolean
}

export interface FloorPreference {
  type: 'low' | 'middle' | 'high' | 'specific'
  floors?: number[]
  avoid?: number[]
}

export interface ViewPreference {
  preferred: string[]
  avoid?: string[]
  priority: number
}

export interface LocationPreference {
  nearElevator?: boolean
  nearStairs?: boolean
  nearIce?: boolean
  nearPool?: boolean
  cornerRoom?: boolean
  endOfHallway?: boolean
}

export interface AccessibilityFeatures {
  wheelchairAccessible: boolean
  hearingImpaired: boolean
  visuallyImpaired: boolean
  mobilityAssistance: boolean
  rollInShower?: boolean
  loweredFixtures?: boolean
}

export interface UpgradePolicy {
  automatic: boolean
  conditions: UpgradeCondition[]
  maxUpgradeLevel: number
  chargeUpgrade: boolean
  notifyGuest: boolean
}

export interface UpgradeCondition {
  trigger: 'availability' | 'loyalty' | 'special_occasion' | 'overbooking' | 'maintenance'
  threshold: any
  upgradeType: string[]
}

export interface FallbackOption {
  roomTypeId: string
  acceptanceThreshold: number
  notificationRequired: boolean
  approvalRequired: boolean
}

export interface RuleSchedule {
  startDate?: Date
  endDate?: Date
  daysOfWeek?: number[]
  timeOfDay?: {
    start: string
    end: string
  }
  seasonalRules?: SeasonalRule[]
}

export interface SeasonalRule {
  season: 'spring' | 'summer' | 'fall' | 'winter'
  modifications: RuleModification[]
}

export interface RuleModification {
  field: string
  adjustment: any
  reason: string
}

export interface AssignmentPreferences {
  assignmentTiming: 'immediate' | 'check_in_day' | 'arrival' | 'custom'
  customTiming?: number
  blockContiguous: boolean
  groupAssignments: GroupAssignmentPolicy
  vipHandling: VIPHandlingPolicy
  familyRoomPolicy: FamilyRoomPolicy
}

export interface GroupAssignmentPolicy {
  keepTogether: boolean
  maxDistance: number
  sameFloor: boolean
  consecutiveRooms: boolean
  notifyIfSeparated: boolean
}

export interface VIPHandlingPolicy {
  autoUpgrade: boolean
  bestAvailable: boolean
  manualReview: boolean
  specialAmenities: string[]
  personalizedService: boolean
}

export interface FamilyRoomPolicy {
  adjacentRooms: boolean
  connectingRooms: boolean
  childSafetyFeatures: boolean
  familyFloors: number[]
  quietHours: boolean
}

export interface AssignmentConstraints {
  maintenanceRooms: string[]
  blockedRooms: string[]
  reservedRooms: ReservedRoom[]
  overbookingBuffer: number
  minimumInventory: Record<string, number>
  maxConsecutiveAssignments: number
}

export interface ReservedRoom {
  roomNumber: string
  reservedFor: string
  startDate: Date
  endDate: Date
  reason: string
}

export interface NotificationConfig {
  notifyGuest: boolean
  notifyStaff: boolean
  channels: string[]
  templates: Record<string, string>
  escalation: NotificationEscalation[]
}

export interface NotificationEscalation {
  condition: string
  delay: number
  recipients: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface AutomationSettings {
  enableAutomaticAssignment: boolean
  assignmentWindow: number
  batchProcessing: boolean
  batchSize: number
  retryFailedAssignments: boolean
  maxRetries: number
  conflictResolution: ConflictResolutionPolicy
}

export interface ConflictResolutionPolicy {
  strategy: 'first_come_first_served' | 'priority_based' | 'manual_review' | 'upgrade_offer'
  manualReviewThreshold: number
  upgradeIncentives: UpgradeIncentive[]
}

export interface UpgradeIncentive {
  roomType: string
  incentive: string
  value: number
  conditions: string[]
}

export interface OverrideSettings {
  allowManualOverride: boolean
  overrideRequiresApproval: boolean
  approvalLevels: ApprovalLevel[]
  overrideReasons: string[]
  trackOverrides: boolean
}

export interface ApprovalLevel {
  level: number
  roles: string[]
  conditions: string[]
  timeLimit: number
}

export interface RoomAssignmentRequest {
  bookingId: string
  guestId: string
  propertyId: string
  checkIn: Date
  checkOut: Date
  roomTypeBooked: string
  partySize: number
  guestPreferences?: GuestRoomPreferences
  specialRequests?: string[]
  loyaltyTier?: string
  accessibilityNeeds?: AccessibilityFeatures
  groupBooking?: GroupBookingInfo
}

export interface GuestRoomPreferences {
  floorPreference?: 'low' | 'middle' | 'high'
  viewPreference?: string[]
  bedType?: 'king' | 'queen' | 'twin' | 'double'
  smokingPreference?: 'smoking' | 'non-smoking'
  quietRoom?: boolean
  nearElevator?: boolean
  highFloor?: boolean
  roomNumber?: string
}

export interface GroupBookingInfo {
  groupId: string
  totalRooms: number
  isMainContact: boolean
  groupType: 'family' | 'business' | 'wedding' | 'conference' | 'leisure'
  specialInstructions?: string
}

export interface RoomAssignmentResult {
  bookingId: string
  assignedRoom: AssignedRoom
  assignmentMethod: 'automatic' | 'manual' | 'upgraded' | 'fallback'
  confidence: number
  alternatives?: AssignedRoom[]
  notifications: NotificationResult[]
  upgrades?: UpgradeDetails[]
  conflicts?: ConflictDetail[]
  assignedAt: Date
  assignedBy: string
  notes?: string
}

export interface AssignedRoom {
  roomNumber: string
  roomType: string
  floor: number
  view?: string
  amenities: string[]
  features: RoomFeatures
  rate: number
  currency: string
}

export interface RoomFeatures {
  bedType: string
  bedCount: number
  maxOccupancy: number
  size: number
  smokingAllowed: boolean
  accessibility: AccessibilityFeatures
  balcony: boolean
  kitchenette: boolean
  workspace: boolean
}

export interface NotificationResult {
  type: string
  channel: string
  status: 'sent' | 'failed' | 'pending'
  sentAt?: Date
  error?: string
}

export interface UpgradeDetails {
  fromRoomType: string
  toRoomType: string
  reason: string
  value: number
  charged: boolean
  guestNotified: boolean
}

export interface ConflictDetail {
  type: string
  description: string
  resolutionStrategy: string
  resolved: boolean
  resolvedAt?: Date
}

export interface RoomInventory {
  roomNumber: string
  roomType: string
  floor: number
  status: 'available' | 'occupied' | 'maintenance' | 'blocked' | 'dirty' | 'reserved'
  features: RoomFeatures
  view?: string
  amenities: string[]
  lastCleaned?: Date
  nextMaintenance?: Date
  notes?: string
}

export interface AssignmentAnalytics {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalAssignments: number
    automaticAssignments: number
    manualAssignments: number
    upgrades: number
    conflicts: number
    avgAssignmentTime: number
    satisfactionScore: number
  }
  breakdown: {
    byRoomType: Record<string, AssignmentMetrics>
    byFloor: Record<string, AssignmentMetrics>
    byGuestType: Record<string, AssignmentMetrics>
    byUpgradeReason: Record<string, number>
  }
  efficiency: {
    utilizationRate: number
    upgradeRate: number
    conflictRate: number
    reassignmentRate: number
  }
  trends: TrendData[]
}

export interface AssignmentMetrics {
  assignments: number
  avgSatisfaction: number
  upgradeRate: number
  conflictRate: number
  avgRate: number
}

export interface TrendData {
  date: Date
  assignments: number
  upgrades: number
  conflicts: number
  satisfaction: number
}

export class RoomAssignmentService {
  private configs = new Map<string, RoomAssignmentConfig>()
  private assignments = new Map<string, RoomAssignmentResult>()
  private inventory = new Map<string, RoomInventory[]>()
  private pendingAssignments = new Map<string, RoomAssignmentRequest>()
  private processingQueue: RoomAssignmentRequest[] = []
  private processingInterval?: NodeJS.Timeout

  constructor() {
    this.initializeDefaultConfig()
    this.startAssignmentProcessing()
  }

  async assignRoom(request: RoomAssignmentRequest): Promise<RoomAssignmentResult> {
    const config = this.configs.get(request.propertyId)
    if (!config || !config.enabled) {
      throw new Error('Room assignment not configured or disabled for this property')
    }

    const existingAssignment = this.assignments.get(request.bookingId)
    if (existingAssignment) {
      return existingAssignment
    }

    if (config.automation.enableAutomaticAssignment) {
      return await this.performAutomaticAssignment(request, config)
    } else {
      this.pendingAssignments.set(request.bookingId, request)
      throw new Error('Manual assignment required')
    }
  }

  private async performAutomaticAssignment(
    request: RoomAssignmentRequest,
    config: RoomAssignmentConfig
  ): Promise<RoomAssignmentResult> {
    const availableRooms = await this.getAvailableRooms(request.propertyId, request.checkIn, request.checkOut)
    const applicableRules = await this.findApplicableRules(request, config)
    const scoredRooms = await this.scoreRooms(availableRooms, request, applicableRules, config)

    if (scoredRooms.length === 0) {
      return await this.handleNoAvailableRooms(request, config)
    }

    const selectedRoom = scoredRooms[0]
    const assignmentResult = await this.createAssignment(selectedRoom, request, 'automatic', config)

    await this.updateInventory(request.propertyId, selectedRoom.roomNumber, 'assigned')
    await this.sendNotifications(assignmentResult, config)

    this.assignments.set(request.bookingId, assignmentResult)
    return assignmentResult
  }

  private async getAvailableRooms(propertyId: string, checkIn: Date, checkOut: Date): Promise<RoomInventory[]> {
    try {
      const response = await fetch(`/api/os/properties/${propertyId}/rooms/available`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn, checkOut })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch available rooms')
      }

      const rooms = await response.json()
      return rooms.filter((room: RoomInventory) => room.status === 'available')
    } catch (error) {
      console.error('Error fetching available rooms:', error)
      return this.inventory.get(propertyId) || []
    }
  }

  private async findApplicableRules(
    request: RoomAssignmentRequest,
    config: RoomAssignmentConfig
  ): Promise<AssignmentRule[]> {
    const applicable: AssignmentRule[] = []

    for (const rule of config.assignmentRules) {
      if (!rule.active) continue

      if (rule.schedule && !this.isRuleScheduleActive(rule.schedule)) {
        continue
      }

      const conditionsMet = await this.evaluateRuleConditions(rule.conditions, request)
      if (conditionsMet) {
        applicable.push(rule)
      }
    }

    return applicable.sort((a, b) => b.priority - a.priority)
  }

  private isRuleScheduleActive(schedule: RuleSchedule): boolean {
    const now = new Date()

    if (schedule.startDate && now < schedule.startDate) return false
    if (schedule.endDate && now > schedule.endDate) return false

    if (schedule.daysOfWeek && !schedule.daysOfWeek.includes(now.getDay())) {
      return false
    }

    if (schedule.timeOfDay) {
      const currentTime = now.toTimeString().substring(0, 5)
      if (currentTime < schedule.timeOfDay.start || currentTime > schedule.timeOfDay.end) {
        return false
      }
    }

    return true
  }

  private async evaluateRuleConditions(conditions: RuleCondition[], request: RoomAssignmentRequest): Promise<boolean> {
    for (const condition of conditions) {
      const actualValue = this.extractConditionValue(condition.type, request)
      const conditionMet = this.compareValues(actualValue, condition.operator, condition.value)

      if (!conditionMet) {
        return false
      }
    }

    return true
  }

  private extractConditionValue(type: string, request: RoomAssignmentRequest): any {
    switch (type) {
      case 'guest_type':
        return request.loyaltyTier || 'standard'
      case 'booking_value':
        return this.calculateBookingValue(request)
      case 'room_preference':
        return request.guestPreferences?.roomNumber
      case 'accessibility':
        return !!request.accessibilityNeeds
      case 'loyalty_tier':
        return request.loyaltyTier
      case 'party_size':
        return request.partySize
      case 'length_of_stay':
        return Math.ceil((request.checkOut.getTime() - request.checkIn.getTime()) / (1000 * 60 * 60 * 24))
      case 'arrival_time':
        return request.checkIn.getHours()
      default:
        return null
    }
  }

  private calculateBookingValue(request: RoomAssignmentRequest): number {
    const nights = Math.ceil((request.checkOut.getTime() - request.checkIn.getTime()) / (1000 * 60 * 60 * 24))
    return nights * 150
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals': return actual === expected
      case 'not_equals': return actual !== expected
      case 'greater_than': return actual > expected
      case 'less_than': return actual < expected
      case 'contains': return String(actual).includes(String(expected))
      case 'in': return Array.isArray(expected) && expected.includes(actual)
      case 'between': return Array.isArray(expected) && actual >= expected[0] && actual <= expected[1]
      default: return false
    }
  }

  private async scoreRooms(
    rooms: RoomInventory[],
    request: RoomAssignmentRequest,
    rules: AssignmentRule[],
    config: RoomAssignmentConfig
  ): Promise<(RoomInventory & { score: number })[]> {
    const scoredRooms = await Promise.all(
      rooms.map(async (room) => {
        const score = await this.calculateRoomScore(room, request, rules, config)
        return { ...room, score }
      })
    )

    return scoredRooms
      .filter(room => room.score > 0)
      .sort((a, b) => b.score - a.score)
  }

  private async calculateRoomScore(
    room: RoomInventory,
    request: RoomAssignmentRequest,
    rules: AssignmentRule[],
    config: RoomAssignmentConfig
  ): Promise<number> {
    let score = 50

    score += this.scoreRoomTypeMatch(room, request)
    score += this.scoreAccessibilityMatch(room, request)
    score += this.scorePreferencesMatch(room, request)
    score += this.scoreLocationPreferences(room, request)
    score += this.scoreUpgradePotential(room, request, rules)
    score += this.scoreGroupRequirements(room, request, config)

    score -= this.penalizeConstraints(room, config.constraints)

    return Math.max(0, score)
  }

  private scoreRoomTypeMatch(room: RoomInventory, request: RoomAssignmentRequest): number {
    if (room.roomType === request.roomTypeBooked) {
      return 30
    }

    const hierarchy = ['standard', 'deluxe', 'suite', 'presidential']
    const bookedIndex = hierarchy.indexOf(request.roomTypeBooked)
    const roomIndex = hierarchy.indexOf(room.roomType)

    if (roomIndex > bookedIndex) {
      return 20 + (roomIndex - bookedIndex) * 5
    } else if (roomIndex < bookedIndex) {
      return -(bookedIndex - roomIndex) * 10
    }

    return 0
  }

  private scoreAccessibilityMatch(room: RoomInventory, request: RoomAssignmentRequest): number {
    if (!request.accessibilityNeeds) return 0

    let score = 0
    const roomAccessibility = room.features.accessibility

    if (request.accessibilityNeeds.wheelchairAccessible && roomAccessibility.wheelchairAccessible) {
      score += 25
    }
    if (request.accessibilityNeeds.hearingImpaired && roomAccessibility.hearingImpaired) {
      score += 20
    }
    if (request.accessibilityNeeds.visuallyImpaired && roomAccessibility.visuallyImpaired) {
      score += 20
    }

    return score
  }

  private scorePreferencesMatch(room: RoomInventory, request: RoomAssignmentRequest): number {
    if (!request.guestPreferences) return 0

    let score = 0
    const prefs = request.guestPreferences

    if (prefs.floorPreference) {
      score += this.scoreFloorPreference(room.floor, prefs.floorPreference)
    }

    if (prefs.viewPreference && room.view) {
      score += prefs.viewPreference.includes(room.view) ? 15 : 0
    }

    if (prefs.bedType && room.features.bedType === prefs.bedType) {
      score += 10
    }

    if (prefs.smokingPreference) {
      const isSmokingRoom = room.features.smokingAllowed
      const wantsSmokingRoom = prefs.smokingPreference === 'smoking'
      score += (isSmokingRoom === wantsSmokingRoom) ? 10 : -20
    }

    if (prefs.quietRoom) {
      score += this.scoreQuietRoom(room)
    }

    return score
  }

  private scoreFloorPreference(floor: number, preference: 'low' | 'middle' | 'high'): number {
    switch (preference) {
      case 'low':
        return floor <= 3 ? 10 : floor <= 6 ? 5 : 0
      case 'middle':
        return floor >= 4 && floor <= 8 ? 10 : 5
      case 'high':
        return floor >= 9 ? 15 : floor >= 6 ? 8 : 0
      default:
        return 0
    }
  }

  private scoreQuietRoom(room: RoomInventory): number {
    let score = 0

    if (room.floor >= 5) score += 5
    if (room.roomNumber.endsWith('01') || room.roomNumber.endsWith('99')) score += 5
    if (!room.amenities.includes('elevator_adjacent')) score += 3

    return score
  }

  private scoreLocationPreferences(room: RoomInventory, request: RoomAssignmentRequest): number {
    if (!request.guestPreferences) return 0

    let score = 0
    const prefs = request.guestPreferences

    if (prefs.nearElevator) {
      score += room.amenities.includes('elevator_adjacent') ? 8 : 0
    }

    if (prefs.highFloor && room.floor >= 8) {
      score += 10
    }

    return score
  }

  private scoreUpgradePotential(room: RoomInventory, request: RoomAssignmentRequest, rules: AssignmentRule[]): number {
    const hierarchy = ['standard', 'deluxe', 'suite', 'presidential']
    const bookedIndex = hierarchy.indexOf(request.roomTypeBooked)
    const roomIndex = hierarchy.indexOf(room.roomType)

    if (roomIndex <= bookedIndex) return 0

    const upgradeRule = rules.find(rule =>
      rule.assignments.some(assignment => assignment.upgrades.automatic)
    )

    if (!upgradeRule) return 0

    const loyaltyBonus = request.loyaltyTier === 'platinum' ? 15 : request.loyaltyTier === 'gold' ? 10 : 5
    const upgradeBonus = (roomIndex - bookedIndex) * 8

    return loyaltyBonus + upgradeBonus
  }

  private scoreGroupRequirements(room: RoomInventory, request: RoomAssignmentRequest, config: RoomAssignmentConfig): number {
    if (!request.groupBooking) return 0

    let score = 0

    if (config.preferences.groupAssignments.sameFloor) {
      score += 10
    }

    if (config.preferences.groupAssignments.consecutiveRooms) {
      const roomNum = parseInt(room.roomNumber.slice(-2))
      score += (roomNum % 2 === 0) ? 5 : 0
    }

    return score
  }

  private penalizeConstraints(room: RoomInventory, constraints: AssignmentConstraints): number {
    let penalty = 0

    if (constraints.maintenanceRooms.includes(room.roomNumber)) {
      penalty += 100
    }

    if (constraints.blockedRooms.includes(room.roomNumber)) {
      penalty += 100
    }

    const reservedRoom = constraints.reservedRooms.find(r => r.roomNumber === room.roomNumber)
    if (reservedRoom && new Date() >= reservedRoom.startDate && new Date() <= reservedRoom.endDate) {
      penalty += 100
    }

    return penalty
  }

  private async handleNoAvailableRooms(
    request: RoomAssignmentRequest,
    config: RoomAssignmentConfig
  ): Promise<RoomAssignmentResult> {
    const alternatives = await this.findAlternativeOptions(request, config)

    if (alternatives.length > 0) {
      const selectedRoom = alternatives[0]
      return await this.createAssignment(selectedRoom, request, 'fallback', config)
    }

    throw new Error('No rooms available for assignment')
  }

  private async findAlternativeOptions(
    request: RoomAssignmentRequest,
    config: RoomAssignmentConfig
  ): Promise<RoomInventory[]> {
    const extendedDates = [
      { checkIn: new Date(request.checkIn.getTime() + 24 * 60 * 60 * 1000), checkOut: request.checkOut },
      { checkIn: request.checkIn, checkOut: new Date(request.checkOut.getTime() - 24 * 60 * 60 * 1000) }
    ]

    for (const dates of extendedDates) {
      const rooms = await this.getAvailableRooms(request.propertyId, dates.checkIn, dates.checkOut)
      if (rooms.length > 0) {
        return rooms
      }
    }

    return []
  }

  private async createAssignment(
    room: RoomInventory,
    request: RoomAssignmentRequest,
    method: 'automatic' | 'manual' | 'upgraded' | 'fallback',
    config: RoomAssignmentConfig
  ): Promise<RoomAssignmentResult> {
    const assignedRoom: AssignedRoom = {
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      floor: room.floor,
      view: room.view,
      amenities: room.amenities,
      features: room.features,
      rate: await this.calculateRoomRate(room, request),
      currency: 'USD'
    }

    const upgrades = this.detectUpgrades(room.roomType, request.roomTypeBooked)
    const confidence = this.calculateAssignmentConfidence(room, request, method)

    const result: RoomAssignmentResult = {
      bookingId: request.bookingId,
      assignedRoom,
      assignmentMethod: method,
      confidence,
      notifications: [],
      upgrades,
      assignedAt: new Date(),
      assignedBy: 'system'
    }

    return result
  }

  private async calculateRoomRate(room: RoomInventory, request: RoomAssignmentRequest): Promise<number> {
    const baseRates = {
      'standard': 150,
      'deluxe': 200,
      'suite': 300,
      'presidential': 500
    }

    return baseRates[room.roomType as keyof typeof baseRates] || 150
  }

  private detectUpgrades(assignedType: string, bookedType: string): UpgradeDetails[] {
    const hierarchy = ['standard', 'deluxe', 'suite', 'presidential']
    const bookedIndex = hierarchy.indexOf(bookedType)
    const assignedIndex = hierarchy.indexOf(assignedType)

    if (assignedIndex > bookedIndex) {
      return [{
        fromRoomType: bookedType,
        toRoomType: assignedType,
        reason: 'Automatic upgrade based on availability',
        value: (assignedIndex - bookedIndex) * 50,
        charged: false,
        guestNotified: true
      }]
    }

    return []
  }

  private calculateAssignmentConfidence(
    room: RoomInventory,
    request: RoomAssignmentRequest,
    method: string
  ): number {
    let confidence = 0.7

    if (room.roomType === request.roomTypeBooked) confidence += 0.15
    if (request.accessibilityNeeds && room.features.accessibility.wheelchairAccessible) confidence += 0.1
    if (method === 'automatic') confidence += 0.05

    return Math.min(1.0, confidence)
  }

  private async updateInventory(propertyId: string, roomNumber: string, status: string): Promise<void> {
    const rooms = this.inventory.get(propertyId) || []
    const room = rooms.find(r => r.roomNumber === roomNumber)
    if (room) {
      room.status = status as any
    }
  }

  private async sendNotifications(result: RoomAssignmentResult, config: RoomAssignmentConfig): Promise<void> {
    if (!config.notifications.notifyGuest && !config.notifications.notifyStaff) {
      return
    }

    const notifications: NotificationResult[] = []

    if (config.notifications.notifyGuest) {
      for (const channel of config.notifications.channels) {
        try {
          await this.sendGuestNotification(result, channel, config)
          notifications.push({
            type: 'guest',
            channel,
            status: 'sent',
            sentAt: new Date()
          })
        } catch (error) {
          notifications.push({
            type: 'guest',
            channel,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    if (config.notifications.notifyStaff) {
      try {
        await this.sendStaffNotification(result, config)
        notifications.push({
          type: 'staff',
          channel: 'internal',
          status: 'sent',
          sentAt: new Date()
        })
      } catch (error) {
        notifications.push({
          type: 'staff',
          channel: 'internal',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    result.notifications = notifications
  }

  private async sendGuestNotification(
    result: RoomAssignmentResult,
    channel: string,
    config: RoomAssignmentConfig
  ): Promise<void> {
    const template = config.notifications.templates.guest_assignment || 'room-assignment-confirmation'

    const notificationData = {
      bookingId: result.bookingId,
      roomNumber: result.assignedRoom.roomNumber,
      roomType: result.assignedRoom.roomType,
      floor: result.assignedRoom.floor,
      amenities: result.assignedRoom.amenities,
      upgrades: result.upgrades,
      template
    }

    await fetch(`/api/communications/${channel}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notificationData)
    })
  }

  private async sendStaffNotification(result: RoomAssignmentResult, config: RoomAssignmentConfig): Promise<void> {
    const notification = {
      type: 'room_assignment',
      severity: result.conflicts && result.conflicts.length > 0 ? 'warning' : 'info',
      message: `Room ${result.assignedRoom.roomNumber} assigned to booking ${result.bookingId}`,
      bookingId: result.bookingId,
      roomNumber: result.assignedRoom.roomNumber,
      method: result.assignmentMethod,
      confidence: result.confidence,
      timestamp: new Date()
    }

    await fetch('/api/notifications/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    })
  }

  private startAssignmentProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processAssignmentQueue()
    }, 30000)
  }

  private async processAssignmentQueue(): Promise<void> {
    while (this.processingQueue.length > 0) {
      const request = this.processingQueue.shift()
      if (request) {
        try {
          await this.assignRoom(request)
        } catch (error) {
          console.error('Error processing room assignment:', error)
        }
      }
    }
  }

  private initializeDefaultConfig(): void {
    const defaultConfig: RoomAssignmentConfig = {
      propertyId: 'default',
      enabled: true,
      assignmentRules: [
        {
          id: 'accessibility-priority',
          name: 'Accessibility Priority Assignment',
          description: 'Prioritize accessible rooms for guests with accessibility needs',
          priority: 100,
          conditions: [
            {
              type: 'accessibility',
              operator: 'equals',
              value: true,
              weight: 1.0
            }
          ],
          assignments: [
            {
              roomTypeId: 'any',
              preferences: {
                accessibility: {
                  wheelchairAccessible: true,
                  hearingImpaired: false,
                  visuallyImpaired: false,
                  mobilityAssistance: true
                }
              },
              upgrades: {
                automatic: false,
                conditions: [],
                maxUpgradeLevel: 0,
                chargeUpgrade: false,
                notifyGuest: true
              },
              fallbacks: []
            }
          ],
          active: true
        },
        {
          id: 'vip-upgrade',
          name: 'VIP Automatic Upgrade',
          description: 'Automatically upgrade VIP guests when possible',
          priority: 90,
          conditions: [
            {
              type: 'loyalty_tier',
              operator: 'in',
              value: ['platinum', 'gold'],
              weight: 1.0
            }
          ],
          assignments: [
            {
              roomTypeId: 'any',
              preferences: {
                floor: {
                  type: 'high',
                  floors: [8, 9, 10]
                },
                view: {
                  preferred: ['ocean', 'city'],
                  priority: 1
                }
              },
              upgrades: {
                automatic: true,
                conditions: [
                  {
                    trigger: 'availability',
                    threshold: 0.7,
                    upgradeType: ['deluxe', 'suite']
                  }
                ],
                maxUpgradeLevel: 2,
                chargeUpgrade: false,
                notifyGuest: true
              },
              fallbacks: []
            }
          ],
          active: true
        }
      ],
      preferences: {
        assignmentTiming: 'check_in_day',
        blockContiguous: true,
        groupAssignments: {
          keepTogether: true,
          maxDistance: 3,
          sameFloor: true,
          consecutiveRooms: false,
          notifyIfSeparated: true
        },
        vipHandling: {
          autoUpgrade: true,
          bestAvailable: true,
          manualReview: false,
          specialAmenities: ['champagne', 'flowers'],
          personalizedService: true
        },
        familyRoomPolicy: {
          adjacentRooms: true,
          connectingRooms: true,
          childSafetyFeatures: true,
          familyFloors: [2, 3, 4],
          quietHours: true
        }
      },
      constraints: {
        maintenanceRooms: [],
        blockedRooms: [],
        reservedRooms: [],
        overbookingBuffer: 5,
        minimumInventory: {
          'standard': 10,
          'deluxe': 5,
          'suite': 2
        },
        maxConsecutiveAssignments: 10
      },
      notifications: {
        notifyGuest: true,
        notifyStaff: true,
        channels: ['email', 'sms'],
        templates: {
          'guest_assignment': 'room-assignment-template',
          'upgrade_notification': 'upgrade-notification-template'
        },
        escalation: []
      },
      automation: {
        enableAutomaticAssignment: true,
        assignmentWindow: 24,
        batchProcessing: true,
        batchSize: 50,
        retryFailedAssignments: true,
        maxRetries: 3,
        conflictResolution: {
          strategy: 'priority_based',
          manualReviewThreshold: 0.5,
          upgradeIncentives: []
        }
      },
      overrides: {
        allowManualOverride: true,
        overrideRequiresApproval: true,
        approvalLevels: [
          {
            level: 1,
            roles: ['front_desk_manager'],
            conditions: ['guest_request'],
            timeLimit: 60
          }
        ],
        overrideReasons: ['Guest request', 'Special circumstances', 'Maintenance issue'],
        trackOverrides: true
      }
    }

    this.configs.set('default', defaultConfig)
  }

  async updateConfiguration(propertyId: string, config: RoomAssignmentConfig): Promise<void> {
    this.configs.set(propertyId, config)
    await this.saveConfiguration(propertyId, config)
  }

  async getConfiguration(propertyId: string): Promise<RoomAssignmentConfig | null> {
    return this.configs.get(propertyId) || null
  }

  async getAssignment(bookingId: string): Promise<RoomAssignmentResult | null> {
    return this.assignments.get(bookingId) || null
  }

  async manualAssignment(
    request: RoomAssignmentRequest,
    roomNumber: string,
    assignedBy: string,
    notes?: string
  ): Promise<RoomAssignmentResult> {
    const config = this.configs.get(request.propertyId)
    if (!config) {
      throw new Error('Configuration not found')
    }

    const room = (await this.getAvailableRooms(request.propertyId, request.checkIn, request.checkOut))
      .find(r => r.roomNumber === roomNumber)

    if (!room) {
      throw new Error('Room not available for assignment')
    }

    const result = await this.createAssignment(room, request, 'manual', config)
    result.assignedBy = assignedBy
    result.notes = notes

    await this.updateInventory(request.propertyId, roomNumber, 'assigned')
    await this.sendNotifications(result, config)

    this.assignments.set(request.bookingId, result)
    return result
  }

  async reassignRoom(
    bookingId: string,
    newRoomNumber: string,
    reason: string,
    assignedBy: string
  ): Promise<RoomAssignmentResult> {
    const existingAssignment = this.assignments.get(bookingId)
    if (!existingAssignment) {
      throw new Error('No existing assignment found')
    }

    await this.updateInventory(existingAssignment.assignedRoom.roomNumber, existingAssignment.assignedRoom.roomNumber, 'available')

    const config = this.configs.get('default')!
    const room = (await this.getAvailableRooms('default', new Date(), new Date()))
      .find(r => r.roomNumber === newRoomNumber)

    if (!room) {
      throw new Error('New room not available')
    }

    const newAssignment = await this.createAssignment(room, {
      bookingId,
      guestId: '',
      propertyId: 'default',
      checkIn: new Date(),
      checkOut: new Date(),
      roomTypeBooked: room.roomType,
      partySize: 1
    }, 'manual', config)

    newAssignment.assignedBy = assignedBy
    newAssignment.notes = `Reassigned from ${existingAssignment.assignedRoom.roomNumber}. Reason: ${reason}`

    await this.updateInventory('default', newRoomNumber, 'assigned')
    this.assignments.set(bookingId, newAssignment)

    return newAssignment
  }

  async getAnalytics(propertyId: string, startDate: Date, endDate: Date): Promise<AssignmentAnalytics> {
    const assignments = Array.from(this.assignments.values())
      .filter(a => a.assignedAt >= startDate && a.assignedAt <= endDate)

    const totalAssignments = assignments.length
    const automaticAssignments = assignments.filter(a => a.assignmentMethod === 'automatic').length
    const manualAssignments = assignments.filter(a => a.assignmentMethod === 'manual').length
    const upgrades = assignments.filter(a => a.upgrades && a.upgrades.length > 0).length

    return {
      period: { start: startDate, end: endDate },
      summary: {
        totalAssignments,
        automaticAssignments,
        manualAssignments,
        upgrades,
        conflicts: 0,
        avgAssignmentTime: 5,
        satisfactionScore: 4.2
      },
      breakdown: {
        byRoomType: {},
        byFloor: {},
        byGuestType: {},
        byUpgradeReason: {}
      },
      efficiency: {
        utilizationRate: 0.85,
        upgradeRate: upgrades / totalAssignments,
        conflictRate: 0.02,
        reassignmentRate: 0.05
      },
      trends: []
    }
  }

  private async saveConfiguration(propertyId: string, config: RoomAssignmentConfig): Promise<void> {
  }

  async bulkAssignment(requests: RoomAssignmentRequest[]): Promise<RoomAssignmentResult[]> {
    const results: RoomAssignmentResult[] = []

    for (const request of requests) {
      try {
        const result = await this.assignRoom(request)
        results.push(result)
      } catch (error) {
        console.error(`Failed to assign room for booking ${request.bookingId}:`, error)
      }
    }

    return results
  }

  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = undefined
    }
  }
}

export const roomAssignmentService = new RoomAssignmentService()