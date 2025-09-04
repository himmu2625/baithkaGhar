import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/utils/dbConnect"
import Task from "@/models/Task"
import StaffMember from "@/models/StaffMember"
import Room from "@/models/Room"
import Booking from "@/models/Booking"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    // Fetch pending tasks for the property
    const tasks = await Task.find({
      propertyId,
      status: { $in: ['pending', 'in_progress', 'delayed'] }
    })
    .populate('staffId', 'firstName lastName')
    .populate('roomId', 'number unitTypeCode')
    .populate('bookingId', 'contactDetails.name')
    .populate('assignedBy', 'firstName lastName')
    .sort({ priority: -1, dueDate: 1 }) // Urgent first, then by due date
    .limit(50) // Limit for performance

    // Format tasks for frontend
    const formattedTasks = tasks.map((task: any) => ({
      id: task._id.toString(),
      title: task.description,
      type: task.taskType,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: task.staffId ? 
        `${task.staffId.firstName} ${task.staffId.lastName}` : 
        'Unassigned',
      description: task.notes || task.description,
      location: task.location || 
        (task.roomId ? `Room ${task.roomId.number}` : null) ||
        (task.bookingId ? `Booking ${task.bookingId.contactDetails?.name || ''}` : null),
      status: task.status,
      estimatedDuration: task.estimatedDuration,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }))

    // Calculate statistics
    const stats = {
      total: formattedTasks.length,
      urgent: formattedTasks.filter(t => t.priority === 'urgent').length,
      high: formattedTasks.filter(t => t.priority === 'high').length,
      overdue: formattedTasks.filter(t => new Date(t.dueDate) < new Date()).length,
      byType: {
        housekeeping: formattedTasks.filter(t => t.type === 'housekeeping').length,
        maintenance: formattedTasks.filter(t => t.type === 'maintenance').length,
        guest_service: formattedTasks.filter(t => t.type === 'guest_service').length,
        administrative: formattedTasks.filter(t => t.type === 'administrative').length,
        security: formattedTasks.filter(t => t.type === 'security').length,
        other: formattedTasks.filter(t => t.type === 'other').length
      }
    }

    return NextResponse.json({
      success: true,
      data: formattedTasks,
      stats
    })

  } catch (error) {
    console.error("Pending Tasks API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to fetch pending tasks",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// POST endpoint for updating task status
export async function POST(request: NextRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const body = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: "Property ID is required" },
        { status: 400 }
      )
    }

    const { action, taskId, status, staffId, notes } = body

    switch (action) {
      case 'update_status':
        const task = await Task.findOneAndUpdate(
          { _id: taskId, propertyId },
          { 
            status,
            ...(status === 'completed' && { completedDate: new Date() }),
            ...(notes && { notes }),
            updatedAt: new Date()
          },
          { new: true }
        )

        if (!task) {
          return NextResponse.json(
            { error: "Task not found" },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: `Task ${status} successfully`,
          data: task
        })

      case 'reassign':
        const reassignedTask = await Task.findOneAndUpdate(
          { _id: taskId, propertyId },
          { 
            staffId,
            reassignedTo: staffId,
            updatedAt: new Date()
          },
          { new: true }
        ).populate('staffId', 'firstName lastName')

        if (!reassignedTask) {
          return NextResponse.json(
            { error: "Task not found" },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          message: "Task reassigned successfully",
          data: reassignedTask
        })

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("Pending Tasks POST API error:", error)
    
    return NextResponse.json(
      { 
        error: "Failed to update task",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}