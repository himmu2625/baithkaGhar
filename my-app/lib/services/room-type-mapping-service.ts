import { connectToDatabase } from '@/lib/mongodb'
import Room from '@/models/Room'
import RoomType from '@/models/RoomType'
import { Types } from 'mongoose'

export interface RoomTypeMapping {
  roomTypeId: string
  roomTypeName: string
  roomTypeCode: string
  category: string
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  maintenanceRooms: number
  cleaningRooms: number
  outOfOrderRooms: number
  rooms: Array<{
    roomId: string
    roomNumber: string
    floor: number
    wing?: string
    status: string
    condition: string
    currentBooking?: any
    lastCleaned?: Date
    maintenanceIssues: number
  }>
  averageRate: number
  occupancyRate: number
  revenueContribution: number
}

export interface RoomTypeMappingConfig {
  autoAssignment: boolean
  preferredFloors: number[]
  distributionStrategy: 'random' | 'sequential' | 'preference_based'
  upgradePriority: number
  seasonalPricing: boolean
  dynamicPricing: boolean
}

export interface BulkRoomTypeUpdate {
  roomIds: string[]
  newRoomTypeId: string
  reason: string
  effectiveDate?: Date
  preservePricing?: boolean
}

export class RoomTypeMappingService {
  // Get comprehensive room type mapping for a property
  static async getRoomTypeMapping(propertyId: string): Promise<RoomTypeMapping[]> {
    await connectToDatabase()

    const roomTypes = await RoomType.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).sort({ displayOrder: 1, category: 1 })

    const mappings: RoomTypeMapping[] = []

    for (const roomType of roomTypes) {
      const rooms = await Room.find({
        propertyId: new Types.ObjectId(propertyId),
        roomTypeId: roomType._id,
        isActive: true
      }).populate('currentBooking.bookingId').lean()

      // Calculate statistics
      const totalRooms = rooms.length
      let availableRooms = 0
      let occupiedRooms = 0
      let maintenanceRooms = 0
      let cleaningRooms = 0
      let outOfOrderRooms = 0
      let totalRevenue = 0

      const roomDetails = rooms.map(room => {
        // Count by status
        switch (room.status) {
          case 'available':
            availableRooms++
            break
          case 'occupied':
            occupiedRooms++
            totalRevenue += room.pricing?.dynamicPricing?.currentRate || room.pricing?.baseRate || 0
            break
          case 'maintenance':
            maintenanceRooms++
            break
          case 'cleaning':
            cleaningRooms++
            break
          case 'out_of_order':
            outOfOrderRooms++
            break
        }

        return {
          roomId: room._id.toString(),
          roomNumber: room.roomNumber,
          floor: room.floor,
          wing: room.wing,
          status: room.status,
          condition: room.condition,
          currentBooking: room.currentBooking,
          lastCleaned: room.housekeeping?.lastCleaned,
          maintenanceIssues: room.maintenance?.currentIssues?.length || 0
        }
      })

      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0
      const averageRate = rooms.reduce((sum, room) => {
        return sum + (room.pricing?.dynamicPricing?.currentRate || room.pricing?.baseRate || 0)
      }, 0) / (totalRooms || 1)

      mappings.push({
        roomTypeId: roomType._id.toString(),
        roomTypeName: roomType.name,
        roomTypeCode: roomType.code,
        category: roomType.category,
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        cleaningRooms,
        outOfOrderRooms,
        rooms: roomDetails,
        averageRate,
        occupancyRate,
        revenueContribution: totalRevenue
      })
    }

    return mappings
  }

  // Map rooms to optimal room types based on characteristics
  static async optimizeRoomTypeMapping(propertyId: string): Promise<{
    recommendations: Array<{
      roomId: string
      roomNumber: string
      currentRoomType: string
      recommendedRoomType: string
      reason: string
      potentialRevenueIncrease: number
    }>
    summary: {
      totalRecommendations: number
      potentialRevenueIncrease: number
      affectedRooms: number
    }
  }> {
    await connectToDatabase()

    const rooms = await Room.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).populate('roomTypeId').lean()

    const roomTypes = await RoomType.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    }).lean()

    const recommendations = []
    let totalPotentialIncrease = 0

    for (const room of rooms) {
      const currentRoomType = room.roomTypeId
      const optimalRoomType = this.findOptimalRoomType(room, roomTypes)

      if (optimalRoomType && optimalRoomType._id.toString() !== currentRoomType._id.toString()) {
        const revenueIncrease = optimalRoomType.basePrice.perNight - currentRoomType.basePrice.perNight
        const reason = this.generateOptimizationReason(room, currentRoomType, optimalRoomType)

        recommendations.push({
          roomId: room._id.toString(),
          roomNumber: room.roomNumber,
          currentRoomType: currentRoomType.name,
          recommendedRoomType: optimalRoomType.name,
          reason,
          potentialRevenueIncrease: revenueIncrease
        })

        totalPotentialIncrease += revenueIncrease
      }
    }

    return {
      recommendations,
      summary: {
        totalRecommendations: recommendations.length,
        potentialRevenueIncrease: totalPotentialIncrease,
        affectedRooms: recommendations.length
      }
    }
  }

  // Bulk update room type assignments
  static async bulkUpdateRoomTypes(
    propertyId: string,
    updates: BulkRoomTypeUpdate[],
    updatedBy: string
  ): Promise<{
    success: boolean
    updated: number
    failed: number
    errors: Array<{ roomId: string; error: string }>
  }> {
    await connectToDatabase()

    let updated = 0
    let failed = 0
    const errors: Array<{ roomId: string; error: string }> = []

    for (const update of updates) {
      try {
        // Validate new room type exists
        const newRoomType = await RoomType.findOne({
          _id: new Types.ObjectId(update.newRoomTypeId),
          propertyId: new Types.ObjectId(propertyId),
          isActive: true
        })

        if (!newRoomType) {
          errors.push({
            roomId: 'all',
            error: `Room type ${update.newRoomTypeId} not found`
          })
          failed += update.roomIds.length
          continue
        }

        for (const roomId of update.roomIds) {
          try {
            const room = await Room.findOne({
              _id: new Types.ObjectId(roomId),
              propertyId: new Types.ObjectId(propertyId)
            })

            if (!room) {
              errors.push({ roomId, error: 'Room not found' })
              failed++
              continue
            }

            // Store old room type for history
            const oldRoomTypeId = room.roomTypeId

            // Update room type
            room.roomTypeId = new Types.ObjectId(update.newRoomTypeId)
            room.lastModifiedBy = new Types.ObjectId(updatedBy)

            // Update pricing if not preserving
            if (!update.preservePricing) {
              room.pricing.baseRate = newRoomType.basePrice.perNight
              room.pricing.dynamicPricing.currentRate = newRoomType.basePrice.perNight
              room.pricing.dynamicPricing.lastUpdated = new Date()
              room.pricing.dynamicPricing.updatedBy = 'manual'
            }

            // Add to maintenance history for tracking
            room.maintenance.maintenanceHistory.push({
              type: 'other',
              description: `Room type changed: ${update.reason}`,
              performedBy: updatedBy,
              performedAt: update.effectiveDate || new Date(),
              cost: 0,
              duration: 0,
              notes: `Changed from ${oldRoomTypeId} to ${update.newRoomTypeId}`
            })

            await room.save()
            updated++

          } catch (roomError) {
            console.error(`Error updating room ${roomId}:`, roomError)
            errors.push({
              roomId,
              error: roomError instanceof Error ? roomError.message : 'Unknown error'
            })
            failed++
          }
        }

      } catch (updateError) {
        console.error('Bulk update error:', updateError)
        errors.push({
          roomId: 'batch',
          error: updateError instanceof Error ? updateError.message : 'Unknown error'
        })
        failed += update.roomIds.length
      }
    }

    // Update room type inventory counts
    await this.updateRoomTypeInventory(propertyId)

    return {
      success: updated > 0,
      updated,
      failed,
      errors
    }
  }

  // Create rooms from room type template
  static async createRoomsFromTemplate(
    propertyId: string,
    roomTypeId: string,
    roomCount: number,
    startingFloor: number,
    roomNumberPrefix: string,
    createdBy: string
  ): Promise<{
    success: boolean
    created: string[]
    errors: string[]
  }> {
    await connectToDatabase()

    const roomType = await RoomType.findOne({
      _id: new Types.ObjectId(roomTypeId),
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    })

    if (!roomType) {
      return {
        success: false,
        created: [],
        errors: ['Room type not found']
      }
    }

    const created: string[] = []
    const errors: string[] = []

    for (let i = 0; i < roomCount; i++) {
      try {
        const roomNumber = `${roomNumberPrefix}${String(i + 1).padStart(2, '0')}`

        // Check if room number already exists
        const existingRoom = await Room.findOne({
          propertyId: new Types.ObjectId(propertyId),
          roomNumber
        })

        if (existingRoom) {
          errors.push(`Room ${roomNumber} already exists`)
          continue
        }

        const newRoom = new Room({
          propertyId: new Types.ObjectId(propertyId),
          roomTypeId: new Types.ObjectId(roomTypeId),
          roomNumber,
          floor: startingFloor + Math.floor(i / 10), // 10 rooms per floor
          status: 'available',
          condition: 'good',

          // Copy from room type template
          actualSize: {
            area: roomType.roomSize.area,
            unit: roomType.roomSize.unit
          },

          actualBeds: {
            singleBeds: roomType.bedConfiguration.singleBeds,
            doubleBeds: roomType.bedConfiguration.doubleBeds,
            queenBeds: roomType.bedConfiguration.queenBeds,
            kingBeds: roomType.bedConfiguration.kingBeds,
            sofaBeds: roomType.bedConfiguration.sofaBeds,
            bunkBeds: roomType.bedConfiguration.bunkBeds
          },

          specificAmenities: {
            hasBalcony: roomType.amenities.comfort.balcony,
            hasKitchen: roomType.amenities.kitchen.fullKitchen || roomType.amenities.kitchen.kitchenette,
            hasAC: roomType.amenities.comfort.airConditioning,
            hasSmartTV: roomType.amenities.technology.smartTV,
            hasSafe: roomType.amenities.safety.safe,
            hasMinibar: false,
            hasJacuzzi: false,
            hasWorkDesk: roomType.amenities.technology.workDesk,
            hasTerrace: roomType.amenities.comfort.terrace,
            hasGarden: roomType.amenities.comfort.garden,
            customAmenities: []
          },

          accessibility: roomType.accessibility,

          pricing: {
            baseRate: roomType.basePrice.perNight,
            seasonalMultiplier: 1,
            dynamicPricing: {
              currentRate: roomType.basePrice.perNight,
              lastUpdated: new Date(),
              updatedBy: 'system'
            },
            specialRates: []
          },

          housekeeping: {
            lastCleaned: new Date(),
            lastCleanedBy: new Types.ObjectId(createdBy),
            cleaningStatus: 'clean',
            cleaningDuration: roomType.housekeeping.cleaningTime,
            housekeepingIssues: []
          },

          maintenance: {
            lastMaintenance: new Date(),
            maintenanceHistory: [],
            currentIssues: []
          },

          safety: {
            smokeDetectorStatus: 'working',
            lastSafetyCheck: new Date(),
            emergencyEquipment: [],
            securityFeatures: {
              keyCardAccess: roomType.amenities.safety.keylessEntry,
              deadbolt: true,
              chainLock: false,
              peephole: true,
              balconyLock: roomType.amenities.comfort.balcony
            }
          },

          feedback: {
            averageRating: 0,
            totalReviews: 0,
            commonComplaints: [],
            commonPraises: []
          },

          inventory: [],

          energyConsumption: {
            electricityUsage: 0,
            waterUsage: 0,
            lastMeterReading: new Date(),
            monthlyAverage: 0
          },

          revenue: {
            monthlyRevenue: 0,
            yearlyRevenue: 0,
            averageDailyRate: roomType.basePrice.perNight,
            revenuePAR: 0,
            lastRevenueUpdate: new Date()
          },

          isActive: true,
          isBookable: true,
          notes: `Created from ${roomType.name} template`,
          createdBy: new Types.ObjectId(createdBy),
          lastModifiedBy: new Types.ObjectId(createdBy)
        })

        await newRoom.save()
        created.push(newRoom._id.toString())

      } catch (error) {
        console.error(`Error creating room ${i + 1}:`, error)
        errors.push(`Room ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Update room type inventory
    await this.updateRoomTypeInventory(propertyId)

    return {
      success: created.length > 0,
      created,
      errors
    }
  }

  // Get room type mapping configuration
  static async getRoomTypeMappingConfig(propertyId: string): Promise<Record<string, RoomTypeMappingConfig>> {
    await connectToDatabase()

    const roomTypes = await RoomType.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    })

    const configs: Record<string, RoomTypeMappingConfig> = {}

    for (const roomType of roomTypes) {
      configs[roomType._id.toString()] = {
        autoAssignment: true,
        preferredFloors: roomType.floorPreference || [],
        distributionStrategy: 'preference_based',
        upgradePriority: this.getUpgradePriority(roomType.category),
        seasonalPricing: roomType.seasonalPricing?.length > 0,
        dynamicPricing: true
      }
    }

    return configs
  }

  // Update room type inventory counts
  static async updateRoomTypeInventory(propertyId: string): Promise<void> {
    await connectToDatabase()

    const roomTypes = await RoomType.find({
      propertyId: new Types.ObjectId(propertyId),
      isActive: true
    })

    for (const roomType of roomTypes) {
      const rooms = await Room.find({
        propertyId: new Types.ObjectId(propertyId),
        roomTypeId: roomType._id,
        isActive: true
      })

      const totalRooms = rooms.length
      const availableRooms = rooms.filter(r => r.status === 'available').length
      const maintenanceRooms = rooms.filter(r => r.status === 'maintenance' || r.status === 'out_of_order').length
      const bookedRooms = rooms.filter(r => r.status === 'occupied' || r.status === 'reserved').length

      roomType.inventory = {
        totalRooms,
        availableRooms,
        maintenanceRooms,
        bookedRooms
      }

      await roomType.save()
    }
  }

  // Utility methods
  private static findOptimalRoomType(room: any, roomTypes: any[]): any {
    // Score each room type based on room characteristics
    let bestScore = -1
    let optimalRoomType = null

    for (const roomType of roomTypes) {
      let score = 0

      // Size matching
      const sizeDiff = Math.abs(room.actualSize.area - roomType.roomSize.area)
      score += Math.max(0, 100 - sizeDiff / 10) // Penalty for size difference

      // Bed configuration matching
      const totalActualBeds = Object.values(room.actualBeds).reduce((sum: number, count: any) => sum + count, 0)
      const totalTypeBeds = roomType.bedConfiguration.totalBeds
      if (totalActualBeds === totalTypeBeds) score += 50

      // Amenity matching
      let amenityMatches = 0
      if (room.specificAmenities.hasBalcony === roomType.amenities.comfort.balcony) amenityMatches++
      if (room.specificAmenities.hasKitchen === (roomType.amenities.kitchen.fullKitchen || roomType.amenities.kitchen.kitchenette)) amenityMatches++
      if (room.specificAmenities.hasAC === roomType.amenities.comfort.airConditioning) amenityMatches++
      score += amenityMatches * 10

      // Floor preference
      if (roomType.floorPreference?.includes(room.floor)) score += 20

      // Accessibility matching
      if (room.accessibility.wheelchairAccessible === roomType.accessibility.wheelchairAccessible) score += 15

      if (score > bestScore) {
        bestScore = score
        optimalRoomType = roomType
      }
    }

    return optimalRoomType
  }

  private static generateOptimizationReason(room: any, currentType: any, optimalType: any): string {
    const reasons = []

    if (Math.abs(room.actualSize.area - optimalType.roomSize.area) < Math.abs(room.actualSize.area - currentType.roomSize.area)) {
      reasons.push('Better size match')
    }

    if (optimalType.basePrice.perNight > currentType.basePrice.perNight) {
      reasons.push('Higher revenue potential')
    }

    if (optimalType.floorPreference?.includes(room.floor)) {
      reasons.push('Floor preference alignment')
    }

    return reasons.join(', ') || 'Better overall match'
  }

  private static getUpgradePriority(category: string): number {
    const priorities = {
      'economy': 1,
      'standard': 2,
      'deluxe': 3,
      'suite': 4,
      'presidential': 5,
      'family': 2,
      'accessible': 2
    }
    return priorities[category as keyof typeof priorities] || 2
  }
}