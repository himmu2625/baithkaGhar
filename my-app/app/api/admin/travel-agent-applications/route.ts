import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgentApplication from '@/models/TravelAgentApplication';
import TravelAgent from '@/models/TravelAgent';
import User from '@/models/User';
import { getSession } from '@/lib/get-session';
import { authOptions } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const companyType = searchParams.get('companyType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (companyType && companyType !== 'all') query.companyType = companyType;

    // Get applications with pagination
    const applications = await TravelAgentApplication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await TravelAgentApplication.countDocuments(query);

    // Format applications for frontend
    const formattedApplications = applications.map(app => ({
      id: app._id.toString(),
      name: app.name,
      email: app.email,
      phone: app.phone,
      companyName: app.companyName,
      companyType: app.companyType,
      status: app.status,
      statusDisplay: app.statusDisplay,
      ageInDays: app.ageInDays,
      createdAt: app.createdAt,
      adminNotes: app.adminNotes,
      rejectionReason: app.rejectionReason,
      businessDetails: app.businessDetails,
      commissionExpectations: app.commissionExpectations
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Travel agent applications fetch error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch applications: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const body = await req.json();
    const { applicationId, action, notes, rejectionReason } = body;

    if (!applicationId || !action) {
      return NextResponse.json(
        { success: false, message: 'Application ID and action are required' },
        { status: 400 }
      );
    }

    const application = await TravelAgentApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      // Check if travel agent already exists
      const existingAgent = await TravelAgent.findOne({ email: application.email });
      if (existingAgent) {
        return NextResponse.json(
          { success: false, message: 'A travel agent with this email already exists' },
          { status: 400 }
        );
      }

      // Create travel agent account
      const travelAgent = new TravelAgent({
        name: application.name,
        email: application.email,
        phone: application.phone,
        password: application.password, // Include password from application
        companyName: application.companyName,
        companyType: application.companyType,
        licenseNumber: application.licenseNumber,
        gstNumber: application.gstNumber,
        panNumber: application.panNumber,
        address: application.address,
        businessDetails: application.businessDetails,
        commissionStructure: {
          type: application.commissionExpectations.preferredType,
          rate: application.commissionExpectations.expectedRate
        },
        documents: application.documents,
        preferences: {
          commissionPayoutFrequency: 'monthly',
          autoPayout: false,
          minPayoutAmount: 1000
        },
        notes: notes,
        createdBy: (session.user as any).id || new mongoose.Types.ObjectId()
      });

      await travelAgent.save();

      // Update application status
      application.status = 'approved';
      application.adminNotes = notes;
      application.approvedBy = (session.user as any).id || new mongoose.Types.ObjectId();
      await application.save();

      return NextResponse.json({
        success: true,
        message: 'Application approved and travel agent account created',
        travelAgentId: travelAgent._id
      });

    } else if (action === 'reject') {
      application.status = 'rejected';
      application.adminNotes = notes;
      application.rejectionReason = rejectionReason;
      await application.save();

      return NextResponse.json({
        success: true,
        message: 'Application rejected'
      });

    } else if (action === 'review') {
      application.status = 'under_review';
      application.adminNotes = notes;
      await application.save();

      return NextResponse.json({
        success: true,
        message: 'Application marked for review'
      });

    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Travel agent application action error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process application' },
      { status: 500 }
    );
  }
} 