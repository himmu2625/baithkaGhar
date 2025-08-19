"use client"

import React from "react"
import { RequireOSAccess } from "@/components/os/auth/rbac-protected-route"
import { MainLayout } from "@/components/os/layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Bed,
  Wifi,
  Tv,
  Coffee,
  Snowflake,
  Droplets,
} from "lucide-react"

const mockRooms = [
  {
    id: 1,
    number: "101",
    type: "Deluxe Room",
    status: "occupied",
    guest: "John Doe",
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    rate: 2500,
    amenities: ["wifi", "tv", "ac", "coffee"],
  },
  {
    id: 2,
    number: "102",
    type: "Standard Room",
    status: "available",
    guest: null,
    checkIn: null,
    checkOut: null,
    rate: 1800,
    amenities: ["wifi", "tv", "ac"],
  },
  {
    id: 3,
    number: "103",
    type: "Suite",
    status: "maintenance",
    guest: null,
    checkIn: null,
    checkOut: null,
    rate: 3500,
    amenities: ["wifi", "tv", "ac", "coffee", "minibar"],
  },
  {
    id: 4,
    number: "201",
    type: "Deluxe Room",
    status: "reserved",
    guest: "Jane Smith",
    checkIn: "2024-01-16",
    checkOut: "2024-01-18",
    rate: 2500,
    amenities: ["wifi", "tv", "ac", "coffee"],
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "occupied":
      return "bg-red-100 text-red-800"
    case "available":
      return "bg-green-100 text-green-800"
    case "maintenance":
      return "bg-yellow-100 text-yellow-800"
    case "reserved":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case "wifi":
      return <Wifi className="h-4 w-4" />
    case "tv":
      return <Tv className="h-4 w-4" />
    case "ac":
      return <Snowflake className="h-4 w-4" />
    case "coffee":
      return <Coffee className="h-4 w-4" />
    case "minibar":
      return <Droplets className="h-4 w-4" />
    default:
      return null
  }
}

export default function RoomsPage() {
  return (
    <RequireOSAccess>
      <MainLayout
        title="Room Management"
        description="Manage all rooms in your property"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Room Management
              </h1>
              <p className="text-gray-600">Manage all rooms in your property</p>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Rooms
                </CardTitle>
                <Bed className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">All room types</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <div className="h-4 w-4 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">18</div>
                <p className="text-xs text-muted-foreground">
                  Ready for booking
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupied</CardTitle>
                <div className="h-4 w-4 rounded-full bg-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">
                  Currently occupied
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Maintenance
                </CardTitle>
                <div className="h-4 w-4 rounded-full bg-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Under maintenance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Rooms</CardTitle>
                  <CardDescription>Manage and view all rooms</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockRooms.map((room) => (
                  <Card
                    key={room.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Room {room.number}
                          </CardTitle>
                          <CardDescription>{room.type}</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(room.status)}>
                          {room.status.charAt(0).toUpperCase() +
                            room.status.slice(1)}
                        </Badge>
                        <span className="text-sm font-medium">
                          ₹{room.rate}/night
                        </span>
                      </div>

                      {room.guest && (
                        <div className="text-sm">
                          <p className="font-medium">Guest: {room.guest}</p>
                          <p className="text-muted-foreground">
                            {room.checkIn} - {room.checkOut}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Amenities:
                        </span>
                        <div className="flex items-center gap-1">
                          {room.amenities.map((amenity) => (
                            <div
                              key={amenity}
                              className="p-1 rounded bg-gray-100"
                            >
                              {getAmenityIcon(amenity)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RequireOSAccess>
  )
}
