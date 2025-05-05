import { NextRequest, NextResponse } from 'next/server'
import getServerSession from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { ReportStatus, ReportType, ReportTargetType } from '@/models/Report'
import mongoose from 'mongoose'
import { connectMongo } from '@/lib/db/mongodb'
import { getReportModel } from '@/lib/models'

// Schema for GET request query parameters
const getReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(['all', ...Object.values(ReportStatus)] as [string, ...string[]]).optional(),
  type: z.enum(['all', ...Object.values(ReportType)] as [string, ...string[]]).optional(),
  targetType: z.enum(['all', ...Object.values(ReportTargetType)] as [string, ...string[]]).optional(),
  sortBy: z.enum(['createdAt', 'status', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Schema for PATCH request body to update report status
const updateReportSchema = z.object({
  id: z.string().min(1),
  status: z.enum(Object.values(ReportStatus) as [string, ...string[]]),
  adminResponse: z.string().optional(),
})

// GET endpoint for fetching reports with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    
    const validatedParams = getReportsQuerySchema.safeParse(queryParams)
    if (!validatedParams.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedParams.error },
        { status: 400 }
      )
    }

    const { page, limit, status, type, targetType, sortBy, sortOrder } = validatedParams.data
    
    try {
      // Connect to MongoDB
      await connectMongo()
      
      // Get the Report model safely using our utility function
      const Report = await getReportModel()
      
      // Build query object
      const query: any = {}
      if (status && status !== 'all') query.status = status
      if (type && type !== 'all') query.type = type
      if (targetType && targetType !== 'all') query.targetType = targetType
      
      // Calculate pagination
      const skip = (page - 1) * limit
      
      // Count total matching documents for pagination info
      const totalReports = await Report.countDocuments(query)
      
      // Execute query with pagination and sorting
      const reports = await Report.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .skip(skip)
        .limit(limit)
        .populate('reporter', 'name email profilePicture')
        .populate('property', 'title location images')
        .populate('user', 'name email profilePicture')
        .populate('review', 'rating comment')
        .populate('booking', 'bookingCode startDate endDate')

      // Generate counts by status for dashboard summary
      const statusCounts = await Report.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
      
      const formattedStatusCounts = Object.values(ReportStatus).reduce((acc, status) => {
        const found = statusCounts.find(item => item._id === status)
        acc[status] = found ? found.count : 0
        return acc
      }, {} as Record<string, number>)
      
      return NextResponse.json({
        reports,
        pagination: {
          page,
          limit,
          totalReports,
          totalPages: Math.ceil(totalReports / limit),
          hasMore: page * limit < totalReports
        },
        statusCounts: formattedStatusCounts
      })
    } catch (err) {
      console.error('Database operation error:', err)
      return NextResponse.json(
        { error: 'Database operation failed', details: err instanceof Error ? err.message : 'Unknown database error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// PATCH endpoint for updating report status
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    let body;
    try {
      body = await request.json()
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const validatedBody = updateReportSchema.safeParse(body)
    if (!validatedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validatedBody.error },
        { status: 400 }
      )
    }
    
    const { id, status, adminResponse } = validatedBody.data
    
    try {
      // Connect to MongoDB and get the Report model
      await connectMongo()
      const Report = await getReportModel()
      
      const report = await Report.findById(id)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      
      // Update the report using correct Mongoose methods
      const updateData: any = { status: status };
      if (adminResponse) updateData.adminResponse = adminResponse;
      
      // Add resolvedAt date if status is being set to RESOLVED or DISMISSED
      if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
        updateData.resolvedAt = new Date();
      }
      
      await Report.updateOne({ _id: id }, updateData);
      
      // Get the updated report
      const updatedReport = await Report.findById(id);
      
      return NextResponse.json({
        success: true,
        report: updatedReport
      })
    } catch (err) {
      console.error('Database update error:', err)
      return NextResponse.json(
        { error: 'Failed to update report', details: err instanceof Error ? err.message : 'Unknown database error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Failed to update report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE endpoint for removing a report
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session as any).user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 })
    }
    
    try {
      // Connect to MongoDB and get the Report model
      await connectMongo()
      const Report = await getReportModel()
      
      const report = await Report.findById(id)
      if (!report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      
      await report.deleteOne()
      
      return NextResponse.json({
        success: true,
        message: 'Report deleted successfully'
      })
    } catch (err) {
      console.error('Database delete error:', err)
      return NextResponse.json(
        { error: 'Failed to delete report', details: err instanceof Error ? err.message : 'Unknown database error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Failed to delete report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 