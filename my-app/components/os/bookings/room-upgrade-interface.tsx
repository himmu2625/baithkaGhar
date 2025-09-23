"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import {
  TrendingUp,
  Star,
  Crown,
  Gem,
  Gift,
  ArrowUp,
  ArrowRight,
  IndianRupee,
  Users,
  Bed,
  Wifi,
  Car,
  Coffee,
  Tv,
  Wind,
  Bath,
  CheckCircle2,
  Clock,
  Calculator,
  Eye,
  Edit,
  Save,
  X,
  AlertTriangle,
  Sparkles,
  Trophy,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"

interface RoomType {
  _id: string
  name: string
  category: 'standard' | 'deluxe' | 'premium' | 'suite' | 'presidential'
  basePrice: number
  maxOccupancy: number
  size: number
  amenities: string[]
  features: string[]
  description: string
  images: string[]
  upgradePrice?: number
  tier: number
}

interface Booking {
  _id: string
  guestName: string
  guestEmail: string
  checkInDate: string
  checkOutDate: string
  adults: number
  children: number
  roomType: RoomType
  currentRoom?: {
    _id: string
    roomNumber: string
    roomType: RoomType
  }
  totalAmount: number
  status: string
  paymentStatus: string
  specialRequests: string
  nights: number
}

interface UpgradeOption {
  fromRoomType: RoomType
  toRoomType: RoomType
  upgradeFee: number
  upgradePercentage: number
  benefits: string[]
  available: boolean
}

export function RoomUpgradeInterface({ propertyId }: { propertyId: string }) {
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [eligibleBookings, setEligibleBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([])
  const [selectedUpgrade, setSelectedUpgrade] = useState<UpgradeOption | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState("")
  const [customPrice, setCustomPrice] = useState<number | null>(null)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  // Fetch room types and eligible bookings
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch room types
        const roomTypesResponse = await fetch(`/api/inventory/room-types?propertyId=${propertyId}`)
        if (roomTypesResponse.ok) {
          const roomTypesData = await roomTypesResponse.json()
          if (roomTypesData.success) {
            const sortedRoomTypes = (roomTypesData.roomTypes || []).sort((a: RoomType, b: RoomType) => a.tier - b.tier)
            setRoomTypes(sortedRoomTypes)
          }
        }

        // Fetch bookings eligible for upgrade (confirmed and upcoming)
        const bookingsResponse = await fetch(
          `/api/os/bookings/${propertyId}?status=confirmed&checkInDate=${new Date().toISOString()}`
        )
        if (bookingsResponse.ok) {
          const bookingsData = await bookingsResponse.json()
          if (bookingsData.success) {
            setEligibleBookings(bookingsData.bookings || [])
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Data Loading Failed",
          description: "Failed to load room types and bookings",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchData()
    }
  }, [propertyId])

  // Generate upgrade options when booking is selected
  useEffect(() => {
    if (selectedBooking && roomTypes.length > 0) {
      const currentRoomType = selectedBooking.roomType
      const availableUpgrades = roomTypes
        .filter(roomType => roomType.tier > currentRoomType.tier)
        .map(roomType => {
          const basePriceDiff = roomType.basePrice - currentRoomType.basePrice
          const upgradeFee = basePriceDiff * selectedBooking.nights
          const upgradePercentage = ((roomType.basePrice - currentRoomType.basePrice) / currentRoomType.basePrice) * 100

          const benefits = [
            ...(roomType.size > currentRoomType.size ? [`Larger room (${roomType.size} sqft)`] : []),
            ...roomType.amenities.filter(amenity => !currentRoomType.amenities.includes(amenity)),
            ...roomType.features.filter(feature => !currentRoomType.features.includes(feature))
          ]

          return {
            fromRoomType: currentRoomType,
            toRoomType: roomType,
            upgradeFee,
            upgradePercentage,
            benefits,
            available: true // You could check actual room availability here
          }
        })

      setUpgradeOptions(availableUpgrades)
    }
  }, [selectedBooking, roomTypes])

  const handleUpgradeBooking = async () => {
    if (!selectedBooking || !selectedUpgrade) return

    setProcessing(true)
    try {
      const upgradeData = {
        bookingId: selectedBooking._id,
        newRoomTypeId: selectedUpgrade.toRoomType._id,
        upgradeFee: customPrice || selectedUpgrade.upgradeFee,
        upgradeReason,
        originalAmount: selectedBooking.totalAmount,
        newAmount: selectedBooking.totalAmount + (customPrice || selectedUpgrade.upgradeFee)
      }

      const response = await fetch(`/api/os/bookings/${propertyId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upgradeData)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Room Upgrade Successful",
          description: `${selectedBooking.guestName} upgraded to ${selectedUpgrade.toRoomType.name}`,
        })

        // Refresh data
        setEligibleBookings(prev => prev.map(booking =>
          booking._id === selectedBooking._id
            ? { ...booking, roomType: selectedUpgrade.toRoomType, totalAmount: upgradeData.newAmount }
            : booking
        ))

        setShowUpgradeDialog(false)
        setSelectedBooking(null)
        setSelectedUpgrade(null)
        setUpgradeReason("")
        setCustomPrice(null)
      } else {
        throw new Error(result.error || 'Failed to upgrade room')
      }
    } catch (error) {
      console.error("Room upgrade error:", error)
      toast({
        title: "Upgrade Failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
    }
  }

  const getRoomTypeTierIcon = (category: string) => {
    switch (category) {
      case 'standard': return <Bed className="h-4 w-4 text-gray-600" />
      case 'deluxe': return <Star className="h-4 w-4 text-blue-600" />
      case 'premium': return <Crown className="h-4 w-4 text-purple-600" />
      case 'suite': return <Gem className="h-4 w-4 text-pink-600" />
      case 'presidential': return <Trophy className="h-4 w-4 text-yellow-600" />
      default: return <Bed className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoomTypeTierColor = (category: string) => {
    switch (category) {
      case 'standard': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'deluxe': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'suite': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'presidential': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <Wifi className="h-3 w-3" />
      case 'tv': return <Tv className="h-3 w-3" />
      case 'ac': case 'air conditioning': return <Wind className="h-3 w-3" />
      case 'parking': return <Car className="h-3 w-3" />
      case 'coffee': return <Coffee className="h-3 w-3" />
      case 'bathtub': return <Bath className="h-3 w-3" />
      default: return <Sparkles className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Room Upgrade Interface...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-900 flex items-center space-x-2">
            <TrendingUp className="h-6 w-6" />
            <span>Room Upgrade Management</span>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Manage room type upgrades and upselling opportunities
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eligible Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Upgrade Opportunities</span>
              <Badge variant="secondary">{eligibleBookings.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-96 overflow-y-auto">
            {eligibleBookings.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">No upgrade opportunities available</p>
              </div>
            ) : (
              eligibleBookings.map(booking => (
                <Card
                  key={booking._id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedBooking?._id === booking._id ? "ring-2 ring-purple-500 bg-purple-50" : ""
                  )}
                  onClick={() => setSelectedBooking(booking)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{booking.guestName}</div>
                        <Badge className={getRoomTypeTierColor(booking.roomType.category)}>
                          {getRoomTypeTierIcon(booking.roomType.category)}
                          <span className="ml-1">{booking.roomType.category}</span>
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Current Room:</span>
                          <span className="font-medium">{booking.roomType.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Check-in:</span>
                          <span>{new Date(booking.checkInDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Nights:</span>
                          <span>{booking.nights}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Current Total:</span>
                          <span className="font-semibold text-green-600">₹{booking.totalAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                          <div className="text-xs text-yellow-800">
                            <span className="font-medium">Special Request:</span> {booking.specialRequests}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ArrowUp className="h-5 w-5" />
              <span>Available Upgrades</span>
              {selectedBooking && (
                <Badge className="bg-green-100 text-green-800">
                  {upgradeOptions.length} Options
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedBooking ? (
              <div className="text-center py-8">
                <Gift className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Select a booking to view upgrade options</p>
              </div>
            ) : upgradeOptions.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                <p className="text-gray-600">No upgrades available for this room type</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {upgradeOptions.map((option, index) => (
                  <Card
                    key={index}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedUpgrade === option ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    )}
                    onClick={() => setSelectedUpgrade(option)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge className={getRoomTypeTierColor(option.toRoomType.category)}>
                              {getRoomTypeTierIcon(option.toRoomType.category)}
                              <span className="ml-1">{option.toRoomType.name}</span>
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              +₹{option.upgradeFee.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {option.upgradePercentage.toFixed(0)}% increase
                            </div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-3 w-3" />
                            <span>Max {option.toRoomType.maxOccupancy} guests</span>
                            <span>•</span>
                            <span>{option.toRoomType.size} sqft</span>
                          </div>
                          <p className="text-xs">{option.toRoomType.description}</p>
                        </div>

                        {option.benefits.length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Upgrade Benefits:</div>
                            <div className="flex flex-wrap gap-1">
                              {option.benefits.slice(0, 3).map((benefit, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {benefit}
                                </Badge>
                              ))}
                              {option.benefits.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{option.benefits.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1">
                          {option.toRoomType.amenities.slice(0, 4).map(amenity => (
                            <div
                              key={amenity}
                              className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1 text-xs"
                            >
                              {getAmenityIcon(amenity)}
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade Action */}
      {selectedBooking && selectedUpgrade && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <Badge className={getRoomTypeTierColor(selectedUpgrade.fromRoomType.category)}>
                    {selectedUpgrade.fromRoomType.name}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    ₹{selectedUpgrade.fromRoomType.basePrice}/night
                  </div>
                </div>

                <ArrowRight className="h-6 w-6 text-green-600" />

                <div className="text-center">
                  <Badge className={getRoomTypeTierColor(selectedUpgrade.toRoomType.category)}>
                    {selectedUpgrade.toRoomType.name}
                  </Badge>
                  <div className="text-sm text-gray-600 mt-1">
                    ₹{selectedUpgrade.toRoomType.basePrice}/night
                  </div>
                </div>

                <div className="text-center">
                  <div className="font-bold text-green-600 text-lg">
                    +₹{selectedUpgrade.upgradeFee.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total upgrade fee
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowUpgradeDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Process Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Room Upgrade</DialogTitle>
            <DialogDescription>
              Upgrade {selectedBooking?.guestName} to {selectedUpgrade?.toRoomType.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Original Amount:</span>
                  <span>₹{selectedBooking?.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upgrade Fee:</span>
                  <span>₹{selectedUpgrade?.upgradeFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2">
                  <span>New Total:</span>
                  <span>₹{(selectedBooking?.totalAmount + (selectedUpgrade?.upgradeFee || 0)).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="customPrice">Custom Upgrade Price (Optional)</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="customPrice"
                  type="number"
                  placeholder={selectedUpgrade?.upgradeFee.toString()}
                  value={customPrice || ''}
                  onChange={(e) => setCustomPrice(e.target.value ? parseInt(e.target.value) : null)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="upgradeReason">Upgrade Reason</Label>
              <Textarea
                id="upgradeReason"
                placeholder="Reason for upgrade (optional)"
                value={upgradeReason}
                onChange={(e) => setUpgradeReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowUpgradeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpgradeBooking}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm Upgrade
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Room Type Hierarchy Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5" />
            <span>Room Type Hierarchy</span>
          </CardTitle>
          <CardDescription>
            Overview of all room types and upgrade paths
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {roomTypes.map((roomType, index) => (
              <Card key={roomType._id} className="relative">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <Badge className={getRoomTypeTierColor(roomType.category)}>
                      {getRoomTypeTierIcon(roomType.category)}
                      <span className="ml-1">{roomType.category}</span>
                    </Badge>
                    <div className="font-semibold">{roomType.name}</div>
                    <div className="text-sm text-gray-600">₹{roomType.basePrice}/night</div>
                    <div className="text-xs text-gray-500">
                      {roomType.size} sqft • Max {roomType.maxOccupancy}
                    </div>
                  </div>
                  {index < roomTypes.length - 1 && (
                    <ArrowRight className="absolute -right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 bg-white rounded-full" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}