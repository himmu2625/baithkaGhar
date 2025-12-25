import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email and verify they are a property owner
    const user = await User.findOne({
      email: email.toLowerCase(),
      role: 'property_owner'
    });

    // Always return success to prevent email enumeration
    // But only send email if user actually exists
    if (user) {
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenHash = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      // Set token expiry to 1 hour from now
      const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

      // Save reset token to user
      user.resetPasswordToken = resetTokenHash;
      user.resetPasswordExpire = resetTokenExpiry;
      await user.save();

      // Create reset URL
      const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/os/reset-password?token=${resetToken}`;

      // TODO: Send email with reset link
      // For now, we'll log it to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Password Reset URL:', resetUrl);
        console.log('Reset Token:', resetToken);
      }

      // In production, you would send an email here
      // Example:
      // await sendEmail({
      //   to: user.email,
      //   subject: 'Password Reset Request - Baithaka Ghar OS',
      //   html: `
      //     <p>You requested a password reset for your Baithaka Ghar Owner Portal account.</p>
      //     <p>Click this link to reset your password:</p>
      //     <a href="${resetUrl}">${resetUrl}</a>
      //     <p>This link will expire in 1 hour.</p>
      //     <p>If you didn't request this, please ignore this email.</p>
      //   `
      // });
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an owner account exists with that email, a password reset link has been sent.',
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
