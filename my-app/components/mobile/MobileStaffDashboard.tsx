'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Bed,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  MessageSquare,
  Settings,
  Bell,
  Calendar,
  MapPin,
  User,
  Home,
  Wrench,
  Utensils,
  Car,
  Wifi,
  Shield,
  Star,
  TrendingUp,
  Activity,
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Camera,
  Send,
  Eye,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  role: 'front-desk' | 'housekeeping' | 'maintenance' | 'concierge' | 'manager'
  avatar?: string
  status: 'available' | 'busy' | 'break' | 'offline'
  currentTask?: string
  shift: string
}

interface Task {
  id: string
  type: 'cleaning' | 'maintenance' | 'guest-request' | 'inspection' | 'delivery'
  title: string
  description: string
  room?: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  assignedTo?: string
  dueTime: string
  estimatedDuration?: number
  notes?: string[]
  attachments?: string[]
}

interface Room {
  number: string
  type: string
  status: 'occupied' | 'vacant-clean' | 'vacant-dirty' | 'out-of-order' | 'maintenance'
  guest?: string
  checkIn?: string
  checkOut?: string
  housekeeping?: 'pending' | 'in-progress' | 'completed'
  maintenance?: Task[]
  notes?: string
}

interface GuestRequest {
  id: string
  room: string
  guest: string
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'food' | 'transport'
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'acknowledged' | 'in-progress' | 'completed'
  timestamp: string
  assignedTo?: string
  estimatedTime?: string
}

interface DashboardStats {
  occupancyRate: number
  availableRooms: number
  pendingTasks: number
  urgentIssues: number
  staffOnDuty: number
  guestRequests: number
}

export default function MobileStaffDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'rooms' | 'guests' | 'profile'>('overview')
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [notifications, setNotifications] = useState<number>(3)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Mock data
  const currentStaff: StaffMember = {
    id: 'staff-001',
    name: 'Sarah Johnson',
    role: 'front-desk',
    status: 'available',
    shift: '9:00 AM - 5:00 PM'
  }

  const dashboardStats: DashboardStats = {
    occupancyRate: 78,
    availableRooms: 12,
    pendingTasks: 8,
    urgentIssues: 2,
    staffOnDuty: 15,
    guestRequests: 5
  }

  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'task-001',
      type: 'cleaning',
      title: 'Room 205 Checkout Cleaning',
      description: 'Standard checkout cleaning required',
      room: '205',
      priority: 'medium',
      status: 'pending',
      dueTime: '2:00 PM',
      estimatedDuration: 45
    },
    {
      id: 'task-002',
      type: 'maintenance',
      title: 'AC Unit Repair',
      description: 'Guest reported AC not cooling properly',
      room: '312',
      priority: 'high',
      status: 'in-progress',
      assignedTo: 'Mike Chen',
      dueTime: '1:30 PM',
      estimatedDuration: 60
    },
    {
      id: 'task-003',
      type: 'guest-request',
      title: 'Extra Towels',
      description: 'Guest requested additional towels',
      room: '118',
      priority: 'low',
      status: 'pending',
      dueTime: '3:00 PM',
      estimatedDuration: 15
    }
  ])

  const [rooms, setRooms] = useState<Room[]>([
    {
      number: '101',
      type: 'Standard King',
      status: 'occupied',
      guest: 'John Smith',
      checkIn: '2024-01-15',
      checkOut: '2024-01-18',
      housekeeping: 'completed'
    },
    {
      number: '102',
      type: 'Standard Queen',
      status: 'vacant-dirty',
      housekeeping: 'pending'
    },
    {
      number: '103',
      type: 'Deluxe Suite',
      status: 'vacant-clean',
      housekeeping: 'completed'
    },
    {
      number: '104',
      type: 'Standard King',
      status: 'maintenance',
      notes: 'Plumbing issue reported',
      housekeeping: 'pending'
    }
  ])

  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([
    {
      id: 'req-001',
      room: '205',
      guest: 'Alice Brown',
      type: 'housekeeping',
      description: 'Need fresh towels and toiletries',
      priority: 'medium',
      status: 'pending',
      timestamp: '10:30 AM',
      estimatedTime: '15 min'
    },
    {
      id: 'req-002',
      room: '312',
      guest: 'Bob Wilson',
      type: 'maintenance',
      description: 'Bathroom light not working',
      priority: 'high',
      status: 'acknowledged',
      timestamp: '9:45 AM',
      assignedTo: 'Mike Chen',
      estimatedTime: '30 min'
    }
  ])

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setNotifications(prev => prev + Math.floor(Math.random() * 2))
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRefreshing(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in-progress': return 'text-blue-600 bg-blue-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-blue-500'
      case 'vacant-clean': return 'bg-green-500'
      case 'vacant-dirty': return 'bg-yellow-500'
      case 'out-of-order': return 'bg-red-500'
      case 'maintenance': return 'bg-orange-500'
      default: return 'bg-gray-500'
    }
  }

  const assignTask = (taskId: string, staffId: string) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, assignedTo: staffId, status: 'in-progress' } : task
    ))
  }

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId ? { ...task, status } : task
    ))
  }

  const updateRoomStatus = (roomNumber: string, status: Room['status']) => {
    setRooms(prev => prev.map(room =>
      room.number === roomNumber ? { ...room, status } : room
    ))
  }

  const acknowledgeRequest = (requestId: string) => {
    setGuestRequests(prev => prev.map(req =>
      req.id === requestId ? { ...req, status: 'acknowledged', assignedTo: currentStaff.name } : req
    ))
  }

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardStats.occupancyRate}%</div>
            <p className="text-sm text-gray-600">Occupancy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardStats.availableRooms}</div>
            <p className="text-sm text-gray-600">Available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{dashboardStats.pendingTasks}</div>
            <p className="text-sm text-gray-600">Pending Tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{dashboardStats.urgentIssues}</div>
            <p className="text-sm text-gray-600">Urgent Issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto p-3 flex-col gap-2">
              <ClipboardList className="w-6 h-6" />
              <span className="text-xs">New Task</span>
            </Button>
            <Button variant="outline" className="h-auto p-3 flex-col gap-2">
              <Bed className="w-6 h-6" />
              <span className="text-xs">Room Status</span>
            </Button>
            <Button variant="outline" className="h-auto p-3 flex-col gap-2">
              <Users className="w-6 h-6" />
              <span className="text-xs">Guest Check-in</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Room 205 cleaned</p>
                <p className="text-xs text-gray-500">Completed by Maria - 10:30 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Guest checked in</p>
                <p className="text-xs text-gray-500">John Smith - Room 101 - 9:45 AM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Maintenance request</p>
                <p className="text-xs text-gray-500">Room 312 AC issue - 9:15 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Urgent Alerts */}
      {dashboardStats.urgentIssues > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Urgent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 bg-white rounded border border-red-200">
                <p className="text-sm font-medium text-red-700">Room 312 - AC Emergency</p>
                <p className="text-xs text-red-600">Guest complaint - requires immediate attention</p>
              </div>
              <div className="p-2 bg-white rounded border border-red-200">
                <p className="text-sm font-medium text-red-700">Elevator Malfunction</p>
                <p className="text-xs text-red-600">Main elevator stopped between floors 2-3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderTasks = () => (
    <div className="space-y-4">
      {/* Filter and Search */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id} className="border-l-4" style={{ borderLeftColor: getPriorityColor(task.priority).replace('bg-', '#') }}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{task.title}</h3>
                  <p className="text-xs text-gray-600 mb-1">{task.description}</p>
                  {task.room && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3" />
                      Room {task.room}
                    </div>
                  )}
                </div>
                <Badge className={getStatusColor(task.status)} variant="secondary">
                  {task.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  Due: {task.dueTime}
                </div>
                {task.estimatedDuration && (
                  <span>{task.estimatedDuration} min</span>
                )}
              </div>

              <div className="flex gap-2">
                {task.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => assignTask(task.id, currentStaff.id)}
                    className="flex-1"
                  >
                    Accept
                  </Button>
                )}
                {task.status === 'in-progress' && (
                  <Button
                    size="sm"
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    className="flex-1"
                  >
                    Complete
                  </Button>
                )}
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Task FAB */}
      <Button
        className="fixed bottom-20 right-4 rounded-full w-14 h-14 shadow-lg"
        onClick={() => setShowTaskForm(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  )

  const renderRooms = () => (
    <div className="space-y-4">
      {/* Room Grid */}
      <div className="grid grid-cols-3 gap-2">
        {rooms.map((room) => (
          <Card
            key={room.number}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => {
              setSelectedRoom(room)
              setShowRoomDetails(true)
            }}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${getRoomStatusColor(room.status)}`}></div>
              <div className="font-medium text-sm">{room.number}</div>
              <div className="text-xs text-gray-600 capitalize">{room.status.replace('-', ' ')}</div>
              {room.guest && (
                <div className="text-xs text-gray-500 mt-1">{room.guest}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Room Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Room Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Vacant Clean</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Vacant Dirty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span>Maintenance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderGuests = () => (
    <div className="space-y-4">
      {/* Guest Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guestRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Room {request.room}</span>
                      <Badge variant="outline" className="text-xs">
                        {request.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{request.description}</p>
                    <p className="text-xs text-gray-500">by {request.guest} • {request.timestamp}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority)}`}></div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    {request.estimatedTime && `Est. ${request.estimatedTime}`}
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeRequest(request.id)}
                      >
                        Acknowledge
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4">
      {/* Staff Info */}
      <Card>
        <CardContent className="p-4 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="font-bold text-lg">{currentStaff.name}</h2>
          <p className="text-gray-600 capitalize">{currentStaff.role.replace('-', ' ')}</p>
          <Badge className="mt-2 capitalize">{currentStaff.status}</Badge>
        </CardContent>
      </Card>

      {/* Shift Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Shift Time</span>
              <span className="font-medium">{currentStaff.shift}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Break Time</span>
              <span className="font-medium">12:00 PM - 1:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tasks Completed</span>
              <span className="font-medium">12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-2" />
            Privacy
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Settings className="w-4 h-4 mr-2" />
            Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Staff Dashboard</h1>
              <p className="text-blue-100 text-sm">Welcome back, {currentStaff.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" className="text-white hover:bg-blue-700">
                  <Bell className="w-4 h-4" />
                </Button>
                {notifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">{notifications}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'tasks' && renderTasks()}
          {activeTab === 'rooms' && renderRooms()}
          {activeTab === 'guests' && renderGuests()}
          {activeTab === 'profile' && renderProfile()}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="grid grid-cols-5 h-16">
            {[
              { id: 'overview', icon: Home, label: 'Overview' },
              { id: 'tasks', icon: ClipboardList, label: 'Tasks' },
              { id: 'rooms', icon: Bed, label: 'Rooms' },
              { id: 'guests', icon: Users, label: 'Guests' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex flex-col items-center justify-center gap-1 ${
                  activeTab === id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Room Details Modal */}
        {showRoomDetails && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm max-h-[80vh] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Room {selectedRoom.number}</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowRoomDetails(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium">{selectedRoom.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={`capitalize ${getRoomStatusColor(selectedRoom.status)} text-white`}>
                    {selectedRoom.status.replace('-', ' ')}
                  </Badge>
                </div>
                {selectedRoom.guest && (
                  <div>
                    <p className="text-sm text-gray-600">Guest</p>
                    <p className="font-medium">{selectedRoom.guest}</p>
                  </div>
                )}
                {selectedRoom.housekeeping && (
                  <div>
                    <p className="text-sm text-gray-600">Housekeeping</p>
                    <Badge className={getStatusColor(selectedRoom.housekeeping)} variant="secondary">
                      {selectedRoom.housekeeping}
                    </Badge>
                  </div>
                )}
                {selectedRoom.notes && (
                  <div>
                    <p className="text-sm text-gray-600">Notes</p>
                    <p className="text-sm">{selectedRoom.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                  <Button variant="outline" size="sm">
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}