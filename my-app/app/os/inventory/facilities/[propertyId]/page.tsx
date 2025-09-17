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
  Building,
  Zap,
  Droplets,
  Wifi,
  Car,
  Shield,
  Wrench,
  Plus,
  Edit,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ArrowLeft,
  BarChart3,
  Target,
  Filter,
  RefreshCw,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Phone,
  Mail,
  Clock,
  Gauge,
  Leaf,
  Eye,
  FileText,
  Lock,
  X,
} from "lucide-react"
import { ListPageSkeleton } from "@/components/ui/loading-skeleton"

interface Facility {
  id: string
  name: string
  category:
    | "infrastructure"
    | "utilities"
    | "security"
    | "maintenance"
    | "technology"
  description: string
  icon: string
  status: "operational" | "maintenance" | "offline" | "warning"
  priority: "low" | "normal" | "high" | "critical"
  lastMaintenance: string
  nextMaintenance: string
  maintenanceCost: number
  operationalCost: number
  uptime: number
  capacity: number
  currentUsage: number
  vendor?: string
}

// Removed mock data - now fetching from real API

const getFacilityIcon = (iconName: string) => {
  const icons: { [key: string]: JSX.Element } = {
    zap: <Zap className="h-5 w-5" />,
    droplets: <Droplets className="h-5 w-5" />,
    wifi: <Wifi className="h-5 w-5" />,
    car: <Car className="h-5 w-5" />,
    shield: <Shield className="h-5 w-5" />,
    wrench: <Wrench className="h-5 w-5" />,
  }
  return icons[iconName] || <Building className="h-5 w-5" />
}

const getStatusColor = (status: string) => {
  const colors: { [key: string]: string } = {
    operational: "bg-green-500",
    maintenance: "bg-yellow-500",
    offline: "bg-red-500",
    warning: "bg-orange-500",
  }
  return colors[status] || "bg-gray-500"
}

const getPriorityColor = (priority: string) => {
  const colors: { [key: string]: string } = {
    critical: "bg-red-100 text-red-800",
    high: "bg-orange-100 text-orange-800",
    normal: "bg-blue-100 text-blue-800",
    low: "bg-gray-100 text-gray-800",
  }
  return colors[priority] || "bg-gray-100 text-gray-800"
}

const getCategoryGradient = (category: string) => {
  const gradients: { [key: string]: string } = {
    infrastructure: "bg-gradient-to-r from-blue-500/20 to-indigo-500/20",
    security: "bg-gradient-to-r from-red-500/20 to-pink-500/20",
    maintenance: "bg-gradient-to-r from-yellow-500/20 to-orange-500/20",
    technology: "bg-gradient-to-r from-purple-500/20 to-pink-500/20",
    utilities: "bg-gradient-to-r from-green-500/20 to-emerald-500/20",
  }
  return (
    gradients[category] || "bg-gradient-to-r from-gray-500/20 to-slate-500/20"
  )
}

const getCategoryButtonGradient = (category: string) => {
  const gradients: { [key: string]: string } = {
    infrastructure:
      "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
    security:
      "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700",
    maintenance:
      "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700",
    technology:
      "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700",
    utilities:
      "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700",
  }
  return (
    gradients[category] ||
    "bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
  )
}

export default function FacilitiesManagement() {
  const router = useRouter()
  const { data: session } = useSession()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showManageDialog, setShowManageDialog] = useState(false)
  const [managingFacility, setManagingFacility] = useState<Facility | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Facility Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "infrastructure",
    description: "",
    icon: "building",
    priority: "normal",
    capacity: 0,
    currentUsage: 0,
    unit: "units",

    // Location information
    location: "",
    area: "",
    floor: "",
    buildingSection: "",

    // Vendor information
    vendor: "",
    vendorContact: {
      name: "",
      email: "",
      phone: "",
      address: "",
    },
    model: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiry: "",

    // Maintenance information
    lastMaintenance: "",
    nextMaintenance: "",
    maintenanceInterval: 90,
    maintenanceType: "preventive",

    // Cost information
    acquisitionCost: 0,
    operationalCost: 0,
    maintenanceCost: 0,
    estimatedLifespan: 120,

    // Performance metrics
    uptime: 100,
    efficiency: 100,

    // Safety and compliance
    safetyRating: "good",
    complianceStatus: "compliant",
    certifications: [],
    inspectionDate: "",
    nextInspection: "",

    // Environmental impact
    energyConsumption: 0,
    carbonFootprint: 0,
    environmentalRating: "",

    // Operational settings
    operatingHours: {
      isAlwaysOn: true,
      startTime: "00:00",
      endTime: "23:59",
      days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
    },

    // Monitoring
    monitoring: {
      isMonitored: false,
      monitoringSystem: "",
      alertThresholds: {},
    },

    // Access and security
    accessLevel: "staff",
    securityProtocols: [],

    // Notes
    notes: "",
  })

  const propertyId = useParams()?.propertyId as string

  useEffect(() => {
    if (propertyId) {
      fetchFacilities()
    }
  }, [propertyId])

  const fetchFacilities = async () => {
    try {
      setLoading(true)

      if (!propertyId) {
        console.log("Property ID not available yet, skipping fetch")
        setFacilities([])
        return
      }

      const response = await fetch(
        `/api/inventory/facilities?propertyId=${propertyId}`
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch facilities")
      }

      // Transform API data to match Facility interface
      const transformedFacilities: Facility[] =
        data.facilities?.map((facility: any) => ({
          id: facility._id || facility.id,
          name: facility.name,
          category: facility.category || "infrastructure",
          description: facility.description || "",
          icon: facility.icon || "building",
          status: facility.status || "operational",
          priority: facility.priority || "normal",
          capacity: facility.capacity || 0,
          currentUsage: facility.currentUsage || 0,
          unit: facility.unit || "units",
          location: facility.location || "",
          area: facility.area || "",
          floor: facility.floor || "",
          buildingSection: facility.buildingSection || "",
          vendor: facility.vendor || "",
          vendorContact: facility.vendorContact || {
            name: "",
            email: "",
            phone: "",
            address: "",
          },
          model: facility.model || "",
          serialNumber: facility.serialNumber || "",
          purchaseDate: facility.purchaseDate,
          warrantyExpiry: facility.warrantyExpiry,
          lastMaintenance: facility.lastMaintenance,
          nextMaintenance: facility.nextMaintenance,
          maintenanceInterval: facility.maintenanceInterval || 90,
          maintenanceType: facility.maintenanceType || "preventive",
          acquisitionCost: facility.acquisitionCost || 0,
          operationalCost: facility.operationalCost || 0,
          maintenanceCost: facility.maintenanceCost || 0,
          estimatedLifespan: facility.estimatedLifespan || 120,
          uptime: facility.uptime || 100,
          efficiency: facility.efficiency || 100,
          lastDowntime: facility.lastDowntime,
          totalDowntime: facility.totalDowntime || 0,
          safetyRating: facility.safetyRating || "good",
          complianceStatus: facility.complianceStatus || "compliant",
          certifications: facility.certifications || [],
          inspectionDate: facility.inspectionDate,
          nextInspection: facility.nextInspection,
          energyConsumption: facility.energyConsumption || 0,
          carbonFootprint: facility.carbonFootprint || 0,
          environmentalRating: facility.environmentalRating || "",
          operatingHours: facility.operatingHours || {
            isAlwaysOn: true,
            startTime: "00:00",
            endTime: "23:59",
            days: [
              "monday",
              "tuesday",
              "wednesday",
              "thursday",
              "friday",
              "saturday",
              "sunday",
            ],
          },
          monitoring: facility.monitoring || {
            isMonitored: false,
            monitoringSystem: "",
            alertThresholds: {},
            lastAlert: null,
          },
          manuals: facility.manuals || [],
          specifications: facility.specifications || {},
          photos: facility.photos || [],
          diagrams: facility.diagrams || [],
          accessLevel: facility.accessLevel || "staff",
          securityProtocols: facility.securityProtocols || [],
          notes: facility.notes || "",
          maintenanceHistory: facility.maintenanceHistory || [],
          modificationHistory: facility.modificationHistory || [],
          createdAt: facility.createdAt,
          updatedAt: facility.updatedAt,
          createdBy: facility.createdBy,
        })) || []

      setFacilities(transformedFacilities)
    } catch (error) {
      console.error("Error fetching facilities:", error)
      setFacilities([])
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "infrastructure",
      description: "",
      icon: "building",
      priority: "normal",
      capacity: 0,
      currentUsage: 0,
      unit: "units",
      location: "",
      area: "",
      floor: "",
      buildingSection: "",
      vendor: "",
      vendorContact: {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      model: "",
      serialNumber: "",
      purchaseDate: "",
      warrantyExpiry: "",
      lastMaintenance: "",
      nextMaintenance: "",
      maintenanceInterval: 90,
      maintenanceType: "preventive",
      acquisitionCost: 0,
      operationalCost: 0,
      maintenanceCost: 0,
      estimatedLifespan: 120,
      uptime: 100,
      efficiency: 100,
      safetyRating: "good",
      complianceStatus: "compliant",
      certifications: [],
      inspectionDate: "",
      nextInspection: "",
      energyConsumption: 0,
      carbonFootprint: 0,
      environmentalRating: "",
      operatingHours: {
        isAlwaysOn: true,
        startTime: "00:00",
        endTime: "23:59",
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      monitoring: {
        isMonitored: false,
        monitoringSystem: "",
        alertThresholds: {},
      },
      accessLevel: "staff",
      securityProtocols: [],
      notes: "",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId) return

    setIsSubmitting(true)
    try {
      const isUpdate = showManageDialog && managingFacility
      const url = isUpdate
        ? `/api/inventory/facilities/${managingFacility._id}?propertyId=${propertyId}`
        : `/api/inventory/facilities?propertyId=${propertyId}`

      const response = await fetch(url, {
        method: isUpdate ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          propertyId
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Refresh the facilities list from API
        await fetchFacilities()
        setShowAddDialog(false)
        setShowManageDialog(false)
        setManagingFacility(null)
        resetForm()
      } else {
        console.error(`Error ${isUpdate ? 'updating' : 'creating'} facility:`, data.error || "Unknown error")
        // Handle error display to user if needed
      }
    } catch (error) {
      console.error(`Error ${showManageDialog ? 'updating' : 'creating'} facility:`, error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleManageFacility = (facility: Facility) => {
    setManagingFacility(facility)
    setFormData({
      name: facility.name,
      category: facility.category,
      description: facility.description,
      icon: facility.icon,
      priority: facility.priority,
      capacity: facility.capacity,
      currentUsage: facility.currentUsage,
      unit: facility.unit || "units",
      location: facility.location || "",
      area: facility.area || "",
      floor: facility.floor || "",
      buildingSection: facility.buildingSection || "",
      vendor: facility.vendor || "",
      vendorContact: facility.vendorContact || {
        name: "",
        email: "",
        phone: "",
        address: "",
      },
      model: facility.model || "",
      serialNumber: facility.serialNumber || "",
      purchaseDate: facility.purchaseDate || "",
      warrantyExpiry: facility.warrantyExpiry || "",
      lastMaintenance: facility.lastMaintenance || "",
      nextMaintenance: facility.nextMaintenance || "",
      maintenanceInterval: facility.maintenanceInterval || 90,
      maintenanceType: facility.maintenanceType || "preventive",
      acquisitionCost: facility.acquisitionCost || 0,
      operationalCost: facility.operationalCost || 0,
      maintenanceCost: facility.maintenanceCost || 0,
      estimatedLifespan: facility.estimatedLifespan || 120,
      uptime: facility.uptime || 100,
      efficiency: facility.efficiency || 100,
      safetyRating: facility.safetyRating || "good",
      complianceStatus: facility.complianceStatus || "compliant",
      certifications: facility.certifications || [],
      inspectionDate: facility.inspectionDate || "",
      nextInspection: facility.nextInspection || "",
      energyConsumption: facility.energyConsumption || 0,
      carbonFootprint: facility.carbonFootprint || 0,
      environmentalRating: facility.environmentalRating || "",
      operatingHours: facility.operatingHours || {
        isAlwaysOn: true,
        startTime: "00:00",
        endTime: "23:59",
        days: [
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ],
      },
      monitoring: facility.monitoring || {
        isMonitored: false,
        monitoringSystem: "",
        alertThresholds: {},
      },
      accessLevel: facility.accessLevel || "staff",
      securityProtocols: facility.securityProtocols || [],
      notes: facility.notes || "",
    })
    setShowManageDialog(true)
  }

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith("vendorContact.")) {
      const contactField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        vendorContact: {
          ...prev.vendorContact,
          [contactField]: value,
        },
      }))
    } else if (field.startsWith("operatingHours.")) {
      const hoursField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        operatingHours: {
          ...prev.operatingHours,
          [hoursField]: value,
        },
      }))
    } else if (field.startsWith("monitoring.")) {
      const monitoringField = field.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        monitoring: {
          ...prev.monitoring,
          [monitoringField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }
  }

  const filteredFacilities =
    selectedCategory === "all"
      ? facilities
      : facilities.filter((facility) => facility.category === selectedCategory)

  const categories = [
    { id: "all", label: "All Facilities", count: facilities.length },
    {
      id: "infrastructure",
      label: "Infrastructure",
      count: facilities.filter((f) => f.category === "infrastructure").length,
    },
    {
      id: "utilities",
      label: "Utilities",
      count: facilities.filter((f) => f.category === "utilities").length,
    },
    {
      id: "security",
      label: "Security",
      count: facilities.filter((f) => f.category === "security").length,
    },
    {
      id: "maintenance",
      label: "Maintenance",
      count: facilities.filter((f) => f.category === "maintenance").length,
    },
    {
      id: "technology",
      label: "Technology",
      count: facilities.filter((f) => f.category === "technology").length,
    },
  ]

  if (loading) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Matching F&B Dashboard Style */}
      <div className="bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/os/inventory/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Inventory</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Building className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Facilities Management
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Wrench className="h-4 w-4" />
                    <span className="text-gray-100">
                      Infrastructure & Systems
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-green-200 font-medium">
                      Operational
                    </span>
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
              className="bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Facility
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Category Filter */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-white">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 text-gray-600 mr-2" />
            Facility Categories
          </CardTitle>
          <CardDescription>
            Filter facilities by type and category
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  selectedCategory === category.id ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-gray-600 to-slate-600 text-white hover:from-gray-700 hover:to-slate-700"
                    : "border-gray-300 hover:bg-gray-50"
                }
              >
                {category.label}
                <Badge
                  className={`ml-2 border-0 ${
                    selectedCategory === category.id
                      ? "bg-white/20 text-current"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Operational
            </CardTitle>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {facilities.filter((f) => f.status === "operational").length}
            </div>
            <p className="text-xs text-emerald-600">Systems running</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-yellow-700">
              Maintenance
            </CardTitle>
            <Wrench className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900 mb-1">
              {
                facilities.filter(
                  (f) => f.status === "maintenance" || f.status === "warning"
                ).length
              }
            </div>
            <p className="text-xs text-yellow-600">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Avg Uptime
            </CardTitle>
            <Activity className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {facilities.length > 0
                ? (
                    facilities.reduce((sum, f) => sum + f.uptime, 0) /
                    facilities.length
                  ).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-blue-600">System reliability</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Monthly Cost
            </CardTitle>
            <Target className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹
              {(
                facilities.reduce(
                  (sum, f) => sum + f.operationalCost + f.maintenanceCost,
                  0
                ) / 1000
              ).toFixed(0)}
              K
            </div>
            <p className="text-xs text-purple-600">Total operating</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Facilities Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Infrastructure & Systems
            </h2>
            <p className="text-gray-600">
              Manage all property facilities and infrastructure
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-lg">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => {
            const utilizationPercentage =
              (facility.currentUsage / facility.capacity) * 100

            return (
              <Card
                key={facility.id}
                className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-0 shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-gray-50 hover:to-white overflow-hidden"
              >
                {/* Enhanced Header */}
                <div
                  className={`h-2 rounded-t-lg ${
                    facility.status === "operational"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : facility.status === "maintenance"
                      ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                      : facility.status === "warning"
                      ? "bg-gradient-to-r from-orange-500 to-red-500"
                      : "bg-gradient-to-r from-red-500 to-pink-500"
                  }`}
                ></div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div
                      className={`p-3 rounded-xl transition-all duration-300 ${getCategoryGradient(
                        facility.category
                      )}`}
                    >
                      {getFacilityIcon(facility.icon)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(facility.priority)}>
                        {facility.priority}
                      </Badge>
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          facility.status
                        )} animate-pulse`}
                      ></div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-gray-700">
                      {facility.name}
                    </CardTitle>
                    <CardDescription className="text-gray-600 capitalize">
                      {facility.category.replace("_", " ")} •{" "}
                      {facility.description}
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm font-medium">
                      System Status
                    </span>
                    <Badge
                      className={`${getStatusColor(
                        facility.status
                      )} text-white border-0 font-medium capitalize`}
                    >
                      {facility.status}
                    </Badge>
                  </div>

                  {/* Uptime */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">Uptime</span>
                      <span className="font-bold text-gray-800">
                        {facility.uptime}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          facility.uptime >= 99
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : facility.uptime >= 95
                            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                            : facility.uptime >= 90
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-red-500 to-pink-500"
                        }`}
                        style={{ width: `${facility.uptime}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-medium">
                        Utilization
                      </span>
                      <span className="font-bold text-gray-800">
                        {facility.currentUsage}/{facility.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                          utilizationPercentage >= 90
                            ? "bg-gradient-to-r from-red-500 to-pink-500"
                            : utilizationPercentage >= 75
                            ? "bg-gradient-to-r from-orange-500 to-red-500"
                            : utilizationPercentage >= 50
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-green-500 to-emerald-500"
                        }`}
                        style={{
                          width: `${Math.min(utilizationPercentage, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      {utilizationPercentage.toFixed(0)}% capacity
                    </div>
                  </div>

                  {/* Maintenance Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1 font-medium">
                        Last Service
                      </div>
                      <div className="font-bold text-gray-800 text-xs">
                        {new Date(
                          facility.lastMaintenance
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1 font-medium">
                        Next Service
                      </div>
                      <div className="font-bold text-gray-800 text-xs">
                        {new Date(
                          facility.nextMaintenance
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Cost Information */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1 font-medium">
                        Operating
                      </div>
                      <div className="font-bold text-blue-700">
                        ₹{facility.operationalCost.toLocaleString()}/mo
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1 font-medium">
                        Maintenance
                      </div>
                      <div className="font-bold text-orange-700">
                        ₹{facility.maintenanceCost.toLocaleString()}/mo
                      </div>
                    </div>
                  </div>

                  {/* Vendor Info */}
                  {facility.vendor && (
                    <div className="text-xs text-gray-500 font-medium pt-2 border-t border-gray-200/50">
                      Vendor: {facility.vendor}
                    </div>
                  )}

                  {/* Enhanced Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleManageFacility(facility)}
                      className={`flex-1 shadow-md hover:shadow-lg transition-all duration-200 ${getCategoryButtonGradient(
                        facility.category
                      )}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-300 hover:bg-gray-50 hover:shadow-md transition-all duration-200"
                    >
                      <Wrench className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* Add New Facility Card */}
          <Card className="group hover:scale-105 transition-all duration-300 hover:shadow-xl border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer bg-gradient-to-br from-gray-50 to-white hover:from-gray-100 hover:to-gray-50">
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-500/20 to-slate-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Plus className="h-8 w-8 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Add New Facility
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Register a new facility or infrastructure system
              </p>
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Facility Dialog */}
      <Dialog
        open={showAddDialog || showManageDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetForm()
            setManagingFacility(null)
          }
          setShowAddDialog(open && !showManageDialog)
          setShowManageDialog(open && showManageDialog)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center">
              <Building className="h-6 w-6 mr-2 text-gray-600" />
              {showManageDialog ? 'Manage Facility' : 'Add New Facility'}
            </DialogTitle>
            <DialogDescription>
              {showManageDialog
                ? 'Update facility details and operational parameters'
                : 'Register a new facility or infrastructure system for comprehensive property management'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="facilityName"
                    className="text-sm font-semibold"
                  >
                    Facility Name *
                  </Label>
                  <Input
                    id="facilityName"
                    type="text"
                    placeholder="e.g., Main HVAC System, Emergency Generator"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-sm font-semibold">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="infrastructure">
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4" />
                          <span>Infrastructure</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="utilities">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4" />
                          <span>Utilities</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="security">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Security</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4" />
                          <span>Maintenance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="technology">
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4" />
                          <span>Technology</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <SelectItem value="critical">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          <span>Critical</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="icon" className="text-sm font-semibold">
                    Icon
                  </Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => handleInputChange("icon", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zap">
                        <div className="flex items-center space-x-2">
                          <Zap className="h-4 w-4" />
                          <span>Electrical</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="droplets">
                        <div className="flex items-center space-x-2">
                          <Droplets className="h-4 w-4" />
                          <span>Water/Plumbing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="wifi">
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4" />
                          <span>Network/IT</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="car">
                        <div className="flex items-center space-x-2">
                          <Car className="h-4 w-4" />
                          <span>Vehicle/Transport</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="shield">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4" />
                          <span>Security</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="wrench">
                        <div className="flex items-center space-x-2">
                          <Wrench className="h-4 w-4" />
                          <span>Mechanical</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="capacity" className="text-sm font-semibold">
                      Capacity *
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="100"
                      value={formData.capacity}
                      onChange={(e) =>
                        handleInputChange(
                          "capacity",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="mt-1"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="unit" className="text-sm font-semibold">
                      Unit
                    </Label>
                    <Input
                      id="unit"
                      type="text"
                      placeholder="kW, users, units"
                      value={formData.unit}
                      onChange={(e) =>
                        handleInputChange("unit", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label
                    htmlFor="currentUsage"
                    className="text-sm font-semibold"
                  >
                    Current Usage
                  </Label>
                  <Input
                    id="currentUsage"
                    type="number"
                    placeholder="75"
                    value={formData.currentUsage}
                    onChange={(e) =>
                      handleInputChange(
                        "currentUsage",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-semibold">
                Description *
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the facility, its purpose, and key features..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="mt-1 min-h-[100px]"
                required
              />
            </div>

            {/* Location Information */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Location Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-sm font-semibold">
                    Location
                  </Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Basement, Roof, Utility Room"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="area" className="text-sm font-semibold">
                    Area/Zone
                  </Label>
                  <Input
                    id="area"
                    type="text"
                    placeholder="e.g., North Wing, Building A"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="floor" className="text-sm font-semibold">
                    Floor
                  </Label>
                  <Input
                    id="floor"
                    type="text"
                    placeholder="e.g., B1, Ground, 1st"
                    value={formData.floor}
                    onChange={(e) => handleInputChange("floor", e.target.value)}
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="buildingSection"
                    className="text-sm font-semibold"
                  >
                    Building Section
                  </Label>
                  <Input
                    id="buildingSection"
                    type="text"
                    placeholder="e.g., Main Building, Annex"
                    value={formData.buildingSection}
                    onChange={(e) =>
                      handleInputChange("buildingSection", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Vendor Information */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Vendor Information
              </h4>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vendor" className="text-sm font-semibold">
                      Vendor Company
                    </Label>
                    <Input
                      id="vendor"
                      type="text"
                      placeholder="e.g., Johnson Controls, Siemens"
                      value={formData.vendor}
                      onChange={(e) =>
                        handleInputChange("vendor", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="vendorContactName"
                      className="text-sm font-semibold"
                    >
                      Contact Person
                    </Label>
                    <Input
                      id="vendorContactName"
                      type="text"
                      placeholder="Contact person name"
                      value={formData.vendorContact.name}
                      onChange={(e) =>
                        handleInputChange("vendorContact.name", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="vendorEmail"
                      className="text-sm font-semibold"
                    >
                      Email
                    </Label>
                    <Input
                      id="vendorEmail"
                      type="email"
                      placeholder="vendor@company.com"
                      value={formData.vendorContact.email}
                      onChange={(e) =>
                        handleInputChange("vendorContact.email", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="vendorPhone"
                      className="text-sm font-semibold"
                    >
                      Phone
                    </Label>
                    <Input
                      id="vendorPhone"
                      type="tel"
                      placeholder="+1234567890"
                      value={formData.vendorContact.phone}
                      onChange={(e) =>
                        handleInputChange("vendorContact.phone", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="model" className="text-sm font-semibold">
                      Model Number
                    </Label>
                    <Input
                      id="model"
                      type="text"
                      placeholder="Model/Part Number"
                      value={formData.model}
                      onChange={(e) =>
                        handleInputChange("model", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="serialNumber"
                      className="text-sm font-semibold"
                    >
                      Serial Number
                    </Label>
                    <Input
                      id="serialNumber"
                      type="text"
                      placeholder="Serial Number"
                      value={formData.serialNumber}
                      onChange={(e) =>
                        handleInputChange("serialNumber", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="purchaseDate"
                      className="text-sm font-semibold"
                    >
                      Purchase Date
                    </Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) =>
                        handleInputChange("purchaseDate", e.target.value)
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Schedule */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-900 mb-3 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Maintenance Schedule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="maintenanceInterval"
                    className="text-sm font-semibold"
                  >
                    Maintenance Interval (days)
                  </Label>
                  <Input
                    id="maintenanceInterval"
                    type="number"
                    placeholder="90"
                    value={formData.maintenanceInterval}
                    onChange={(e) =>
                      handleInputChange(
                        "maintenanceInterval",
                        parseInt(e.target.value) || 90
                      )
                    }
                    className="mt-1 bg-white"
                    min="1"
                    max="365"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="maintenanceType"
                    className="text-sm font-semibold"
                  >
                    Maintenance Type
                  </Label>
                  <Select
                    value={formData.maintenanceType}
                    onValueChange={(value) =>
                      handleInputChange("maintenanceType", value)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive">Preventive</SelectItem>
                      <SelectItem value="corrective">Corrective</SelectItem>
                      <SelectItem value="predictive">Predictive</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="lastMaintenance"
                    className="text-sm font-semibold"
                  >
                    Last Maintenance
                  </Label>
                  <Input
                    id="lastMaintenance"
                    type="date"
                    value={formData.lastMaintenance}
                    onChange={(e) =>
                      handleInputChange("lastMaintenance", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="nextMaintenance"
                    className="text-sm font-semibold"
                  >
                    Next Maintenance
                  </Label>
                  <Input
                    id="nextMaintenance"
                    type="date"
                    value={formData.nextMaintenance}
                    onChange={(e) =>
                      handleInputChange("nextMaintenance", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Cost Information */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Cost Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label
                    htmlFor="acquisitionCost"
                    className="text-sm font-semibold"
                  >
                    Acquisition Cost (₹)
                  </Label>
                  <Input
                    id="acquisitionCost"
                    type="number"
                    placeholder="500000"
                    value={formData.acquisitionCost}
                    onChange={(e) =>
                      handleInputChange(
                        "acquisitionCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="operationalCost"
                    className="text-sm font-semibold"
                  >
                    Monthly Operating (₹)
                  </Label>
                  <Input
                    id="operationalCost"
                    type="number"
                    placeholder="15000"
                    value={formData.operationalCost}
                    onChange={(e) =>
                      handleInputChange(
                        "operationalCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="maintenanceCost"
                    className="text-sm font-semibold"
                  >
                    Monthly Maintenance (₹)
                  </Label>
                  <Input
                    id="maintenanceCost"
                    type="number"
                    placeholder="5000"
                    value={formData.maintenanceCost}
                    onChange={(e) =>
                      handleInputChange(
                        "maintenanceCost",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    step="100"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="estimatedLifespan"
                    className="text-sm font-semibold"
                  >
                    Lifespan (months)
                  </Label>
                  <Input
                    id="estimatedLifespan"
                    type="number"
                    placeholder="120"
                    value={formData.estimatedLifespan}
                    onChange={(e) =>
                      handleInputChange(
                        "estimatedLifespan",
                        parseInt(e.target.value) || 120
                      )
                    }
                    className="mt-1 bg-white"
                    min="12"
                    max="600"
                  />
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-orange-900 mb-3 flex items-center">
                <Gauge className="h-5 w-5 mr-2" />
                Performance Metrics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="uptime" className="text-sm font-semibold">
                    Expected Uptime (%)
                  </Label>
                  <Input
                    id="uptime"
                    type="number"
                    placeholder="99.5"
                    value={formData.uptime}
                    onChange={(e) =>
                      handleInputChange(
                        "uptime",
                        parseFloat(e.target.value) || 100
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="efficiency" className="text-sm font-semibold">
                    Efficiency Rating (%)
                  </Label>
                  <Input
                    id="efficiency"
                    type="number"
                    placeholder="85"
                    value={formData.efficiency}
                    onChange={(e) =>
                      handleInputChange(
                        "efficiency",
                        parseFloat(e.target.value) || 100
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Impact */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                <Leaf className="h-5 w-5 mr-2" />
                Environmental Impact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="energyConsumption"
                    className="text-sm font-semibold"
                  >
                    Energy Consumption (kWh/month)
                  </Label>
                  <Input
                    id="energyConsumption"
                    type="number"
                    placeholder="1200"
                    value={formData.energyConsumption}
                    onChange={(e) =>
                      handleInputChange(
                        "energyConsumption",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="carbonFootprint"
                    className="text-sm font-semibold"
                  >
                    Carbon Footprint (kg CO2/month)
                  </Label>
                  <Input
                    id="carbonFootprint"
                    type="number"
                    placeholder="450"
                    value={formData.carbonFootprint}
                    onChange={(e) =>
                      handleInputChange(
                        "carbonFootprint",
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="mt-1 bg-white"
                    min="0"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="environmentalRating"
                    className="text-sm font-semibold"
                  >
                    Environmental Rating
                  </Label>
                  <Select
                    value={formData.environmentalRating}
                    onValueChange={(value) =>
                      handleInputChange("environmentalRating", value)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent (A++)</SelectItem>
                      <SelectItem value="very-good">Very Good (A+)</SelectItem>
                      <SelectItem value="good">Good (A)</SelectItem>
                      <SelectItem value="average">Average (B)</SelectItem>
                      <SelectItem value="poor">Poor (C)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Operating Hours */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-3 flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Operating Hours
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isAlwaysOn"
                    checked={formData.operatingHours.isAlwaysOn}
                    onChange={(e) =>
                      handleInputChange(
                        "operatingHours.isAlwaysOn",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <Label
                    htmlFor="isAlwaysOn"
                    className="text-sm font-semibold text-indigo-800"
                  >
                    Operates 24/7
                  </Label>
                </div>

                {!formData.operatingHours.isAlwaysOn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="operatingStartTime"
                        className="text-sm font-semibold"
                      >
                        Operating Start Time
                      </Label>
                      <Input
                        id="operatingStartTime"
                        type="time"
                        value={formData.operatingHours.startTime}
                        onChange={(e) =>
                          handleInputChange(
                            "operatingHours.startTime",
                            e.target.value
                          )
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="operatingEndTime"
                        className="text-sm font-semibold"
                      >
                        Operating End Time
                      </Label>
                      <Input
                        id="operatingEndTime"
                        type="time"
                        value={formData.operatingHours.endTime}
                        onChange={(e) =>
                          handleInputChange(
                            "operatingHours.endTime",
                            e.target.value
                          )
                        }
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Safety & Compliance */}
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Safety & Compliance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="safetyRating"
                    className="text-sm font-semibold"
                  >
                    Safety Rating
                  </Label>
                  <Select
                    value={formData.safetyRating}
                    onValueChange={(value) =>
                      handleInputChange("safetyRating", value)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="needs-improvement">
                        Needs Improvement
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="complianceStatus"
                    className="text-sm font-semibold"
                  >
                    Compliance Status
                  </Label>
                  <Select
                    value={formData.complianceStatus}
                    onValueChange={(value) =>
                      handleInputChange("complianceStatus", value)
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compliant">Compliant</SelectItem>
                      <SelectItem value="partial-compliance">
                        Partial Compliance
                      </SelectItem>
                      <SelectItem value="non-compliant">
                        Non-Compliant
                      </SelectItem>
                      <SelectItem value="pending-review">
                        Pending Review
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label
                    htmlFor="inspectionDate"
                    className="text-sm font-semibold"
                  >
                    Last Inspection
                  </Label>
                  <Input
                    id="inspectionDate"
                    type="date"
                    value={formData.inspectionDate}
                    onChange={(e) =>
                      handleInputChange("inspectionDate", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="nextInspection"
                    className="text-sm font-semibold"
                  >
                    Next Inspection
                  </Label>
                  <Input
                    id="nextInspection"
                    type="date"
                    value={formData.nextInspection}
                    onChange={(e) =>
                      handleInputChange("nextInspection", e.target.value)
                    }
                    className="mt-1 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Monitoring Settings */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Monitoring & Alerts
              </h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isMonitored"
                    checked={formData.monitoring.isMonitored}
                    onChange={(e) =>
                      handleInputChange(
                        "monitoring.isMonitored",
                        e.target.checked
                      )
                    }
                    className="rounded border-gray-300 focus:ring-gray-500"
                  />
                  <Label
                    htmlFor="isMonitored"
                    className="text-sm font-semibold"
                  >
                    Enable automated monitoring
                  </Label>
                </div>

                {formData.monitoring.isMonitored && (
                  <div>
                    <Label
                      htmlFor="monitoringSystem"
                      className="text-sm font-semibold"
                    >
                      Monitoring System
                    </Label>
                    <Input
                      id="monitoringSystem"
                      type="text"
                      placeholder="e.g., Building Management System, IoT Sensors"
                      value={formData.monitoring.monitoringSystem}
                      onChange={(e) =>
                        handleInputChange(
                          "monitoring.monitoringSystem",
                          e.target.value
                        )
                      }
                      className="mt-1 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <Label htmlFor="notes" className="text-sm font-semibold">
                Additional Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Any additional information, special requirements, or observations..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddDialog(false)
                  setShowManageDialog(false)
                  setManagingFacility(null)
                  resetForm()
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {showManageDialog ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Building className="h-4 w-4 mr-2" />
                    {showManageDialog ? 'Update Facility' : 'Create Facility'}
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
