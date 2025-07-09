import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import InfluencerApplication from '@/models/InfluencerApplication';
import { adminApiAuth } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await adminApiAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const platform = searchParams.get('platform');
    const search = searchParams.get('search');

    // Build query
    let query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (platform && platform !== 'all') {
      query.primaryPlatform = platform;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { niche: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count
    const total = await InfluencerApplication.countDocuments(query);

    // Get applications with pagination
    const applications = await InfluencerApplication.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .select('-ipAddress -userAgent'); // Don't send sensitive data

    // Get stats
    const stats = await InfluencerApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgFollowers: { $avg: '$followerCount' }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching influencer applications:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch applications'
    }, { status: 500 });
  }
} 