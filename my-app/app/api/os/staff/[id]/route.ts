import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import StaffMember from '@/models/StaffMember';

// GET: Fetch all staff members for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const { searchParams } = request.nextUrl;
    const role = searchParams.get('role');
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Build query filters
    const query: any = { propertyId };
    if (role) query['employment.role'] = role;
    if (department) query['employment.department'] = department;
    if (status) query.status = status;

    // Fetch staff with pagination
    const staff = await StaffMember.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const totalCount = await StaffMember.countDocuments(query);

    // Transform data for frontend
    const transformedStaff = staff.map(member => ({
      ...member,
      _id: member._id?.toString(),
      id: member._id?.toString()
    }));

    return NextResponse.json({
      staff: transformedStaff,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + staff.length < totalCount
      },
      stats: await generateStaffStats(propertyId)
    });
  } catch (error) {
    console.error('Staff fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

// POST: Add a new staff member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    const propertyId = params.id;
    const staffData = await request.json();

    if (!session || !propertyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasAccess = await validateOSAccess(session.user?.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await dbConnect();

    // Validate required fields
    const { personalInfo, employment } = staffData;
    if (!personalInfo?.firstName || !personalInfo?.lastName || !personalInfo?.email || 
        !employment?.role || !employment?.department || !employment?.designation) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingStaff = await StaffMember.findOne({ 
      'personalInfo.email': personalInfo.email 
    });
    
    if (existingStaff) {
      return NextResponse.json(
        { error: 'Staff member with this email already exists' },
        { status: 400 }
      );
    }

    // Generate employee ID
    const rolePrefix = employment.role.substring(0, 2).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const employeeId = `${rolePrefix}${timestamp}`;

    // Create staff member
    const staffMember = new StaffMember({
      propertyId,
      employeeId,
      personalInfo: {
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        email: personalInfo.email.toLowerCase(),
        phone: personalInfo.phone,
        address: personalInfo.address || {}
      },
      employment: {
        role: employment.role,
        department: employment.department,
        designation: employment.designation,
        employmentType: employment.employmentType || 'full-time',
        joiningDate: employment.joiningDate || new Date(),
        salary: {
          basic: employment.salary?.basic || 0,
          hra: employment.salary?.hra || 0,
          allowances: employment.salary?.allowances || 0,
          deductions: employment.salary?.deductions || 0,
          currency: 'INR',
          payFrequency: 'monthly'
        }
      },
      schedule: {
        workingDays: staffData.schedule?.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        shiftType: staffData.schedule?.shiftType || 'day',
        workingHours: {
          start: staffData.schedule?.workingHours?.start || '09:00',
          end: staffData.schedule?.workingHours?.end || '18:00',
          breakTime: 60
        },
        hoursPerWeek: 40,
        overtimeEligible: true
      },
      access: {
        isActive: true,
        permissions: [], // Will be auto-assigned based on role
        osAccess: true,
        mobileAccess: false,
        apiAccess: false
      },
      performance: {
        currentRating: 3,
        goals: [],
        achievements: [],
        warnings: []
      },
      attendance: {
        totalLeaves: 21,
        usedLeaves: 0,
        sickLeaves: 0,
        casualLeaves: 0,
        earnedLeaves: 0,
        lateMarks: 0,
        presentDays: 0,
        absentDays: 0
      },
      documents: [],
      notifications: {
        email: true,
        sms: false,
        push: true,
        preferredLanguage: 'en'
      },
      createdBy: session.user?.id, // You may need to adjust this based on your auth system
      status: 'active'
    });

    await staffMember.save();

    return NextResponse.json({
      success: true,
      staff: {
        ...staffMember.toObject(),
        _id: staffMember._id?.toString(),
        id: staffMember._id?.toString()
      },
      message: 'Staff member added successfully'
    });
  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json({ error: 'Failed to add staff member' }, { status: 500 });
  }
}

async function generateStaffStats(propertyId: string) {
  try {
    const [totalStaff, activeStaff, departmentStats, roleStats] = await Promise.all([
      StaffMember.countDocuments({ propertyId }),
      StaffMember.countDocuments({ propertyId, status: 'active' }),
      StaffMember.aggregate([
        { $match: { propertyId } },
        { $group: { _id: '$employment.department', count: { $sum: 1 } } }
      ]),
      StaffMember.aggregate([
        { $match: { propertyId } },
        { $group: { _id: '$employment.role', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalStaff,
      activeStaff,
      inactiveStaff: totalStaff - activeStaff,
      departments: departmentStats.reduce((acc, dept) => {
        acc[dept._id] = dept.count;
        return acc;
      }, {}),
      roles: roleStats.reduce((acc, role) => {
        acc[role._id] = role.count;
        return acc;
      }, {}),
      averageRating: await StaffMember.aggregate([
        { $match: { propertyId, status: 'active' } },
        { $group: { _id: null, avgRating: { $avg: '$performance.currentRating' } } }
      ]).then(result => result[0]?.avgRating || 0)
    };
  } catch (error) {
    console.error('Error generating staff stats:', error);
    return {
      totalStaff: 0,
      activeStaff: 0,
      inactiveStaff: 0,
      departments: {},
      roles: {},
      averageRating: 0
    };
  }
}