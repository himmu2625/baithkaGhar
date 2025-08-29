import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import StaffMember from '@/models/StaffMember';

// GET: Fetch a specific staff member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, staffId } = params;

    if (!session || !propertyId || !staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    const staffMember = await StaffMember.findOne({ 
      _id: staffId, 
      propertyId 
    })
    .populate('employment.reportsTo', 'personalInfo.firstName personalInfo.lastName employment.designation')
    .populate('employment.teamMembers', 'personalInfo.firstName personalInfo.lastName employment.designation')
    .lean();

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({
      staff: {
        ...staffMember,
        _id: staffMember._id?.toString(),
        id: staffMember._id?.toString()
      }
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff member' }, { status: 500 });
  }
}

// PUT: Update a staff member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, staffId } = params;
    const updateData = await request.json();

    if (!session || !propertyId || !staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Check if staff member exists
    const existingStaff = await StaffMember.findOne({ 
      _id: staffId, 
      propertyId 
    });

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    // Check if email is being updated and if it's already taken
    if (updateData.personalInfo?.email && 
        updateData.personalInfo.email !== existingStaff.personalInfo.email) {
      const emailExists = await StaffMember.findOne({
        'personalInfo.email': updateData.personalInfo.email.toLowerCase(),
        _id: { $ne: staffId }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 400 }
        );
      }
    }

    // Prepare update object
    const updateFields: any = {
      lastUpdatedBy: session.user?.id,
      updatedAt: new Date()
    };

    // Update personal information
    if (updateData.personalInfo) {
      Object.keys(updateData.personalInfo).forEach(key => {
        if (key === 'email') {
          updateFields[`personalInfo.${key}`] = updateData.personalInfo[key].toLowerCase();
        } else {
          updateFields[`personalInfo.${key}`] = updateData.personalInfo[key];
        }
      });
    }

    // Update employment information
    if (updateData.employment) {
      Object.keys(updateData.employment).forEach(key => {
        if (key === 'salary') {
          Object.keys(updateData.employment.salary).forEach(salaryKey => {
            updateFields[`employment.salary.${salaryKey}`] = updateData.employment.salary[salaryKey];
          });
        } else {
          updateFields[`employment.${key}`] = updateData.employment[key];
        }
      });
    }

    // Update schedule information
    if (updateData.schedule) {
      Object.keys(updateData.schedule).forEach(key => {
        if (key === 'workingHours') {
          Object.keys(updateData.schedule.workingHours).forEach(hourKey => {
            updateFields[`schedule.workingHours.${hourKey}`] = updateData.schedule.workingHours[hourKey];
          });
        } else {
          updateFields[`schedule.${key}`] = updateData.schedule[key];
        }
      });
    }

    // Update access and permissions
    if (updateData.access) {
      Object.keys(updateData.access).forEach(key => {
        updateFields[`access.${key}`] = updateData.access[key];
      });
    }

    // Update performance
    if (updateData.performance) {
      Object.keys(updateData.performance).forEach(key => {
        updateFields[`performance.${key}`] = updateData.performance[key];
      });
    }

    // Update attendance
    if (updateData.attendance) {
      Object.keys(updateData.attendance).forEach(key => {
        updateFields[`attendance.${key}`] = updateData.attendance[key];
      });
    }

    // Update status
    if (updateData.status) {
      updateFields.status = updateData.status;
      
      // If terminating, add termination details
      if (updateData.status === 'terminated') {
        updateFields.terminationDate = updateData.terminationDate || new Date();
        updateFields.terminationReason = updateData.terminationReason || 'Not specified';
        updateFields['access.isActive'] = false;
      }
    }

    const updatedStaff = await StaffMember.findOneAndUpdate(
      { _id: staffId, propertyId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      staff: {
        ...updatedStaff,
        _id: updatedStaff?._id?.toString(),
        id: updatedStaff?._id?.toString()
      },
      message: 'Staff member updated successfully'
    });
  } catch (error) {
    console.error('Staff update error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

// DELETE: Delete/deactivate a staff member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, staffId } = params;
    const { searchParams } = request.nextUrl;
    const permanent = searchParams.get('permanent') === 'true';

    if (!session || !propertyId || !staffId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    const staffMember = await StaffMember.findOne({ 
      _id: staffId, 
      propertyId 
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    if (permanent) {
      // Permanent deletion
      await StaffMember.findOneAndDelete({ _id: staffId, propertyId });
      
      return NextResponse.json({
        success: true,
        message: 'Staff member permanently deleted'
      });
    } else {
      // Soft delete - mark as inactive/terminated
      await StaffMember.findOneAndUpdate(
        { _id: staffId, propertyId },
        {
          $set: {
            status: 'terminated',
            terminationDate: new Date(),
            terminationReason: 'Deleted by admin',
            'access.isActive': false,
            lastUpdatedBy: session.user?.id,
            updatedAt: new Date()
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Staff member deactivated successfully'
      });
    }
  } catch (error) {
    console.error('Staff deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}

// PATCH: Update specific fields (for quick actions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; staffId: string } }
) {
  try {
    const session = await getServerSession();
    const { id: propertyId, staffId } = params;
    const { action, ...data } = await request.json();

    if (!session || !propertyId || !staffId || !action) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    const staffMember = await StaffMember.findOne({ 
      _id: staffId, 
      propertyId 
    });

    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    let updateFields: any = {
      lastUpdatedBy: session.user?.id,
      updatedAt: new Date()
    };

    switch (action) {
      case 'toggle_active':
        updateFields['access.isActive'] = !staffMember.access.isActive;
        updateFields.status = !staffMember.access.isActive ? 'active' : 'inactive';
        break;

      case 'reset_password':
        // In a real implementation, you would generate a password reset token
        updateFields['access.loginAttempts'] = 0;
        updateFields['access.accountLocked'] = false;
        updateFields['access.lockUntil'] = undefined;
        break;

      case 'update_rating':
        if (data.rating && data.rating >= 1 && data.rating <= 5) {
          updateFields['performance.currentRating'] = data.rating;
          updateFields['performance.lastReviewDate'] = new Date();
        } else {
          return NextResponse.json({ error: 'Invalid rating value' }, { status: 400 });
        }
        break;

      case 'add_skill':
        if (data.skill) {
          updateFields.$push = { skills: data.skill };
        }
        break;

      case 'remove_skill':
        if (data.skillIndex !== undefined) {
          const skills = [...staffMember.skills];
          skills.splice(data.skillIndex, 1);
          updateFields.skills = skills;
        }
        break;

      case 'update_permissions':
        if (data.permissions && Array.isArray(data.permissions)) {
          updateFields['access.permissions'] = data.permissions;
        }
        break;

      case 'mark_attendance':
        const today = new Date().toISOString().split('T')[0];
        if (data.status === 'present') {
          updateFields['attendance.presentDays'] = staffMember.attendance.presentDays + 1;
        } else if (data.status === 'absent') {
          updateFields['attendance.absentDays'] = staffMember.attendance.absentDays + 1;
        } else if (data.status === 'late') {
          updateFields['attendance.lateMarks'] = staffMember.attendance.lateMarks + 1;
          updateFields['attendance.presentDays'] = staffMember.attendance.presentDays + 1;
        }
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedStaff = await StaffMember.findOneAndUpdate(
      { _id: staffId, propertyId },
      updateFields,
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({
      success: true,
      staff: {
        ...updatedStaff,
        _id: updatedStaff?._id?.toString(),
        id: updatedStaff?._id?.toString()
      },
      message: `Staff member ${action.replace('_', ' ')} successfully`
    });
  } catch (error) {
    console.error('Staff patch error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}