import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
// @ts-ignore
import InfluencerApplication from '@/models/InfluencerApplication';
// @ts-ignore
import Influencer from '@/models/Influencer';
import { adminApiAuth } from '@/lib/admin-auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const session = await adminApiAuth(request);
    if (session instanceof NextResponse) {
      return session;
    }

    await dbConnect();

    const { id } = params;
    const body = await request.json();
    const { status, reviewNotes } = body;

    // Validate status
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'contacted'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status'
      }, { status: 400 });
    }

    // Find and update the application
    const application = await InfluencerApplication.findById(id);
    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    // Update fields
    application.status = status;
    if (reviewNotes) {
      application.reviewNotes = reviewNotes;
    }
    application.reviewedBy = session.user.id;
    application.reviewedAt = new Date();

    if (status === 'contacted') {
      application.contactedAt = new Date();
    }

    if (status === 'approved' && !application.convertedToInfluencer) {
      // Generate referral code
      const nameCode = application.fullName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      const referralCode = `${nameCode}${randomCode}`;

      // Determine handle
      let handle = '';
      const links = application.socialLinks || {} as any;
      if (links.instagram) handle = links.instagram;
      else if (links.youtube) handle = links.youtube;
      else if (links.tiktok) handle = links.tiktok;
      else if (links.facebook) handle = links.facebook;
      else if (links.twitter) handle = links.twitter;
      else if (links.blog) handle = links.blog;
      else if (links.other) handle = links.other;

      const influencerDoc = await Influencer.create({
        name: application.fullName,
        email: application.email,
        phone: application.phone,
        platform: application.primaryPlatform,
        handle: handle || application.email.split('@')[0],
        followerCount: application.followerCount,
        niche: application.niche || 'general',
        referralCode,
        commissionType: 'percentage',
        commissionRate: 5,
        totalEarnings: 0,
        walletBalance: 0,
        totalClicks: 0,
        totalBookings: 0,
        totalRevenue: 0,
        status: 'active',
        createdBy: session.user.id
      });

      application.convertedToInfluencer = true;
      application.convertedInfluencerId = influencerDoc._id;
    }

    await application.save();

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      data: {
        id: application._id,
        status: application.status,
        reviewedAt: application.reviewedAt
      }
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update application'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin authentication
    const authResult = await adminApiAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

    const { id } = params;

    const application = await InfluencerApplication.findById(id)
      .populate('reviewedBy', 'name email')
      .select('-ipAddress -userAgent');

    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch application'
    }, { status: 500 });
  }
} 