import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import Property from '@/models/Property'

interface MaintenanceTask {
  id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  roomNumber?: string
  category: 'electrical' | 'plumbing' | 'hvac' | 'cleaning' | 'repair' | 'inspection' | 'other'
  createdAt: string
  updatedAt: string
  dueDate?: string
  estimatedHours?: number
  actualHours?: number
  notes?: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // For now, we'll generate sample maintenance data based on property rooms
    // In a real implementation, this would come from a Maintenance collection
    const sampleTasks: MaintenanceTask[] = [
      {
        id: '1',
        title: 'Fix leaking faucet',
        description: 'Guest reported dripping faucet in bathroom',
        priority: 'medium',
        status: 'pending',
        assignedTo: 'John Doe',
        roomNumber: '101',
        category: 'plumbing',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 2,
        notes: 'Need to check water pressure as well'
      },
      {
        id: '2',
        title: 'AC not cooling properly',
        description: 'Room temperature not reaching set point',
        priority: 'high',
        status: 'in-progress',
        assignedTo: 'Mike Johnson',
        roomNumber: '205',
        category: 'hvac',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 0.5 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 4,
        actualHours: 2,
        notes: 'Refrigerant levels checked, filter replaced'
      },
      {
        id: '3',
        title: 'Deep cleaning required',
        description: 'Post-checkout deep cleaning for premium suite',
        priority: 'medium',
        status: 'completed',
        assignedTo: 'Sarah Wilson',
        roomNumber: '301',
        category: 'cleaning',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 3,
        actualHours: 3.5
      },
      {
        id: '4',
        title: 'Monthly fire safety inspection',
        description: 'Routine inspection of fire safety equipment',
        priority: 'high',
        status: 'pending',
        assignedTo: 'Safety Inspector',
        category: 'inspection',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 6,
        notes: 'Check all extinguishers, alarms, and emergency exits'
      },
      {
        id: '5',
        title: 'Light bulb replacement',
        description: 'Replace burnt out LED bulbs in lobby',
        priority: 'low',
        status: 'pending',
        assignedTo: 'Maintenance Team',
        category: 'electrical',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedHours: 1
      }
    ]

    // Calculate stats
    const stats = {
      total: sampleTasks.length,
      pending: sampleTasks.filter(t => t.status === 'pending').length,
      inProgress: sampleTasks.filter(t => t.status === 'in-progress').length,
      completed: sampleTasks.filter(t => t.status === 'completed').length,
      overdue: sampleTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
      ).length,
      highPriority: sampleTasks.filter(t => 
        t.priority === 'high' || t.priority === 'urgent'
      ).length,
      avgCompletionTime: sampleTasks
        .filter(t => t.actualHours)
        .reduce((sum, t) => sum + (t.actualHours || 0), 0) / 
        Math.max(sampleTasks.filter(t => t.actualHours).length, 1)
    }

    return NextResponse.json({
      success: true,
      tasks: sampleTasks,
      stats,
      property: {
        id: property._id,
        title: property.title,
        address: property.address
      }
    })
  } catch (error) {
    console.error('Error fetching maintenance data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id
    const taskData = await request.json()

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // In a real implementation, this would save to a Maintenance collection
    const newTask: MaintenanceTask = {
      id: Date.now().toString(),
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'pending'
    }

    return NextResponse.json({
      success: true,
      task: newTask,
      message: 'Maintenance task created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance task:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase()

    const propertyId = params.id
    const { taskId, ...updateData } = await request.json()

    // Verify property exists
    const property = await Property.findById(propertyId)
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // In a real implementation, this would update the Maintenance collection
    const updatedTask = {
      ...updateData,
      updatedAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: 'Maintenance task updated successfully'
    })
  } catch (error) {
    console.error('Error updating maintenance task:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance task' },
      { status: 500 }
    )
  }
}