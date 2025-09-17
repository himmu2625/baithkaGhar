import { NextRequest, NextResponse } from 'next/server';
import { StaffManagementIntegration } from '@/lib/integrations/staff-management-integration';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const staffManagement = new StaffManagementIntegration();
    await staffManagement.initialize();

    switch (action) {
      case 'create_staff':
        const { staffData } = body;
        if (!staffData) {
          return NextResponse.json(
            { error: 'Staff data is required' },
            { status: 400 }
          );
        }

        const createResult = await staffManagement.createStaffMember(staffData);
        return NextResponse.json({
          success: true,
          data: createResult
        });

      case 'clock_in':
        const { staffId: clockInStaffId, location, ipAddress } = body;
        if (!clockInStaffId) {
          return NextResponse.json(
            { error: 'Staff ID is required' },
            { status: 400 }
          );
        }

        const clockInResult = await staffManagement.clockIn(
          new ObjectId(clockInStaffId),
          location,
          ipAddress
        );
        return NextResponse.json({
          success: true,
          data: clockInResult
        });

      case 'clock_out':
        const { staffId: clockOutStaffId, notes } = body;
        if (!clockOutStaffId) {
          return NextResponse.json(
            { error: 'Staff ID is required' },
            { status: 400 }
          );
        }

        const clockOutResult = await staffManagement.clockOut(
          new ObjectId(clockOutStaffId),
          notes
        );
        return NextResponse.json({
          success: true,
          data: clockOutResult
        });

      case 'request_leave':
        const { leaveRequest } = body;
        if (!leaveRequest) {
          return NextResponse.json(
            { error: 'Leave request data is required' },
            { status: 400 }
          );
        }

        // Convert string dates to Date objects
        leaveRequest.startDate = new Date(leaveRequest.startDate);
        leaveRequest.endDate = new Date(leaveRequest.endDate);
        leaveRequest.staffId = new ObjectId(leaveRequest.staffId);

        const leaveResult = await staffManagement.requestLeave(leaveRequest);
        return NextResponse.json({
          success: true,
          data: leaveResult
        });

      case 'get_schedule':
        const { staffId: scheduleStaffId, startDate, endDate } = body;
        if (!scheduleStaffId || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Staff ID, start date, and end date are required' },
            { status: 400 }
          );
        }

        const schedule = await staffManagement.getStaffSchedule(
          new ObjectId(scheduleStaffId),
          new Date(startDate),
          new Date(endDate)
        );
        return NextResponse.json({
          success: true,
          data: schedule
        });

      case 'get_time_entries':
        const { staffId: timeStaffId, startDate: timeStartDate, endDate: timeEndDate } = body;
        if (!timeStaffId || !timeStartDate || !timeEndDate) {
          return NextResponse.json(
            { error: 'Staff ID, start date, and end date are required' },
            { status: 400 }
          );
        }

        const timeEntries = await staffManagement.getStaffTimeEntries(
          new ObjectId(timeStaffId),
          new Date(timeStartDate),
          new Date(timeEndDate)
        );
        return NextResponse.json({
          success: true,
          data: timeEntries
        });

      case 'generate_payroll':
        const { payrollStartDate, payrollEndDate } = body;
        if (!payrollStartDate || !payrollEndDate) {
          return NextResponse.json(
            { error: 'Start date and end date are required for payroll' },
            { status: 400 }
          );
        }

        const payrollReport = await staffManagement.generatePayrollReport(
          new Date(payrollStartDate),
          new Date(payrollEndDate)
        );
        return NextResponse.json({
          success: true,
          data: payrollReport
        });

      case 'get_statistics':
        const statistics = await staffManagement.getStaffStatistics();
        return NextResponse.json({
          success: true,
          data: statistics
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create_staff, clock_in, clock_out, request_leave, get_schedule, get_time_entries, generate_payroll, or get_statistics' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Staff management API error:', error);
    return NextResponse.json(
      { error: 'Staff management operation failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const staffId = searchParams.get('staffId');

    const staffManagement = new StaffManagementIntegration();
    await staffManagement.initialize();

    switch (action) {
      case 'statistics':
        const statistics = await staffManagement.getStaffStatistics();
        return NextResponse.json({
          success: true,
          data: statistics
        });

      case 'schedule':
        if (!staffId) {
          return NextResponse.json(
            { error: 'Staff ID is required for schedule' },
            { status: 400 }
          );
        }

        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'Start date and end date are required' },
            { status: 400 }
          );
        }

        const schedule = await staffManagement.getStaffSchedule(
          new ObjectId(staffId),
          new Date(startDate),
          new Date(endDate)
        );

        return NextResponse.json({
          success: true,
          data: schedule
        });

      case 'time_entries':
        if (!staffId) {
          return NextResponse.json(
            { error: 'Staff ID is required for time entries' },
            { status: 400 }
          );
        }

        const timeStartDate = searchParams.get('startDate');
        const timeEndDate = searchParams.get('endDate');

        if (!timeStartDate || !timeEndDate) {
          return NextResponse.json(
            { error: 'Start date and end date are required' },
            { status: 400 }
          );
        }

        const timeEntries = await staffManagement.getStaffTimeEntries(
          new ObjectId(staffId),
          new Date(timeStartDate),
          new Date(timeEndDate)
        );

        return NextResponse.json({
          success: true,
          data: timeEntries
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: statistics, schedule, or time_entries' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Staff management GET API error:', error);
    return NextResponse.json(
      { error: 'Failed to get staff data' },
      { status: 500 }
    );
  }
}