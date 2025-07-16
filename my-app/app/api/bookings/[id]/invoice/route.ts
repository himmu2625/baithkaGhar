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
      .populate("propertyId", "title address images price ownerId")
      .populate("userId", "name email")
      .lean();

    if (!booking || Array.isArray(booking)) {
      console.log(`❌ [GET /api/bookings/${id}/invoice] Booking not found or invalid type`);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    const bookingObj = booking as any;

    // Authorization check
    const isOwner = (bookingObj as any).propertyId?.ownerId?.toString() === session.user.id;
    const isBooker = ((bookingObj as any).userId as any)?._id?.toString() === session.user.id;

    if (!isOwner && !isBooker && session.user.role !== "admin") {
      console.log(`❌ [GET /api/bookings/${id}/invoice] Unauthorized access`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(bookingObj);
    
    // For now, return HTML as downloadable file
    // In production, you would use puppeteer or similar to convert to PDF
    return new NextResponse(invoiceHTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice-${id.slice(-6).toUpperCase()}.html"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
  const invoiceDate = new Date();
  
  const totalPrice = booking.totalPrice || 0;
  const basePrice = totalPrice / 1.12;
  const taxes = totalPrice - basePrice;
  const serviceFee = basePrice * 0.05; // 5% service fee
  const actualBasePrice = basePrice - serviceFee;

  // Fallback data handling
  const guestName = booking.userId?.name || booking.contactDetails?.name || 'Guest';
  const guestEmail = booking.userId?.email || booking.contactDetails?.email || 'N/A';
  const guestPhone = booking.contactDetails?.phone || 'N/A';
  const propertyName = booking.propertyId?.title || booking.propertyName || 'Property';
  const propertyLocation = booking.propertyId?.address?.city || booking.propertyId?.city || 'Location';
  const propertyState = booking.propertyId?.address?.state || booking.propertyId?.state || 'State';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - ${bookingId}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
        }
        
        body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            color: #2c3e50; 
            background-color: #ffffff;
            font-size: 14px;
        }
        
        .invoice-container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            min-height: 100vh;
            padding: 0;
        }
        
        .header { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
            color: white; 
            padding: 40px 50px 30px; 
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 200px;
            background: rgba(76, 175, 80, 0.1);
            border-radius: 50%;
            transform: translate(50%, -50%);
        }
        
        .logo-section { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            margin-bottom: 30px;
            position: relative;
            z-index: 2;
        }
        
        .logo { 
            font-size: 32px; 
            font-weight: 700; 
            color: #4CAF50;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .company-details {
            text-align: right;
            font-size: 12px;
            line-height: 1.4;
            opacity: 0.9;
        }
        
        .invoice-title { 
            font-size: 42px; 
            font-weight: 300; 
            letter-spacing: 2px;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
        }
        
        .invoice-subtitle {
            font-size: 16px;
            opacity: 0.8;
            position: relative;
            z-index: 2;
        }
        
        .content { 
            padding: 50px; 
        }
        
        .invoice-meta { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin-bottom: 40px;
            background: #f8f9fa;
            padding: 30px;
            border-radius: 12px;
            border: 1px solid #e9ecef;
        }
        
        .meta-section h3 { 
            color: #4CAF50; 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 15px; 
            border-bottom: 2px solid #4CAF50; 
            padding-bottom: 8px; 
            display: inline-block;
        }
        
        .meta-info { 
            display: grid; 
            gap: 8px; 
        }
        
        .info-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
        }
        
        .info-label { 
            font-weight: 500; 
            color: #6c757d; 
            font-size: 13px;
        }
        
        .info-value { 
            font-weight: 600; 
            color: #2c3e50;
        }
        
        .booking-details { 
            background: white; 
            border: 2px solid #e9ecef; 
            border-radius: 16px; 
            padding: 30px; 
            margin: 30px 0;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .section-title { 
            color: #2c3e50; 
            font-size: 20px; 
            font-weight: 600; 
            margin-bottom: 25px; 
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .property-info { 
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); 
            border-radius: 12px; 
            padding: 25px; 
            margin-bottom: 25px;
            border: 1px solid #dee2e6;
        }
        
        .property-name { 
            font-size: 24px; 
            font-weight: 700; 
            color: #2c3e50; 
            margin-bottom: 8px;
        }
        
        .property-location { 
            color: #6c757d; 
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .detail-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 25px 0;
        }
        
        .detail-item { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 10px; 
            border-left: 4px solid #4CAF50;
            transition: transform 0.2s ease;
        }
        
        .detail-item:hover {
            transform: translateY(-2px);
        }
        
        .detail-item h4 { 
            color: #6c757d; 
            font-size: 12px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            margin-bottom: 8px;
        }
        
        .detail-item p { 
            color: #2c3e50; 
            font-size: 16px; 
            font-weight: 600;
        }
        
        .price-breakdown { 
            background: #ffffff; 
            border: 2px solid #e9ecef; 
            border-radius: 16px; 
            overflow: hidden; 
            margin: 30px 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .price-header {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 20px 30px;
            border-bottom: 2px solid #dee2e6;
        }
        
        .price-header h3 {
            color: #2c3e50;
            font-size: 18px;
            font-weight: 600;
            margin: 0;
        }
        
        .price-row { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 18px 30px; 
            border-bottom: 1px solid #f1f3f4;
        }
        
        .price-row:last-child { 
            border-bottom: none; 
        }
        
        .price-row.subtotal {
            background: #f8f9fa;
            font-weight: 500;
        }
        
        .price-row.total { 
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
            color: white; 
            font-weight: 700; 
            font-size: 18px;
            border-bottom: none;
        }
        
        .price-label { 
            display: flex; 
            align-items: center; 
            gap: 8px;
        }
        
        .price-value { 
            font-weight: 600; 
        }
        
        .terms-section { 
            background: #f8f9fa; 
            border-radius: 12px; 
            padding: 25px; 
            margin: 30px 0;
            border-left: 4px solid #ffc107;
        }
        
        .terms-section h3 { 
            color: #856404; 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .terms-list { 
            list-style: none; 
            padding: 0;
        }
        
        .terms-list li { 
            padding: 6px 0; 
            color: #6c757d; 
            position: relative;
            padding-left: 20px;
        }
        
        .terms-list li::before {
            content: '•';
            color: #ffc107;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .footer { 
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
            color: white; 
            padding: 40px 50px; 
            text-align: center;
            margin-top: 50px;
        }
        
        .footer-content { 
            max-width: 600px; 
            margin: 0 auto;
        }
        
        .footer h3 { 
            font-size: 24px; 
            margin-bottom: 15px; 
            color: #4CAF50;
        }
        
        .contact-info { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 25px 0;
        }
        
        .contact-item { 
            background: rgba(255,255,255,0.1); 
            padding: 15px; 
            border-radius: 8px;
        }
        
        .contact-item h4 { 
            color: #4CAF50; 
            margin-bottom: 5px; 
            font-size: 14px;
        }
        
        .footer-note { 
            margin-top: 30px; 
            padding-top: 20px; 
            border-top: 1px solid rgba(255,255,255,0.2); 
            font-size: 12px; 
            opacity: 0.8;
        }
        
        .qr-section {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        }
        
        @media print {
            body { background: white; }
            .invoice-container { box-shadow: none; margin: 0; }
            .qr-section { display: none; }
        }
        
        @media (max-width: 768px) {
            .content { padding: 30px 20px; }
            .header { padding: 30px 20px; }
            .invoice-meta { grid-template-columns: 1fr; gap: 20px; }
            .detail-grid { grid-template-columns: 1fr; }
            .logo-section { flex-direction: column; gap: 20px; }
            .company-details { text-align: left; }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <div class="logo-section">
                <div class="logo">🏠 BAITHAKA GHAR</div>
                <div class="company-details">
                    <div><strong>Baithaka Ghar Private Limited</strong></div>
                    <div>Ground Floor, Silver Palm Resort (New Jolly Panda Resort)</div>
                    <div>Near Novotel Hotel, Behind Solitude Villa</div>
                    <div>Calangute- Aguda Road, Anna Waddo, Candolim -GOA 403515</div>
                    <div>GST: 07AABCU9603R1ZM</div>
                    <div>support@baithakaghar.com</div>
                    <div>+91 9356547176 / +91 9936712614</div>
                </div>
            </div>
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-subtitle">Booking Confirmation & Receipt</div>
        </div>
        
        <div class="content">
            <div class="invoice-meta">
                <div class="meta-section">
                    <h3>📋 Invoice Details</h3>
                    <div class="meta-info">
                        <div class="info-row">
                            <span class="info-label">Invoice Number</span>
                            <span class="info-value">${bookingId}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Invoice Date</span>
                            <span class="info-value">${invoiceDate.toLocaleDateString('en-IN')}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Payment Status</span>
                            <span class="info-value" style="color: #28a745;">✅ Paid</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Booking Status</span>
                            <span class="info-value" style="color: #4CAF50;">${booking.status?.toUpperCase() || 'CONFIRMED'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="meta-section">
                    <h3>👤 Guest Information</h3>
                    <div class="meta-info">
                        <div class="info-row">
                            <span class="info-label">Name</span>
                            <span class="info-value">${guestName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Email</span>
                            <span class="info-value">${guestEmail}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Phone</span>
                            <span class="info-value">${guestPhone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Booking Date</span>
                            <span class="info-value">${new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="booking-details">
                <h2 class="section-title">🏨 Property & Stay Details</h2>
                
                <div class="property-info">
                    <div class="property-name">${propertyName}</div>
                    <div class="property-location">📍 ${propertyLocation}, ${propertyState}</div>
                </div>
                
                <div class="detail-grid">
                    <div class="detail-item">
                        <h4>Check-in Date</h4>
                        <p>${checkIn.toLocaleDateString('en-IN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                        <small style="color: #6c757d;">2:00 PM onwards</small>
                    </div>
                    
                    <div class="detail-item">
                        <h4>Check-out Date</h4>
                        <p>${checkOut.toLocaleDateString('en-IN', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</p>
                        <small style="color: #6c757d;">11:00 AM</small>
                    </div>
                    
                    <div class="detail-item">
                        <h4>Duration</h4>
                        <p>${nights} ${nights === 1 ? 'Night' : 'Nights'}</p>
                    </div>
                    
                    <div class="detail-item">
                        <h4>Guests</h4>
                        <p>${booking.guests} ${booking.guests === 1 ? 'Guest' : 'Guests'}</p>
                    </div>
                    
                    <div class="detail-item">
                        <h4>Room Type</h4>
                        <p>${booking.propertyId?.propertyType || 'Standard'}</p>
                    </div>
                    
                    <div class="detail-item">
                        <h4>Booking ID</h4>
                        <p style="font-family: monospace; font-size: 14px; color: #4CAF50;">${bookingId}</p>
                    </div>
                </div>
                
                ${booking.specialRequests ? `
                <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #007bff;">
                    <h4 style="color: #0056b3; margin-bottom: 10px;">Special Requests</h4>
                    <p style="color: #0056b3; margin: 0;">${booking.specialRequests}</p>
                </div>
                ` : ''}
            </div>
            
            <div class="price-breakdown">
                <div class="price-header">
                    <h3>💰 Payment Breakdown</h3>
                </div>
                <div class="price-row">
                    <span class="price-label">🏠 Room Price (${nights} ${nights === 1 ? 'night' : 'nights'})</span>
                    <span class="price-value">₹${actualBasePrice.toFixed(2)}</span>
                </div>
                <div class="price-row">
                    <span class="price-label">⚙️ Service Fee</span>
                    <span class="price-value">₹${serviceFee.toFixed(2)}</span>
                </div>
                <div class="price-row subtotal">
                    <span class="price-label"><strong>Subtotal</strong></span>
                    <span class="price-value"><strong>₹${basePrice.toFixed(2)}</strong></span>
                </div>
                <div class="price-row">
                    <span class="price-label">🧾 Taxes & GST (12%)</span>
                    <span class="price-value">₹${taxes.toFixed(2)}</span>
                </div>
                <div class="price-row total">
                    <span class="price-label"><strong>TOTAL AMOUNT PAID</strong></span>
                    <span class="price-value"><strong>₹${totalPrice.toFixed(2)}</strong></span>
                </div>
            </div>
            
            <div class="terms-section">
                <h3>⚠️ Important Terms & Conditions</h3>
                <ul class="terms-list">
                    <li>This invoice serves as your booking confirmation and payment receipt</li>
                    <li>Please carry a valid government-issued photo ID during check-in</li>
                    <li>Check-in time: 2:00 PM onwards | Check-out time: 11:00 AM</li>
                    <li>Cancellation charges may apply as per the booking policy</li>
                    <li>Any damage to property will be charged separately</li>
                    <li>Outside food and alcohol may not be permitted (property specific)</li>
                    <li>For any queries, contact our 24/7 customer support</li>
                </ul>
            </div>
            
            <div class="qr-section">
                <p style="color: #6c757d; margin-bottom: 10px;">
                    <strong>📱 Quick Access</strong><br>
                    Save this booking reference: <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; color: #4CAF50;">${bookingId}</code>
                </p>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <h3>🙏 Thank You for Choosing Baithaka Ghar!</h3>
                <p>We're committed to making your stay memorable and comfortable.</p>
                
                <div class="contact-info">
                    <div class="contact-item">
                        <h4>📧 Email Support</h4>
                        <p>support@baithakaghar.com</p>
                    </div>
                    <div class="contact-item">
                        <h4>📞 Phone Support</h4>
                        <p>+91 9356547176 / +91 9936712614</p>
                    </div>
                    <div class="contact-item">
                        <h4>🌐 Website</h4>
                        <p>www.baithakaghar.com</p>
                    </div>
                </div>
                
                <div class="footer-note">
                    <p>This is a computer-generated invoice and does not require a physical signature.</p>
                    <p>© ${new Date().getFullYear()} Baithaka Ghar Private Limited. All rights reserved. | GST: 07AABCU9603R1ZM</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
} 