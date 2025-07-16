import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgentApplication from '@/models/TravelAgentApplication';
import { getSession } from '@/lib/get-session';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectMongo();
    
    const body = await req.json();
    const {
      name,
      email,
      phone,
      companyName,
      companyType,
      licenseNumber,
      gstNumber,
      panNumber,
      address,
      businessDetails,
      commissionExpectations,
      documents
    } = body;

    // Basic validation
    if (!name || !email || !phone || !companyName || !companyType || !address) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if application already exists for this email
    const existingApplication = await TravelAgentApplication.findOne({ email });
    if (existingApplication) {
      return NextResponse.json(
        { success: false, message: 'An application with this email already exists' },
        { status: 400 }
      );
    }

    // Create new application
    const application = new TravelAgentApplication({
      name,
      email,
      phone,
      companyName,
      companyType,
      licenseNumber,
      gstNumber,
      panNumber,
      address,
      businessDetails,
      commissionExpectations,
      documents
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Travel agent application submitted successfully',
      applicationId: application._id
    });

  } catch (error: any) {
    console.error('Travel agent registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit application' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const application = await TravelAgentApplication.findOne({ email });
    
    if (!application) {
      return NextResponse.json(
        { success: false, message: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application: {
        id: application._id,
        status: application.status,
        statusDisplay: application.statusDisplay,
        createdAt: application.createdAt,
        adminNotes: application.adminNotes,
        rejectionReason: application.rejectionReason
      }
    });

  } catch (error: any) {
    console.error('Travel agent application check error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to check application status' },
      { status: 500 }
    );
  }
} 