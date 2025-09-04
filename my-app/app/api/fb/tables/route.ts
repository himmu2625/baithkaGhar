import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Table from "@/models/Table"
import Order from "@/models/Order"
import Reservation from "@/models/Reservation"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all tables for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const section = searchParams.get('section')
    const status = searchParams.get('status')
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const withDetails = searchParams.get('withDetails') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (section) {
      query.section = section
    }
    
    if (status) {
      query.status = status
    }
    
    if (!includeInactive) {
      query.isActive = true
    }

    const tables = await Table.find(query)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .sort({ section: 1, number: 1 })
      .lean() as any[]

    // Get current orders and reservations for each table if requested
    const tablesWithDetails = await Promise.all(
      tables.map(async (table) => {
        let currentOrder = null
        let reservation = null

        if (withDetails) {
          // Get current active order
          currentOrder = await Order.findOne({
            tableId: table._id,
            status: { $in: ['confirmed', 'preparing', 'ready', 'served'] },
            orderType: 'dine_in'
          })
          .populate('items.itemId', 'name basePrice')
          .sort({ 'timestamps.ordered': -1 })
          .lean() as any

          // Get today's reservation for this table
          const today = new Date()
          const startOfDay = new Date(today)
          startOfDay.setHours(0, 0, 0, 0)
          const endOfDay = new Date(today)
          endOfDay.setHours(23, 59, 59, 999)

          reservation = await Reservation.findOne({
            'tableAssignment.assignedTableId': table._id,
            'reservationDetails.reservationDate': { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['confirmed', 'pending'] },
            isActive: true
          })
          .select('reservationNumber customer reservationDetails status')
          .lean() as any
        }

        // Transform table data to match frontend interface
        return {
          id: table._id.toString(),
          name: `Table ${table.number}`,
          capacity: table.capacity,
          shape: table.shape || 'circle', // Default shape if not specified
          position: table.location?.coordinates || { x: 100, y: 100 }, // Default position
          rotation: 0, // Could be added to Table model if needed
          status: table.status === 'out_of_order' ? 'maintenance' : table.status, // Map status
          isActive: table.isActive,
          section: table.section,
          currentOrder: currentOrder ? {
            id: currentOrder._id.toString(),
            orderNumber: currentOrder.orderNumber,
            customerName: currentOrder.guestInfo?.name || 'Guest',
            partySize: currentOrder.guestInfo?.partySize || 1,
            startTime: currentOrder.timestamps?.ordered?.toISOString() || '',
            totalAmount: currentOrder.pricing?.total || 0
          } : undefined,
          reservation: reservation ? {
            id: reservation._id.toString(),
            customerName: reservation.customer?.contactInfo?.name || 'Guest',
            partySize: reservation.reservationDetails?.partySize || 1,
            reservationTime: reservation.reservationDetails?.reservationTime || '',
            phone: reservation.customer?.contactInfo?.phone || ''
          } : undefined,
          features: table.features || [],
          minimumSpend: table.minimumSpend || 0,
          notes: table.notes || '',
          qrCode: table.qrCode || null,
          settings: table.settings,
          createdAt: table.createdAt,
          updatedAt: table.updatedAt
        }
      })
    )

    return NextResponse.json({
      success: true,
      tables: tablesWithDetails,
      total: tablesWithDetails.length
    })

  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch tables" },
      { status: 500 }
    )
  }
})

// POST handler - Create new table
export const POST = dbHandler(async (req: NextRequest) => {
  try {
    // Validate authentication
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token || !token.sub) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Please log in" },
        { status: 401 }
      )
    }

    await connectMongo()

    // Parse and validate request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    const {
      propertyId,
      number,
      capacity,
      section,
      shape = 'circle',
      position = { x: 100, y: 100 },
      features = [],
      minimumSpend = 0,
      notes = ''
    } = body

    // Validate required fields
    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!number || typeof number !== 'number' || number <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid table number is required" },
        { status: 400 }
      )
    }

    if (!capacity || typeof capacity !== 'number' || capacity <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid table capacity is required" },
        { status: 400 }
      )
    }

    if (!section || typeof section !== 'string') {
      return NextResponse.json(
        { success: false, message: "Table section is required" },
        { status: 400 }
      )
    }

    // Check if table number already exists in the same property
    const existingTable = await Table.findOne({
      propertyId: new Types.ObjectId(propertyId),
      number,
      isActive: true
    })

    if (existingTable) {
      return NextResponse.json(
        { success: false, message: `Table ${number} already exists in this property` },
        { status: 409 }
      )
    }

    // Create table data
    const tableData = {
      propertyId: new Types.ObjectId(propertyId),
      number,
      capacity,
      section,
      shape,
      location: {
        type: 'Point',
        coordinates: [position.x, position.y]
      },
      features,
      minimumSpend,
      notes,
      status: 'available',
      isActive: true,
      settings: {
        allowOnlineReservation: true,
        requiresDeposit: false,
        depositAmount: 0,
        maxReservationTime: 120,
        allowSelfService: false
      },
      createdBy: new Types.ObjectId(token.sub),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const newTable = await Table.create(tableData)

    // Populate the created table
    const populatedTable = await Table.findById(newTable._id)
      .populate('createdBy', 'name email')
      .lean() as any

    // Transform for response
    const responseTable = {
      id: populatedTable._id.toString(),
      name: `Table ${populatedTable.number}`,
      capacity: populatedTable.capacity,
      shape: populatedTable.shape || 'circle',
      position: {
        x: populatedTable.location?.coordinates[0] || 100,
        y: populatedTable.location?.coordinates[1] || 100
      },
      rotation: 0,
      status: populatedTable.status,
      isActive: populatedTable.isActive,
      section: populatedTable.section,
      features: populatedTable.features || [],
      minimumSpend: populatedTable.minimumSpend || 0,
      notes: populatedTable.notes || '',
      settings: populatedTable.settings,
      createdAt: populatedTable.createdAt,
      createdBy: populatedTable.createdBy
    }

    return NextResponse.json({
      success: true,
      message: "Table created successfully",
      table: responseTable
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating table:', error)
    return NextResponse.json(
      { success: false, message: "Failed to create table" },
      { status: 500 }
    )
  }
})