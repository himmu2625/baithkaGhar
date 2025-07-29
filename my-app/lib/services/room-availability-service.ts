import Property from '@/models/Property';
import Booking from '@/models/Booking';
import dbConnect from '@/lib/db/dbConnect';

export interface RoomAvailability {
  unitTypeCode: string;
  unitTypeName: string;
  availableRooms: Array<{
    roomNumber: string;
    roomId: string;
    status: 'available' | 'booked' | 'maintenance';
  }>;
  totalRooms: number;
  availableCount: number;
}

export interface RoomAllocationResult {
  success: boolean;
  allocatedRoom?: {
    unitTypeCode: string;
    unitTypeName: string;
    roomNumber: string;
    roomId: string;
  };
  error?: string;
}

export class RoomAvailabilityService {
  /**
   * Get available rooms for a property during specific dates
   */
  static async getAvailableRooms(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: string,
    unitTypeCode?: string
  ): Promise<RoomAvailability[]> {
    await dbConnect();

    const property = await Property.findById(propertyId);
    if (!property) {
      throw new Error('Property not found');
    }

    const availabilities: RoomAvailability[] = [];

    // Process each property unit
    for (const unit of property.propertyUnits || []) {
      // If specific unit type is requested, skip others
      if (unitTypeCode && unit.unitTypeCode !== unitTypeCode) {
        continue;
      }

      const availableRooms = [];
      const totalRooms = unit.count || 0;

      // Check each room in this unit type
      for (let i = 0; i < totalRooms; i++) {
        const roomNumber = unit.roomNumbers?.[i]?.number || `${unit.unitTypeCode}-${i + 1}`;
        const roomStatus = unit.roomNumbers?.[i]?.status || 'available';
        const roomId = `${unit.unitTypeCode}-${i}`;

        // Check if room is available for the booking period
        const isBooked = await this.isRoomBooked(
          propertyId,
          unit.unitTypeCode,
          roomNumber,
          checkInDate,
          new Date(checkOutDate)
        );

        const finalStatus = isBooked ? 'booked' : roomStatus;

        if (finalStatus === 'available') {
          availableRooms.push({
            roomNumber,
            roomId,
            status: finalStatus
          });
        }
      }

      availabilities.push({
        unitTypeCode: unit.unitTypeCode,
        unitTypeName: unit.unitTypeName,
        availableRooms,
        totalRooms,
        availableCount: availableRooms.length
      });
    }

    return availabilities;
  }

  /**
   * Check if a specific room is booked during given dates
   */
  static async isRoomBooked(
    propertyId: string,
    unitTypeCode: string,
    roomNumber: string,
    checkInDate: Date,
    checkOutDate: Date
  ): Promise<boolean> {
    const conflictingBooking = await Booking.findOne({
      propertyId,
      'allocatedRoom.unitTypeCode': unitTypeCode,
      'allocatedRoom.roomNumber': roomNumber,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        // Check-in date falls within existing booking
        {
          dateFrom: { $lte: checkInDate },
          dateTo: { $gt: checkInDate }
        },
        // Check-out date falls within existing booking
        {
          dateFrom: { $lt: checkOutDate },
          dateTo: { $gte: checkOutDate }
        },
        // Booking completely encompasses existing booking
        {
          dateFrom: { $gte: checkInDate },
          dateTo: { $lte: checkOutDate }
        }
      ]
    });

    return !!conflictingBooking;
  }

  /**
   * Allocate a random available room for booking
   */
  static async allocateRoom(
    propertyId: string,
    checkInDate: Date,
    checkOutDate: Date,
    unitTypeCode?: string
  ): Promise<RoomAllocationResult> {
    try {
      const availabilities = await this.getAvailableRooms(
        propertyId,
        checkInDate,
        checkOutDate,
        unitTypeCode
      );

      // Find units with available rooms
      const availableUnits = availabilities.filter(unit => unit.availableCount > 0);

      if (availableUnits.length === 0) {
        return {
          success: false,
          error: 'No rooms available for the selected dates'
        };
      }

      // Select a random unit with available rooms
      const selectedUnit = availableUnits[Math.floor(Math.random() * availableUnits.length)];

      // Select a random available room from the unit
      const selectedRoom = selectedUnit.availableRooms[
        Math.floor(Math.random() * selectedUnit.availableRooms.length)
      ];

      return {
        success: true,
        allocatedRoom: {
          unitTypeCode: selectedUnit.unitTypeCode,
          unitTypeName: selectedUnit.unitTypeName,
          roomNumber: selectedRoom.roomNumber,
          roomId: selectedRoom.roomId
        }
      };
    } catch (error) {
      console.error('Error allocating room:', error);
      return {
        success: false,
        error: 'Failed to allocate room'
      };
    }
  }

  /**
   * Update room status in property (for admin control)
   */
  static async updateRoomStatus(
    propertyId: string,
    unitTypeCode: string,
    roomNumber: string,
    status: 'available' | 'booked' | 'maintenance'
  ): Promise<boolean> {
    try {
      await dbConnect();

      const property = await Property.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Find the unit and update the room status
      const unitIndex = property.propertyUnits?.findIndex(
        unit => unit.unitTypeCode === unitTypeCode
      );

      if (unitIndex === -1 || unitIndex === undefined) {
        throw new Error('Unit type not found');
      }

      const roomIndex = property.propertyUnits[unitIndex].roomNumbers?.findIndex(
        room => room.number === roomNumber
      );

      if (roomIndex === -1 || roomIndex === undefined) {
        throw new Error('Room not found');
      }

      // Update the room status
      property.propertyUnits[unitIndex].roomNumbers[roomIndex].status = status;
      await property.save();

      return true;
    } catch (error) {
      console.error('Error updating room status:', error);
      return false;
    }
  }

  /**
   * Get room allocation status for a booking
   */
  static async getBookingRoomAllocation(bookingId: string): Promise<any> {
    await dbConnect();
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    return {
      allocatedRoom: booking.allocatedRoom,
      roomAllocationStatus: booking.roomAllocationStatus
    };
  }

  /**
   * Manually allocate a specific room for a booking (admin function)
   */
  static async manuallyAllocateRoom(
    bookingId: string,
    unitTypeCode: string,
    roomNumber: string
  ): Promise<boolean> {
    try {
      await dbConnect();

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if room is available for the booking period
      const isBooked = await this.isRoomBooked(
        booking.propertyId.toString(),
        unitTypeCode,
        roomNumber,
        booking.dateFrom,
        booking.dateTo
      );

      if (isBooked) {
        throw new Error('Room is not available for the selected dates');
      }

      // Get property to get unit type name
      const property = await Property.findById(booking.propertyId);
      const unit = property?.propertyUnits?.find(u => u.unitTypeCode === unitTypeCode);

      // Update booking with room allocation
      booking.allocatedRoom = {
        unitTypeCode,
        unitTypeName: unit?.unitTypeName || unitTypeCode,
        roomNumber,
        roomId: `${unitTypeCode}-${roomNumber}`
      };
      booking.roomAllocationStatus = 'allocated';

      await booking.save();
      return true;
    } catch (error) {
      console.error('Error manually allocating room:', error);
      return false;
    }
  }
} 