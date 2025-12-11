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

interface ChildAge {
  id: string
  age: number
}

interface RoomConfig {
  id: string
  adults: number
  children: ChildAge[]
}

interface RoomGuestSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRooms?: number
  initialGuests?: number
  initialRoomConfigs?: RoomConfig[]
  maxGuestsPerRoom?: number
  onConfirm: (rooms: RoomConfig[], totalGuests: number, effectiveAdults: number, actualChildren: number) => void
}

export function RoomGuestSelector({
  open,
  onOpenChange,
  initialRooms = 1,
  initialGuests = 1,
  initialRoomConfigs,
  maxGuestsPerRoom = 3,
  onConfirm
}: RoomGuestSelectorProps) {
  const [rooms, setRooms] = useState<RoomConfig[]>([
    { id: '1', adults: initialGuests, children: [] }
  ])

  // Initialize rooms based on initial values or saved configurations
  useEffect(() => {
    if (open) {
      // If we have saved room configurations, use those
      if (initialRoomConfigs && initialRoomConfigs.length > 0) {
        setRooms(initialRoomConfigs)
      } else if (initialRooms > 0) {
        // Otherwise, create default room configurations
        const newRooms: RoomConfig[] = []
        const guestsPerRoom = Math.floor(initialGuests / initialRooms)
        const remainingGuests = initialGuests % initialRooms

        for (let i = 0; i < initialRooms; i++) {
          newRooms.push({
            id: `${i + 1}`,
            adults: i === 0 ? guestsPerRoom + remainingGuests : guestsPerRoom,
            children: []
          })
        }
        setRooms(newRooms)
      }
    }
  }, [open, initialRooms, initialGuests, initialRoomConfigs])

  // Helper function to count children older than 5 as adults
  const getEffectiveAdultCount = (room: RoomConfig) => {
    const childrenAsAdults = room.children.filter(child => child.age > 5).length
    return room.adults + childrenAsAdults
  }

  // Helper function to get total occupancy
  const getTotalOccupancy = (room: RoomConfig) => {
    return room.adults + room.children.length
  }

  const updateRoomAdults = (roomId: string, increment: boolean) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id !== roomId) return room

        if (increment) {
          // Check if adding an adult would exceed max capacity
          const newAdultCount = room.adults + 1
          const wouldExceedLimit = getEffectiveAdultCount({ ...room, adults: newAdultCount }) > maxGuestsPerRoom

          if (wouldExceedLimit) {
            return room // Don't allow increment
          }
          return { ...room, adults: newAdultCount }
        } else {
          // Decrement (minimum 1 adult)
          return { ...room, adults: Math.max(1, room.adults - 1) }
        }
      })
    )
  }

  const addChild = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id !== roomId) return room

        // Check if adding a child would exceed max capacity
        // We assume new child is >5 (worst case) for validation
        const newChildren = [...room.children, { id: `${Date.now()}`, age: 6 }]
        const wouldExceedLimit = getEffectiveAdultCount({ ...room, children: newChildren }) > maxGuestsPerRoom

        if (wouldExceedLimit) {
          return room // Don't allow adding child
        }

        return { ...room, children: newChildren }
      })
    )
  }

  const removeChild = (roomId: string) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id !== roomId) return room
        if (room.children.length === 0) return room

        const newChildren = room.children.slice(0, -1)
        return { ...room, children: newChildren }
      })
    )
  }

  const updateChildAge = (roomId: string, childId: string, age: number) => {
    setRooms(prevRooms =>
      prevRooms.map(room => {
        if (room.id !== roomId) return room

        const updatedChildren = room.children.map(child =>
          child.id === childId ? { ...child, age } : child
        )

        // Check if this age change would exceed the max capacity
        const effectiveAdults = room.adults + updatedChildren.filter(c => c.age > 5).length
        if (effectiveAdults > maxGuestsPerRoom) {
          return room // Don't allow this age change
        }

        return { ...room, children: updatedChildren }
      })
    )
  }

  const addRoom = () => {
    const newRoomId = `${rooms.length + 1}`
    setRooms([...rooms, { id: newRoomId, adults: 1, children: [] }])
  }

  const deleteRoom = (roomId: string) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter(room => room.id !== roomId))
    }
  }

  const getTotalGuests = () => {
    return rooms.reduce((sum, room) => sum + room.adults + room.children.length, 0)
  }

  const getEffectiveAdultsTotal = () => {
    return rooms.reduce((sum, room) => {
      const childrenAsAdults = room.children.filter(child => child.age > 5).length
      return sum + room.adults + childrenAsAdults
    }, 0)
  }

  const getActualChildrenTotal = () => {
    return rooms.reduce((sum, room) => {
      const childrenUnder5 = room.children.filter(child => child.age <= 5).length
      return sum + childrenUnder5
    }, 0)
  }

  const handleDone = () => {
    // Check if any room exceeds capacity
    const hasExceededCapacity = rooms.some(room => getEffectiveAdultCount(room) > maxGuestsPerRoom)

    if (hasExceededCapacity) {
      // Don't allow confirmation if capacity is exceeded
      return
    }

    const totalGuests = getTotalGuests()
    const effectiveAdults = getEffectiveAdultsTotal()
    const actualChildren = getActualChildrenTotal()

    onConfirm(rooms, totalGuests, effectiveAdults, actualChildren)
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
          {/* Info Message */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Maximum {maxGuestsPerRoom} persons per room. Children over 5 years count as adults for capacity.
            </p>
          </div>

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
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-xs text-gray-500">
                        Total: {getTotalOccupancy(room)} / Max: {maxGuestsPerRoom}
                      </div>
                      <div className="text-[10px] text-orange-600">
                        {getEffectiveAdultCount(room) > maxGuestsPerRoom && '⚠️ Exceeds capacity!'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Adults and Children breakdown */}
                <div className="pl-4 space-y-3 text-sm">
                  {/* Adults Section */}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Adults</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomAdults(room.id, false)}
                        disabled={room.adults <= 1}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-gray-900">{room.adults}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateRoomAdults(room.id, true)}
                        disabled={getEffectiveAdultCount({ ...room, adults: room.adults + 1 }) > maxGuestsPerRoom}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Children Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Children (0-12 yrs)</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(room.id)}
                          disabled={room.children.length === 0}
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-gray-900">{room.children.length}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addChild(room.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Child Age Inputs */}
                    {room.children.length > 0 && (
                      <div className="pl-2 space-y-1.5 border-l-2 border-gray-200">
                        <div className="text-[10px] text-gray-500 mb-1">
                          Children over 5 years count as adults for capacity
                        </div>
                        {room.children.map((child, childIndex) => (
                          <div key={child.id} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-16">Child {childIndex + 1}:</span>
                            <select
                              value={child.age}
                              onChange={(e) => updateChildAge(room.id, child.id, parseInt(e.target.value))}
                              className="text-xs border rounded px-2 py-1 flex-1"
                            >
                              {[...Array(13)].map((_, i) => (
                                <option key={i} value={i}>
                                  {i} {i === 1 ? 'year' : 'years'} {i > 5 ? '(counts as adult)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
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

        <DialogFooter className="flex flex-col gap-2 border-t pt-4">
          {rooms.some(room => getEffectiveAdultCount(room) > maxGuestsPerRoom) && (
            <div className="text-xs text-red-600 text-center mb-2">
              ⚠️ One or more rooms exceed maximum capacity. Please adjust guest counts.
            </div>
          )}
          <div className="flex flex-row justify-between gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDone}
              disabled={rooms.some(room => getEffectiveAdultCount(room) > maxGuestsPerRoom)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
