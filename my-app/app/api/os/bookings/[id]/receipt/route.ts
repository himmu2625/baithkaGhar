import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, canAccessProperty } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { renderToStream } from '@react-pdf/renderer';
import PaymentReceipt from '@/components/os/PaymentReceipt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getOwnerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Fetch booking with populated data
    const booking = await Booking.findById(params.id)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title location address email contactNo')
      .lean();

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Authorization check
    const hasAccess = await canAccessProperty(
      session.user.id!,
      booking.propertyId._id.toString()
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have access to this booking' },
        { status: 403 }
      );
    }

    // Verify payment has been collected (optional - uncomment if needed)
    // if (!booking.isPartialPayment || booking.hotelPaymentStatus !== 'collected') {
    //   return NextResponse.json(
    //     { error: 'Receipt can only be generated for collected payments' },
    //     { status: 400 }
    //   );
    // }

    // Generate receipt number (format: REC-YYYYMMDD-BOOKINGID)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const receiptNumber = `REC-${dateStr}-${booking._id.toString().slice(-8).toUpperCase()}`;

    // Generate PDF
    const stream = await renderToStream(
      PaymentReceipt({
        booking,
        property: booking.propertyId,
        receiptNumber,
      })
    );

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Return PDF as download
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${booking._id}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
