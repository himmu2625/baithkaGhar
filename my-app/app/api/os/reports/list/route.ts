import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/utils/dbConnect"
import GeneratedReport from "@/models/GeneratedReport"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const reportType = searchParams.get('type') // optional filter

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Build query
    const query: any = { propertyId }
    if (reportType && reportType !== 'all') {
      query.reportType = reportType
    }

    // Fetch reports from database
    const reports = await GeneratedReport.find(query)
      .populate('generatedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(50)

    // Format reports for frontend
    const formattedReports = reports.map((report: any) => ({
      id: report._id.toString(),
      name: report.reportName || `${report.reportType} Report`,
      type: report.reportType,
      lastGenerated: report.createdAt.toISOString(),
      status: report.status,
      size: report.fileSize ? `${(report.fileSize / (1024 * 1024)).toFixed(1)} MB` : undefined,
      downloadUrl: report.fileUrl,
      description: report.description,
      parameters: report.parameters,
      generatedBy: report.generatedBy ? 
        `${report.generatedBy.firstName} ${report.generatedBy.lastName}` : 
        'System'
    }))

    // If no reports found, return some sample system reports
    if (formattedReports.length === 0) {
      const systemReports = [
        {
          id: 'sys-1',
          name: 'Daily Operations Report',
          type: 'daily',
          lastGenerated: new Date().toISOString(),
          status: 'ready' as const,
          description: 'Comprehensive daily operations overview',
          generatedBy: 'System'
        },
        {
          id: 'sys-2',
          name: 'Weekly Revenue Analysis',
          type: 'weekly',
          lastGenerated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: 'ready' as const,
          description: 'Weekly revenue and booking analysis',
          generatedBy: 'System'
        },
        {
          id: 'sys-3',
          name: 'Monthly Performance Report',
          type: 'monthly',
          lastGenerated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ready' as const,
          description: 'Monthly performance metrics and trends',
          generatedBy: 'System'
        },
        {
          id: 'sys-4',
          name: 'Staff Productivity Report',
          type: 'staff',
          lastGenerated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'ready' as const,
          description: 'Staff performance and productivity analysis',
          generatedBy: 'System'
        }
      ]

      return NextResponse.json({
        success: true,
        data: systemReports,
        message: 'No custom reports found, showing system reports'
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedReports
    })

  } catch (error) {
    console.error("Reports List API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch reports list",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST endpoint for generating new reports
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    const { 
      reportType, 
      reportName, 
      description, 
      parameters, 
      generatedBy 
    } = body

    // Create new report record
    const newReport = new GeneratedReport({
      propertyId,
      reportType,
      reportName,
      description,
      parameters,
      status: 'generating',
      generatedBy,
      createdAt: new Date()
    })

    await newReport.save()

    // In a real implementation, you would trigger background job to generate the report
    // For now, we'll simulate the process
    setTimeout(async () => {
      try {
        // Simulate report generation
        await GeneratedReport.findByIdAndUpdate(newReport._id, {
          status: 'ready',
          completedAt: new Date(),
          fileSize: Math.floor(Math.random() * 5000000) + 1000000, // Random size between 1-5MB
          fileUrl: `/api/os/reports/download/${newReport._id}`
        })
      } catch (error) {
        console.error('Error updating report status:', error)
        await GeneratedReport.findByIdAndUpdate(newReport._id, {
          status: 'failed',
          error: 'Report generation failed'
        })
      }
    }, 5000) // Simulate 5 second generation time

    return NextResponse.json({
      success: true,
      data: {
        reportId: newReport._id,
        status: 'generating',
        message: 'Report generation started'
      }
    })

  } catch (error) {
    console.error("Generate Report API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to initiate report generation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}