"use client"

import React, { useState, useCallback, useRef } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { GlassCard, GlassCardHeader, GlassCardContent, GlassCardTitle } from "@/components/os/ui/glass-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bed,
  User,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Edit,
  Eye,
  Filter,
  Search,
  Calendar,
  Users,
  Wifi,
  Tv,
  Car,
  Coffee,
  Bath,
  Wind,
  Phone,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Room {
  id: string
  number: string
  type: string
  floor: number
  status: "available" | "occupied" | "cleaning" | "maintenance" | "blocked"
  guest?: {
    name: string
    checkIn: string
    checkOut: string
    adults: number
    children: number
  }
  housekeeping?: {
    lastCleaned: string
    cleanedBy: string
    notes: string
  }
  amenities: string[]
  price: number
  lastUpdated: string
}

interface RoomColumn {
  id: string
  title: string
  status: Room["status"]
  color: string
  rooms: Room[]
}

const ROOM_STATUSES = {
  available: { color: "bg-green-500", label: "Available", icon: CheckCircle2 },
  occupied: { color: "bg-blue-500", label: "Occupied", icon: User },
  cleaning: { color: "bg-yellow-500", label: "Cleaning", icon: Clock },
  maintenance: { color: "bg-red-500", label: "Maintenance", icon: Wrench },
  blocked: { color: "bg-gray-500", label: "Blocked", icon: XCircle },
}

const AMENITY_ICONS: { [key: string]: React.ReactNode } = {
  "WiFi": <Wifi className="h-3 w-3" />,
  "TV": <Tv className="h-3 w-3" />,
  "AC": <Wind className="h-3 w-3" />,
  "Parking": <Car className="h-3 w-3" />,
  "Coffee": <Coffee className="h-3 w-3" />,
  "Bathroom": <Bath className="h-3 w-3" />,
  "Phone": <Phone className="h-3 w-3" />,
  "Safe": <Shield className="h-3 w-3" />,
}

const sampleRooms: Room[] = [
  {
    id: "1",
    number: "101",
    type: "Deluxe",
    floor: 1,
    status: "available",
    amenities: ["WiFi", "TV", "AC", "Coffee"],
    price: 2500,
    lastUpdated: "2024-01-15T10:30:00Z",
    housekeeping: {
      lastCleaned: "2024-01-15T09:00:00Z",
      cleanedBy: "Priya Sharma",
      notes: "Deep cleaned, ready for guests"
    }
  },
  {
    id: "2",
    number: "102",
    type: "Standard",
    floor: 1,
    status: "occupied",
    guest: {
      name: "Rajesh Kumar",
      checkIn: "2024-01-14",
      checkOut: "2024-01-16",
      adults: 2,
      children: 0
    },
    amenities: ["WiFi", "TV", "AC"],
    price: 2000,
    lastUpdated: "2024-01-14T15:00:00Z"
  },
  {
    id: "3",
    number: "103",
    type: "Suite",
    floor: 1,
    status: "cleaning",
    amenities: ["WiFi", "TV", "AC", "Coffee", "Bathroom", "Safe"],
    price: 4000,
    lastUpdated: "2024-01-15T11:15:00Z",
    housekeeping: {
      lastCleaned: "2024-01-15T11:15:00Z",
      cleanedBy: "Amit Singh",
      notes: "In progress - checkout cleaning"
    }
  },
  {
    id: "4",
    number: "201",
    type: "Deluxe",
    floor: 2,
    status: "maintenance",
    amenities: ["WiFi", "TV", "AC", "Coffee"],
    price: 2500,
    lastUpdated: "2024-01-13T14:20:00Z"
  },
  {
    id: "5",
    number: "202",
    type: "Standard",
    floor: 2,
    status: "blocked",
    amenities: ["WiFi", "TV", "AC"],
    price: 2000,
    lastUpdated: "2024-01-12T16:45:00Z"
  },
]

export function AdvancedRoomManager() {
  const [columns, setColumns] = useState<RoomColumn[]>(() => {
    const columnData: RoomColumn[] = [
      { id: "available", title: "Available", status: "available", color: "bg-green-100", rooms: [] },
      { id: "occupied", title: "Occupied", status: "occupied", color: "bg-blue-100", rooms: [] },
      { id: "cleaning", title: "Cleaning", status: "cleaning", color: "bg-yellow-100", rooms: [] },
      { id: "maintenance", title: "Maintenance", status: "maintenance", color: "bg-red-100", rooms: [] },
      { id: "blocked", title: "Blocked", status: "blocked", color: "bg-gray-100", rooms: [] },
    ]

    // Distribute rooms into columns
    sampleRooms.forEach(room => {
      const column = columnData.find(col => col.status === room.status)
      if (column) {
        column.rooms.push(room)
      }
    })

    return columnData
  })

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterFloor, setFilterFloor] = useState("all")
  const [filterType, setFilterType] = useState("all")

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result

    // If dropped outside of droppable area
    if (!destination) return

    // If dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)
    
    if (!sourceColumn || !destColumn) return

    const draggedRoom = sourceColumn.rooms.find(room => room.id === draggableId)
    if (!draggedRoom) return

    setColumns(prevColumns => {
      const newColumns = prevColumns.map(column => {
        if (column.id === source.droppableId) {
          return {
            ...column,
            rooms: column.rooms.filter(room => room.id !== draggableId)
          }
        }
        if (column.id === destination.droppableId) {
          const newRooms = [...column.rooms]
          const updatedRoom = { ...draggedRoom, status: column.status as Room["status"] }
          newRooms.splice(destination.index, 0, updatedRoom)
          return {
            ...column,
            rooms: newRooms
          }
        }
        return column
      })
      
      return newColumns
    })
  }, [columns])

  const filteredColumns = columns.map(column => ({
    ...column,
    rooms: column.rooms.filter(room => {
      const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          room.guest?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFloor = filterFloor === "all" || room.floor.toString() === filterFloor
      const matchesType = filterType === "all" || room.type.toLowerCase() === filterType.toLowerCase()
      
      return matchesSearch && matchesFloor && matchesType
    })
  }))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getRoomTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "suite": return "bg-purple-100 text-purple-800 border-purple-200"
      case "deluxe": return "bg-blue-100 text-blue-800 border-blue-200"
      case "standard": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Room Management</h2>
          <p className="text-white/70">Drag and drop to update room status</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
          
          <Select value={filterFloor} onValueChange={setFilterFloor}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              <SelectItem value="1">Floor 1</SelectItem>
              <SelectItem value="2">Floor 2</SelectItem>
              <SelectItem value="3">Floor 3</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="deluxe">Deluxe</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
            </SelectContent>
          </Select>

          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Room
          </Button>
        </div>
      </div>

      {/* Room Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Object.entries(ROOM_STATUSES).map(([status, config]) => {
          const count = columns.find(col => col.status === status)?.rooms.length || 0
          const Icon = config.icon
          
          return (
            <GlassCard key={status} variant="subtle" className="text-center">
              <GlassCardContent>
                <div className="flex items-center justify-center space-x-3 py-4">
                  <div className={cn("p-2 rounded-lg", config.color, "bg-opacity-20")}>
                    <Icon className={cn("h-5 w-5", config.color.replace("bg-", "text-"))} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-sm text-white/70">{config.label}</div>
                  </div>
                </div>
              </GlassCardContent>
            </GlassCard>
          )
        })}
      </div>

      {/* Drag and Drop Board */}
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
                        {column.rooms.length}
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
                        {column.rooms.map((room, index) => (
                          <Draggable key={room.id} draggableId={room.id} index={index}>
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
                                {/* Room Header */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-lg font-bold text-white">
                                      {room.number}
                                    </div>
                                    <Badge className={getRoomTypeColor(room.type)}>
                                      {room.type}
                                    </Badge>
                                  </div>
                                  <div className="text-sm font-semibold text-green-400">
                                    {formatCurrency(room.price)}
                                  </div>
                                </div>

                                {/* Guest Info */}
                                {room.guest && (
                                  <div className="bg-blue-500/20 rounded-lg p-3 mb-3">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <User className="h-4 w-4 text-blue-400" />
                                      <div className="font-medium text-white">{room.guest.name}</div>
                                    </div>
                                    <div className="text-xs text-blue-200 space-y-1">
                                      <div className="flex justify-between">
                                        <span>Check-in:</span>
                                        <span>{formatDate(room.guest.checkIn)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Check-out:</span>
                                        <span>{formatDate(room.guest.checkOut)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Guests:</span>
                                        <span>{room.guest.adults}A, {room.guest.children}C</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Housekeeping Info */}
                                {room.housekeeping && (
                                  <div className="bg-green-500/20 rounded-lg p-3 mb-3">
                                    <div className="text-xs text-green-200 space-y-1">
                                      <div className="font-medium">Last cleaned by {room.housekeeping.cleanedBy}</div>
                                      <div>{formatTime(room.housekeeping.lastCleaned)}</div>
                                      {room.housekeeping.notes && (
                                        <div className="italic">{room.housekeeping.notes}</div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Amenities */}
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {room.amenities.slice(0, 4).map((amenity) => (
                                    <div
                                      key={amenity}
                                      className="flex items-center space-x-1 bg-white/10 rounded px-2 py-1 text-xs text-white/80"
                                      title={amenity}
                                    >
                                      {AMENITY_ICONS[amenity]}
                                      <span>{amenity}</span>
                                    </div>
                                  ))}
                                  {room.amenities.length > 4 && (
                                    <div className="bg-white/10 rounded px-2 py-1 text-xs text-white/80">
                                      +{room.amenities.length - 4}
                                    </div>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex space-x-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                                        onClick={() => setSelectedRoom(room)}
                                      >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
                                      <DialogHeader>
                                        <DialogTitle className="text-white">
                                          Room {room.number} Details
                                        </DialogTitle>
                                      </DialogHeader>
                                      {selectedRoom && (
                                        <div className="space-y-4 text-white">
                                          <div className="grid grid-cols-2 gap-4">
                                            <div>
                                              <label className="text-sm font-medium text-gray-300">Room Number</label>
                                              <Input value={selectedRoom.number} className="bg-slate-800 border-slate-600" readOnly />
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-300">Room Type</label>
                                              <Input value={selectedRoom.type} className="bg-slate-800 border-slate-600" readOnly />
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-300">Floor</label>
                                              <Input value={selectedRoom.floor.toString()} className="bg-slate-800 border-slate-600" readOnly />
                                            </div>
                                            <div>
                                              <label className="text-sm font-medium text-gray-300">Price</label>
                                              <Input value={formatCurrency(selectedRoom.price)} className="bg-slate-800 border-slate-600" readOnly />
                                            </div>
                                          </div>
                                          
                                          {selectedRoom.guest && (
                                            <div>
                                              <label className="text-sm font-medium text-gray-300">Current Guest</label>
                                              <div className="bg-slate-800 p-3 rounded border border-slate-600 mt-1">
                                                <div className="font-medium">{selectedRoom.guest.name}</div>
                                                <div className="text-sm text-gray-400">
                                                  {formatDate(selectedRoom.guest.checkIn)} - {formatDate(selectedRoom.guest.checkOut)}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                  {selectedRoom.guest.adults} Adults, {selectedRoom.guest.children} Children
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          <div>
                                            <label className="text-sm font-medium text-gray-300">Amenities</label>
                                            <div className="flex flex-wrap gap-2 mt-1">
                                              {selectedRoom.amenities.map((amenity) => (
                                                <Badge key={amenity} variant="outline" className="border-slate-600">
                                                  {amenity}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
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
                        ))}
                        {provided.placeholder}
                      </div>
                      
                      {column.rooms.length === 0 && (
                        <div className="text-center py-8 text-white/50">
                          <Bed className="h-8 w-8 mx-auto mb-2" />
                          <p>No rooms in {column.title.toLowerCase()}</p>
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