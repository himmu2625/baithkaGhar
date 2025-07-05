import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import TeamMember from '@/models/Team';
import User from '@/models/User';
import { deleteImage } from '@/lib/services/cloudinary';

// PUT - Update team member
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!params.id) {
      return NextResponse.json(
        { success: false, message: 'Team member ID is required' },
        { status: 400 }
      );
    }

    await connectMongo();

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (bio) updateData.bio = bio;
    if (image) updateData.image = image;
    if (social) updateData.social = social;
    if (location) updateData.location = location;
    if (skills) updateData.skills = skills;
    if (achievements) updateData.achievements = achievements;
    if (education) updateData.education = education;
    if (experience) updateData.experience = experience;
    if (order !== undefined) updateData.order = order;
    if (showOnAboutPage !== undefined) updateData.showOnAboutPage = showOnAboutPage;
    if (joinedDate) updateData.joinedDate = new Date(joinedDate);

    // Update team member
    const updatedMember = await TeamMember.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedMember) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully',
      data: updatedMember,
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

// DELETE - Delete team member
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Find and delete team member
    const teamMember = await TeamMember.findById(params.id);
    if (!teamMember) {
      return NextResponse.json(
        { success: false, message: 'Team member not found' },
        { status: 404 }
      );
    }

    // Delete image from Cloudinary
    try {
      await deleteImage(teamMember.image.public_id);
    } catch (error) {
      console.warn('Failed to delete image from Cloudinary:', error);
    }

    // Delete team member from database
    await TeamMember.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Team member deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting team member:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete team member' },
      { status: 500 }
    );
  }
} 