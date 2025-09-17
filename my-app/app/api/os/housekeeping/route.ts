import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Task from '@/models/Task';
import Staff from '@/models/Staff';
import Room from '@/models/Room';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const staffId = searchParams.get('staffId');
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const roomId = searchParams.get('roomId') || '';
    const date = searchParams.get('date') || '';
    const includeStats = searchParams.get('includeStats') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Validate propertyId format
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid property ID format' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, propertyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Build query for housekeeping tasks
    const query: any = {
      propertyId: new mongoose.Types.ObjectId(propertyId),
      taskType: 'housekeeping'
    };

    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) {
      query.staffId = new mongoose.Types.ObjectId(staffId);
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (roomId && mongoose.Types.ObjectId.isValid(roomId)) {
      query.roomId = new mongoose.Types.ObjectId(roomId);
    }

    // Date filtering
    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      query.$or = [
        { assignedDate: { $gte: startOfDay, $lte: endOfDay } },
        { dueDate: { $gte: startOfDay, $lte: endOfDay } }
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [tasks, totalCount] = await Promise.all([
      Task.find(query)
        .populate('staffId', 'name email phone status role')
        .populate('roomId', 'roomNumber floor status')
        .populate('assignedBy', 'name email')
        .populate('reassignedTo', 'name email')
        .sort({
          priority: 1, // urgent first
          dueDate: 1,   // earliest due dates first
          assignedDate: -1 // newest assignments first
        })
        .skip(skip)
        .limit(limit)
        .lean(),
      Task.countDocuments(query)
    ]);

    // Enhance tasks with additional room information
    const enhancedTasks = await Promise.all(
      tasks.map(async (task) => {
        let roomDetails = null;
        if (task.roomId) {
          const room = await Room.findById(task.roomId)
            .select('housekeeping.cleaningStatus housekeeping.lastCleaned housekeeping.cleaningNotes')
            .lean();
          roomDetails = room?.housekeeping || null;
        }

        return {
          ...task,
          _id: task._id.toString(),
          staffId: task.staffId ? {
            ...task.staffId,
            _id: task.staffId._id?.toString()
          } : null,
          roomId: task.roomId ? {
            ...task.roomId,
            _id: task.roomId._id?.toString()
          } : null,
          roomHousekeeping: roomDetails
        };
      })
    );

    const responseData: any = {
      tasks: enhancedTasks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      }
    };

    // Include statistics if requested
    if (includeStats) {
      const statsQuery = {
        propertyId: new mongoose.Types.ObjectId(propertyId),
        taskType: 'housekeeping'
      };

      // Get task statistics
      const [taskStats, staffStats, todaysTasks] = await Promise.all([
        // Task status distribution
        Task.aggregate([
          { $match: statsQuery },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              avgDuration: { $avg: '$actualDuration' }
            }
          }
        ]),

        // Staff workload
        Task.aggregate([
          { $match: { ...statsQuery, status: { $nin: ['completed', 'cancelled'] } } },
          {
            $group: {
              _id: '$staffId',
              activeTasks: { $sum: 1 },
              urgentTasks: {
                $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
              }
            }
          },
          {
            $lookup: {
              from: 'staff',
              localField: '_id',
              foreignField: '_id',
              as: 'staff'
            }
          },
          { $unwind: '$staff' },
          {
            $project: {
              staffName: '$staff.name',
              activeTasks: 1,
              urgentTasks: 1
            }
          }
        ]),

        // Today's tasks
        Task.countDocuments({
          ...statsQuery,
          $or: [
            {
              assignedDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999))
              }
            },
            {
              dueDate: {
                $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                $lte: new Date(new Date().setHours(23, 59, 59, 999))
              }
            }
          ]
        })
      ]);

      // Process task statistics
      const statusMap = taskStats.reduce((acc: any, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgDuration: Math.round(stat.avgDuration || 0)
        };
        return acc;
      }, {});

      // Calculate room cleaning status
      const roomCleaningStats = await Room.aggregate([
        { $match: { propertyId: new mongoose.Types.ObjectId(propertyId) } },
        {
          $group: {
            _id: '$housekeeping.cleaningStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const cleaningStatusMap = roomCleaningStats.reduce((acc: any, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {});

      responseData.statistics = {
        tasks: {
          total: totalCount,
          today: todaysTasks,
          pending: statusMap.pending?.count || 0,
          inProgress: statusMap.in_progress?.count || 0,
          completed: statusMap.completed?.count || 0,
          delayed: statusMap.delayed?.count || 0,
          cancelled: statusMap.cancelled?.count || 0,
          avgCompletionTime: Math.round(
            (statusMap.completed?.avgDuration || 0) +
            (statusMap.in_progress?.avgDuration || 0)
          ) / 2
        },
        staff: {
          totalAssigned: staffStats.length,
          workload: staffStats.map(staff => ({
            staffName: staff.staffName,
            activeTasks: staff.activeTasks,
            urgentTasks: staff.urgentTasks
          }))
        },
        rooms: {
          totalRooms: Object.values(cleaningStatusMap).reduce((sum: number, count) => sum + (count as number), 0),
          clean: cleaningStatusMap.clean || 0,
          dirty: cleaningStatusMap.dirty || 0,
          inProgress: cleaningStatusMap.cleaning_in_progress || 0,
          inspected: cleaningStatusMap.inspected || 0,
          maintenanceRequired: cleaningStatusMap.maintenance_required || 0
        }
      };
    }

    // Add available actions
    responseData.availableActions = [
      'create_task',
      'bulk_assign',
      'schedule_cleaning',
      'generate_report'
    ];

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching housekeeping tasks:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch housekeeping tasks: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const taskData = await request.json();

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);

    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate required fields
    const requiredFields = ['staffId', 'description', 'propertyId'];
    for (const field of requiredFields) {
      if (!taskData[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required field: ${field}`
          },
          { status: 400 }
        );
      }
    }

    // Validate ObjectIds
    const idsToValidate = ['staffId', 'propertyId'];
    if (taskData.roomId) idsToValidate.push('roomId');
    if (taskData.bookingId) idsToValidate.push('bookingId');

    for (const idField of idsToValidate) {
      if (taskData[idField] && !mongoose.Types.ObjectId.isValid(taskData[idField])) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid ${idField} format`
          },
          { status: 400 }
        );
      }
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, taskData.propertyId);
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Verify staff exists and belongs to property
    const staff = await Staff.findOne({
      _id: taskData.staffId,
      propertyId: taskData.propertyId,
      status: 'active'
    });

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          error: 'Staff member not found or not active in this property'
        },
        { status: 404 }
      );
    }

    // Verify room exists if provided
    if (taskData.roomId) {
      const room = await Room.findOne({
        _id: taskData.roomId,
        propertyId: taskData.propertyId
      });

      if (!room) {
        return NextResponse.json(
          {
            success: false,
            error: 'Room not found in this property'
          },
          { status: 404 }
        );
      }

      // Auto-set location to room number if not provided
      if (!taskData.location) {
        taskData.location = `Room ${room.roomNumber}`;
      }
    }

    // Set default values
    const newTask = new Task({
      ...taskData,
      taskType: 'housekeeping',
      status: taskData.status || 'pending',
      priority: taskData.priority || 'medium',
      assignedDate: taskData.assignedDate || new Date(),
      assignedBy: session.user.id || session.user.email,
      estimatedDuration: taskData.estimatedDuration || 30 // Default 30 minutes
    });

    // Validate priority and status
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'delayed'];

    if (!validPriorities.includes(newTask.priority)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
        },
        { status: 400 }
      );
    }

    if (!validStatuses.includes(newTask.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        },
        { status: 400 }
      );
    }

    // Save the task
    await newTask.save();

    // Update room housekeeping status if this is a cleaning task
    if (taskData.roomId && taskData.description.toLowerCase().includes('clean')) {
      await Room.findByIdAndUpdate(
        taskData.roomId,
        {
          $set: {
            'housekeeping.nextCleaningScheduled': newTask.dueDate || newTask.assignedDate,
            'housekeeping.cleaningStatus': 'cleaning_in_progress'
          }
        }
      );
    }

    // Populate the created task for response
    const populatedTask = await Task.findById(newTask._id)
      .populate('staffId', 'name email phone')
      .populate('roomId', 'roomNumber floor')
      .populate('assignedBy', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        task: {
          ...populatedTask,
          _id: populatedTask!._id.toString()
        },
        message: 'Housekeeping task created successfully'
      }
    });

  } catch (error) {
    console.error('Error creating housekeeping task:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to create housekeeping task: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}