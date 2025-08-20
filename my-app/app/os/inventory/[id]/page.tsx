"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  BedIcon,
  Settings,
  Plus,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircleIcon,
  Users,
  Calendar,
  Wrench,
  Home,
  BarChart3,
  Timer,
  CheckCircle2,
  Building,
  Key,
  DoorOpen,
  DoorClosed,
  Hammer,
  PieChart,
  TrendingUp,
  Building2,
  Hotel,
  Bed,
  Star,
  IndianRupee,
  ClipboardCheck,
  Zap,
  Filter,
  Search,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface RoomData {
  unitTypeName: string
  unitTypeCode: string
  count: number
  pricing: {
    price: string
    pricePerWeek: string
    pricePerMonth: string
  }
  roomNumbers?: Array<{
    number: string
    status: "available" | "booked" | "maintenance"
  }>
}

interface InventoryStats {
  totalRooms: number
  availableRooms: number
  bookedRooms: number
  maintenanceRooms: number
  occupancyRate: number
  averageRate: number
}

export default function InventoryManagementPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [propertyData, setPropertyData] = useState<any>(null)
  const [rooms, setRooms] = useState<RoomData[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomData | null>(null)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)

  const propertyId = (params as { id?: string } | null)?.id as string

  useEffect(() => {
    const fetchInventoryData = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/os/inventory/${propertyId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch inventory data")
        }
        const data = await response.json()
        setPropertyData(data.property)
        setRooms(data.inventory)
        setStats(data.stats)
      } catch (error) {
        console.error("Error fetching inventory:", error)
        setError("Failed to load inventory data")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (propertyId && isAuthenticated) {
      fetchInventoryData()
    }
  }, [propertyId, isAuthenticated])

  // Authentication and access control
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.propertyId !== propertyId) {
        setError("You don't have access to this property")
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => router.push("/os/login")} variant="outline">
              Return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === "string" ? parseInt(amount) : amount
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "booked":
        return <Users className="h-4 w-4 text-blue-600" />
      case "maintenance":
        return <Wrench className="h-4 w-4 text-orange-600" />
      default:
        return <AlertCircleIcon className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "default"
      case "booked":
        return "secondary"
      case "maintenance":
        return "destructive"
      default:
        return "outline"
    }
  }

  const updateRoomStatus = async (
    unitCode: string,
    roomNumber: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/os/inventory/${propertyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unitCode,
          roomNumber,
          status: newStatus,
        }),
      })

      if (response.ok) {
        // Refresh inventory data
        const updatedRooms = rooms.map((room) => {
          if (room.unitTypeCode === unitCode && room.roomNumbers) {
            return {
              ...room,
              roomNumbers: room.roomNumbers.map((r) =>
                r.number === roomNumber ? { ...r, status: newStatus as any } : r
              ),
            }
          }
          return room
        })
        setRooms(updatedRooms)
      }
    } catch (error) {
      console.error("Error updating room status:", error)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border border-emerald-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-green-500/5 to-teal-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-300/20 to-teal-300/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-300/20 to-emerald-300/20 rounded-full blur-2xl transform -translate-x-24 translate-y-24"></div>

        <div className="relative p-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                    <Hotel className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                </div>
        <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-green-700 to-teal-700 bg-clip-text text-transparent">
            Room & Inventory Management
          </h1>
                  <p className="text-emerald-600/80 font-medium">
            Manage room availability, pricing, and maintenance
          </p>
        </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-4 text-sm text-emerald-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live System</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Timer className="h-4 w-4" />
                  <span>Real-time Status</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 transition-all duration-200"
                >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <Plus className="h-4 w-4 mr-2" />
            Add Room Type
          </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-blue-800">
                Total Rooms
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-blue-900 mb-1">
                {stats.totalRooms}
              </div>
              <div className="flex items-center space-x-1">
                <Hotel className="h-3 w-3 text-blue-600" />
                <p className="text-xs text-blue-600 font-medium">
                Across all room types
              </p>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-800">
                Available
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <DoorOpen className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-green-900 mb-1">
                {stats.availableRooms}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">
                    Ready for booking
                  </p>
                </div>
                <div className="w-full bg-green-200 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${
                        stats.totalRooms > 0
                          ? (stats.availableRooms / stats.totalRooms) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-800">
                Occupancy Rate
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-purple-900 mb-1">
                {stats.occupancyRate}%
              </div>
              <div className="space-y-2">
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${stats.occupancyRate}%` }}
                  ></div>
                </div>
                <div className="flex items-center space-x-1">
                  <DoorClosed className="h-3 w-3 text-purple-600" />
                  <p className="text-xs text-purple-600 font-medium">
                {stats.bookedRooms} rooms occupied
              </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-800">
                Maintenance
              </CardTitle>
              <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                <Hammer className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-orange-900 mb-1">
                {stats.maintenanceRooms}
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-1">
                  <Wrench className="h-3 w-3 text-orange-600" />
                  <p className="text-xs text-orange-600 font-medium">
                Requires attention
              </p>
                </div>
                {stats.maintenanceRooms > 0 && (
                  <div className="flex items-center space-x-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <p className="text-xs text-red-600">Action needed</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Room Management with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["room-types", "room-status"]}
        className="w-full"
      >
        {/* Enhanced Room Types Overview */}
        <AccordionItem
          value="room-types"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                <Bed className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-emerald-800">Room Types & Pricing</span>
              <Badge
                variant="secondary"
                className="ml-3 bg-emerald-100 text-emerald-700 border-emerald-200"
              >
                {rooms.length} types
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room, index) => (
                <Card
                  key={index}
                  className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer bg-gradient-to-br from-white to-slate-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardHeader className="relative">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                          <Key className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-slate-800">
                      {room.unitTypeName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {room.unitTypeCode}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                        <div className="flex items-center justify-center space-x-2 mb-1">
                          <Building className="h-4 w-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-800">
                            Total Rooms
                          </p>
                        </div>
                        <p className="text-3xl font-bold text-blue-900">
                          {room.count}
                        </p>
                      </div>

                      <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
                        <div className="flex items-center space-x-2 mb-3">
                          <IndianRupee className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-semibold text-emerald-800">
                            Pricing
                          </p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-700">
                              Per Night
                            </span>
                            <span className="font-bold text-emerald-900">
                              {formatCurrency(room.pricing.price)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-700">
                              Per Week
                            </span>
                            <span className="font-medium text-emerald-800">
                              {formatCurrency(room.pricing.pricePerWeek)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-emerald-700">
                              Per Month
                            </span>
                            <span className="font-medium text-emerald-800">
                              {formatCurrency(room.pricing.pricePerMonth)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRoom(room)
                            setIsRoomDialogOpen(true)
                          }}
                          className="border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-700 transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <DoorOpen className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium text-slate-700">
                          {room.roomNumbers ? (
                            <>
                              {
                                room.roomNumbers.filter(
                                  (r) => r.status === "available"
                                ).length
                              }{" "}
                              available
                            </>
                          ) : (
                            "All rooms"
                              )}
                            </span>
                          </div>
                          {room.roomNumbers && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="text-xs text-slate-600">
                                {room.roomNumbers.length} total
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Individual Room Status */}
        <AccordionItem
          value="room-status"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 mt-6"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-slate-500/20 mr-3">
                <ClipboardCheck className="h-5 w-5 text-slate-600" />
              </div>
              <span className="text-slate-800">Individual Room Status</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="space-y-0">
              {rooms.map((roomType, index) => (
                <Card key={index} className="border-0 shadow-none rounded-none">
                  <CardHeader
                    className={`bg-gradient-to-r ${
                      index % 2 === 0
                        ? "from-emerald-50 to-green-50"
                        : "from-blue-50 to-indigo-50"
                    } border-b border-slate-100`}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            index % 2 === 0
                              ? "bg-emerald-500/20"
                              : "bg-blue-500/20"
                          }`}
                        >
                          <Hotel
                            className={`h-4 w-4 ${
                              index % 2 === 0
                                ? "text-emerald-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <span className="text-slate-800">
                          {roomType.unitTypeName}
                        </span>
                      </CardTitle>
                      {roomType.roomNumbers && (
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="bg-white/70">
                            {roomType.roomNumbers.length} rooms
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            {
                              roomType.roomNumbers.filter(
                                (r) => r.status === "available"
                              ).length
                            }{" "}
                            available
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {roomType.roomNumbers && roomType.roomNumbers.length > 0 ? (
                      <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                            <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
                              <TableHead className="font-semibold text-slate-700">
                                Room Number
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700">
                                Status
                              </TableHead>
                              <TableHead className="font-semibold text-slate-700">
                                Actions
                              </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomType.roomNumbers.map((room, roomIndex) => (
                              <TableRow
                                key={roomIndex}
                                className={`hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-gray-50/50 transition-all duration-200 ${
                                  roomIndex % 2 === 0
                                    ? "bg-white"
                                    : "bg-slate-50/30"
                                }`}
                              >
                                <TableCell className="py-4">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ${
                                        room.status === "available"
                                          ? "bg-green-100 text-green-600"
                                          : room.status === "booked"
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-orange-100 text-orange-600"
                                      }`}
                                    >
                                      <Bed className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-800">
                                        Room {room.number}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {roomType.unitTypeCode}
                                      </p>
                                    </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(room.status)}
                                  <Badge
                                      variant={getStatusBadgeVariant(
                                        room.status
                                      )}
                                      className="font-medium"
                                  >
                                    {room.status}
                                  </Badge>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={room.status}
                                  onValueChange={(value) =>
                                    updateRoomStatus(
                                      roomType.unitTypeCode,
                                      room.number,
                                      value
                                    )
                                  }
                                >
                                    <SelectTrigger className="w-36 h-8 text-xs border-slate-200 hover:border-emerald-300 transition-colors">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                        <div className="flex items-center space-x-2">
                                          <CheckCircle className="h-3 w-3 text-green-600" />
                                          <span>Available</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="booked">
                                        <div className="flex items-center space-x-2">
                                          <Users className="h-3 w-3 text-blue-600" />
                                          <span>Booked</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                        <div className="flex items-center space-x-2">
                                          <Wrench className="h-3 w-3 text-orange-600" />
                                          <span>Maintenance</span>
                                        </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Building className="h-10 w-10 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <p className="text-slate-600 font-medium">
                            No individual room tracking
                          </p>
                          <p className="text-sm text-slate-500">
                          {roomType.count} rooms managed as a group
                        </p>
                          <div className="flex items-center justify-center space-x-1 mt-3">
                            <Sparkles className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm text-emerald-600 font-medium">
                              Bulk Management
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Enhanced Room Management Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="relative pb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-t-lg -m-6 mb-0"></div>
            <div className="relative flex items-center space-x-4">
              {selectedRoom && (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Key className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-800 mb-1">
                      {selectedRoom.unitTypeName}
                    </DialogTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Code: {selectedRoom.unitTypeCode}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4 text-slate-600" />
                        <span className="text-sm text-slate-600">
                          {selectedRoom.count} rooms
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-6">
              {/* Room Information Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-blue-800">
                      Room Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Hotel className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {selectedRoom.unitTypeName}
                        </p>
                        <p className="text-sm text-slate-600">Room Type Name</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Key className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="font-medium text-slate-800">
                          {selectedRoom.unitTypeCode}
                        </p>
                        <p className="text-sm text-slate-600">Room Type Code</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Home className="h-4 w-4 text-blue-600" />
              <div>
                        <p className="font-bold text-blue-900 text-xl">
                          {selectedRoom.count}
                </p>
                        <p className="text-sm text-slate-600">Total Rooms</p>
                      </div>
              </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                      <IndianRupee className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-emerald-800">
                      Current Pricing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <div className="flex-1 flex justify-between items-center">
              <div>
                          <p className="text-sm text-emerald-700">Per Night</p>
                        </div>
                        <p className="font-bold text-emerald-900">
                          {formatCurrency(selectedRoom.pricing.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <CalendarDays className="h-4 w-4 text-emerald-600" />
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-emerald-700">Per Week</p>
                        </div>
                        <p className="font-semibold text-emerald-800">
                    {formatCurrency(selectedRoom.pricing.pricePerWeek)}
                  </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/70 rounded-lg">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <div className="flex-1 flex justify-between items-center">
                        <div>
                          <p className="text-sm text-emerald-700">Per Month</p>
                        </div>
                        <p className="font-semibold text-emerald-800">
                    {formatCurrency(selectedRoom.pricing.pricePerMonth)}
                  </p>
                </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Availability Summary */}
              {selectedRoom.roomNumbers && (
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20 mr-3">
                      <BarChart3 className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-purple-800">
                      Availability Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white/70 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-xl font-bold text-green-700">
                            {
                              selectedRoom.roomNumbers.filter(
                                (r) => r.status === "available"
                              ).length
                            }
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">Available</p>
                      </div>
                      <div className="text-center p-4 bg-white/70 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="text-xl font-bold text-blue-700">
                            {
                              selectedRoom.roomNumbers.filter(
                                (r) => r.status === "booked"
                              ).length
                            }
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">Booked</p>
                      </div>
                      <div className="text-center p-4 bg-white/70 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <Wrench className="h-5 w-5 text-orange-600" />
                          <span className="text-xl font-bold text-orange-700">
                            {
                              selectedRoom.roomNumbers.filter(
                                (r) => r.status === "maintenance"
                              ).length
                            }
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">Maintenance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <Button
                  variant="outline"
                  className="border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 transition-all duration-200"
                >
                  <IndianRupee className="h-4 w-4 mr-2" />
                  Edit Pricing
                </Button>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                  <Settings className="h-4 w-4 mr-2" />
                  Room Settings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
