// import 'server-only'; // Commented out for Vercel compatibility
import * as nodemailer from 'nodemailer';
import { ReactElement } from 'react';

// Email service configuration
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@baithakaghar.com';
const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 587;
const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_SERVER_HOST,
  port: EMAIL_SERVER_PORT,
  secure: EMAIL_SERVER_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_SERVER_USER,
    pass: EMAIL_SERVER_PASSWORD,
  },
});

// Utility to verify SMTP connection
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return false;
  }
}

// Generic email sending function with logging
async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    // Check if email configuration exists
    if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
      console.error('Email server configuration missing');
      return false;
    }
    
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || '', // Optional plain text version
      replyTo: replyTo || EMAIL_FROM,
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Send React Email component (simplified for build)
export async function sendReactEmail({
  to,
  subject,
  emailComponent,
  replyTo,
}: {
  to: string;
  subject: string;
  emailComponent: any;
  replyTo?: string;
}): Promise<boolean> {
  try {
    // Simplified dummy implementation for build
    console.log('Would send email to:', to, 'Subject:', subject);

    return true;
  } catch (error) {
    console.error('Failed to render and send React Email:', error);
    return false;
  }
}

// OTP Email
export async function sendOtpEmail({
  to,
  otp,
  name,
}: {
  to: string;
  otp: string;
  name: string;
}): Promise<boolean> {
  try {
    const subject = 'Your Verification Code for Baithaka Ghar';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verification Code</h2>
        <p>Hello ${name},</p>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;
    
    return sendEmail({
      to,
      subject,
      html,
      text: `Hello ${name}, Your verification code is: ${otp}. This code will expire in 5 minutes.`,
    });
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return false;
  }
}

// Welcome Email
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<boolean> {
  try {
    const subject = 'Welcome to Baithaka Ghar!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Baithaka Ghar!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for joining Baithaka Ghar! We're excited to have you on board.</p>
        <p>With Baithaka Ghar, you can:</p>
        <ul>
          <li>Discover unique properties across India</li>
          <li>Book stays with confidence</li>
          <li>Enjoy a personalized travel experience</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `;
    
    return sendEmail({
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

// Enhanced Booking Confirmation Email with modern design
export async function sendBookingConfirmationEmail({
  to,
  name,
  booking,
  property,
}: {
  to: string;
  name: string;
  booking: any;
  property: any;
}): Promise<boolean> {
  try {
    const checkIn = new Date(booking.dateFrom || booking.checkInDate);
    const checkOut = new Date(booking.dateTo || booking.checkOutDate);
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    const bookingId = `BK-${booking._id.toString().slice(-6).toUpperCase()}`;
    const totalPrice = booking.totalPrice || booking.totalAmount || 0;
    const basePrice = totalPrice / 1.12;
    const taxes = totalPrice - basePrice;

    const subject = `🎉 Booking Confirmed - ${property?.title || 'Your Stay'} | Baithaka Ghar`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Booking Confirmation</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  background-color: #f8f9fa;
              }
              .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 12px; 
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
              }
              .logo { 
                  font-size: 28px; 
                  font-weight: bold; 
                  margin-bottom: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  gap: 10px;
              }
              .content { padding: 30px; }
              .success-icon { 
                  width: 80px; 
                  height: 80px; 
                  background: #ffffff20; 
                  border-radius: 50%; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  margin: 0 auto 20px;
                  font-size: 40px;
              }
              .booking-card { 
                  background: #f8f9fa; 
                  border-radius: 12px; 
                  padding: 25px; 
                  margin: 25px 0;
                  border-left: 4px solid #4CAF50;
              }
              .booking-id { 
                  background: #4CAF50; 
                  color: white; 
                  padding: 8px 16px; 
                  border-radius: 20px; 
                  display: inline-block; 
                  font-weight: bold; 
                  margin-bottom: 20px;
                  font-size: 14px;
              }
              .detail-row { 
                  display: flex; 
                  justify-content: space-between; 
                  padding: 12px 0; 
                  border-bottom: 1px solid #e9ecef;
              }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { font-weight: 600; color: #666; }
              .detail-value { font-weight: 500; }
              .property-info { 
                  background: white; 
                  border: 2px solid #e9ecef; 
                  border-radius: 12px; 
                  padding: 20px; 
                  margin: 20px 0;
              }
              .property-name { 
                  font-size: 20px; 
                  font-weight: bold; 
                  color: #2c3e50; 
                  margin-bottom: 8px;
              }
              .property-location { color: #7f8c8d; }
              .price-breakdown { 
                  background: #f8f9fa; 
                  border-radius: 8px; 
                  overflow: hidden; 
                  margin: 20px 0;
              }
              .price-row { 
                  display: flex; 
                  justify-content: space-between; 
                  padding: 15px 20px; 
                  border-bottom: 1px solid #dee2e6;
              }
              .price-row:last-child { border-bottom: none; }
              .total-row { 
                  background: #4CAF50; 
                  color: white; 
                  font-weight: bold; 
                  font-size: 18px;
              }
              .action-buttons { 
                  text-align: center; 
                  margin: 30px 0;
              }
              .btn { 
                  display: inline-block; 
                  padding: 15px 30px; 
                  background: #4CAF50; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold; 
                  margin: 10px;
                  transition: background-color 0.3s;
              }
              .btn:hover { background: #45a049; }
              .btn-secondary { 
                  background: #6c757d; 
              }
              .btn-secondary:hover { background: #5a6268; }
              .important-info { 
                  background: #fff3cd; 
                  border: 1px solid #ffeaa7; 
                  border-radius: 8px; 
                  padding: 20px; 
                  margin: 20px 0;
              }
              .footer { 
                  background: #2c3e50; 
                  color: white; 
                  padding: 30px; 
                  text-align: center;
              }
              .footer a { color: #4CAF50; text-decoration: none; }
              .social-links { margin: 20px 0; }
              .social-links a { 
                  display: inline-block; 
                  margin: 0 10px; 
                  color: #4CAF50; 
                  text-decoration: none;
              }
              @media (max-width: 600px) {
                  .detail-row { flex-direction: column; }
                  .detail-label { margin-bottom: 5px; }
                  .btn { display: block; margin: 10px 0; }
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="success-icon">✅</div>
                  <div class="logo">🏠 BAITHAKA GHAR</div>
                  <h1>Booking Confirmed!</h1>
                  <p>Get ready for your amazing stay</p>
              </div>
              
              <div class="content">
                  <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
                  <p style="margin-bottom: 20px;">Great news! Your booking has been confirmed. We're excited to host you!</p>
                  
                  <div class="booking-id">Booking ID: ${bookingId}</div>
                  
                  <div class="property-info">
                      <div class="property-name">${property?.title || property?.name || 'Your Property'}</div>
                      <div class="property-location">📍 ${property?.address?.city || property?.city || 'Location'}, ${property?.address?.state || property?.state || 'State'}</div>
                  </div>
                  
                  <div class="booking-card">
                      <h3 style="margin-bottom: 15px; color: #2c3e50;">📅 Stay Details</h3>
                      <div class="detail-row">
                          <span class="detail-label">Check-in</span>
                          <span class="detail-value">${checkIn.toLocaleDateString('en-IN', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                          })} (2:00 PM onwards)</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Check-out</span>
                          <span class="detail-value">${checkOut.toLocaleDateString('en-IN', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                          })} (11:00 AM)</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Duration</span>
                          <span class="detail-value">${nights} ${nights === 1 ? 'night' : 'nights'}</span>
                      </div>
                      <div class="detail-row">
                          <span class="detail-label">Guests</span>
                          <span class="detail-value">${booking.guests} ${booking.guests === 1 ? 'guest' : 'guests'}</span>
                      </div>
                      ${booking.specialRequests ? `
                      <div class="detail-row">
                          <span class="detail-label">Special Requests</span>
                          <span class="detail-value">${booking.specialRequests}</span>
                      </div>
                      ` : ''}
                  </div>
                  
                  <div class="booking-card">
                      <h3 style="margin-bottom: 15px; color: #2c3e50;">💰 Payment Summary</h3>
                      <div class="price-breakdown">
                          <div class="price-row">
                              <span>Room Price (${nights} ${nights === 1 ? 'night' : 'nights'})</span>
                              <span>₹${basePrice.toFixed(2)}</span>
                          </div>
                          <div class="price-row">
                              <span>Taxes & Service Fees</span>
                              <span>₹${taxes.toFixed(2)}</span>
                          </div>
                          <div class="price-row total-row">
                              <span>Total Paid</span>
                              <span>₹${totalPrice.toFixed(2)}</span>
                          </div>
                      </div>
                  </div>
                  
                  <div class="important-info">
                      <h3 style="margin-bottom: 10px; color: #856404;">⚠️ Important Information</h3>
                      <ul style="margin-left: 20px;">
                          <li>Please carry a valid ID proof during check-in</li>
                          <li>Contact the property 30 minutes before arrival</li>
                          <li>Cancellation policy applies as per booking terms</li>
                          <li>For any assistance, contact our 24/7 support team</li>
                      </ul>
                  </div>
                  
                  <div class="action-buttons">
                      <a href="${process.env.NEXTAUTH_URL || 'https://yourdomain.com'}/booking/${booking._id}" class="btn">View Booking Details</a>
                      <a href="${process.env.NEXTAUTH_URL || 'https://yourdomain.com'}/api/bookings/${booking._id}/invoice" class="btn btn-secondary">Download Invoice</a>
                  </div>
                  
                  <p style="text-align: center; margin-top: 30px; color: #666;">
                      Need help? We're here for you 24/7!<br>
                      📧 <a href="mailto:support@baithakaghar.com" style="color: #4CAF50;">support@baithakaghar.com</a> | 
                      📞 <a href="tel:+919356547176" style="color: #4CAF50;">+91 9356547176</a> / <a href="tel:+919936712614" style="color: #4CAF50;">+91 9936712614</a>
                  </p>
              </div>
              
              <div class="footer">
                  <p style="margin-bottom: 15px;">Thank you for choosing Baithaka Ghar!</p>
                  <div class="social-links">
                      <a href="#">Facebook</a> |
                      <a href="#">Instagram</a> |
                      <a href="#">Twitter</a>
                  </div>
                  <p style="font-size: 12px; opacity: 0.8;">
                      This is an automated email. Please do not reply to this message.<br>
                      © ${new Date().getFullYear()} Baithaka Ghar. All rights reserved.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    return sendEmail({
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
    return false;
  }
}

// Send booking reminder email (24 hours before check-in)
export async function sendBookingReminderEmail({
  to,
  name,
  booking,
  property,
}: {
  to: string;
  name: string;
  booking: any;
  property: any;
}): Promise<boolean> {
  try {
    const checkIn = new Date(booking.dateFrom || booking.checkInDate);
    const bookingId = `BK-${booking._id.toString().slice(-6).toUpperCase()}`;

    const subject = `📅 Check-in Reminder Tomorrow - ${property?.title || 'Your Stay'} | Baithaka Ghar`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Check-in Reminder</title>
          <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                  line-height: 1.6; 
                  color: #333; 
                  background-color: #f8f9fa;
              }
              .container { 
                  max-width: 600px; 
                  margin: 0 auto; 
                  background: white; 
                  border-radius: 12px; 
                  overflow: hidden;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); 
                  color: white; 
                  padding: 40px 30px; 
                  text-align: center; 
              }
              .content { padding: 30px; }
              .reminder-card { 
                  background: #fff3cd; 
                  border: 2px solid #ffeaa7; 
                  border-radius: 12px; 
                  padding: 25px; 
                  margin: 25px 0;
                  text-align: center;
              }
              .btn { 
                  display: inline-block; 
                  padding: 15px 30px; 
                  background: #ff6b6b; 
                  color: white; 
                  text-decoration: none; 
                  border-radius: 8px; 
                  font-weight: bold; 
                  margin: 10px;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>⏰ Check-in Tomorrow!</h1>
                  <p>Your stay is just around the corner</p>
              </div>
              
              <div class="content">
                  <p style="font-size: 18px; margin-bottom: 20px;">Hello <strong>${name}</strong>,</p>
                  
                  <div class="reminder-card">
                      <h2 style="margin-bottom: 15px;">🎉 Tomorrow's the day!</h2>
                      <p style="margin-bottom: 15px;">You're checking in tomorrow at <strong>${property?.title || 'your property'}</strong></p>
                      <p><strong>Check-in:</strong> ${checkIn.toLocaleDateString('en-IN', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                      })} at 2:00 PM</p>
                      <p style="margin-top: 10px;"><strong>Booking ID:</strong> ${bookingId}</p>
                  </div>
                  
                  <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                      <h3 style="margin-bottom: 10px;">📋 Checklist for Tomorrow:</h3>
                      <ul style="margin-left: 20px;">
                          <li>✅ Pack your valid ID proof</li>
                          <li>✅ Contact property 30 minutes before arrival</li>
                          <li>✅ Review property location and directions</li>
                          <li>✅ Check weather forecast for your destination</li>
                      </ul>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${process.env.NEXTAUTH_URL || 'https://yourdomain.com'}/booking/${booking._id}" class="btn">View Booking Details</a>
                  </div>
                  
                  <p style="text-align: center; color: #666;">
                      Questions? Contact us at 📞 +91 9356547176 or +91 9936712614
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;
    
    return sendEmail({
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send booking reminder email:', error);
    return false;
  }
}

// Property Listing Confirmation Email
export async function sendPropertyListingEmail({
  to,
  name,
  property,
}: {
  to: string;
  name: string;
  property: any;
}): Promise<boolean> {
  try {
    const subject = 'Your Property Listing - Baithaka Ghar';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Property Listing Confirmation</h2>
        <p>Hello ${name},</p>
        <p>Your property "${property?.name || 'New Property'}" has been successfully listed on Baithaka Ghar!</p>
        <p>Our team will review your listing shortly, and it will be visible to potential guests once approved.</p>
        <p>Thank you for choosing to host with Baithaka Ghar!</p>
      </div>
    `;
    
    return sendEmail({
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Failed to send property listing email:', error);
    return false;
  }
} 