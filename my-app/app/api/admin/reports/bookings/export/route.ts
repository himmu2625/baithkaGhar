import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Booking from "@/models/Booking"
import dbConnect from "@/lib/db/dbConnect"

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    console.log(`🔍 [POST /api/admin/reports/bookings/export] Export request received`);
    
    await dbConnect()
    
    const session = await auth()
    
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    const body = await req.json()
    const { 
      format = "csv",
      dateRange = "30", 
      status = "all",
      propertyId = null,
      includeFields = ["all"]
    } = body
    
    console.log(`🔍 [POST /api/admin/reports/bookings/export] Export parameters:`, {
      format, dateRange, status, propertyId, includeFields
    });
    
    // Build filter based on parameters
    const filter: any = {}
    
    // Date range filter
    if (dateRange !== "all") {
      const daysAgo = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)
      filter.createdAt = { $gte: startDate }
    }
    
    // Status filter
    if (status !== "all") {
      filter.status = status
    }
    
    // Property filter
    if (propertyId && propertyId !== "all") {
      filter.propertyId = propertyId
    }
    
    console.log(`🔍 [POST /api/admin/reports/bookings/export] MongoDB filter:`, filter);
    
    // Fetch bookings with populated fields
    const bookings = await Booking.find(filter)
      .populate("propertyId", "title address city state")
      .populate("userId", "name email phone")
      .sort({ createdAt: -1 })
      .lean()
    
    console.log(`🔍 [POST /api/admin/reports/bookings/export] Found ${bookings.length} bookings`);
    
    // Define available fields for export
    const availableFields = {
      basic: [
        { key: 'bookingCode', label: 'Booking Code' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Booking Date' },
        { key: 'dateFrom', label: 'Check-in Date' },
        { key: 'dateTo', label: 'Check-out Date' },
        { key: 'guests', label: 'Guests' },
        { key: 'totalPrice', label: 'Total Amount' }
      ],
      guest: [
        { key: 'guestName', label: 'Guest Name' },
        { key: 'guestEmail', label: 'Guest Email' },
        { key: 'guestPhone', label: 'Guest Phone' },
        { key: 'contactName', label: 'Contact Name' },
        { key: 'contactEmail', label: 'Contact Email' },
        { key: 'contactPhone', label: 'Contact Phone' }
      ],
      property: [
        { key: 'propertyName', label: 'Property Name' },
        { key: 'propertyCity', label: 'Property City' },
        { key: 'propertyState', label: 'Property State' }
      ],
      payment: [
        { key: 'paymentStatus', label: 'Payment Status' },
        { key: 'paymentId', label: 'Payment ID' },
        { key: 'originalAmount', label: 'Original Amount' },
        { key: 'discountAmount', label: 'Discount Amount' },
        { key: 'couponCode', label: 'Coupon Code' }
      ],
      advanced: [
        { key: 'specialRequests', label: 'Special Requests' },
        { key: 'adminNotes', label: 'Admin Notes' },
        { key: 'refundAmount', label: 'Refund Amount' },
        { key: 'refundStatus', label: 'Refund Status' },
        { key: 'cancelledAt', label: 'Cancelled At' },
        { key: 'completedAt', label: 'Completed At' }
      ],
      commission: [
        { key: 'referralCode', label: 'Referral Code' },
        { key: 'commissionAmount', label: 'Commission Amount' },
        { key: 'commissionPaid', label: 'Commission Paid' },
        { key: 'travelAgentReferralCode', label: 'Travel Agent Code' },
        { key: 'travelAgentCommissionAmount', label: 'TA Commission' }
      ]
    }
    
    // Determine which fields to include
    let fieldsToExport: Array<{ key: string; label: string }> = []
    
    if (includeFields.includes("all")) {
      fieldsToExport = [
        ...availableFields.basic,
        ...availableFields.guest,
        ...availableFields.property,
        ...availableFields.payment,
        ...availableFields.advanced,
        ...availableFields.commission
      ]
    } else {
      includeFields.forEach((fieldGroup: string) => {
        if (availableFields[fieldGroup as keyof typeof availableFields]) {
          fieldsToExport.push(...availableFields[fieldGroup as keyof typeof availableFields])
        }
      })
    }
    
    // Transform booking data for export
    const exportData = bookings.map((booking: any) => {
      const row: Record<string, any> = {}
      
      fieldsToExport.forEach(({ key, label }) => {
        switch (key) {
          case 'bookingCode':
            row[label] = `BK-${booking._id.toString().slice(-6).toUpperCase()}`
            break
          case 'guestName':
            row[label] = booking.userId?.name || booking.contactDetails?.name || 'Unknown'
            break
          case 'guestEmail':
            row[label] = booking.userId?.email || booking.contactDetails?.email || 'Unknown'
            break
          case 'guestPhone':
            row[label] = booking.userId?.phone || booking.contactDetails?.phone || 'Unknown'
            break
          case 'contactName':
            row[label] = booking.contactDetails?.name || ''
            break
          case 'contactEmail':
            row[label] = booking.contactDetails?.email || ''
            break
          case 'contactPhone':
            row[label] = booking.contactDetails?.phone || ''
            break
          case 'propertyName':
            row[label] = booking.propertyId?.title || booking.propertyName || 'Unknown Property'
            break
          case 'propertyCity':
            row[label] = booking.propertyId?.city || 'Unknown'
            break
          case 'propertyState':
            row[label] = booking.propertyId?.state || 'Unknown'
            break
          case 'createdAt':
          case 'dateFrom':
          case 'dateTo':
          case 'cancelledAt':
          case 'completedAt':
            row[label] = booking[key] ? new Date(booking[key]).toISOString().split('T')[0] : ''
            break
          case 'totalPrice':
          case 'originalAmount':
          case 'discountAmount':
          case 'refundAmount':
          case 'commissionAmount':
          case 'travelAgentCommissionAmount':
            row[label] = booking[key] || 0
            break
          case 'commissionPaid':
            row[label] = booking[key] ? 'Yes' : 'No'
            break
          default:
            row[label] = booking[key] || ''
        }
      })
      
      return row
    })
    
    console.log(`✅ [POST /api/admin/reports/bookings/export] Prepared ${exportData.length} rows for export`);
    
    if (format === "json") {
      return NextResponse.json({
        data: exportData,
        metadata: {
          totalRecords: exportData.length,
          exportedAt: new Date().toISOString(),
          filters: { dateRange, status, propertyId },
          fields: fieldsToExport.map(f => f.label)
        }
      })
    }
    
    if (format === "csv") {
      // Generate CSV content
      const headers = fieldsToExport.map(f => f.label).join(',')
      const csvRows = exportData.map(row => 
        fieldsToExport.map(({ label }) => {
          const value = row[label]
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
      
      const csvContent = [headers, ...csvRows].join('\n')
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }
    
    return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
    
  } catch (error: any) {
    console.error("💥 [POST /api/admin/reports/bookings/export] Error:", error)
    return NextResponse.json({ 
      error: "Failed to export bookings",
      details: error.message
    }, { status: 500 })
  }
}

// GET endpoint to retrieve available export options
export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user || !["admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    
    // Get unique properties for filtering options
    await dbConnect()
    const properties = await Booking.aggregate([
      { $group: { _id: "$propertyId" } },
      { $lookup: { from: "properties", localField: "_id", foreignField: "_id", as: "property" } },
      { $unwind: "$property" },
      { $project: { _id: 1, title: "$property.title" } }
    ])
    
    const exportOptions = {
      formats: [
        { value: "csv", label: "CSV (Excel Compatible)" },
        { value: "json", label: "JSON (Raw Data)" }
      ],
      dateRanges: [
        { value: "7", label: "Last 7 days" },
        { value: "30", label: "Last 30 days" },
        { value: "90", label: "Last 90 days" },
        { value: "365", label: "Last year" },
        { value: "all", label: "All time" }
      ],
      statuses: [
        { value: "all", label: "All statuses" },
        { value: "pending", label: "Pending" },
        { value: "confirmed", label: "Confirmed" },
        { value: "completed", label: "Completed" },
        { value: "cancelled", label: "Cancelled" }
      ],
      properties: [
        { value: "all", label: "All properties" },
        ...properties.map(p => ({ value: p._id, label: p.title }))
      ],
      fieldGroups: [
        { value: "all", label: "All fields" },
        { value: "basic", label: "Basic booking info" },
        { value: "guest", label: "Guest information" },
        { value: "property", label: "Property details" },
        { value: "payment", label: "Payment information" },
        { value: "advanced", label: "Advanced fields" },
        { value: "commission", label: "Commission tracking" }
      ]
    }
    
    return NextResponse.json(exportOptions)
    
  } catch (error: any) {
    console.error("💥 [GET /api/admin/reports/bookings/export] Error:", error)
    return NextResponse.json({ 
      error: "Failed to get export options",
      details: error.message
    }, { status: 500 })
  }
}