import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params

    // Mock room data for the property
    const mockRooms = [
      {
        _id: `room_${propertyId}_1`,
        number: '101',
        type: 'Deluxe King',
        status: 'available',
        floor: 1,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar'],
        lastCleaned: new Date().toISOString(),
        isOccupied: false,
        currentGuest: null,
        nextCheckIn: null,
        nextCheckOut: null
      },
      {
        _id: `room_${propertyId}_2`,
        number: '102',
        type: 'Standard Queen',
        status: 'occupied',
        floor: 1,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac'],
        lastCleaned: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isOccupied: true,
        currentGuest: 'John Doe',
        nextCheckIn: null,
        nextCheckOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        _id: `room_${propertyId}_3`,
        number: '103',
        type: 'Suite',
        status: 'maintenance',
        floor: 1,
        capacity: 4,
        amenities: ['wifi', 'tv', 'ac', 'minibar', 'jacuzzi'],
        lastCleaned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isOccupied: false,
        currentGuest: null,
        nextCheckIn: null,
        nextCheckOut: null
      },
      {
        _id: `room_${propertyId}_4`,
        number: '201',
        type: 'Deluxe King',
        status: 'cleaning',
        floor: 2,
        capacity: 2,
        amenities: ['wifi', 'tv', 'ac', 'minibar'],
        lastCleaned: new Date().toISOString(),
        isOccupied: false,
        currentGuest: null,
        nextCheckIn: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        nextCheckOut: null
      }
    ]

    return NextResponse.json({
      success: true,
      rooms: mockRooms,
      totalRooms: mockRooms.length,
      available: mockRooms.filter(room => room.status === 'available').length,
      occupied: mockRooms.filter(room => room.status === 'occupied').length,
      maintenance: mockRooms.filter(room => room.status === 'maintenance').length,
      cleaning: mockRooms.filter(room => room.status === 'cleaning').length
    })

  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rooms',
        rooms: []
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params
    const body = await request.json()
    const { roomId, status, notes } = body

    // Mock room status update
    console.log(`Updating room ${roomId} in property ${propertyId} to status: ${status}`)

    return NextResponse.json({
      success: true,
      message: 'Room status updated successfully',
      room: {
        _id: roomId,
        status: status,
        updatedAt: new Date().toISOString(),
        notes: notes || ''
      }
    })

  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update room status'
      },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params
    const body = await request.json()
    const { number, type, floor, capacity, amenities } = body

    // Mock room creation
    const newRoom = {
      _id: `room_${propertyId}_${Date.now()}`,
      number: number,
      type: type,
      status: 'available',
      floor: floor,
      capacity: capacity,
      amenities: amenities || [],
      lastCleaned: new Date().toISOString(),
      isOccupied: false,
      currentGuest: null,
      nextCheckIn: null,
      nextCheckOut: null,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'Room created successfully',
      room: newRoom
    })

  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create room'
      },
      { status: 500 }
    )
  }
}