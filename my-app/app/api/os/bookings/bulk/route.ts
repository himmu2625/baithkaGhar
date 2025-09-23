import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { validateOSAccess } from '@/lib/auth/os-auth'
import { connectToDatabase } from '@/lib/mongodb'
import Booking from '@/models/Booking'
import { bulkUpdateSchema, BookingValidator } from '@/lib/validation/booking-validation'
import { ZodError } from 'zod'

// Bulk update bookings
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    const rawData = await request.json()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate request data
    let validatedData
    try {
      validatedData = bulkUpdateSchema.parse(rawData)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        }, { status: 400 })
      }
      throw error
    }

    await connectToDatabase()

    // Get all bookings to verify access
    const bookings = await Booking.find({
      _id: { $in: validatedData.bookingIds }
    }).lean()

    if (bookings.length !== validatedData.bookingIds.length) {
      return NextResponse.json({
        error: 'Some bookings not found',
        found: bookings.length,
        requested: validatedData.bookingIds.length
      }, { status: 404 })
    }

    // Verify access to all properties
    const propertyIds = [...new Set(bookings.map(b => b.propertyId.toString()))]
    const accessChecks = await Promise.all(
      propertyIds.map(propertyId => validateOSAccess(session.user?.email, propertyId))
    )

    if (accessChecks.some(hasAccess => !hasAccess)) {
      return NextResponse.json({ error: 'Access denied to one or more properties' }, { status: 403 })
    }

    // Prepare update fields
    const updateFields: any = {
      updatedAt: new Date()
    }

    if (validatedData.status) {
      updateFields.status = validatedData.status

      if (validatedData.status === 'cancelled') {
        updateFields.cancelledAt = new Date()
        updateFields.cancelledBy = session.user?.id
        updateFields.cancellationReason = validatedData.cancellationReason

        if (validatedData.refundAmount) {
          updateFields.refundAmount = validatedData.refundAmount
          updateFields.refundStatus = 'pending'
          updateFields.refundReason = 'Bulk cancellation'
        }
      } else if (validatedData.status === 'completed') {
        updateFields.completedAt = new Date()
      }
    }

    if (validatedData.paymentStatus) {
      updateFields.paymentStatus = validatedData.paymentStatus
    }

    if (validatedData.adminNotes) {
      updateFields.adminNotes = validatedData.adminNotes
    }

    // Execute bulk update
    const result = await Booking.updateMany(
      { _id: { $in: validatedData.bookingIds } },
      { $set: updateFields }
    )

    return NextResponse.json({
      success: true,
      updated: result.modifiedCount,
      message: `${result.modifiedCount} booking(s) updated successfully`
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json(
      { error: 'Failed to update bookings' },
      { status: 500 }
    )
  }
}

// Bulk delete/cancel bookings
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    const { searchParams } = request.nextUrl
    const bookingIds = searchParams.get('ids')?.split(',') || []
    const reason = searchParams.get('reason') || 'Bulk cancellation'
    const permanent = searchParams.get('permanent') === 'true'

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (bookingIds.length === 0) {
      return NextResponse.json({ error: 'No booking IDs provided' }, { status: 400 })
    }

    await connectToDatabase()

    // Get all bookings to verify access
    const bookings = await Booking.find({
      _id: { $in: bookingIds }
    }).lean()

    if (bookings.length === 0) {
      return NextResponse.json({ error: 'No bookings found' }, { status: 404 })
    }

    // Verify access to all properties
    const propertyIds = [...new Set(bookings.map(b => b.propertyId.toString()))]
    const accessChecks = await Promise.all(
      propertyIds.map(propertyId => validateOSAccess(session.user?.email, propertyId))
    )

    if (accessChecks.some(hasAccess => !hasAccess)) {
      return NextResponse.json({ error: 'Access denied to one or more properties' }, { status: 403 })
    }

    if (permanent) {
      // Permanent deletion (use with extreme caution)
      const result = await Booking.deleteMany({
        _id: { $in: bookingIds }
      })

      return NextResponse.json({
        success: true,
        deleted: result.deletedCount,
        message: `${result.deletedCount} booking(s) permanently deleted`
      })
    } else {
      // Soft delete - mark as cancelled
      const result = await Booking.updateMany(
        { _id: { $in: bookingIds } },
        {
          $set: {
            status: 'cancelled',
            cancelledAt: new Date(),
            cancellationReason: reason,
            cancelledBy: session.user?.id,
            updatedAt: new Date()
          }
        }
      )

      return NextResponse.json({
        success: true,
        cancelled: result.modifiedCount,
        message: `${result.modifiedCount} booking(s) cancelled successfully`
      })
    }
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookings' },
      { status: 500 }
    )
  }
}