import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Task from '@/models/Task';
import Staff from '@/models/Staff';
import Room from '@/models/Room';
import { validateOSAccess } from '@/lib/auth/os-auth';
import { getServerSession } from 'next-auth';

interface Params {
  params: {
    taskId: string;
  };
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
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

    // Find the task
    const task = await Task.findById(taskId)
      .populate('staffId', 'name email phone status role')
      .populate('roomId', 'roomNumber floor status housekeeping')
      .populate('assignedBy', 'name email')
      .populate('reassignedTo', 'name email')
      .populate('feedback.givenBy', 'name email')
      .lean();

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, task.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Calculate task metrics
    const taskMetrics: any = {
      isOverdue: false,
      timeElapsed: 0,
      timeRemaining: 0,
      progressPercent: 0
    };

    const now = new Date();

    // Check if overdue
    if (task.dueDate && now > task.dueDate && task.status !== 'completed') {
      taskMetrics.isOverdue = true;
    }

    // Calculate time elapsed since assignment
    taskMetrics.timeElapsed = Math.floor((now.getTime() - task.assignedDate.getTime()) / (1000 * 60)); // minutes

    // Calculate time remaining until due date
    if (task.dueDate) {
      taskMetrics.timeRemaining = Math.floor((task.dueDate.getTime() - now.getTime()) / (1000 * 60)); // minutes
    }

    // Calculate progress percentage
    switch (task.status) {
      case 'pending':
        taskMetrics.progressPercent = 0;
        break;
      case 'in_progress':
        taskMetrics.progressPercent = 50;
        break;
      case 'completed':
        taskMetrics.progressPercent = 100;
        break;
      case 'cancelled':
        taskMetrics.progressPercent = 0;
        break;
      case 'delayed':
        taskMetrics.progressPercent = 25;
        break;
      default:
        taskMetrics.progressPercent = 0;
    }

    // Get task history if this task was reassigned
    const taskHistory: any[] = [];
    if (task.reassignedTo) {
      // In a real implementation, you might have a separate TaskHistory model
      // For now, we'll create a simple history entry
      taskHistory.push({
        action: 'reassigned',
        from: task.staffId,
        to: task.reassignedTo,
        timestamp: task.updatedAt,
        reason: 'Task reassignment'
      });
    }

    // Determine available actions based on current status
    const availableActions: string[] = [];

    switch (task.status) {
      case 'pending':
        availableActions.push('start_task', 'reassign', 'cancel', 'update_priority');
        break;
      case 'in_progress':
        availableActions.push('complete_task', 'pause_task', 'add_notes', 'request_help', 'delay');
        break;
      case 'completed':
        availableActions.push('provide_feedback', 'reopen');
        break;
      case 'delayed':
        availableActions.push('resume_task', 'reassign', 'cancel');
        break;
      case 'cancelled':
        availableActions.push('reopen');
        break;
    }

    // Add time-based actions
    if (task.dueDate && now > task.dueDate) {
      availableActions.push('extend_deadline');
    }

    return NextResponse.json({
      success: true,
      data: {
        task: {
          ...task,
          _id: task._id.toString(),
          propertyId: task.propertyId.toString()
        },
        metrics: taskMetrics,
        history: taskHistory,
        availableActions: [...new Set(availableActions)] // Remove duplicates
      }
    });

  } catch (error) {
    console.error('Error fetching task details:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch task details: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;
    const updateData = await request.json();

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
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

    // Find the existing task
    const existingTask = await Task.findById(taskId);
    if (!existingTask) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, existingTask.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Define allowed fields for update
    const allowedFields = [
      'status', 'priority', 'description', 'dueDate', 'location',
      'estimatedDuration', 'actualDuration', 'notes', 'attachments',
      'feedback', 'reassignedTo'
    ];

    const updateFields: any = {};

    // Filter and validate update fields
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields[key] = updateData[key];
      }
    });

    // Special handling for status changes
    if (updateData.status && updateData.status !== existingTask.status) {
      const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled', 'delayed'];

      if (!validStatuses.includes(updateData.status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
          },
          { status: 400 }
        );
      }

      // Validate status transitions
      const validTransitions: { [key: string]: string[] } = {
        'pending': ['in_progress', 'cancelled', 'delayed'],
        'in_progress': ['completed', 'delayed', 'cancelled'],
        'delayed': ['in_progress', 'cancelled', 'pending'],
        'cancelled': ['pending'],
        'completed': ['pending'] // Allow reopening if needed
      };

      const currentStatus = existingTask.status;
      const newStatus = updateData.status;

      if (!validTransitions[currentStatus]?.includes(newStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition from ${currentStatus} to ${newStatus}`
          },
          { status: 400 }
        );
      }

      // Set completion date when completing task
      if (newStatus === 'completed') {
        updateFields.completedDate = new Date();

        // If no actual duration provided, calculate from start time
        if (!updateData.actualDuration && existingTask.status === 'in_progress') {
          const startTime = existingTask.updatedAt; // Approximate start time
          const completionTime = new Date();
          updateFields.actualDuration = Math.floor((completionTime.getTime() - startTime.getTime()) / (1000 * 60));
        }
      }

      // Clear completion date if status changed from completed
      if (currentStatus === 'completed' && newStatus !== 'completed') {
        updateFields.completedDate = null;
      }
    }

    // Validate priority if provided
    if (updateData.priority) {
      const validPriorities = ['low', 'medium', 'high', 'urgent'];
      if (!validPriorities.includes(updateData.priority)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
          },
          { status: 400 }
        );
      }
    }

    // Validate reassignment
    if (updateData.reassignedTo) {
      if (!mongoose.Types.ObjectId.isValid(updateData.reassignedTo)) {
        return NextResponse.json(
          { success: false, error: 'Invalid staff ID for reassignment' },
          { status: 400 }
        );
      }

      // Verify the staff member exists and is active
      const newStaff = await Staff.findOne({
        _id: updateData.reassignedTo,
        propertyId: existingTask.propertyId,
        status: 'active'
      });

      if (!newStaff) {
        return NextResponse.json(
          {
            success: false,
            error: 'Staff member not found or not active in this property'
          },
          { status: 404 }
        );
      }

      // Update staffId to the new assignee
      updateFields.staffId = updateData.reassignedTo;
    }

    // Validate feedback
    if (updateData.feedback) {
      if (updateData.feedback.rating < 1 || updateData.feedback.rating > 5) {
        return NextResponse.json(
          { success: false, error: 'Feedback rating must be between 1 and 5' },
          { status: 400 }
        );
      }

      updateFields.feedback = {
        ...updateData.feedback,
        givenBy: session.user.id || session.user.email,
        givenAt: new Date()
      };
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $set: updateFields },
      {
        new: true,
        runValidators: true
      }
    ).populate('staffId', 'name email phone')
     .populate('roomId', 'roomNumber floor status')
     .populate('assignedBy', 'name email')
     .populate('reassignedTo', 'name email');

    // Update room status if task is completed and related to cleaning
    if (updateData.status === 'completed' && existingTask.roomId &&
        existingTask.description.toLowerCase().includes('clean')) {

      await Room.findByIdAndUpdate(
        existingTask.roomId,
        {
          $set: {
            'housekeeping.cleaningStatus': 'clean',
            'housekeeping.lastCleaned': new Date(),
            'housekeeping.lastCleanedBy': updatedTask?.staffId._id || existingTask.staffId
          }
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        task: updatedTask,
        message: 'Task updated successfully',
        updatedFields: Object.keys(updateFields)
      }
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to update task: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { taskId } = params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid task ID format' },
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

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Validate OS access
    const hasAccess = await validateOSAccess(session.user.email, task.propertyId.toString());
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this property' },
        { status: 403 }
      );
    }

    // Check if task can be deleted (business rules)
    if (task.status === 'in_progress') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a task that is in progress' },
        { status: 400 }
      );
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Task deleted successfully',
        deletedTask: {
          id: taskId,
          description: task.description,
          status: task.status
        }
      }
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        success: false,
        error: `Failed to delete task: ${(error as Error).message}`
      },
      { status: 500 }
    );
  }
}