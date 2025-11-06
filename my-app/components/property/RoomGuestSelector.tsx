"use client"

import React, { useState, useEffect } from "react"
import { Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RoomConfig {
  id: string
  adults: number
  children: number
}

interface RoomGuestSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRooms?: number
  initialGuests?: number
  maxGuestsPerRoom?: number
  onConfirm: (rooms: RoomConfig[], totalGuests: number) => void
}

export function RoomGuestSelector({
  open,
  onOpenChange,
  initialRooms = 1,
  initialGuests = 1,
  maxGuestsPerRoom = 3,
  onConfirm
}: RoomGuestSelectorProps) {
  const [rooms, setRooms] = useState<RoomConfig[]>([
    { id: '1', adults: initialGuests, children: 0 }
  ])

  // Initialize rooms based on initial values
  useEffect(() => {
    if (open && initialRooms > 0) {
      const newRooms: RoomConfig[] = []
      const guestsPerRoom = Math.floor(initialGuests / initialRooms)
      const remainingGuests = initialGuests % initialRooms

      for (let i = 0; i < initialRooms; i++) {
        newRooms.push({
          id: `${i + 1}`,
          adults: i === 0 ? guestsPerRoom + remainingGuests : guestsPerRoom,
          children: 0
        })
      }
      setRooms(newRooms)
    }
  }, [open, initialRooms, initialGuests])

  const updateRoomGuests = (roomId: string, type: 'adults' | 'children', increment: boolean) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id !== roomId) return room

        const newValue = increment
          ? room[type] + 1
          : Math.max(type === 'adults' ? 1 : 0, room[type] - 1)

        return { ...room, [type]: newValue }
      })
    )
  }

  const addRoom = () => {
    const newRoomId = `${rooms.length + 1}`
    setRooms([...rooms, { id: newRoomId, adults: 1, children: 0 }])
  }

  const deleteRoom = (roomId: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(room => room.id !== roomId))
    }
  }

  const getTotalGuests = () => {
    return rooms.reduce((sum, room) => sum + room.adults + room.children, 0)
  }

  const handleDone = () => {
    onConfirm(rooms, getTotalGuests())
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Select Rooms and Guests</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Room and Guest Headers */}
          <div className="grid grid-cols-2 gap-4 mb-4 pb-3 border-b">
            <div className="text-center font-semibold text-gray-900">Rooms</div>
            <div className="text-center font-semibold text-gray-900">Guests</div>
          </div>

          {/* Room Rows */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {rooms.map((room, index) => (
              <div key={room.id} className="space-y-3">
                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* Room Number */}
                  <div className="text-center">
                    <span className="font-medium text-gray-900">Room {index + 1}</span>
                  </div>

                  {/* Total Guests in Room */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (room.adults > 1) {
                            updateRoomGuests(room.id, 'adults', false)
                          } else if (room.children > 0) {
                            updateRoomGuests(room.id, 'children', false)
                          }
                        }}
                        disabled={room.adults === 1 && room.children === 0}
                        className="h-8 w-8 p-0 rounded-md border-2"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-gray-900">
                        {room.adults + room.children}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateRoomGuests(room.id, 'adults', true)}
                        className="h-8 w-8 p-0 rounded-md border-2"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Adults and Children breakdown */}
                <div className="pl-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Adults</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomGuests(room.id, 'adults', false)}
                        disabled={room.adults <= 1}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-gray-900">{room.adults}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomGuests(room.id, 'adults', true)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Children</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomGuests(room.id, 'children', false)}
                        disabled={room.children <= 0}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-gray-900">{room.children}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomGuests(room.id, 'children', true)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {index < rooms.length - 1 && <div className="border-b pt-2"></div>}
              </div>
            ))}
          </div>

          {/* Add/Delete Room Actions */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => deleteRoom(rooms[rooms.length - 1].id)}
              disabled={rooms.length <= 1}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete Room
            </Button>
            <Button
              variant="ghost"
              onClick={addRoom}
              disabled={rooms.length >= 5}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Add Room
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDone}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
