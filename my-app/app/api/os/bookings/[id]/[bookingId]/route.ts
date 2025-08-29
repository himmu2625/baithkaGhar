import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { connectToDatabase } from '@/lib/mongodb';
import Booking from '@/models/Booking';

// GET: Fetch a specific booking
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, bookingId } = params;

    if (!session || !propertyId || !bookingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      propertyId 
    })
    .populate('userId', 'name email phone')
    .populate('propertyId', 'title address')
    .lean();

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        ...booking,
        _id: booking._id?.toString(),
        id: booking._id?.toString(),
        checkInDate: booking.dateFrom,
        checkOutDate: booking.dateTo,
        totalAmount: booking.totalPrice || 0,
        adults: booking.guests || 1,
        children: 0,
        rooms: 1
      }
    });
  } catch (error) {
    console.error('Booking fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch booking' }, { status: 500 });
  }
}

// PUT: Update a specific booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, bookingId } = params;
    const updateData = await request.json();

    if (!session || !propertyId || !bookingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    // Check if booking exists
    const existingBooking = await Booking.findOne({ 
      _id: bookingId, 
      propertyId 
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Validate date changes if provided
    if (updateData.dateFrom || updateData.dateTo) {
      const newCheckIn = new Date(updateData.dateFrom || existingBooking.dateFrom);
      const newCheckOut = new Date(updateData.dateTo || existingBooking.dateTo);

      if (newCheckOut <= newCheckIn) {
        return NextResponse.json(
          { error: 'Check-out date must be after check-in date' },
          { status: 400 }
        );
      }

      // Check if dates are in the past for confirmed bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (existingBooking.status === 'confirmed' && newCheckIn < today) {
        return NextResponse.json(
          { error: 'Cannot set check-in date in the past for confirmed bookings' },
          { status: 400 }
        );
      }
    }

    // Prepare update fields
    const updateFields: any = { 
      updatedAt: new Date() 
    };

    // Handle status changes with proper timestamps
    if (updateData.status) {
      updateFields.status = updateData.status;
      
      switch (updateData.status) {
        case 'cancelled':
          updateFields.cancelledAt = new Date();
          updateFields.cancellationReason = updateData.cancellationReason || 'Cancelled by admin';
          if (updateData.refundAmount) {
            updateFields.refundAmount = updateData.refundAmount;
            updateFields.refundStatus = 'pending';
            updateFields.refundReason = updateData.refundReason || 'Booking cancelled';
          }
          break;
          
        case 'completed':
          updateFields.completedAt = new Date();
          if (!existingBooking.checkInTime) {
            updateFields.checkInTime = new Date();
          }
          updateFields.checkOutTime = new Date();
          break;
          
        case 'confirmed':
          // Clear any cancellation data if re-confirming
          updateFields.cancelledAt = undefined;
          updateFields.cancellationReason = undefined;
          break;
      }
    }

    // Handle payment status changes
    if (updateData.paymentStatus) {
      updateFields.paymentStatus = updateData.paymentStatus;
      
      if (updateData.paymentStatus === 'completed' && updateData.paymentId) {
        updateFields.paymentId = updateData.paymentId;
      }
    }

    // Handle basic field updates
    if (updateData.dateFrom) updateFields.dateFrom = new Date(updateData.dateFrom);
    if (updateData.dateTo) updateFields.dateTo = new Date(updateData.dateTo);
    if (updateData.guests) updateFields.guests = updateData.guests;
    if (updateData.totalPrice) updateFields.totalPrice = updateData.totalPrice;
    if (updateData.specialRequests !== undefined) updateFields.specialRequests = updateData.specialRequests;
    if (updateData.adminNotes !== undefined) updateFields.adminNotes = updateData.adminNotes;

    // Handle contact details updates
    if (updateData.contactDetails) {
      updateFields.contactDetails = {
        ...existingBooking.contactDetails,
        ...updateData.contactDetails
      };
    }

    // Handle room allocation
    if (updateData.allocatedRoom) {
      updateFields.allocatedRoom = updateData.allocatedRoom;
      updateFields.roomAllocationStatus = 'allocated';
    }

    // Handle check-in/out times
    if (updateData.checkInTime) {
      updateFields.checkInTime = new Date(updateData.checkInTime);
    }
    
    if (updateData.checkOutTime) {
      updateFields.checkOutTime = new Date(updateData.checkOutTime);
      // If checking out, consider setting status to completed
      if (existingBooking.status === 'confirmed') {
        updateFields.status = 'completed';
        updateFields.completedAt = new Date();
      }
    }

    // Handle rating and review
    if (updateData.rating) {
      updateFields.rating = Math.min(5, Math.max(1, updateData.rating));
    }
    
    if (updateData.review) {
      updateFields.review = updateData.review;
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: bookingId, propertyId },
      { $set: updateFields },
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email phone')
    .populate('propertyId', 'title')
    .lean();

    return NextResponse.json({
      success: true,
      booking: {
        ...updatedBooking,
        _id: updatedBooking?._id?.toString(),
        id: updatedBooking?._id?.toString(),
        checkInDate: updatedBooking?.dateFrom,
        checkOutDate: updatedBooking?.dateTo,
        totalAmount: updatedBooking?.totalPrice || 0
      },
      message: 'Booking updated successfully'
    });
  } catch (error) {
    console.error('Booking update error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

// DELETE: Cancel/delete a specific booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, bookingId } = params;
    const { searchParams } = request.nextUrl;
    const reason = searchParams.get('reason') || 'Cancelled by admin';
    const refundAmount = searchParams.get('refundAmount');
    const permanent = searchParams.get('permanent') === 'true';

    if (!session || !propertyId || !bookingId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      propertyId 
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanent deletion (use with caution)
      await Booking.findOneAndDelete({ _id: bookingId, propertyId });
      
      return NextResponse.json({
        success: true,
        message: 'Booking permanently deleted'
      });
    } else {
      // Soft delete - mark as cancelled
      const updateFields: any = {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: session.user?.id,
        updatedAt: new Date()
      };

      // Handle refund if specified
      if (refundAmount && parseFloat(refundAmount) > 0) {
        updateFields.refundAmount = parseFloat(refundAmount);
        updateFields.refundStatus = 'pending';
        updateFields.refundReason = 'Booking cancelled';
      }

      const cancelledBooking = await Booking.findOneAndUpdate(
        { _id: bookingId, propertyId },
        { $set: updateFields },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        booking: {
          ...cancelledBooking?.toObject(),
          _id: cancelledBooking?._id?.toString(),
          id: cancelledBooking?._id?.toString()
        },
        message: 'Booking cancelled successfully'
      });
    }
  } catch (error) {
    console.error('Booking deletion error:', error);
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
  }
}

// PATCH: Quick updates for specific actions
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; bookingId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, bookingId } = params;
    const { action, ...data } = await request.json();

    if (!session || !propertyId || !bookingId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectToDatabase();

    const booking = await Booking.findOne({ 
      _id: bookingId, 
      propertyId 
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let updateFields: any = { updatedAt: new Date() };
    let message = '';

    switch (action) {
      case 'check_in':
        updateFields.checkInTime = new Date();
        updateFields.status = 'confirmed';
        message = 'Guest checked in successfully';
        break;

      case 'check_out':
        updateFields.checkOutTime = new Date();
        updateFields.status = 'completed';
        updateFields.completedAt = new Date();
        message = 'Guest checked out successfully';
        break;

      case 'confirm_payment':
        updateFields.paymentStatus = 'completed';
        if (data.paymentId) updateFields.paymentId = data.paymentId;
        message = 'Payment confirmed successfully';
        break;

      case 'allocate_room':
        if (!data.roomDetails) {
          return NextResponse.json({ error: 'Room details required' }, { status: 400 });
        }
        updateFields.allocatedRoom = data.roomDetails;
        updateFields.roomAllocationStatus = 'allocated';
        message = 'Room allocated successfully';
        break;

      case 'send_confirmation':
        updateFields['emailSent.confirmation'] = new Date();
        message = 'Confirmation email sent';
        break;

      case 'add_review':
        if (data.rating && data.rating >= 1 && data.rating <= 5) {
          updateFields.rating = data.rating;
        }
        if (data.review) {
          updateFields.review = data.review;
        }
        message = 'Review added successfully';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedBooking = await Booking.findOneAndUpdate(
      { _id: bookingId, propertyId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      booking: {
        ...updatedBooking,
        _id: updatedBooking?._id?.toString(),
        id: updatedBooking?._id?.toString()
      },
      message
    });
  } catch (error) {
    console.error('Booking patch error:', error);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}