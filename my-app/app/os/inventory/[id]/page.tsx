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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Room & Inventory Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage room availability, pricing, and maintenance
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Room Type
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRooms}</div>
              <p className="text-xs text-muted-foreground">
                Across all room types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.availableRooms}
              </div>
              <p className="text-xs text-muted-foreground">Ready for booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Occupancy Rate
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.bookedRooms} rooms occupied
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.maintenanceRooms}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Room Management with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={["room-types", "room-status"]}
        className="w-full"
      >
        {/* Room Types Overview */}
        <AccordionItem value="room-types">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <BedIcon className="h-5 w-5 mr-2" />
              Room Types & Pricing
              <Badge variant="secondary" className="ml-2">
                {rooms.length} types
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room, index) => (
                <Card
                  key={index}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {room.unitTypeName}
                      <Badge variant="outline">{room.unitTypeCode}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Total Rooms</p>
                        <p className="text-2xl font-bold">{room.count}</p>
                      </div>

                      <Separator />

                      <div>
                        <p className="text-sm text-gray-600">Pricing</p>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {formatCurrency(room.pricing.price)}/night
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(room.pricing.pricePerWeek)}/week
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(room.pricing.pricePerMonth)}/month
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRoom(room)
                            setIsRoomDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <div className="text-sm text-gray-600">
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
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Individual Room Status */}
        <AccordionItem value="room-status">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Individual Room Status
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6">
              {rooms.map((roomType, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{roomType.unitTypeName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {roomType.roomNumbers && roomType.roomNumbers.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room Number</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roomType.roomNumbers.map((room, roomIndex) => (
                            <TableRow key={roomIndex}>
                              <TableCell>
                                <div className="flex items-center">
                                  <BedIcon className="h-4 w-4 mr-2" />
                                  {room.number}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(room.status)}
                                  <Badge
                                    variant={getStatusBadgeVariant(room.status)}
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
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      Available
                                    </SelectItem>
                                    <SelectItem value="booked">
                                      Booked
                                    </SelectItem>
                                    <SelectItem value="maintenance">
                                      Maintenance
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <BedIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No individual room tracking for this type</p>
                        <p className="text-sm">
                          {roomType.count} rooms managed as a group
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Room Management Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Room Type</DialogTitle>
          </DialogHeader>
          {selectedRoom && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedRoom.unitTypeName}</h4>
                <p className="text-sm text-gray-600">
                  Code: {selectedRoom.unitTypeCode}
                </p>
              </div>

              <Separator />

              <div>
                <h5 className="font-medium">Current Pricing</h5>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    Per Night: {formatCurrency(selectedRoom.pricing.price)}
                  </p>
                  <p className="text-sm">
                    Per Week:{" "}
                    {formatCurrency(selectedRoom.pricing.pricePerWeek)}
                  </p>
                  <p className="text-sm">
                    Per Month:{" "}
                    {formatCurrency(selectedRoom.pricing.pricePerMonth)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  Edit Pricing
                </Button>
                <Button className="flex-1">Room Settings</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
