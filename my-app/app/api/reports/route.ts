import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { z } from 'zod';
import { connectMongo } from '@/lib/db/mongodb';
import Report, { ReportType, ReportStatus, ReportTargetType } from '@/models/Report';
import User from '@/models/User';
import Property from '@/models/Property';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import mongoose from 'mongoose';
import { sendReactEmail } from '@/lib/services/email';
import dbConnect from '@/lib/db/dbConnect';

// Schema for creating a report
const createReportSchema = z.object({
  type: z.enum([
    ReportType.INAPPROPRIATE_CONTENT,
    ReportType.MISLEADING_INFORMATION,
    ReportType.FAKE_LISTING,
    ReportType.SCAM,
    ReportType.HARASSMENT,
    ReportType.DISCRIMINATION,
    ReportType.POLICY_VIOLATION,
    ReportType.OTHER
  ]),
  targetType: z.enum([
    ReportTargetType.PROPERTY,
    ReportTargetType.USER,
    ReportTargetType.REVIEW,
    ReportTargetType.BOOKING
  ]),
  targetId: z.string().min(1),
  reason: z.string().min(10).max(500),
  details: z.string().max(2000).optional(),
  attachments: z.array(z.string().url()).max(5).optional(),
});

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

// POST endpoint for creating a new report
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    const validatedData = createReportSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const { type, targetType, targetId, reason, details, attachments } = validatedData.data;
    
    await connectMongo();
    
    // Verify the user exists
    const reporter = await User.findById(userId);
    if (!reporter) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Verify the target exists based on targetType
    let targetExists = false;
    let targetObjectId;
    
    try {
      targetObjectId = new mongoose.Types.ObjectId(targetId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid target ID format' }, { status: 400 });
    }
    
    switch (targetType) {
      case ReportTargetType.PROPERTY:
        targetExists = !!(await Property.findById(targetObjectId));
        break;
      case ReportTargetType.USER:
        targetExists = !!(await User.findById(targetObjectId));
        break;
      case ReportTargetType.REVIEW:
        targetExists = !!(await Review.findById(targetObjectId));
        break;
      case ReportTargetType.BOOKING:
        targetExists = !!(await Booking.findById(targetObjectId));
        break;
      default:
        return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
    }
    
    if (!targetExists) {
      return NextResponse.json({ error: `${targetType} not found` }, { status: 404 });
    }
    
    // Create the report
    const newReport = new Report({
      type,
      targetType,
      reporter: userId,
      reason,
      details,
      attachments,
      status: ReportStatus.PENDING,
    });
    
    // Set the appropriate target field based on targetType
    switch (targetType) {
      case ReportTargetType.PROPERTY:
        newReport.property = targetObjectId;
        break;
      case ReportTargetType.USER:
        newReport.user = targetObjectId;
        break;
      case ReportTargetType.REVIEW:
        newReport.review = targetObjectId;
        break;
      case ReportTargetType.BOOKING:
        newReport.booking = targetObjectId;
        break;
    }
    
    await newReport.save();
    
    // Send notification to admins (implement this function in email.ts)
    try {
      await sendReactEmail({
        to: process.env.ADMIN_EMAIL || 'admin@baithakaghar.com',
        subject: 'New Report Submitted',
        emailComponent: {
          name: 'Admin',
          reportId: String(newReport._id),
          reportType: String(newReport.type),
          reportedBy: session.user.name || 'Anonymous'
        }
      });
    } catch (emailError) {
      console.error('Error sending admin notification:', emailError);
      // Don't fail the request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Report submitted successfully',
      reportId: newReport._id
    });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

// GET endpoint for fetching a user's reports
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    await connectMongo();
    
    const skip = (page - 1) * limit;
    const totalReports = await Report.countDocuments({ reporter: userId });
    
    const reports = await Report.find({ reporter: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('property', 'title location images')
      .populate('user', 'name email profilePicture')
      .populate('review', 'rating comment')
      .populate('booking', 'bookingCode startDate endDate');
    
    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        totalReports,
        totalPages: Math.ceil(totalReports / limit),
        hasMore: page * limit < totalReports
      }
    });
  } catch (error) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
} 