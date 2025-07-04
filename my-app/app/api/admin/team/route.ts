import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import TeamMember from '@/models/Team';
import User from '@/models/User';

// GET - Fetch all team members
export async function GET(req: NextRequest) {
  try {
    await connectMongo();
    
    const teamMembers = await TeamMember.find({ isActive: true })
      .sort({ order: 1 })
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

// POST - Create new team member
export async function POST(req: NextRequest) {
  try {
    // Check admin authentication
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token?.sub) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    // Verify admin role
    const user = await User.findById(token.sub);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { 
      name, 
      role, 
      department, 
      bio, 
      image, 
      social, 
      order, 
      showOnAboutPage,
      location,
      skills,
      achievements,
      education,
      experience,
      joinedDate
    } = body;

    // Validate required fields
    if (!name || !role || !department || !bio || !image?.url || !image?.public_id) {
      return NextResponse.json(
        { success: false, message: 'Name, role, department, bio, and image are required' },
        { status: 400 }
      );
    }

    // Create new team member
    const teamMember = new TeamMember({
      name,
      role,
      department,
      bio,
      image,
      social: social || {},
      order: order || 0,
      showOnAboutPage: showOnAboutPage || false,
      location: location || '',
      skills: skills || [],
      achievements: achievements || [],
      education: education || '',
      experience: experience || '',
      joinedDate: joinedDate ? new Date(joinedDate) : new Date(),
    });

    await teamMember.save();

    return NextResponse.json({
      success: true,
      message: 'Team member created successfully',
      data: teamMember,
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create team member' },
      { status: 500 }
    );
  }
}

// PUT - Update team member order
export async function PUT(req: NextRequest) {
  try {
    // Check admin authentication
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token?.sub) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    // Verify admin role
    const user = await User.findById(token.sub);
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { teamMembers } = body; // Array of { id, order }

    if (!Array.isArray(teamMembers)) {
      return NextResponse.json(
        { success: false, message: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Update orders in bulk
    const updatePromises = teamMembers.map(({ id, order }) =>
      TeamMember.findByIdAndUpdate(id, { order }, { new: true })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: 'Team member order updated successfully',
    });
  } catch (error) {
    console.error('Error updating team member order:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update team member order' },
      { status: 500 }
    );
  }
} 