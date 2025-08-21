"use client"

import React, { useState, useCallback } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle, GlassCardDescription } from "@/components/os/ui/glass-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Wrench,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  Calendar,
  MapPin,
  Phone,
  DollarSign,
  Camera,
  FileText,
  Plus,
  Search,
  Filter,
  Upload,
  Download,
  Star,
  Zap,
  Droplets,
  Wind,
  Lightbulb,
  Wifi,
  Tv,
  Bath,
  Bed,
  Coffee,
  Car,
  Shield,
  Bell,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface MaintenanceTask {
  id: string
  title: string
  description: string
  category: "plumbing" | "electrical" | "hvac" | "cleaning" | "it" | "furniture" | "safety" | "preventive"
  priority: "low" | "medium" | "high" | "critical"
  status: "pending" | "assigned" | "in-progress" | "review" | "completed" | "cancelled"
  location: {
    area: string
    room?: string
    floor: number
    specific?: string
  }
  assignee?: {
    id: string
    name: string
    phone: string
    specialization: string[]
  }
  reporter: {
    name: string
    role: string
    timestamp: string
  }
  timeline: {
    created: string
    assigned?: string
    started?: string
    completed?: string
    deadline: string
  }
  cost?: {
    estimated: number
    actual?: number
    materials: MaterialItem[]
  }
  images: string[]
  notes: TaskNote[]
  checklist: ChecklistItem[]
  recurring?: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
    lastCompleted: string
    nextDue: string
  }
}

interface MaterialItem {
  id: string
  name: string
  quantity: number
  unit: string
  cost: number
  supplier?: string
}

interface TaskNote {
  id: string
  content: string
  author: string
  timestamp: string
  type: "note" | "update" | "issue" | "solution"
}

interface ChecklistItem {
  id: string
  task: string
  completed: boolean
  completedBy?: string
  completedAt?: string
}

interface TaskColumn {
  id: string
  title: string
  status: MaintenanceTask["status"]
  color: string
  tasks: MaintenanceTask[]
}

const TASK_CATEGORIES = {
  plumbing: { icon: Droplets, color: "text-blue-400", bgColor: "bg-blue-500/20" },
  electrical: { icon: Zap, color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  hvac: { icon: Wind, color: "text-cyan-400", bgColor: "bg-cyan-500/20" },
  cleaning: { icon: Shield, color: "text-green-400", bgColor: "bg-green-500/20" },
  it: { icon: Wifi, color: "text-purple-400", bgColor: "bg-purple-500/20" },
  furniture: { icon: Bed, color: "text-orange-400", bgColor: "bg-orange-500/20" },
  safety: { icon: Shield, color: "text-red-400", bgColor: "bg-red-500/20" },
  preventive: { icon: Calendar, color: "text-indigo-400", bgColor: "bg-indigo-500/20" },
}

const PRIORITY_COLORS = {
  low: "border-green-400/50 bg-green-500/10 text-green-400",
  medium: "border-yellow-400/50 bg-yellow-500/10 text-yellow-400",
  high: "border-orange-400/50 bg-orange-500/10 text-orange-400",
  critical: "border-red-400/50 bg-red-500/10 text-red-400",
}

const STATUS_COLORS = {
  pending: { color: "text-gray-400", bgColor: "bg-gray-500/20" },
  assigned: { color: "text-blue-400", bgColor: "bg-blue-500/20" },
  "in-progress": { color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  review: { color: "text-purple-400", bgColor: "bg-purple-500/20" },
  completed: { color: "text-green-400", bgColor: "bg-green-500/20" },
  cancelled: { color: "text-red-400", bgColor: "bg-red-500/20" },
}

const sampleTasks: MaintenanceTask[] = [
  {
    id: "1",
    title: "Fix leaking bathroom tap",
    description: "Water is continuously dripping from the main bathroom tap in room 205. Guest complained about noise.",
    category: "plumbing",
    priority: "high",
    status: "pending",
    location: {
      area: "Guest Room",
      room: "205",
      floor: 2,
      specific: "Main bathroom tap"
    },
    reporter: {
      name: "Front Desk",
      role: "Reception",
      timestamp: "2024-01-15T09:30:00Z"
    },
    timeline: {
      created: "2024-01-15T09:30:00Z",
      deadline: "2024-01-15T18:00:00Z"
    },
    cost: {
      estimated: 500,
      materials: [
        { id: "1", name: "Tap washer", quantity: 2, unit: "pcs", cost: 50 },
        { id: "2", name: "Plumber's tape", quantity: 1, unit: "roll", cost: 30 }
      ]
    },
    images: [],
    notes: [
      {
        id: "1",
        content: "Guest in room 205 reported dripping sound keeping them awake",
        author: "Priya Sharma",
        timestamp: "2024-01-15T09:30:00Z",
        type: "note"
      }
    ],
    checklist: [
      { id: "1", task: "Turn off water supply", completed: false },
      { id: "2", task: "Remove old washer", completed: false },
      { id: "3", task: "Install new washer", completed: false },
      { id: "4", task: "Test for leaks", completed: false },
      { id: "5", task: "Clean up area", completed: false }
    ]
  },
  {
    id: "2",
    title: "AC not cooling properly",
    description: "Air conditioning unit in room 301 is not maintaining temperature. Set to 20°C but room temperature is 26°C.",
    category: "hvac",
    priority: "high",
    status: "assigned",
    location: {
      area: "Guest Room",
      room: "301",
      floor: 3,
      specific: "Split AC unit"
    },
    assignee: {
      id: "tech1",
      name: "Rajesh Technician",
      phone: "+91 98765 43211",
      specialization: ["HVAC", "Electrical"]
    },
    reporter: {
      name: "Housekeeping",
      role: "Room Service",
      timestamp: "2024-01-15T11:15:00Z"
    },
    timeline: {
      created: "2024-01-15T11:15:00Z",
      assigned: "2024-01-15T11:30:00Z",
      deadline: "2024-01-15T16:00:00Z"
    },
    cost: {
      estimated: 1500,
      materials: []
    },
    images: [],
    notes: [
      {
        id: "1",
        content: "Assigned to Rajesh for immediate attention",
        author: "Maintenance Manager",
        timestamp: "2024-01-15T11:30:00Z",
        type: "update"
      }
    ],
    checklist: [
      { id: "1", task: "Check refrigerant levels", completed: false },
      { id: "2", task: "Clean air filters", completed: false },
      { id: "3", task: "Inspect condenser coils", completed: false },
      { id: "4", task: "Test thermostat", completed: false },
      { id: "5", task: "Check electrical connections", completed: false }
    ]
  },
  {
    id: "3",
    title: "WiFi connectivity issues",
    description: "Guests in rooms 101-105 reporting intermittent WiFi disconnections. Router may need restart or replacement.",
    category: "it",
    priority: "medium",
    status: "in-progress",
    location: {
      area: "First Floor",
      floor: 1,
      specific: "Access Point AP-1F-01"
    },
    assignee: {
      id: "it1",
      name: "Amit IT Support",
      phone: "+91 98765 43212",
      specialization: ["IT", "Networking"]
    },
    reporter: {
      name: "Guest Services",
      role: "Concierge",
      timestamp: "2024-01-15T08:00:00Z"
    },
    timeline: {
      created: "2024-01-15T08:00:00Z",
      assigned: "2024-01-15T08:30:00Z",
      started: "2024-01-15T09:00:00Z",
      deadline: "2024-01-15T14:00:00Z"
    },
    cost: {
      estimated: 800,
      materials: [
        { id: "1", name: "Ethernet cable", quantity: 2, unit: "pcs", cost: 200 }
      ]
    },
    images: [],
    notes: [
      {
        id: "1",
        content: "Started diagnostics on first floor network equipment",
        author: "Amit IT Support",
        timestamp: "2024-01-15T09:00:00Z",
        type: "update"
      }
    ],
    checklist: [
      { id: "1", task: "Check router status", completed: true, completedBy: "Amit IT Support", completedAt: "2024-01-15T09:15:00Z" },
      { id: "2", task: "Test cable connections", completed: true, completedBy: "Amit IT Support", completedAt: "2024-01-15T09:30:00Z" },
      { id: "3", task: "Reset access point", completed: false },
      { id: "4", task: "Update firmware", completed: false },
      { id: "5", task: "Test connectivity", completed: false }
    ]
  },
  {
    id: "4",
    title: "Monthly elevator inspection",
    description: "Routine monthly safety inspection and maintenance of main elevator. Preventive maintenance as per schedule.",
    category: "preventive",
    priority: "medium",
    status: "completed",
    location: {
      area: "Main Lobby",
      floor: 0,
      specific: "Elevator 1"
    },
    assignee: {
      id: "elev1",
      name: "Kumar Elevator Tech",
      phone: "+91 98765 43213",
      specialization: ["Elevators", "Mechanical"]
    },
    reporter: {
      name: "System",
      role: "Automated",
      timestamp: "2024-01-01T00:00:00Z"
    },
    timeline: {
      created: "2024-01-01T00:00:00Z",
      assigned: "2024-01-14T09:00:00Z",
      started: "2024-01-15T07:00:00Z",
      completed: "2024-01-15T10:00:00Z",
      deadline: "2024-01-15T12:00:00Z"
    },
    cost: {
      estimated: 2000,
      actual: 1800,
      materials: [
        { id: "1", name: "Elevator oil", quantity: 1, unit: "bottle", cost: 300 },
        { id: "2", name: "Brake pads", quantity: 2, unit: "pcs", cost: 800 }
      ]
    },
    images: [],
    notes: [
      {
        id: "1",
        content: "Completed monthly inspection. All safety parameters within normal range.",
        author: "Kumar Elevator Tech",
        timestamp: "2024-01-15T10:00:00Z",
        type: "solution"
      }
    ],
    checklist: [
      { id: "1", task: "Check door mechanisms", completed: true, completedBy: "Kumar Elevator Tech" },
      { id: "2", task: "Test emergency brakes", completed: true, completedBy: "Kumar Elevator Tech" },
      { id: "3", task: "Lubricate moving parts", completed: true, completedBy: "Kumar Elevator Tech" },
      { id: "4", task: "Inspect cables", completed: true, completedBy: "Kumar Elevator Tech" },
      { id: "5", task: "Update maintenance log", completed: true, completedBy: "Kumar Elevator Tech" }
    ],
    recurring: {
      frequency: "monthly",
      lastCompleted: "2024-01-15T10:00:00Z",
      nextDue: "2024-02-15T09:00:00Z"
    }
  }
]

export function MaintenanceWorkflowManager() {
  const [columns, setColumns] = useState<TaskColumn[]>(() => {
    const columnData: TaskColumn[] = [
      { id: "pending", title: "Pending", status: "pending", color: "bg-gray-100", tasks: [] },
      { id: "assigned", title: "Assigned", status: "assigned", color: "bg-blue-100", tasks: [] },
      { id: "in-progress", title: "In Progress", status: "in-progress", color: "bg-yellow-100", tasks: [] },
      { id: "review", title: "Review", status: "review", color: "bg-purple-100", tasks: [] },
      { id: "completed", title: "Completed", status: "completed", color: "bg-green-100", tasks: [] },
    ]

    // Distribute tasks into columns
    sampleTasks.forEach(task => {
      const column = columnData.find(col => col.status === task.status)
      if (column) {
        column.tasks.push(task)
      }
    })

    return columnData
  })

  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)
    
    if (!sourceColumn || !destColumn) return

    const draggedTask = sourceColumn.tasks.find(task => task.id === draggableId)
    if (!draggedTask) return

    setColumns(prevColumns => {
      return prevColumns.map(column => {
        if (column.id === source.droppableId) {
          return {
            ...column,
            tasks: column.tasks.filter(task => task.id !== draggableId)
          }
        }
        if (column.id === destination.droppableId) {
          const newTasks = [...column.tasks]
          const updatedTask = { 
            ...draggedTask, 
            status: column.status as MaintenanceTask["status"]
          }
          
          // Update timeline based on status change
          if (column.status === "assigned" && !updatedTask.timeline.assigned) {
            updatedTask.timeline.assigned = new Date().toISOString()
          }
          if (column.status === "in-progress" && !updatedTask.timeline.started) {
            updatedTask.timeline.started = new Date().toISOString()
          }
          if (column.status === "completed" && !updatedTask.timeline.completed) {
            updatedTask.timeline.completed = new Date().toISOString()
          }
          
          newTasks.splice(destination.index, 0, updatedTask)
          return {
            ...column,
            tasks: newTasks
          }
        }
        return column
      })
    })
  }, [columns])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString("en-IN"),
      time: date.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getTimeRemaining = (deadline: string) => {
    const now = new Date()
    const due = new Date(deadline)
    const diffMs = due.getTime() - now.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHours < 0) return { text: "Overdue", color: "text-red-400" }
    if (diffHours < 2) return { text: `${diffHours}h remaining`, color: "text-red-400" }
    if (diffHours < 8) return { text: `${diffHours}h remaining`, color: "text-yellow-400" }
    return { text: `${diffHours}h remaining`, color: "text-green-400" }
  }

  const getTaskProgress = (checklist: ChecklistItem[]) => {
    const completed = checklist.filter(item => item.completed).length
    return (completed / checklist.length) * 100
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task => {
      const matchesSearch = 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.location.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = filterCategory === "all" || task.category === filterCategory
      const matchesPriority = filterPriority === "all" || task.priority === filterPriority
      
      return matchesSearch && matchesCategory && matchesPriority
    })
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Maintenance Workflow</h2>
          <p className="text-white/70">Manage and track all maintenance tasks</p>
        </div>
        
        {/* Filters and Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 w-64"
            />
          </div>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(TASK_CATEGORIES).map(category => (
                <SelectItem key={category} value={category} className="capitalize">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map((column) => {
          const count = column.tasks.length
          const criticalCount = column.tasks.filter(task => task.priority === "critical").length
          
          return (
            <GlassCard key={column.id} variant="subtle" className="text-center">
              <GlassCardContent>
                <div className="py-4">
                  <div className={cn("text-2xl font-bold mb-1", STATUS_COLORS[column.status].color)}>
                    {count}
                  </div>
                  <div className="text-sm text-white/70 mb-2">{column.title}</div>
                  {criticalCount > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {criticalCount} Critical
                    </Badge>
                  )}
                </div>
              </GlassCardContent>
            </GlassCard>
          )
        })}
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {filteredColumns.map((column) => (
            <div key={column.id} className="min-w-80 flex-shrink-0">
              <GlassCard variant="subtle" className="h-full">
                <GlassCardHeader>
                  <GlassCardTitle>
                    <div className="flex items-center justify-between">
                      <span>{column.title}</span>
                      <Badge variant="secondary" className="bg-white/10 text-white">
                        {column.tasks.length}
                      </Badge>
                    </div>
                  </GlassCardTitle>
                </GlassCardHeader>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "min-h-96 p-4 transition-colors",
                        snapshot.isDraggingOver && "bg-white/5"
                      )}
                    >
                      <div className="space-y-3">
                        {column.tasks.map((task, index) => {
                          const CategoryIcon = TASK_CATEGORIES[task.category].icon
                          const timeRemaining = getTimeRemaining(task.timeline.deadline)
                          const progress = getTaskProgress(task.checklist)
                          
                          return (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={cn(
                                    "bg-white/10 rounded-lg p-4 cursor-move transition-all duration-200 hover:bg-white/20 hover:scale-105",
                                    snapshot.isDragging && "rotate-3 shadow-2xl scale-105 bg-white/30"
                                  )}
                                >
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                                      <div className={cn("p-1.5 rounded-lg", TASK_CATEGORIES[task.category].bgColor)}>
                                        <CategoryIcon className={cn("h-4 w-4", TASK_CATEGORIES[task.category].color)} />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-white text-sm line-clamp-2">
                                          {task.title}
                                        </h4>
                                      </div>
                                    </div>
                                    <Badge className={cn("text-xs ml-2", PRIORITY_COLORS[task.priority])}>
                                      {task.priority}
                                    </Badge>
                                  </div>

                                  {/* Location */}
                                  <div className="flex items-center space-x-2 mb-3 text-xs text-white/70">
                                    <MapPin className="h-3 w-3" />
                                    <span>
                                      {task.location.room ? `Room ${task.location.room}` : task.location.area}
                                      {task.location.specific && ` - ${task.location.specific}`}
                                    </span>
                                  </div>

                                  {/* Assignee */}
                                  {task.assignee && (
                                    <div className="flex items-center space-x-2 mb-3">
                                      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                                        <User className="h-3 w-3 text-blue-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-white truncate">
                                          {task.assignee.name}
                                        </div>
                                        <div className="text-xs text-white/60">
                                          {task.assignee.specialization.slice(0, 2).join(", ")}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Progress */}
                                  {task.checklist.length > 0 && (
                                    <div className="mb-3">
                                      <div className="flex justify-between text-xs mb-1">
                                        <span className="text-white/60">Progress</span>
                                        <span className="text-white/80">{Math.round(progress)}%</span>
                                      </div>
                                      <Progress value={progress} className="h-1.5 bg-white/10" />
                                    </div>
                                  )}

                                  {/* Cost */}
                                  {task.cost && (
                                    <div className="flex items-center justify-between mb-3 text-xs">
                                      <span className="text-white/60">Cost:</span>
                                      <span className="text-green-400 font-medium">
                                        {task.cost.actual 
                                          ? formatCurrency(task.cost.actual)
                                          : formatCurrency(task.cost.estimated)
                                        }
                                      </span>
                                    </div>
                                  )}

                                  {/* Deadline */}
                                  <div className="flex items-center justify-between mb-3 text-xs">
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3 text-white/60" />
                                      <span className="text-white/60">Deadline:</span>
                                    </div>
                                    <span className={cn("font-medium", timeRemaining.color)}>
                                      {timeRemaining.text}
                                    </span>
                                  </div>

                                  {/* Recurring Badge */}
                                  {task.recurring && (
                                    <div className="mb-3">
                                      <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-400">
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        {task.recurring.frequency}
                                      </Badge>
                                    </div>
                                  )}

                                  {/* Actions */}
                                  <div className="flex space-x-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                                          onClick={() => setSelectedTask(task)}
                                        >
                                          <Eye className="h-3 w-3 mr-1" />
                                          View
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl bg-slate-900 border-slate-700 max-h-[80vh] overflow-y-auto">
                                        <DialogHeader>
                                          <DialogTitle className="text-white flex items-center space-x-2">
                                            <CategoryIcon className={cn("h-5 w-5", TASK_CATEGORIES[task.category].color)} />
                                            <span>{task.title}</span>
                                          </DialogTitle>
                                        </DialogHeader>
                                        
                                        {selectedTask && (
                                          <div className="space-y-6 text-white">
                                            {/* Task Overview */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <label className="text-sm font-medium text-gray-300">Description</label>
                                                <p className="text-sm text-white/80 mt-1">{selectedTask.description}</p>
                                              </div>
                                              <div className="space-y-3">
                                                <div>
                                                  <label className="text-sm font-medium text-gray-300">Priority</label>
                                                  <Badge className={cn("ml-2", PRIORITY_COLORS[selectedTask.priority])}>
                                                    {selectedTask.priority}
                                                  </Badge>
                                                </div>
                                                <div>
                                                  <label className="text-sm font-medium text-gray-300">Status</label>
                                                  <Badge className={cn("ml-2", STATUS_COLORS[selectedTask.status].bgColor, STATUS_COLORS[selectedTask.status].color)}>
                                                    {selectedTask.status}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Location & Assignment */}
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <label className="text-sm font-medium text-gray-300">Location</label>
                                                <div className="bg-slate-800 p-3 rounded border border-slate-600 mt-1">
                                                  <div className="font-medium">{selectedTask.location.area}</div>
                                                  {selectedTask.location.room && (
                                                    <div className="text-sm text-gray-400">Room: {selectedTask.location.room}</div>
                                                  )}
                                                  <div className="text-sm text-gray-400">Floor: {selectedTask.location.floor}</div>
                                                  {selectedTask.location.specific && (
                                                    <div className="text-sm text-gray-400">{selectedTask.location.specific}</div>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {selectedTask.assignee && (
                                                <div>
                                                  <label className="text-sm font-medium text-gray-300">Assigned To</label>
                                                  <div className="bg-slate-800 p-3 rounded border border-slate-600 mt-1">
                                                    <div className="font-medium">{selectedTask.assignee.name}</div>
                                                    <div className="text-sm text-gray-400">{selectedTask.assignee.phone}</div>
                                                    <div className="text-sm text-gray-400">
                                                      {selectedTask.assignee.specialization.join(", ")}
                                                    </div>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Checklist */}
                                            {selectedTask.checklist.length > 0 && (
                                              <div>
                                                <label className="text-sm font-medium text-gray-300">Checklist</label>
                                                <div className="space-y-2 mt-2">
                                                  {selectedTask.checklist.map((item) => (
                                                    <div key={item.id} className="flex items-center space-x-3 p-2 bg-slate-800 rounded">
                                                      <CheckCircle2 
                                                        className={cn("h-4 w-4", item.completed ? "text-green-400" : "text-gray-400")} 
                                                      />
                                                      <span className={cn(item.completed && "line-through text-gray-500")}>
                                                        {item.task}
                                                      </span>
                                                      {item.completedBy && (
                                                        <span className="text-xs text-gray-400 ml-auto">
                                                          by {item.completedBy}
                                                        </span>
                                                      )}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* Materials & Cost */}
                                            {selectedTask.cost && selectedTask.cost.materials.length > 0 && (
                                              <div>
                                                <label className="text-sm font-medium text-gray-300">Materials & Cost</label>
                                                <div className="bg-slate-800 p-3 rounded border border-slate-600 mt-1">
                                                  <div className="space-y-2 mb-3">
                                                    {selectedTask.cost.materials.map((material) => (
                                                      <div key={material.id} className="flex justify-between text-sm">
                                                        <span>{material.name} ({material.quantity} {material.unit})</span>
                                                        <span>{formatCurrency(material.cost)}</span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                  <div className="border-t border-slate-600 pt-2 flex justify-between font-medium">
                                                    <span>Total Estimated:</span>
                                                    <span className="text-green-400">{formatCurrency(selectedTask.cost.estimated)}</span>
                                                  </div>
                                                  {selectedTask.cost.actual && (
                                                    <div className="flex justify-between font-medium text-blue-400">
                                                      <span>Actual Cost:</span>
                                                      <span>{formatCurrency(selectedTask.cost.actual)}</span>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            )}

                                            {/* Notes */}
                                            {selectedTask.notes.length > 0 && (
                                              <div>
                                                <label className="text-sm font-medium text-gray-300">Notes & Updates</label>
                                                <div className="space-y-3 mt-2 max-h-48 overflow-y-auto">
                                                  {selectedTask.notes.map((note) => {
                                                    const { date, time } = formatDateTime(note.timestamp)
                                                    return (
                                                      <div key={note.id} className="bg-slate-800 p-3 rounded border border-slate-600">
                                                        <div className="flex justify-between items-start mb-2">
                                                          <Badge variant="outline" className="text-xs capitalize">
                                                            {note.type}
                                                          </Badge>
                                                          <span className="text-xs text-gray-400">{date} at {time}</span>
                                                        </div>
                                                        <p className="text-sm text-white/80">{note.content}</p>
                                                        <div className="text-xs text-gray-400 mt-2">by {note.author}</div>
                                                      </div>
                                                    )
                                                  })}
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </DialogContent>
                                    </Dialog>
                                    
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                      
                      {column.tasks.length === 0 && (
                        <div className="text-center py-8 text-white/50">
                          <Wrench className="h-8 w-8 mx-auto mb-2" />
                          <p>No tasks in {column.title.toLowerCase()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </GlassCard>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}