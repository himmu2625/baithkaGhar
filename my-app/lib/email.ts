/**
 * Email service exports
 * This file re-exports functions from the email service implementation
 */

import {
  sendReactEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendPropertyListingEmail,
  verifyEmailConnection
} from './services/email';

// Re-export sendEmail function from the email service
export const sendEmail = async ({
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
}): Promise<boolean> => {
  try {
    // Check if email configuration exists
    const EMAIL_SERVER_HOST = process.env.EMAIL_SERVER_HOST;
    const EMAIL_SERVER_USER = process.env.EMAIL_SERVER_USER;
    const EMAIL_SERVER_PASSWORD = process.env.EMAIL_SERVER_PASSWORD;
    
    if (!EMAIL_SERVER_HOST || !EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD) {
      console.error('Email server configuration missing');
      return false;
    }
    
    // Import dynamically to avoid server/client mismatch
    const nodemailer = await import('nodemailer');
    const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@baithakaghar.com';
    const EMAIL_SERVER_PORT = process.env.EMAIL_SERVER_PORT ? parseInt(process.env.EMAIL_SERVER_PORT) : 587;
    
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: EMAIL_SERVER_HOST,
      port: EMAIL_SERVER_PORT,
      secure: EMAIL_SERVER_PORT === 465, // true for 465, false for other ports
      auth: {
        user: EMAIL_SERVER_USER,
        pass: EMAIL_SERVER_PASSWORD,
      },
    });
    
    const mailOptions = {
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text: text || '', // Optional plain text version
      replyTo: replyTo || EMAIL_FROM,
    };
    
    // Send mail
    const info = await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Re-export other email functions
export {
  sendReactEmail,
  sendOtpEmail,
  sendWelcomeEmail,
  sendBookingConfirmationEmail,
  sendPropertyListingEmail,
  verifyEmailConnection
}; 