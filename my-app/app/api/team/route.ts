import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TeamMember from '@/models/Team';

// GET - Fetch all active team members (public endpoint)
export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    
    const teamMembers = await TeamMember.find({ 
      isActive: true, 
      showOnAboutPage: true 
    })
      .sort({ order: 1 })
      .select('name role department bio image social location skills achievements education experience joinedDate order')
      .lean();
    
    return NextResponse.json({
      success: true,
      data: teamMembers,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
} 