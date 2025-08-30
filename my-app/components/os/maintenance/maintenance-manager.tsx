"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Wrench,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  Plus,
  Edit,
  Calendar,
  Timer,
  TrendingUp,
  Zap,
  Droplets,
  Wind,
  Sparkles,
  HardHat,
  FileSearch,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

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

interface MaintenanceStats {
  total: number
  pending: number
  inProgress: number
  completed: number
  overdue: number
  highPriority: number
  avgCompletionTime: number
}

interface PropertyInfo {
  id: string
  title: string
  address: {
    city: string
    state: string
  }
}

const PRIORITY_CONFIG = {
  low: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Low" },
  medium: { color: "bg-blue-100 text-blue-800 border-blue-200", label: "Medium" },
  high: { color: "bg-orange-100 text-orange-800 border-orange-200", label: "High" },
  urgent: { color: "bg-red-100 text-red-800 border-red-200", label: "Urgent" },
}

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Pending", icon: Clock },
  'in-progress': { color: "bg-blue-100 text-blue-800 border-blue-200", label: "In Progress", icon: Settings },
  completed: { color: "bg-green-100 text-green-800 border-green-200", label: "Completed", icon: CheckCircle2 },
  cancelled: { color: "bg-gray-100 text-gray-800 border-gray-200", label: "Cancelled", icon: AlertTriangle },
}

const CATEGORY_ICONS: { [key: string]: React.ElementType } = {
  electrical: Zap,
  plumbing: Droplets,
  hvac: Wind,
  cleaning: Sparkles,
  repair: Wrench,
  inspection: FileSearch,
  other: Settings,
}

export function MaintenanceManager() {
  const params = useParams()
  const propertyId = params?.id as string
  
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [stats, setStats] = useState<MaintenanceStats | null>(null)
  const [property, setProperty] = useState<PropertyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  const fetchMaintenanceData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch(`/api/os/maintenance/${propertyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch maintenance data')
      }
      
      const data = await response.json()
      if (data.success) {
        setTasks(data.tasks || [])
        setStats(data.stats)
        setProperty(data.property)
      } else {
        setError(data.error || 'Failed to fetch maintenance data')
      }
    } catch (error) {
      console.error('Error fetching maintenance:', error)
      setError('Failed to load maintenance data')
    } finally {
      setIsLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchMaintenanceData()
    }
  }, [propertyId, fetchMaintenanceData])

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      setUpdatingTask(taskId)
      const response = await fetch(`/api/os/maintenance/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          status: newStatus,
          updatedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        // Update local state
        setTasks(tasks.map(task => 
          task.id === taskId 
            ? { ...task, status: newStatus as any, updatedAt: new Date().toISOString() }
            : task
        ))
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setUpdatingTask(null)
    }
  }

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (task.assignedTo?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (task.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter
      const matchesCategory = categoryFilter === "all" || task.category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory
    })
  }

  const isOverdue = (task: MaintenanceTask) => {
    return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  }

  if (isLoading) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading maintenance data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Maintenance Management</h2>
          <p className="text-gray-600">Track and manage property maintenance tasks</p>
          {property && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              <span>{property.title}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <Button onClick={fetchMaintenanceData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Maintenance Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input placeholder="Task title" />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea placeholder="Task description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electrical">Electrical</SelectItem>
                        <SelectItem value="plumbing">Plumbing</SelectItem>
                        <SelectItem value="hvac">HVAC</SelectItem>
                        <SelectItem value="cleaning">Cleaning</SelectItem>
                        <SelectItem value="repair">Repair</SelectItem>
                        <SelectItem value="inspection">Inspection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button>Create Task</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Tasks</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <div className="text-sm text-gray-600">Overdue</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.avgCompletionTime.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">Avg. Time</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="cleaning">Cleaning</SelectItem>
                <SelectItem value="repair">Repair</SelectItem>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center justify-center">
              <Badge variant="outline" className="text-gray-600">
                {getFilteredTasks().length} tasks
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredTasks().map((task) => {
          const CategoryIcon = CATEGORY_ICONS[task.category] || Settings
          const StatusIcon = STATUS_CONFIG[task.status].icon
          const isTaskOverdue = isOverdue(task)
          const isUpdating = updatingTask === task.id
          
          return (
            <Card key={task.id} className={cn(
              "hover:shadow-lg transition-shadow",
              isTaskOverdue && "border-red-200 bg-red-50"
            )}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-500">#{task.id}</p>
                    </div>
                  </div>
                  {isTaskOverdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge className={PRIORITY_CONFIG[task.priority].color}>
                    {PRIORITY_CONFIG[task.priority].label}
                  </Badge>
                  <Badge className={STATUS_CONFIG[task.status].color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {STATUS_CONFIG[task.status].label}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{task.description}</p>
                
                {/* Task Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {task.roomNumber && (
                    <div>
                      <span className="text-gray-500">Room:</span>
                      <div className="font-medium">{task.roomNumber}</div>
                    </div>
                  )}
                  {task.assignedTo && (
                    <div>
                      <span className="text-gray-500">Assigned:</span>
                      <div className="font-medium">{task.assignedTo}</div>
                    </div>
                  )}
                  {task.dueDate && (
                    <div>
                      <span className="text-gray-500">Due:</span>
                      <div className={cn(
                        "font-medium",
                        isTaskOverdue ? "text-red-600" : "text-gray-900"
                      )}>
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {task.estimatedHours && (
                    <div>
                      <span className="text-gray-500">Est. Hours:</span>
                      <div className="font-medium">{task.estimatedHours}h</div>
                    </div>
                  )}
                </div>

                {/* Progress for in-progress tasks */}
                {task.status === 'in-progress' && task.estimatedHours && task.actualHours && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Progress</span>
                      <span>{Math.round((task.actualHours / task.estimatedHours) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((task.actualHours / task.estimatedHours) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{task.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Description</h4>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                        {task.notes && (
                          <div>
                            <h4 className="font-medium mb-2">Notes</h4>
                            <p className="text-sm text-gray-600">{task.notes}</p>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium mb-1">Created</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(task.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-1">Last Updated</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(task.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Select
                    value={task.status}
                    onValueChange={(value) => updateTaskStatus(task.id, value)}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      {isUpdating ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <SelectValue />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {getFilteredTasks().length === 0 && (
        <div className="text-center py-12">
          <HardHat className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No maintenance tasks found</p>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters
            </p>
          )}
        </div>
      )}
    </div>
  )
}