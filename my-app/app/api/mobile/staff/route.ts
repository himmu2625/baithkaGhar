import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateTaskSchema = z.object({
  taskId: z.string().min(1, 'Task ID required'),
  status: z.enum(['pending', 'in-progress', 'completed', 'cancelled']),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  completedAt: z.string().optional()
})

const createTaskSchema = z.object({
  type: z.enum(['cleaning', 'maintenance', 'guest-request', 'inspection', 'delivery']),
  title: z.string().min(1, 'Title required'),
  description: z.string().min(1, 'Description required'),
  room: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  assignedTo: z.string().optional(),
  dueTime: z.string().min(1, 'Due time required'),
  estimatedDuration: z.number().optional()
})

const updateRoomSchema = z.object({
  roomNumber: z.string().min(1, 'Room number required'),
  status: z.enum(['occupied', 'vacant-clean', 'vacant-dirty', 'out-of-order', 'maintenance']),
  housekeeping: z.enum(['pending', 'in-progress', 'completed']).optional(),
  notes: z.string().optional(),
  updatedBy: z.string().min(1, 'Updated by required')
})

const guestRequestResponseSchema = z.object({
  requestId: z.string().min(1, 'Request ID required'),
  status: z.enum(['pending', 'acknowledged', 'in-progress', 'completed']),
  assignedTo: z.string().optional(),
  response: z.string().optional(),
  estimatedTime: z.string().optional()
})

const staffStatusSchema = z.object({
  staffId: z.string().min(1, 'Staff ID required'),
  status: z.enum(['available', 'busy', 'break', 'offline']),
  currentTask: z.string().optional(),
  location: z.string().optional()
})

interface Task {
  id: string
  type: 'cleaning' | 'maintenance' | 'guest-request' | 'inspection' | 'delivery'
  title: string
  description: string
  room?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  createdBy: string
  dueTime: string
  estimatedDuration?: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  notes: string[]
  attachments: string[]
}

interface Room {
  number: string
  type: string
  status: 'occupied' | 'vacant-clean' | 'vacant-dirty' | 'out-of-order' | 'maintenance'
  guest?: string
  checkIn?: string
  checkOut?: string
  housekeeping: 'pending' | 'in-progress' | 'completed'
  maintenance: string[]
  notes: string
  lastUpdated: string
  updatedBy: string
}

interface GuestRequest {
  id: string
  room: string
  guest: string
  guestId: string
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'food' | 'transport'
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed'
  timestamp: string
  assignedTo?: string
  response?: string
  estimatedTime?: string
  completedAt?: string
}

interface StaffMember {
  id: string
  name: string
  email: string
  role: 'front-desk' | 'housekeeping' | 'maintenance' | 'concierge' | 'manager'
  status: 'available' | 'busy' | 'break' | 'offline'
  currentTask?: string
  shift: string
  location?: string
  tasksCompleted: number
  performanceRating: number
  lastActive: string
}

interface DashboardStats {
  occupancyRate: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  pendingTasks: number
  completedTasks: number
  urgentIssues: number
  staffOnDuty: number
  guestRequests: number
  maintenanceIssues: number
}

// Mock database - replace with actual database calls
let mockTasks: Task[] = [
  {
    id: 'task-001',
    type: 'cleaning',
    title: 'Room 205 Checkout Cleaning',
    description: 'Standard checkout cleaning required after guest departure',
    room: '205',
    priority: 'medium',
    status: 'pending',
    createdBy: 'front-desk-001',
    dueTime: '2:00 PM',
    estimatedDuration: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    notes: [],
    attachments: []
  },
  {
    id: 'task-002',
    type: 'maintenance',
    title: 'AC Unit Repair',
    description: 'Guest reported AC not cooling properly in room',
    room: '312',
    priority: 'high',
    status: 'in-progress',
    assignedTo: 'maintenance-001',
    createdBy: 'front-desk-001',
    dueTime: '1:30 PM',
    estimatedDuration: 60,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    notes: ['Guest reported issue at 9:00 AM', 'Technician dispatched'],
    attachments: []
  }
]

let mockRooms: Room[] = [
  {
    number: '101',
    type: 'Standard King',
    status: 'occupied',
    guest: 'John Smith',
    checkIn: '2024-01-15',
    checkOut: '2024-01-18',
    housekeeping: 'completed',
    maintenance: [],
    notes: '',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'front-desk-001'
  },
  {
    number: '102',
    type: 'Standard Queen',
    status: 'vacant-dirty',
    housekeeping: 'pending',
    maintenance: [],
    notes: 'Requires deep cleaning',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'housekeeping-001'
  },
  {
    number: '103',
    type: 'Deluxe Suite',
    status: 'vacant-clean',
    housekeeping: 'completed',
    maintenance: [],
    notes: '',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'housekeeping-002'
  },
  {
    number: '104',
    type: 'Standard King',
    status: 'maintenance',
    housekeeping: 'pending',
    maintenance: ['task-002'],
    notes: 'Plumbing issue reported - toilet running continuously',
    lastUpdated: new Date().toISOString(),
    updatedBy: 'maintenance-001'
  }
]

let mockGuestRequests: GuestRequest[] = [
  {
    id: 'req-001',
    room: '205',
    guest: 'Alice Brown',
    guestId: 'guest-001',
    type: 'housekeeping',
    description: 'Need fresh towels and toiletries replenishment',
    priority: 'medium',
    status: 'pending',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    estimatedTime: '15 min'
  },
  {
    id: 'req-002',
    room: '312',
    guest: 'Bob Wilson',
    guestId: 'guest-002',
    type: 'maintenance',
    description: 'Bathroom light fixture not working properly',
    priority: 'high',
    status: 'acknowledged',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    assignedTo: 'maintenance-001',
    estimatedTime: '30 min'
  }
]

let mockStaff: StaffMember[] = [
  {
    id: 'staff-001',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@hotel.com',
    role: 'front-desk',
    status: 'available',
    shift: '9:00 AM - 5:00 PM',
    tasksCompleted: 12,
    performanceRating: 4.8,
    lastActive: new Date().toISOString()
  },
  {
    id: 'staff-002',
    name: 'Mike Chen',
    email: 'mike.chen@hotel.com',
    role: 'maintenance',
    status: 'busy',
    currentTask: 'task-002',
    shift: '8:00 AM - 4:00 PM',
    location: 'Room 312',
    tasksCompleted: 8,
    performanceRating: 4.6,
    lastActive: new Date().toISOString()
  },
  {
    id: 'staff-003',
    name: 'Maria Garcia',
    email: 'maria.garcia@hotel.com',
    role: 'housekeeping',
    status: 'available',
    shift: '7:00 AM - 3:00 PM',
    tasksCompleted: 15,
    performanceRating: 4.9,
    lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString()
  }
]

function calculateDashboardStats(): DashboardStats {
  const totalRooms = mockRooms.length
  const occupiedRooms = mockRooms.filter(r => r.status === 'occupied').length
  const availableRooms = mockRooms.filter(r => r.status === 'vacant-clean').length
  const pendingTasks = mockTasks.filter(t => t.status === 'pending').length
  const completedTasks = mockTasks.filter(t => t.status === 'completed').length
  const urgentIssues = mockTasks.filter(t => t.priority === 'urgent').length
  const staffOnDuty = mockStaff.filter(s => s.status !== 'offline').length
  const guestRequests = mockGuestRequests.filter(r => r.status !== 'completed').length
  const maintenanceIssues = mockTasks.filter(t => t.type === 'maintenance' && t.status !== 'completed').length

  return {
    occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
    totalRooms,
    availableRooms,
    occupiedRooms,
    pendingTasks,
    completedTasks,
    urgentIssues,
    staffOnDuty,
    guestRequests,
    maintenanceIssues
  }
}

function generateTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// Main API handler
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'get-dashboard': {
        const stats = calculateDashboardStats()
        const recentTasks = mockTasks
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 5)

        const urgentAlerts = mockTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed')

        return NextResponse.json({
          success: true,
          stats,
          recentTasks,
          urgentAlerts,
          lastUpdated: new Date().toISOString()
        })
      }

      case 'get-tasks': {
        const body = await request.json()
        const { staffId, status, priority, type } = body

        let filteredTasks = [...mockTasks]

        if (staffId) {
          filteredTasks = filteredTasks.filter(t => t.assignedTo === staffId || !t.assignedTo)
        }

        if (status && status !== 'all') {
          filteredTasks = filteredTasks.filter(t => t.status === status)
        }

        if (priority && priority !== 'all') {
          filteredTasks = filteredTasks.filter(t => t.priority === priority)
        }

        if (type && type !== 'all') {
          filteredTasks = filteredTasks.filter(t => t.type === type)
        }

        // Sort by priority and due time
        filteredTasks.sort((a, b) => {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          const aPriority = priorityOrder[a.priority]
          const bPriority = priorityOrder[b.priority]

          if (aPriority !== bPriority) {
            return bPriority - aPriority
          }

          return a.dueTime.localeCompare(b.dueTime)
        })

        return NextResponse.json({
          success: true,
          tasks: filteredTasks
        })
      }

      case 'update-task': {
        const body = await request.json()
        const { taskId, status, assignedTo, notes } = updateTaskSchema.parse(body)

        const taskIndex = mockTasks.findIndex(t => t.id === taskId)
        if (taskIndex === -1) {
          return NextResponse.json(
            { error: 'Task not found' },
            { status: 404 }
          )
        }

        const task = mockTasks[taskIndex]
        const updatedTask = {
          ...task,
          status,
          assignedTo: assignedTo || task.assignedTo,
          updatedAt: new Date().toISOString(),
          completedAt: status === 'completed' ? new Date().toISOString() : task.completedAt
        }

        if (notes) {
          updatedTask.notes.push(`${new Date().toLocaleString()}: ${notes}`)
        }

        mockTasks[taskIndex] = updatedTask

        // Update staff status if task assigned
        if (assignedTo && status === 'in-progress') {
          const staffIndex = mockStaff.findIndex(s => s.id === assignedTo)
          if (staffIndex !== -1) {
            mockStaff[staffIndex] = {
              ...mockStaff[staffIndex],
              status: 'busy',
              currentTask: taskId,
              lastActive: new Date().toISOString()
            }
          }
        }

        // Update staff status if task completed
        if (status === 'completed' && task.assignedTo) {
          const staffIndex = mockStaff.findIndex(s => s.id === task.assignedTo)
          if (staffIndex !== -1) {
            mockStaff[staffIndex] = {
              ...mockStaff[staffIndex],
              status: 'available',
              currentTask: undefined,
              tasksCompleted: mockStaff[staffIndex].tasksCompleted + 1,
              lastActive: new Date().toISOString()
            }
          }
        }

        return NextResponse.json({
          success: true,
          task: updatedTask,
          message: `Task ${status === 'completed' ? 'completed' : 'updated'} successfully`
        })
      }

      case 'create-task': {
        const body = await request.json()
        const taskData = createTaskSchema.parse(body)

        const newTask: Task = {
          id: generateTaskId(),
          ...taskData,
          status: 'pending',
          createdBy: 'current-user', // In real app, get from auth
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          notes: [],
          attachments: []
        }

        mockTasks.push(newTask)

        return NextResponse.json({
          success: true,
          task: newTask,
          message: 'Task created successfully'
        })
      }

      case 'get-rooms': {
        const body = await request.json()
        const { status, floor, type } = body

        let filteredRooms = [...mockRooms]

        if (status && status !== 'all') {
          filteredRooms = filteredRooms.filter(r => r.status === status)
        }

        if (floor) {
          filteredRooms = filteredRooms.filter(r => r.number.startsWith(floor))
        }

        if (type && type !== 'all') {
          filteredRooms = filteredRooms.filter(r => r.type === type)
        }

        // Sort by room number
        filteredRooms.sort((a, b) => a.number.localeCompare(b.number))

        return NextResponse.json({
          success: true,
          rooms: filteredRooms
        })
      }

      case 'update-room': {
        const body = await request.json()
        const { roomNumber, status, housekeeping, notes, updatedBy } = updateRoomSchema.parse(body)

        const roomIndex = mockRooms.findIndex(r => r.number === roomNumber)
        if (roomIndex === -1) {
          return NextResponse.json(
            { error: 'Room not found' },
            { status: 404 }
          )
        }

        const updatedRoom = {
          ...mockRooms[roomIndex],
          status,
          housekeeping: housekeeping || mockRooms[roomIndex].housekeeping,
          notes: notes || mockRooms[roomIndex].notes,
          lastUpdated: new Date().toISOString(),
          updatedBy
        }

        mockRooms[roomIndex] = updatedRoom

        return NextResponse.json({
          success: true,
          room: updatedRoom,
          message: 'Room status updated successfully'
        })
      }

      case 'get-guest-requests': {
        const body = await request.json()
        const { status, priority, type, assignedTo } = body

        let filteredRequests = [...mockGuestRequests]

        if (status && status !== 'all') {
          filteredRequests = filteredRequests.filter(r => r.status === status)
        }

        if (priority && priority !== 'all') {
          filteredRequests = filteredRequests.filter(r => r.priority === priority)
        }

        if (type && type !== 'all') {
          filteredRequests = filteredRequests.filter(r => r.type === type)
        }

        if (assignedTo) {
          filteredRequests = filteredRequests.filter(r => r.assignedTo === assignedTo)
        }

        // Sort by priority and timestamp
        filteredRequests.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          const aPriority = priorityOrder[a.priority]
          const bPriority = priorityOrder[b.priority]

          if (aPriority !== bPriority) {
            return bPriority - aPriority
          }

          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        return NextResponse.json({
          success: true,
          requests: filteredRequests
        })
      }

      case 'respond-to-request': {
        const body = await request.json()
        const { requestId, status, assignedTo, response, estimatedTime } = guestRequestResponseSchema.parse(body)

        const requestIndex = mockGuestRequests.findIndex(r => r.id === requestId)
        if (requestIndex === -1) {
          return NextResponse.json(
            { error: 'Guest request not found' },
            { status: 404 }
          )
        }

        const updatedRequest = {
          ...mockGuestRequests[requestIndex],
          status,
          assignedTo: assignedTo || mockGuestRequests[requestIndex].assignedTo,
          response: response || mockGuestRequests[requestIndex].response,
          estimatedTime: estimatedTime || mockGuestRequests[requestIndex].estimatedTime,
          completedAt: status === 'completed' ? new Date().toISOString() : mockGuestRequests[requestIndex].completedAt
        }

        mockGuestRequests[requestIndex] = updatedRequest

        return NextResponse.json({
          success: true,
          request: updatedRequest,
          message: 'Guest request updated successfully'
        })
      }

      case 'update-staff-status': {
        const body = await request.json()
        const { staffId, status, currentTask, location } = staffStatusSchema.parse(body)

        const staffIndex = mockStaff.findIndex(s => s.id === staffId)
        if (staffIndex === -1) {
          return NextResponse.json(
            { error: 'Staff member not found' },
            { status: 404 }
          )
        }

        const updatedStaff = {
          ...mockStaff[staffIndex],
          status,
          currentTask: currentTask || mockStaff[staffIndex].currentTask,
          location: location || mockStaff[staffIndex].location,
          lastActive: new Date().toISOString()
        }

        mockStaff[staffIndex] = updatedStaff

        return NextResponse.json({
          success: true,
          staff: updatedStaff,
          message: 'Staff status updated successfully'
        })
      }

      case 'get-staff': {
        const activeStaff = mockStaff.filter(s => s.status !== 'offline')

        return NextResponse.json({
          success: true,
          staff: activeStaff
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Mobile staff API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get staff dashboard data
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const staffId = url.searchParams.get('staffId')
    const view = url.searchParams.get('view') || 'dashboard'

    switch (view) {
      case 'dashboard': {
        const stats = calculateDashboardStats()
        const staff = staffId ? mockStaff.find(s => s.id === staffId) : null

        return NextResponse.json({
          success: true,
          stats,
          staff,
          lastUpdated: new Date().toISOString()
        })
      }

      case 'notifications': {
        // Get notifications for staff member
        const notifications = [
          {
            id: 'notif-001',
            type: 'task-assigned',
            title: 'New Task Assigned',
            message: 'Room 205 cleaning has been assigned to you',
            timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            read: false
          },
          {
            id: 'notif-002',
            type: 'urgent-request',
            title: 'Urgent Guest Request',
            message: 'Guest in Room 312 needs immediate assistance',
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            read: false
          },
          {
            id: 'notif-003',
            type: 'shift-reminder',
            title: 'Break Time Reminder',
            message: 'Your break starts in 15 minutes',
            timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            read: true
          }
        ]

        return NextResponse.json({
          success: true,
          notifications
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid view specified' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Get staff data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}