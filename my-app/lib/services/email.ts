import 'server-only';
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

// Booking Confirmation Email
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
    const subject = 'Your Booking Confirmation - Baithaka Ghar';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Booking Confirmation</h2>
        <p>Hello ${name},</p>
        <p>Your booking at ${property?.name || 'our property'} has been confirmed!</p>
        <p><strong>Booking Details:</strong></p>
        <ul>
          <li>Check-in: ${booking?.checkInDate || 'N/A'}</li>
          <li>Check-out: ${booking?.checkOutDate || 'N/A'}</li>
          <li>Guests: ${booking?.guestCount || '0'}</li>
          <li>Amount Paid: ₹${booking?.amount || '0'}</li>
        </ul>
        <p>Thank you for choosing Baithaka Ghar!</p>
      </div>
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