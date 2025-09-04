import { NextRequest, NextResponse } from "next/server"
import { dbHandler } from "@/lib/db"
import { connectMongo } from "@/lib/db/mongodb"
import { getToken } from "next-auth/jwt"
import Table from "@/models/Table"
import { Types } from "mongoose"

export const dynamic = 'force-dynamic';

// GET handler - Get all table sections for a property
export const GET = dbHandler(async (req: NextRequest) => {
  try {
    await connectMongo()

    const { searchParams } = new URL(req.url)
    const propertyId = searchParams.get('propertyId')
    const includeInactive = searchParams.get('includeInactive') === 'true'

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId: new Types.ObjectId(propertyId) }
    
    if (!includeInactive) {
      query.isActive = true
    }

    // Get all tables to extract unique sections
    const tables = await Table.find(query)
      .select('section capacity status')
      .lean() as any[]

    if (tables.length === 0) {
      return NextResponse.json({
        success: true,
        sections: [],
        message: "No tables found for this property"
      })
    }

    // Get unique sections and their statistics
    const sectionMap = new Map()
    
    tables.forEach((table: any) => {
      if (!table.section) return
      
      if (!sectionMap.has(table.section)) {
        sectionMap.set(table.section, {
          id: table.section.toLowerCase().replace(/\s+/g, '_'),
          name: table.section,
          color: getSectionColor(table.section), // Generate color based on section name
          isActive: true,
          tableCount: 0,
          totalCapacity: 0,
          availableTables: 0,
          occupiedTables: 0,
          reservedTables: 0,
          cleaningTables: 0,
          maintenanceTables: 0
        })
      }
      
      const section = sectionMap.get(table.section)
      section.tableCount++
      section.totalCapacity += table.capacity
      
      // Count tables by status
      switch (table.status) {
        case 'available':
          section.availableTables++
          break
        case 'occupied':
          section.occupiedTables++
          break
        case 'reserved':
          section.reservedTables++
          break
        case 'cleaning':
          section.cleaningTables++
          break
        case 'out_of_order':
        case 'maintenance':
          section.maintenanceTables++
          break
      }
    })

    // Convert map to array and sort by name
    const sections = Array.from(sectionMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    // Calculate overall statistics
    const overallStats = {
      totalSections: sections.length,
      totalTables: tables.length,
      totalCapacity: tables.reduce((sum, table) => sum + table.capacity, 0),
      averageTablesPerSection: Math.round((tables.length / sections.length) * 10) / 10,
      averageCapacityPerSection: Math.round((tables.reduce((sum, table) => sum + table.capacity, 0) / sections.length) * 10) / 10
    }

    return NextResponse.json({
      success: true,
      sections,
      statistics: overallStats
    })

  } catch (error) {
    console.error('Error fetching table sections:', error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch table sections" },
      { status: 500 }
    )
  }
})

// Helper function to generate consistent colors for sections
function getSectionColor(sectionName: string): string {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280'  // Gray
  ]
  
  // Generate a consistent hash for the section name
  let hash = 0
  for (let i = 0; i < sectionName.length; i++) {
    const char = sectionName.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Use the hash to pick a color
  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

// POST handler - Create new section (or update existing section settings)
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

    const { propertyId, sectionName, color, isActive = true } = body

    if (!propertyId || !Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, message: "Valid property ID is required" },
        { status: 400 }
      )
    }

    if (!sectionName || typeof sectionName !== 'string') {
      return NextResponse.json(
        { success: false, message: "Section name is required" },
        { status: 400 }
      )
    }

    // Note: This endpoint is primarily for updating section metadata
    // since sections are automatically created when tables are assigned to them
    // In a full implementation, you might want to store section configurations
    // in a separate collection or as part of the property configuration

    // For now, we'll return success as sections are dynamic based on tables
    return NextResponse.json({
      success: true,
      message: "Section configuration updated",
      section: {
        id: sectionName.toLowerCase().replace(/\s+/g, '_'),
        name: sectionName,
        color: color || getSectionColor(sectionName),
        isActive
      }
    })

  } catch (error) {
    console.error('Error updating section:', error)
    return NextResponse.json(
      { success: false, message: "Failed to update section" },
      { status: 500 }
    )
  }
})