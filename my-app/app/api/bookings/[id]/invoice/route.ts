import { NextRequest, NextResponse } from "next/server";
import { dbHandler } from "@/lib/db";
import { getSession } from "@/lib/get-session";
import mongoose from "mongoose";
import Booking from "@/models/Booking";
import { convertDocToObj } from "@/lib/db";

interface Params {
  params: {
    id: string;
  };
}

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

export const GET = dbHandler(async (_: Request, { params }: Params) => {
  const { id } = params;
  const session = await getSession();

  console.log(`🧾 [GET /api/bookings/${id}/invoice] Request received`);

  if (!session?.user) {
    console.log(`❌ [GET /api/bookings/${id}/invoice] Unauthorized - no session or user`);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log(`❌ [GET /api/bookings/${id}/invoice] Invalid booking ID format`);
    return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
  }

  try {
    console.log(`🔍 [GET /api/bookings/${id}/invoice] Searching for booking...`);
    
    const booking = await Booking.findById(id)
      .populate("propertyId")
      .populate("userId", "name email")
      .lean();

    if (!booking) {
      console.log(`❌ [GET /api/bookings/${id}/invoice] Booking not found`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Authorization check
    const isOwner = booking.propertyId?.ownerId?.toString() === session.user.id;
    const isBooker = (booking.userId as any)?._id?.toString() === session.user.id;

    if (!isOwner && !isBooker && session.user.role !== "admin") {
      console.log(`❌ [GET /api/bookings/${id}/invoice] Unauthorized access`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(booking);
    
    // For now, return HTML (in production, you'd convert this to PDF)
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(-6).toUpperCase()}.html"`,
      },
    });

  } catch (error: any) {
    console.error(`💥 [GET /api/bookings/${id}/invoice] Error:`, error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
});

function generateInvoiceHTML(booking: any): string {
  const checkIn = new Date(booking.dateFrom || booking.checkInDate);
  const checkOut = new Date(booking.dateTo || booking.checkOutDate);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const bookingId = `BK-${booking._id.toString().slice(-6).toUpperCase()}`;
  
  const basePrice = booking.totalPrice / 1.12;
  const taxes = booking.totalPrice - basePrice;

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice - ${bookingId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #4CAF50; }
        .invoice-title { font-size: 28px; margin: 20px 0; }
        .invoice-details { display: flex; justify-content: space-between; margin: 30px 0; }
        .section { margin: 20px 0; }
        .section h3 { color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
        .booking-info { background: #f9f9f9; padding: 20px; border-radius: 8px; }
        .price-breakdown { border: 1px solid #ddd; border-radius: 8px; overflow: hidden; }
        .price-row { display: flex; justify-content: space-between; padding: 12px 20px; }
        .price-row:nth-child(even) { background: #f9f9f9; }
        .total-row { background: #4CAF50; color: white; font-weight: bold; }
        .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">🏠 BAITHAKA GHAR</div>
        <h1 class="invoice-title">BOOKING INVOICE</h1>
    </div>

    <div class="invoice-details">
        <div>
            <strong>Invoice Number:</strong> ${bookingId}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
            <strong>Status:</strong> ${booking.status || 'Confirmed'}
        </div>
        <div>
            <strong>Guest:</strong> ${booking.userId?.name || 'N/A'}<br>
            <strong>Email:</strong> ${booking.userId?.email || 'N/A'}<br>
            <strong>Phone:</strong> ${booking.contactDetails?.phone || 'N/A'}
        </div>
    </div>

    <div class="section">
        <h3>Property Details</h3>
        <div class="booking-info">
            <strong>Property:</strong> ${booking.propertyId?.title || booking.propertyName || 'N/A'}<br>
            <strong>Location:</strong> ${booking.propertyId?.location || booking.propertyId?.address?.city || 'N/A'}<br>
            <strong>Type:</strong> ${booking.propertyId?.propertyType || 'Hotel'}
        </div>
    </div>

    <div class="section">
        <h3>Booking Details</h3>
        <div class="booking-info">
            <strong>Check-in:</strong> ${checkIn.toLocaleDateString()} (2:00 PM)<br>
            <strong>Check-out:</strong> ${checkOut.toLocaleDateString()} (11:00 AM)<br>
            <strong>Duration:</strong> ${nights} night(s)<br>
            <strong>Guests:</strong> ${booking.guests} guest(s)<br>
            <strong>Rooms:</strong> ${booking.rooms || 1} room(s)
        </div>
    </div>

    <div class="section">
        <h3>Price Breakdown</h3>
        <div class="price-breakdown">
            <div class="price-row">
                <span>Room Price (${nights} nights)</span>
                <span>₹${basePrice.toFixed(2)}</span>
            </div>
            <div class="price-row">
                <span>Taxes & Fees (12%)</span>
                <span>₹${taxes.toFixed(2)}</span>
            </div>
            <div class="price-row total-row">
                <span>Total Amount</span>
                <span>₹${booking.totalPrice.toFixed(2)}</span>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Thank you for choosing Baithaka Ghar!</p>
        <p>For support, contact us at support@baithakaghar.com | +91 8800 123 456</p>
        <p>This is a computer-generated invoice and does not require a signature.</p>
    </div>
</body>
</html>`;
} 