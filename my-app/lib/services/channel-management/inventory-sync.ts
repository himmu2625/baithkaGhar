import { ChannelManager, InventoryUpdate } from './channel-manager'
import { BookingComIntegration } from './booking-com-integration'
import { AirbnbIntegration } from './airbnb-integration'
import { ExpediaIntegration } from './expedia-integration'

export interface InventorySyncConfiguration {
  propertyId: string
  masterInventorySource: 'local' | 'booking_com' | 'airbnb' | 'expedia' | 'pms'
  syncStrategy: 'push_only' | 'pull_only' | 'bidirectional' | 'conflict_resolution'
  syncFrequency: 'realtime' | 'every_5min' | 'hourly' | 'daily'
  conflictResolution: 'first_come_first_served' | 'priority_based' | 'manual_review' | 'most_restrictive'
  channels: {
    [channelName: string]: {
      enabled: boolean
      priority: number
      inventoryBuffer: number
      overBookingThreshold: number
      autoCloseOnLowInventory: boolean
      inventoryMapping: {
        [localRoomTypeId: string]: string
      }
      restrictions: {
        minimumStay?: number
        maximumStay?: number
        stopSellThreshold?: number
      }
    }
  }
  allotmentManagement: {
    enabled: boolean
    strategy: 'fixed' | 'dynamic' | 'demand_based'
    roomTypeAllotments: {
      [roomTypeId: string]: {
        [channelName: string]: {
          allocation: number
          releaseThreshold: number
        }
      }
    }
  }
  overbookingProtection: {
    enabled: boolean
    maxOverbookingPercentage: number
    roomTypeOverbookingLimits: {
      [roomTypeId: string]: number
    }
  }
}

export interface InventorySyncResult {
  channelName: string
  success: boolean
  processed: {
    updates: number
    conflicts: number
    errors: number
  }
  conflicts: Array<{
    roomTypeId: string
    date: Date
    localInventory: number
    channelInventory: number
    resolution: string
  }>
  errors: string[]
  executionTime: number
  lastSyncTime: Date
}

export interface InventoryConflict {
  id: string
  propertyId: string
  roomTypeId: string
  date: Date
  conflictType: 'inventory_mismatch' | 'overbooking' | 'channel_unavailable' | 'rate_conflict'
  channels: Array<{
    name: string
    inventory: number
    rate?: number
    lastUpdated: Date
  }>
  suggestedResolution: {
    type: 'use_lowest' | 'use_highest' | 'use_priority' | 'manual_review'
    value: number
    reason: string
  }
  status: 'pending' | 'resolved' | 'ignored'
  createdAt: Date
  resolvedAt?: Date
}

export interface AllotmentRule {
  id: string
  propertyId: string
  roomTypeId: string
  channelName: string
  ruleType: 'fixed' | 'percentage' | 'demand_based' | 'seasonal'
  allocation: number
  conditions?: {
    dateRange?: { from: Date; to: Date }
    daysOfWeek?: number[]
    seasonType?: 'high' | 'low' | 'shoulder'
    occupancyThreshold?: number
  }
  releaseRules: {
    releaseWindow: number
    releaseToChannel?: string
    releaseToGeneral: boolean
  }
  active: boolean
}

export class InventorySyncService {
  private static syncConfigurations: Map<string, InventorySyncConfiguration> = new Map()
  private static pendingConflicts: Map<string, InventoryConflict[]> = new Map()
  private static allotmentRules: Map<string, AllotmentRule[]> = new Map()
  private static syncHistory: Map<string, InventorySyncResult[]> = new Map()

  static async configureInventorySync(config: InventorySyncConfiguration): Promise<{ success: boolean; error?: string }> {
    try {
      await this.validateSyncConfiguration(config)
      this.syncConfigurations.set(config.propertyId, config)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Configuration failed' }
    }
  }

  static async syncInventoryAcrossChannels(propertyId: string, roomTypeId?: string): Promise<InventorySyncResult[]> {
    const config = this.syncConfigurations.get(propertyId)
    if (!config) {
      throw new Error('Inventory sync configuration not found for property')
    }

    const results: InventorySyncResult[] = []
    const masterInventory = await this.getMasterInventory(propertyId, config.masterInventorySource, roomTypeId)

    for (const [channelName, channelConfig] of Object.entries(config.channels)) {
      if (!channelConfig.enabled) continue

      const startTime = Date.now()
      const channelResult: InventorySyncResult = {
        channelName,
        success: false,
        processed: { updates: 0, conflicts: 0, errors: 0 },
        conflicts: [],
        errors: [],
        executionTime: 0,
        lastSyncTime: new Date()
      }

      try {
        switch (config.syncStrategy) {
          case 'push_only':
            await this.pushInventoryToChannel(propertyId, channelName, masterInventory, channelConfig, channelResult)
            break
          case 'pull_only':
            await this.pullInventoryFromChannel(propertyId, channelName, channelConfig, channelResult)
            break
          case 'bidirectional':
            await this.bidirectionalSync(propertyId, channelName, masterInventory, channelConfig, channelResult)
            break
          case 'conflict_resolution':
            await this.conflictResolutionSync(propertyId, channelName, masterInventory, channelConfig, channelResult, config.conflictResolution)
            break
        }

        channelResult.success = channelResult.errors.length === 0

      } catch (error: any) {
        channelResult.errors.push(error.message || 'Sync failed')
        channelResult.processed.errors++
      }

      channelResult.executionTime = Date.now() - startTime
      results.push(channelResult)
    }

    this.updateSyncHistory(propertyId, results)
    return results
  }

  private static async getMasterInventory(propertyId: string, source: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    const inventory = new Map<string, Map<string, number>>()

    switch (source) {
      case 'local':
        return await this.getLocalInventory(propertyId, roomTypeId)
      case 'booking_com':
        return await this.getBookingComInventory(propertyId, roomTypeId)
      case 'airbnb':
        return await this.getAirbnbInventory(propertyId, roomTypeId)
      case 'expedia':
        return await this.getExpediaInventory(propertyId, roomTypeId)
      case 'pms':
        return await this.getPMSInventory(propertyId, roomTypeId)
      default:
        return inventory
    }
  }

  private static async pushInventoryToChannel(
    propertyId: string,
    channelName: string,
    masterInventory: Map<string, Map<string, number>>,
    channelConfig: any,
    result: InventorySyncResult
  ): Promise<void> {
    const updates: InventoryUpdate[] = []
    const config = this.syncConfigurations.get(propertyId)!

    for (const [roomTypeId, dateInventory] of masterInventory.entries()) {
      const channelRoomId = channelConfig.inventoryMapping[roomTypeId] || roomTypeId

      for (const [dateStr, inventory] of dateInventory.entries()) {
        const date = new Date(dateStr)
        let adjustedInventory = inventory

        adjustedInventory = this.applyInventoryBuffer(adjustedInventory, channelConfig.inventoryBuffer)

        adjustedInventory = await this.applyAllotmentRules(
          propertyId,
          roomTypeId,
          channelName,
          date,
          adjustedInventory
        )

        if (config.overbookingProtection.enabled) {
          adjustedInventory = this.applyOverbookingProtection(
            adjustedInventory,
            roomTypeId,
            config.overbookingProtection
          )
        }

        if (channelConfig.autoCloseOnLowInventory && adjustedInventory <= (channelConfig.restrictions.stopSellThreshold || 0)) {
          adjustedInventory = 0
        }

        updates.push({
          roomTypeId: channelRoomId,
          date,
          availability: adjustedInventory,
          restrictions: channelConfig.restrictions
        })
      }
    }

    const syncResult = await this.executeChannelInventoryUpdate(channelName, propertyId, updates)
    result.processed.updates = updates.length

    if (!syncResult.success) {
      result.errors.push(...(syncResult.errors || ['Channel update failed']))
      result.processed.errors = syncResult.errors?.length || 1
    }
  }

  private static async pullInventoryFromChannel(
    propertyId: string,
    channelName: string,
    channelConfig: any,
    result: InventorySyncResult
  ): Promise<void> {
    const channelInventory = await this.getChannelInventory(propertyId, channelName)

    for (const [roomTypeId, dateInventory] of channelInventory.entries()) {
      for (const [dateStr, inventory] of dateInventory.entries()) {
        await this.updateLocalInventory(propertyId, roomTypeId, new Date(dateStr), inventory)
        result.processed.updates++
      }
    }
  }

  private static async bidirectionalSync(
    propertyId: string,
    channelName: string,
    masterInventory: Map<string, Map<string, number>>,
    channelConfig: any,
    result: InventorySyncResult
  ): Promise<void> {
    const channelInventory = await this.getChannelInventory(propertyId, channelName)

    const conflicts = this.identifyInventoryConflicts(masterInventory, channelInventory, propertyId, channelName)

    result.conflicts = conflicts.map(conflict => ({
      roomTypeId: conflict.roomTypeId,
      date: conflict.date,
      localInventory: conflict.channels.find(c => c.name === 'local')?.inventory || 0,
      channelInventory: conflict.channels.find(c => c.name === channelName)?.inventory || 0,
      resolution: conflict.suggestedResolution.type
    }))

    result.processed.conflicts = conflicts.length

    await this.storePendingConflicts(propertyId, conflicts)
  }

  private static async conflictResolutionSync(
    propertyId: string,
    channelName: string,
    masterInventory: Map<string, Map<string, number>>,
    channelConfig: any,
    result: InventorySyncResult,
    resolutionStrategy: string
  ): Promise<void> {
    const channelInventory = await this.getChannelInventory(propertyId, channelName)
    const conflicts = this.identifyInventoryConflicts(masterInventory, channelInventory, propertyId, channelName)

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict, resolutionStrategy)

      if (resolution.success) {
        await this.applyConflictResolution(propertyId, channelName, conflict, resolution.value!)
        result.processed.updates++
      } else {
        result.errors.push(`Failed to resolve conflict for ${conflict.roomTypeId} on ${conflict.date}`)
        result.processed.errors++
      }
    }
  }

  private static applyInventoryBuffer(inventory: number, buffer: number): number {
    return Math.max(0, inventory - buffer)
  }

  private static async applyAllotmentRules(
    propertyId: string,
    roomTypeId: string,
    channelName: string,
    date: Date,
    inventory: number
  ): Promise<number> {
    const rules = this.allotmentRules.get(propertyId) || []

    const applicableRules = rules.filter(rule =>
      rule.active &&
      rule.roomTypeId === roomTypeId &&
      rule.channelName === channelName &&
      this.isAllotmentRuleApplicable(rule, date)
    )

    let allocatedInventory = inventory

    for (const rule of applicableRules) {
      switch (rule.ruleType) {
        case 'fixed':
          allocatedInventory = Math.min(allocatedInventory, rule.allocation)
          break
        case 'percentage':
          allocatedInventory = Math.min(allocatedInventory, Math.floor(inventory * rule.allocation / 100))
          break
        case 'demand_based':
          const demandAdjustment = await this.calculateDemandBasedAllocation(propertyId, roomTypeId, date, rule.allocation)
          allocatedInventory = Math.min(allocatedInventory, demandAdjustment)
          break
      }
    }

    return allocatedInventory
  }

  private static applyOverbookingProtection(
    inventory: number,
    roomTypeId: string,
    overbookingConfig: any
  ): number {
    const roomTypeLimit = overbookingConfig.roomTypeOverbookingLimits[roomTypeId]
    const maxOverbooking = roomTypeLimit || overbookingConfig.maxOverbookingPercentage

    return Math.min(inventory, Math.floor(inventory * (1 + maxOverbooking / 100)))
  }

  private static identifyInventoryConflicts(
    masterInventory: Map<string, Map<string, number>>,
    channelInventory: Map<string, Map<string, number>>,
    propertyId: string,
    channelName: string
  ): InventoryConflict[] {
    const conflicts: InventoryConflict[] = []

    for (const [roomTypeId, masterDates] of masterInventory.entries()) {
      const channelDates = channelInventory.get(roomTypeId)
      if (!channelDates) continue

      for (const [dateStr, masterQty] of masterDates.entries()) {
        const channelQty = channelDates.get(dateStr)
        if (channelQty === undefined) continue

        if (Math.abs(masterQty - channelQty) > 0) {
          conflicts.push({
            id: `${propertyId}-${roomTypeId}-${dateStr}-${Date.now()}`,
            propertyId,
            roomTypeId,
            date: new Date(dateStr),
            conflictType: 'inventory_mismatch',
            channels: [
              { name: 'master', inventory: masterQty, lastUpdated: new Date() },
              { name: channelName, inventory: channelQty, lastUpdated: new Date() }
            ],
            suggestedResolution: {
              type: 'use_lowest',
              value: Math.min(masterQty, channelQty),
              reason: 'Conservative approach to prevent overbooking'
            },
            status: 'pending',
            createdAt: new Date()
          })
        }
      }
    }

    return conflicts
  }

  private static async resolveConflict(
    conflict: InventoryConflict,
    strategy: string
  ): Promise<{ success: boolean; value?: number; error?: string }> {
    try {
      let resolvedValue: number

      switch (strategy) {
        case 'first_come_first_served':
          resolvedValue = conflict.channels.sort((a, b) =>
            a.lastUpdated.getTime() - b.lastUpdated.getTime()
          )[0].inventory
          break

        case 'priority_based':
          const prioritizedChannel = conflict.channels.find(c => c.name === 'master') || conflict.channels[0]
          resolvedValue = prioritizedChannel.inventory
          break

        case 'most_restrictive':
          resolvedValue = Math.min(...conflict.channels.map(c => c.inventory))
          break

        case 'manual_review':
          await this.flagForManualReview(conflict)
          return { success: false, error: 'Flagged for manual review' }

        default:
          resolvedValue = conflict.suggestedResolution.value
      }

      return { success: true, value: resolvedValue }

    } catch (error: any) {
      return { success: false, error: error.message || 'Resolution failed' }
    }
  }

  private static async executeChannelInventoryUpdate(
    channelName: string,
    propertyId: string,
    updates: InventoryUpdate[]
  ): Promise<{ success: boolean; errors?: string[] }> {
    return await ChannelManager.updateInventoryAcrossChannels(propertyId, updates)
  }

  private static async getLocalInventory(propertyId: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    const inventory = new Map<string, Map<string, number>>()
    const roomTypes = roomTypeId ? [roomTypeId] : ['room-1', 'room-2', 'room-3']

    for (const rtId of roomTypes) {
      const dateMap = new Map<string, number>()
      for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() + i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        dateMap.set(dateStr, Math.floor(Math.random() * 20) + 5)
      }
      inventory.set(rtId, dateMap)
    }

    return inventory
  }

  private static async getChannelInventory(propertyId: string, channelName: string): Promise<Map<string, Map<string, number>>> {
    return await this.getLocalInventory(propertyId)
  }

  private static async getBookingComInventory(propertyId: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    return await this.getLocalInventory(propertyId, roomTypeId)
  }

  private static async getAirbnbInventory(propertyId: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    return await this.getLocalInventory(propertyId, roomTypeId)
  }

  private static async getExpediaInventory(propertyId: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    return await this.getLocalInventory(propertyId, roomTypeId)
  }

  private static async getPMSInventory(propertyId: string, roomTypeId?: string): Promise<Map<string, Map<string, number>>> {
    return await this.getLocalInventory(propertyId, roomTypeId)
  }

  private static async updateLocalInventory(propertyId: string, roomTypeId: string, date: Date, inventory: number): Promise<void> {
    console.log(`Updating local inventory for ${propertyId}/${roomTypeId} on ${date.toISOString()}: ${inventory}`)
  }

  private static isAllotmentRuleApplicable(rule: AllotmentRule, date: Date): boolean {
    if (rule.conditions?.dateRange) {
      if (date < rule.conditions.dateRange.from || date > rule.conditions.dateRange.to) {
        return false
      }
    }

    if (rule.conditions?.daysOfWeek) {
      if (!rule.conditions.daysOfWeek.includes(date.getDay())) {
        return false
      }
    }

    return true
  }

  private static async calculateDemandBasedAllocation(propertyId: string, roomTypeId: string, date: Date, baseAllocation: number): Promise<number> {
    const demandLevel = Math.random()

    if (demandLevel > 0.8) {
      return Math.floor(baseAllocation * 1.2)
    } else if (demandLevel < 0.3) {
      return Math.floor(baseAllocation * 0.8)
    }

    return baseAllocation
  }

  private static async storePendingConflicts(propertyId: string, conflicts: InventoryConflict[]): Promise<void> {
    const existingConflicts = this.pendingConflicts.get(propertyId) || []
    this.pendingConflicts.set(propertyId, [...existingConflicts, ...conflicts])
  }

  private static async flagForManualReview(conflict: InventoryConflict): Promise<void> {
    console.log('Conflict flagged for manual review:', conflict.id)
  }

  private static async applyConflictResolution(propertyId: string, channelName: string, conflict: InventoryConflict, resolvedValue: number): Promise<void> {
    await this.updateLocalInventory(propertyId, conflict.roomTypeId, conflict.date, resolvedValue)

    const updates: InventoryUpdate[] = [{
      roomTypeId: conflict.roomTypeId,
      date: conflict.date,
      availability: resolvedValue
    }]

    await this.executeChannelInventoryUpdate(channelName, propertyId, updates)
  }

  private static updateSyncHistory(propertyId: string, results: InventorySyncResult[]): void {
    const existingHistory = this.syncHistory.get(propertyId) || []
    const newHistory = [...existingHistory, ...results].slice(-100)
    this.syncHistory.set(propertyId, newHistory)
  }

  private static async validateSyncConfiguration(config: InventorySyncConfiguration): Promise<void> {
    if (!config.propertyId) {
      throw new Error('Property ID is required')
    }

    if (!['local', 'booking_com', 'airbnb', 'expedia', 'pms'].includes(config.masterInventorySource)) {
      throw new Error('Invalid master inventory source')
    }

    for (const [channelName, channelConfig] of Object.entries(config.channels)) {
      if (channelConfig.enabled && channelConfig.priority < 1) {
        throw new Error(`Invalid priority for channel ${channelName}`)
      }
    }
  }

  static async addAllotmentRule(propertyId: string, rule: AllotmentRule): Promise<{ success: boolean; error?: string }> {
    try {
      const existingRules = this.allotmentRules.get(propertyId) || []
      const updatedRules = [...existingRules, rule]
      this.allotmentRules.set(propertyId, updatedRules)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to add allotment rule' }
    }
  }

  static async getPendingConflicts(propertyId: string): Promise<{ success: boolean; conflicts?: InventoryConflict[]; error?: string }> {
    try {
      const conflicts = this.pendingConflicts.get(propertyId) || []
      return { success: true, conflicts }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get conflicts' }
    }
  }

  static async resolveConflictManually(propertyId: string, conflictId: string, resolution: number): Promise<{ success: boolean; error?: string }> {
    try {
      const conflicts = this.pendingConflicts.get(propertyId) || []
      const conflictIndex = conflicts.findIndex(c => c.id === conflictId)

      if (conflictIndex === -1) {
        return { success: false, error: 'Conflict not found' }
      }

      const conflict = conflicts[conflictIndex]
      conflict.status = 'resolved'
      conflict.resolvedAt = new Date()

      conflicts[conflictIndex] = conflict
      this.pendingConflicts.set(propertyId, conflicts)

      await this.applyConflictResolution(propertyId, conflict.channels[1].name, conflict, resolution)

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to resolve conflict' }
    }
  }

  static async getSyncHistory(propertyId: string, days: number = 7): Promise<{ success: boolean; history?: InventorySyncResult[]; error?: string }> {
    try {
      const allHistory = this.syncHistory.get(propertyId) || []
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const recentHistory = allHistory.filter(result => result.lastSyncTime >= cutoffDate)

      return { success: true, history: recentHistory }
    } catch (error: any) {
      return { success: false, error: error.message || 'Failed to get sync history' }
    }
  }
}