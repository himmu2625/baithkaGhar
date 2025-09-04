import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Table from "@/models/Table"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// PATCH handler - Update table status
export const PATCH = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
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

    const tableId = params.id
    if (!tableId || !Types.ObjectId.isValid(tableId)) {
      return NextResponse.json(
        { success: false, message: "Valid table ID is required" },
        { status: 400 }
      )
    }

    // Parse request body
    let body;
    try {
      body = await req.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      )
    }

    const { status, notes } = body

    if (!status) {
      return NextResponse.json(
        { success: false, message: "Status is required" },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_order']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Find and update the table
    const table = await Table.findById(tableId)
    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      )
    }

    // Update table status
    table.status = status
    table.lastUpdatedBy = new Types.ObjectId(token.sub)
    table.updatedAt = new Date()

    // Add notes if provided
    if (notes) {
      table.notes = notes
    }

    await table.save()

    // Get updated table with populated data
    const updatedTable = await Table.findById(tableId)
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    // Transform for response
    const responseData = {
      id: updatedTable._id.toString(),
      name: `Table ${updatedTable.number}`,
      number: updatedTable.number,
      capacity: updatedTable.capacity,
      section: updatedTable.section,
      status: updatedTable.status,
      notes: updatedTable.notes || '',
      updatedAt: updatedTable.updatedAt?.toISOString() || '',
      updatedBy: updatedTable.lastUpdatedBy
    }

    return NextResponse.json({
      success: true,
      message: `Table ${updatedTable.number} status updated to ${status}`,
      table: responseData
    })

  } catch (error) {
    console.error('Error updating table status:', error)
    return NextResponse.json(
      { success: false, message: "Failed to update table status" },
      { status: 500 }
    )
  }
})

// GET handler - Get single table details
export const GET = dbHandler(async (req: NextRequest, { params }: { params: { id: string } }) => {
  try {
    await connectMongo()

    const tableId = params.id
    if (!tableId || !Types.ObjectId.isValid(tableId)) {
      return NextResponse.json(
        { success: false, message: "Valid table ID is required" },
        { status: 400 }
      )
    }

    // Find table with populated data
    const table = await Table.findById(tableId)
      .populate('createdBy', 'name email')
      .populate('lastUpdatedBy', 'name email')
      .lean() as any

    if (!table) {
      return NextResponse.json(
        { success: false, message: "Table not found" },
        { status: 404 }
      )
    }

    // Transform for response
    const responseData = {
      id: table._id.toString(),
      name: `Table ${table.number}`,
      number: table.number,
      capacity: table.capacity,
      section: table.section,
      shape: table.shape || 'circle',
      status: table.status,
      isActive: table.isActive,
      features: table.features || [],
      location: table.location || null,
      minimumSpend: table.minimumSpend || 0,
      notes: table.notes || '',
      qrCode: table.qrCode || null,
      settings: table.settings || {},
      createdAt: table.createdAt?.toISOString() || '',
      updatedAt: table.updatedAt?.toISOString() || '',
      createdBy: table.createdBy,
      lastUpdatedBy: table.lastUpdatedBy
    }

    return NextResponse.json({
      success: true,
      table: responseData
    })

  } catch (error) {
    console.error('Error fetching table details:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch table details" },
      { status: 500 }
    )
  }
})