"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  Plus,
  Edit,
  Eye,
  Settings,
  RefreshCw,
  Filter,
  User,
  MapPin,
  Star,
  Timer,
  ClipboardCheck,
  XCircle,
  Play,
  Pause,
  ArrowLeft,
  Activity,
  BarChart3,
  TrendingUp,
  Target,
  X,
  Home,
  Zap,
  Package,
  Wrench,
  Image,
  DollarSign,
  CalendarPlus,
  Repeat,
} from "lucide-react"

interface HousekeepingTask {
  id: string
  roomNumber: string
  roomType: string
  taskType: "cleaning" | "maintenance" | "inspection" | "deep_cleaning"
  status: "pending" | "in_progress" | "completed" | "overdue"
  priority: "low" | "normal" | "high" | "urgent"
  assignedTo?: {
    id: string
    name: string
  }
  estimatedDuration: number // minutes
  actualDuration?: number
  scheduledTime: string
  startedAt?: string
  completedAt?: string
  notes?: string
  checklist: {
    item: string
    completed: boolean
  }[]
  quality: {
    score?: number // 1-5
    inspector?: string
    feedback?: string
  }
}

// Removed mock data - now fetching from real API

export default function HousekeepingManagement() {
  const router = useRouter()
  const { data: session } = useSession()
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Task Form State
  const [formData, setFormData] = useState({
    roomNumber: "",
    roomType: "Standard",
    taskType: "cleaning",
    priority: "normal",
    estimatedDuration: 45,
    scheduledTime: "",

    // Assignment
    assignedTo: null,

    // Task details
    notes: "",
    specialInstructions: "",
    equipmentRequired: [],
    supplies: [],

    // Checklist
    checklist: [
      { item: "Strip beds and replace linens", completed: false },
      { item: "Clean bathroom thoroughly", completed: false },
      { item: "Vacuum and mop floors", completed: false },
      { item: "Dust all surfaces", completed: false },
      { item: "Restock amenities", completed: false },
    ],

    // Guest information
    guestCheckout: "",
    guestCheckin: "",
    isOccupied: false,

    // Recurring task settings
    isRecurring: false,
    recurrencePattern: "daily",
    nextScheduledDate: "",

    // Emergency/urgency
    isEmergency: false,
    emergencyReason: "",

    // Cost tracking
    costEstimate: 0,

    // Room condition
    roomCondition: {
      beforeCleaning: "",
      damageReported: false,
      damageDescription: "",
      maintenanceRequired: false,
    },
  })

  const propertyId = useParams()?.propertyId as string

  useEffect(() => {
    if (propertyId) {
      fetchTasks()
    }
  }, [propertyId])

  const fetchTasks = async () => {
    try {
      setLoading(true)

      if (!propertyId) {
        console.log("Property ID not available yet, skipping fetch")
        setTasks([])
        return
      }

      const response = await fetch(
        `/api/os/housekeeping?propertyId=${propertyId}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch housekeeping tasks")
      }

      // Transform API data to match HousekeepingTask interface
      const transformedTasks: HousekeepingTask[] =
        data.data?.tasks?.map((task: any) => ({
          id: task._id || task.id,
          roomNumber: task.roomNumber,
          roomType: task.roomType,
          taskType: task.taskType,
          status: task.status || "pending",
          priority: task.priority,
          assignedTo: task.assignedTo
            ? {
                id:
                  task.assignedTo._id || task.assignedTo.id || task.assignedTo,
                name: task.assignedTo.name || "Assigned Staff",
                role: task.assignedTo.role || "housekeeper",
              }
            : null,
          estimatedDuration: task.estimatedDuration || 45,
          actualDuration: task.actualDuration,
          scheduledTime: task.scheduledTime,
          startedAt: task.startedAt,
          completedAt: task.completedAt,
          notes: task.notes || "",
          specialInstructions: task.specialInstructions || "",
          equipmentRequired: task.equipmentRequired || [],
          supplies: task.supplies || [],
          checklist: task.checklist || [],
          quality: task.quality || {
            score: null,
            inspector: null,
            feedback: "",
            images: [],
          },
          guestCheckout: task.guestCheckout,
          guestCheckin: task.guestCheckin,
          isOccupied: task.isOccupied || false,
          isRecurring: task.isRecurring || false,
          recurrencePattern: task.recurrencePattern,
          nextScheduledDate: task.nextScheduledDate,
          isEmergency: task.isEmergency || false,
          emergencyReason: task.emergencyReason || "",
          timeSpent: task.timeSpent || 0,
          breaksDuration: task.breaksDuration || 0,
          costEstimate: task.costEstimate || 0,
          actualCost: task.actualCost || 0,
          roomCondition: task.roomCondition || {
            beforeCleaning: "",
            afterCleaning: "",
            damageReported: false,
            damageDescription: "",
            maintenanceRequired: false,
          },
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
          createdBy: task.createdBy,
        })) || []

      setTasks(transformedTasks)
    } catch (error) {
      console.error("Error fetching tasks:", error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      roomNumber: "",
      roomType: "Standard",
      taskType: "cleaning",
      priority: "normal",
      estimatedDuration: 45,
      scheduledTime: "",
      assignedTo: null,
      notes: "",
      specialInstructions: "",
      equipmentRequired: [],
      supplies: [],
      checklist: [
        { item: "Strip beds and replace linens", completed: false },
        { item: "Clean bathroom thoroughly", completed: false },
        { item: "Vacuum and mop floors", completed: false },
        { item: "Dust all surfaces", completed: false },
        { item: "Restock amenities", completed: false },
      ],
      guestCheckout: "",
      guestCheckin: "",
      isOccupied: false,
      isRecurring: false,
      recurrencePattern: "daily",
      nextScheduledDate: "",
      isEmergency: false,
      emergencyReason: "",
      costEstimate: 0,
      roomCondition: {
        beforeCleaning: "",
        damageReported: false,
        damageDescription: "",
        maintenanceRequired: false,
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(
        `/api/os/housekeeping?propertyId=${propertyId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh the tasks list from API
        await fetchTasks()
        setShowAddDialog(false)
        resetForm()
      } else {
        console.error("Error creating task:", data.error || "Unknown error")
        // Handle error display to user if needed
      }
    } catch (error) {
      console.error("Error creating task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("roomCondition.")) {
      const conditionField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        roomCondition: {
          ...prev.roomCondition,
          [conditionField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const filteredTasks =
    selectedStatus === "all"
      ? tasks
      : tasks.filter((task) => task.status === selectedStatus)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500"
      case "in_progress":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "overdue":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "normal":
        return "bg-blue-100 text-blue-800"
      case "low":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "cleaning":
        return <Sparkles className="h-5 w-5" />
      case "maintenance":
        return <Settings className="h-5 w-5" />
      case "inspection":
        return <Eye className="h-5 w-5" />
      case "deep_cleaning":
        return <Star className="h-5 w-5" />
      default:
        return <ClipboardCheck className="h-5 w-5" />
    }
  }

  const calculateProgress = (
    checklist: { item: string; completed: boolean }[]
  ) => {
    const completed = checklist.filter((item) => item.completed).length
    return Math.round((completed / checklist.length) * 100)
  }

  const statusFilters = [
    { id: "all", label: "All Tasks", count: tasks.length },
    {
      id: "pending",
      label: "Pending",
      count: tasks.filter((t) => t.status === "pending").length,
    },
    {
      id: "in_progress",
      label: "In Progress",
      count: tasks.filter((t) => t.status === "in_progress").length,
    },
    {
      id: "completed",
      label: "Completed",
      count: tasks.filter((t) => t.status === "completed").length,
    },
    {
      id: "overdue",
      label: "Overdue",
      count: tasks.filter((t) => t.status === "overdue").length,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Housekeeping Tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  router.push(`/os/inventory/dashboard/${propertyId}`)
                }
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inventory</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Housekeeping Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="text-yellow-100">
                      Task & Quality Control
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button
              onClick={() => router.push(`/os/inventory/analytics/${propertyId}`)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Status Filter */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 text-orange-600 mr-2" />
            Task Filters
          </CardTitle>
          <CardDescription>Filter tasks by status and priority</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {statusFilters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedStatus === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus(filter.id)}
                className={
                  selectedStatus === filter.id
                    ? "bg-gradient-to-r from-yellow-600 to-orange-600 text-white hover:from-yellow-700 hover:to-orange-700"
                    : "border-gray-300 hover:bg-gray-50"
                }
              >
                {filter.label}
                <Badge
                  className={`ml-2 border-0 ${
                    selectedStatus === filter.id
                      ? "bg-white/20 text-current"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Completed Today
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {tasks.filter((t) => t.status === "completed").length}
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">
                Quality maintained
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              In Progress
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {tasks.filter((t) => t.status === "in_progress").length}
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-600">Active cleaning</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-yellow-100 hover:from-yellow-100 hover:to-yellow-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-700">
              Pending Tasks
            </CardTitle>
            <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
              <Timer className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-yellow-900 mb-1">
              {tasks.filter((t) => t.status === "pending").length}
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-600">Awaiting staff</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-700">
              Overdue
            </CardTitle>
            <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-red-900 mb-1">
              {tasks.filter((t) => t.status === "overdue").length}
            </div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600">Needs attention</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tasks Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Housekeeping Tasks
            </h2>
            <p className="text-gray-600">
              Manage cleaning schedules and quality control
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule View
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const progress = calculateProgress(task.checklist)

            return (
              <Card
                key={task.id}
                className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white overflow-hidden"
              >
                {/* Enhanced Header */}
                <div
                  className={`h-2 bg-gradient-to-r ${
                    task.status === "completed"
                      ? "from-green-500 to-emerald-500"
                      : task.status === "in_progress"
                      ? "from-blue-500 to-indigo-500"
                      : task.status === "overdue"
                      ? "from-red-500 to-pink-500"
                      : "from-yellow-500 to-orange-500"
                  } rounded-t-lg`}
                ></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-r ${
                        task.status === "completed"
                          ? "from-green-500/20 to-emerald-500/20"
                          : task.status === "in_progress"
                          ? "from-blue-500/20 to-indigo-500/20"
                          : task.status === "overdue"
                          ? "from-red-500/20 to-pink-500/20"
                          : "from-yellow-500/20 to-orange-500/20"
                      } group-hover:bg-opacity-30 transition-all duration-300`}
                    >
                      {getTaskTypeIcon(task.taskType)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          task.status
                        )} animate-pulse`}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700">
                      Room {task.roomNumber}
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                      {task.roomType} • {task.taskType.replace("_", " ")}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-medium">
                      Current Status
                    </span>
                    <Badge
                      className={`${getStatusColor(
                        task.status
                      )} text-white border-0 font-medium`}
                    >
                      {task.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {/* Assigned Staff */}
                  {task.assignedTo && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="text-gray-700 text-sm font-medium">
                        {task.assignedTo.name}
                      </span>
                    </div>
                  )}

                  {/* Enhanced Progress */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 font-medium">
                        Task Progress
                      </span>
                      <span className="font-bold text-gray-800">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          progress >= 80
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : progress >= 50
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : progress >= 25
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-pink-500"
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-medium">
                      {task.checklist.filter((item) => item.completed).length} /{" "}
                      {task.checklist.length} items completed
                    </div>
                  </div>

                  {/* Enhanced Timing */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        Est: {task.estimatedDuration}min
                      </span>
                    </div>
                    {task.actualDuration && (
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Timer className="h-4 w-4" />
                        <span className="font-medium">
                          Actual: {task.actualDuration}min
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Enhanced Quality Score */}
                  {task.quality.score && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm font-medium">
                        Quality Rating
                      </span>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 transition-colors ${
                              i < task.quality.score!
                                ? "text-yellow-500 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs font-bold text-gray-800">
                          ({task.quality.score}/5)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage Task
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Add New Task Card */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 border-dashed border-gray-300 hover:border-yellow-400 cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-yellow-50 hover:to-orange-50">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-8 w-8 text-yellow-600 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Create New Task
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Schedule a new housekeeping task
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Task Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetForm()
          }
          setShowAddDialog(open)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Zap className="h-6 w-6 mr-2 text-yellow-600" />
              Create New Housekeeping Task
            </DialogTitle>
            <DialogDescription>
              Schedule a new cleaning, maintenance, or inspection task for
              optimal property management
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roomNumber" className="text-sm font-semibold">
                    Room Number *
                  </Label>
                  <Input
                    id="roomNumber"
                    type="text"
                    placeholder="e.g., 301, 205A, Suite-101"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      handleInputChange("roomNumber", e.target.value)
                    }
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roomType" className="text-sm font-semibold">
                    Room Type *
                  </Label>
                  <Select
                    value={formData.roomType}
                    onValueChange={(value) =>
                      handleInputChange("roomType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard Room</SelectItem>
                      <SelectItem value="Deluxe">Deluxe Room</SelectItem>
                      <SelectItem value="Suite">Suite</SelectItem>
                      <SelectItem value="Executive">Executive Room</SelectItem>
                      <SelectItem value="Presidential">
                        Presidential Suite
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="taskType" className="text-sm font-semibold">
                    Task Type *
                  </Label>
                  <Select
                    value={formData.taskType}
                    onValueChange={(value) =>
                      handleInputChange("taskType", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Regular Cleaning</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4" />
                          <span>Maintenance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="inspection">
                        <div className="flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>Quality Inspection</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="deep_cleaning">
                        <div className="flex items-center space-x-2">
                          <Star className="h-4 w-4" />
                          <span>Deep Cleaning</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="priority" className="text-sm font-semibold">
                    Priority Level *
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      handleInputChange("priority", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span>Low Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="normal">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span>Normal Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="high">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                          <span>High Priority</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Urgent</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="estimatedDuration"
                    className="text-sm font-semibold"
                  >
                    Estimated Duration (minutes) *
                  </Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    placeholder="45"
                    value={formData.estimatedDuration}
                    onChange={(e) =>
                      handleInputChange(
                        "estimatedDuration",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                    min="5"
                    max="480"
                    step="5"
                    required
                  />
                </div>
                <div>
                  <Label
                    htmlFor="scheduledTime"
                    className="text-sm font-semibold"
                  >
                    Scheduled Time *
                  </Label>
                  <Input
                    id="scheduledTime"
                    type="datetime-local"
                    value={formData.scheduledTime}
                    onChange={(e) =>
                      handleInputChange("scheduledTime", e.target.value)
                    }
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Emergency Settings */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                Emergency & Urgency
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isEmergency"
                    checked={formData.isEmergency}
                    onChange={(e) =>
                      handleInputChange("isEmergency", e.target.checked)
                    }
                    className="rounded border-gray-300 focus:ring-red-500"
                  />
                  <Label
                    htmlFor="isEmergency"
                    className="text-sm font-semibold text-red-800"
                  >
                    This is an emergency task
                  </Label>
                </div>

                {formData.isEmergency && (
                  <div>
                    <Label
                      htmlFor="emergencyReason"
                      className="text-sm font-semibold"
                    >
                      Emergency Reason *
                    </Label>
                    <Textarea
                      id="emergencyReason"
                      placeholder="Describe the emergency situation requiring immediate attention..."
                      value={formData.emergencyReason}
                      onChange={(e) =>
                        handleInputChange("emergencyReason", e.target.value)
                      }
                      className="mt-1 bg-white"
                      rows={2}
                      required={formData.isEmergency}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Guest Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isOccupied"
                    checked={formData.isOccupied}
                    onChange={(e) =>
                      handleInputChange("isOccupied", e.target.checked)
                    }
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="isOccupied"
                    className="text-sm font-semibold text-blue-800"
                  >
                    Room currently occupied
                  </Label>
                </div>
                <div>
                  <Label
                    htmlFor="guestCheckout"
                    className="text-sm font-semibold"
                  >
                    Guest Checkout Time
                  </Label>
                  <Input
                    id="guestCheckout"
                    type="datetime-local"
                    value={formData.guestCheckout}
                    onChange={(e) =>
                      handleInputChange("guestCheckout", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="guestCheckin"
                    className="text-sm font-semibold"
                  >
                    Next Guest Checkin
                  </Label>
                  <Input
                    id="guestCheckin"
                    type="datetime-local"
                    value={formData.guestCheckin}
                    onChange={(e) =>
                      handleInputChange("guestCheckin", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Task Details & Instructions
              </h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-sm font-semibold">
                    General Notes
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any general notes about this task..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    className="mt-1 bg-white"
                    rows={2}
                  />
                </div>
                <div>
                  <Label
                    htmlFor="specialInstructions"
                    className="text-sm font-semibold"
                  >
                    Special Instructions
                  </Label>
                  <Textarea
                    id="specialInstructions"
                    placeholder="Any specific instructions or requirements for this task..."
                    value={formData.specialInstructions}
                    onChange={(e) =>
                      handleInputChange("specialInstructions", e.target.value)
                    }
                    className="mt-1 bg-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Equipment & Supplies */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Equipment & Supplies
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold">
                    Required Equipment
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      "Vacuum",
                      "Mop & Bucket",
                      "Cleaning Cart",
                      "Steam Cleaner",
                      "Pressure Washer",
                      "Tool Kit",
                    ].map((equipment) => (
                      <div
                        key={equipment}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          id={`equipment-${equipment}`}
                          checked={formData.equipmentRequired.includes(
                            equipment
                          )}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange("equipmentRequired", [
                                ...formData.equipmentRequired,
                                equipment,
                              ])
                            } else {
                              handleInputChange(
                                "equipmentRequired",
                                formData.equipmentRequired.filter(
                                  (eq: string) => eq !== equipment
                                )
                              )
                            }
                          }}
                          className="rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`equipment-${equipment}`}
                          className="text-sm text-purple-800"
                        >
                          {equipment}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold">
                    Required Supplies
                  </Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      "Towels",
                      "Bed Linens",
                      "Toiletries",
                      "Cleaning Chemicals",
                      "Toilet Paper",
                      "Soap & Shampoo",
                    ].map((supply) => (
                      <div key={supply} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`supply-${supply}`}
                          checked={formData.supplies.includes(supply)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleInputChange("supplies", [
                                ...formData.supplies,
                                supply,
                              ])
                            } else {
                              handleInputChange(
                                "supplies",
                                formData.supplies.filter(
                                  (sup: string) => sup !== supply
                                )
                              )
                            }
                          }}
                          className="rounded border-gray-300 focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`supply-${supply}`}
                          className="text-sm text-purple-800"
                        >
                          {supply}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Task Checklist
              </h4>
              <p className="text-sm text-orange-700 mb-3">
                Customize the checklist items for this task
              </p>
              <div className="space-y-2">
                {formData.checklist.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-2 p-2 bg-white rounded border"
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={(e) => {
                        const newChecklist = [...formData.checklist]
                        newChecklist[index].completed = e.target.checked
                        handleInputChange("checklist", newChecklist)
                      }}
                      className="rounded border-gray-300 focus:ring-orange-500"
                    />
                    <Input
                      value={item.item}
                      onChange={(e) => {
                        const newChecklist = [...formData.checklist]
                        newChecklist[index].item = e.target.value
                        handleInputChange("checklist", newChecklist)
                      }}
                      className="flex-1"
                      placeholder="Checklist item..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newChecklist = formData.checklist.filter(
                          (_, i) => i !== index
                        )
                        handleInputChange("checklist", newChecklist)
                      }}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newChecklist = [
                      ...formData.checklist,
                      { item: "", completed: false },
                    ]
                    handleInputChange("checklist", newChecklist)
                  }}
                  className="w-full border-dashed border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Checklist Item
                </Button>
              </div>
            </div>

            {/* Recurring Task Settings */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
                <Repeat className="h-5 w-5 mr-2" />
                Recurring Task Settings
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      handleInputChange("isRecurring", e.target.checked)
                    }
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <Label
                    htmlFor="isRecurring"
                    className="text-sm font-semibold text-indigo-800"
                  >
                    Set up as recurring task
                  </Label>
                </div>

                {formData.isRecurring && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="recurrencePattern"
                        className="text-sm font-semibold"
                      >
                        Recurrence Pattern
                      </Label>
                      <Select
                        value={formData.recurrencePattern}
                        onValueChange={(value) =>
                          handleInputChange("recurrencePattern", value)
                        }
                      >
                        <SelectTrigger className="mt-1 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label
                        htmlFor="nextScheduledDate"
                        className="text-sm font-semibold"
                      >
                        Next Occurrence
                      </Label>
                      <Input
                        id="nextScheduledDate"
                        type="datetime-local"
                        value={formData.nextScheduledDate}
                        onChange={(e) =>
                          handleInputChange("nextScheduledDate", e.target.value)
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Room Condition */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Home className="h-5 w-5 mr-2" />
                Room Condition Assessment
              </h4>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="beforeCleaning"
                    className="text-sm font-semibold"
                  >
                    Room Condition Before Task
                  </Label>
                  <Textarea
                    id="beforeCleaning"
                    placeholder="Describe the current condition of the room..."
                    value={formData.roomCondition.beforeCleaning}
                    onChange={(e) =>
                      handleInputChange(
                        "roomCondition.beforeCleaning",
                        e.target.value
                      )
                    }
                    className="mt-1 bg-white"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="damageReported"
                      checked={formData.roomCondition.damageReported}
                      onChange={(e) =>
                        handleInputChange(
                          "roomCondition.damageReported",
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 focus:ring-gray-500"
                    />
                    <Label
                      htmlFor="damageReported"
                      className="text-sm font-semibold"
                    >
                      Damage reported
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="maintenanceRequired"
                      checked={formData.roomCondition.maintenanceRequired}
                      onChange={(e) =>
                        handleInputChange(
                          "roomCondition.maintenanceRequired",
                          e.target.checked
                        )
                      }
                      className="rounded border-gray-300 focus:ring-gray-500"
                    />
                    <Label
                      htmlFor="maintenanceRequired"
                      className="text-sm font-semibold"
                    >
                      Maintenance required
                    </Label>
                  </div>
                </div>
                {formData.roomCondition.damageReported && (
                  <div>
                    <Label
                      htmlFor="damageDescription"
                      className="text-sm font-semibold"
                    >
                      Damage Description
                    </Label>
                    <Textarea
                      id="damageDescription"
                      placeholder="Describe the damage in detail..."
                      value={formData.roomCondition.damageDescription}
                      onChange={(e) =>
                        handleInputChange(
                          "roomCondition.damageDescription",
                          e.target.value
                        )
                      }
                      className="mt-1 bg-white"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Cost Estimation */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Cost Estimation
              </h4>
              <div>
                <Label htmlFor="costEstimate" className="text-sm font-semibold">
                  Estimated Cost (₹)
                </Label>
                <Input
                  id="costEstimate"
                  type="number"
                  placeholder="500"
                  value={formData.costEstimate}
                  onChange={(e) =>
                    handleInputChange(
                      "costEstimate",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="mt-1 bg-white"
                  min="0"
                  step="10"
                />
                <p className="text-xs text-yellow-700 mt-1">
                  Include labor, supplies, and any additional costs
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
