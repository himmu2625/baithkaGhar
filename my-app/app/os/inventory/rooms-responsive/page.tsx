"use client"

import React, { useState } from "react"
import { ProtectedRoute } from "@/components/os/auth"
import { MainLayout } from "@/components/os/layout"
import { ResponsiveDataTable } from "@/components/os/common-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bed,
  Users,
  Wifi,
  Snowflake,
  Tv,
  Droplets,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
} from "lucide-react"

interface Room {
  id: string
  number: string
  type: string
  status: "available" | "occupied" | "maintenance" | "reserved"
  guest?: string
  checkIn?: string
  checkOut?: string
  amenities: string[]
  rate: number
  floor: number
  size: string
}

const mockRooms: Room[] = [
  {
    id: "1",
    number: "101",
    type: "Deluxe",
    status: "occupied",
    guest: "John Doe",
    checkIn: "2024-01-15",
    checkOut: "2024-01-17",
    amenities: ["wifi", "ac", "tv", "minibar"],
    rate: 2500,
    floor: 1,
    size: "250 sq ft",
  },
  {
    id: "2",
    number: "102",
    type: "Standard",
    status: "available",
    amenities: ["wifi", "ac"],
    rate: 1800,
    floor: 1,
    size: "200 sq ft",
  },
  {
    id: "3",
    number: "201",
    type: "Suite",
    status: "reserved",
    guest: "Jane Smith",
    checkIn: "2024-01-18",
    checkOut: "2024-01-20",
    amenities: ["wifi", "ac", "tv", "minibar", "balcony"],
    rate: 3500,
    floor: 2,
    size: "350 sq ft",
  },
  {
    id: "4",
    number: "202",
    type: "Deluxe",
    status: "maintenance",
    amenities: ["wifi", "ac", "tv"],
    rate: 2500,
    floor: 2,
    size: "250 sq ft",
  },
  {
    id: "5",
    number: "301",
    type: "Standard",
    status: "available",
    amenities: ["wifi", "ac"],
    rate: 1800,
    floor: 3,
    size: "200 sq ft",
  },
  {
    id: "6",
    number: "302",
    type: "Suite",
    status: "occupied",
    guest: "Mike Johnson",
    checkIn: "2024-01-16",
    checkOut: "2024-01-19",
    amenities: ["wifi", "ac", "tv", "minibar", "balcony"],
    rate: 3500,
    floor: 3,
    size: "350 sq ft",
  },
]

const getStatusBadge = (status: Room["status"]) => {
  const variants = {
    available: "bg-green-100 text-green-800",
    occupied: "bg-blue-100 text-blue-800",
    maintenance: "bg-yellow-100 text-yellow-800",
    reserved: "bg-purple-100 text-purple-800",
  }

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

const getAmenityIcon = (amenity: string) => {
  switch (amenity) {
    case "wifi":
      return <Wifi className="h-4 w-4" />
    case "ac":
      return <Snowflake className="h-4 w-4" />
    case "tv":
      return <Tv className="h-4 w-4" />
    case "minibar":
      return <Droplets className="h-4 w-4" />
    default:
      return null
  }
}

interface Column<T> {
  key: keyof T | string
  label: string
  mobilePriority?: boolean
  tabletPriority?: boolean
  desktopPriority?: boolean
  sortable?: boolean
  render?: (row: T) => React.ReactNode
}

const columns: Column<Room>[] = [
  {
    key: "number",
    label: "Room Number",
    mobilePriority: true,
    tabletPriority: true,
    desktopPriority: true,
    render: (room: Room) => (
      <div className="font-medium text-gray-900">{room.number}</div>
    ),
  },
  {
    key: "type",
    label: "Type",
    mobilePriority: true,
    tabletPriority: true,
    desktopPriority: true,
    sortable: true,
    render: (room: Room) => (
      <div className="text-sm text-gray-700">{room.type}</div>
    ),
  },
  {
    key: "status",
    label: "Status",
    mobilePriority: true,
    tabletPriority: true,
    desktopPriority: true,
    sortable: true,
    render: (room: Room) => getStatusBadge(room.status),
  },
  {
    key: "guest",
    label: "Guest",
    mobilePriority: false,
    tabletPriority: true,
    desktopPriority: true,
    render: (room: Room) => (
      <div className="text-sm text-gray-700">{room.guest || "-"}</div>
    ),
  },
  {
    key: "rate",
    label: "Rate",
    mobilePriority: false,
    tabletPriority: true,
    desktopPriority: true,
    sortable: true,
    render: (room: Room) => (
      <div className="text-sm font-medium text-gray-900">
        ₹{room.rate.toLocaleString()}
      </div>
    ),
  },
  {
    key: "amenities",
    label: "Amenities",
    mobilePriority: false,
    tabletPriority: false,
    desktopPriority: true,
    render: (room: Room) => (
      <div className="flex items-center gap-1">
        {room.amenities.slice(0, 3).map((amenity: string, index: number) => (
          <div key={index} className="text-gray-500">
            {getAmenityIcon(amenity)}
          </div>
        ))}
        {room.amenities.length > 3 && (
          <span className="text-xs text-gray-500">
            +{room.amenities.length - 3}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "floor",
    label: "Floor",
    mobilePriority: false,
    tabletPriority: false,
    desktopPriority: true,
    sortable: true,
    render: (room: Room) => (
      <div className="text-sm text-gray-700">{room.floor}</div>
    ),
  },
  {
    key: "size",
    label: "Size",
    mobilePriority: false,
    tabletPriority: false,
    desktopPriority: true,
    render: (room: Room) => (
      <div className="text-sm text-gray-700">{room.size}</div>
    ),
  },
]

export default function RoomsResponsivePage() {
  const [loading, setLoading] = useState(false)

  const handleRowClick = (room: Room) => {
    console.log("Room clicked:", room)
  }

  const handleAdd = () => {
    console.log("Add new room")
  }

  const handleExport = () => {
    console.log("Export rooms")
  }

  const handleImport = () => {
    console.log("Import rooms")
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="Rooms Management"
        description="Manage room inventory, status, and bookings"
      >
        <ResponsiveDataTable
          data={mockRooms}
          columns={columns}
          title="Rooms Inventory"
          description="Manage all rooms in your property"
          searchable={true}
          filterable={true}
          sortable={true}
          pagination={true}
          loading={loading}
          onRowClick={handleRowClick}
          onAdd={handleAdd}
          onExport={handleExport}
          onImport={handleImport}
          itemsPerPage={5}
          emptyMessage="No rooms found. Add your first room to get started."
        />
      </MainLayout>
    </ProtectedRoute>
  )
}
