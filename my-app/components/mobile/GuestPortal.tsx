'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Settings,
  Bell,
  Star,
  Clock,
  Eye,
  Edit,
  Download,
  Share2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  QrCode,
  MessageSquare,
  FileText,
  Camera,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Swimming,
  Utensils,
  LogOut,
  Heart,
  Gift,
  Bookmark,
  History,
  HelpCircle,
  Shield
} from 'lucide-react'

interface GuestProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  nationality?: string
  passportNumber?: string
  preferences: {
    roomType: string[]
    floor: 'low' | 'middle' | 'high' | 'any'
    bedType: 'king' | 'queen' | 'twin' | 'any'
    smokingPreference: 'non-smoking' | 'smoking' | 'any'
    dietaryRestrictions: string[]
    specialNeeds: string[]
  }
  loyaltyProgram?: {
    memberNumber: string
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    points: number
    benefits: string[]
  }
  avatar?: string
  joinDate: string
  lastLogin: string
}

interface Booking {
  id: string
  confirmationNumber: string
  propertyName: string
  propertyLocation: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  roomNumber?: string
  guests: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  totalAmount: number
  paidAmount: number
  balanceAmount: number
  specialRequests: string[]
  amenities: string[]
  images: string[]
  canModify: boolean
  canCancel: boolean
  checkInInstructions?: string
  qrCode?: string
}

interface LoyaltyActivity {
  id: string
  type: 'earn' | 'redeem' | 'bonus'
  points: number
  description: string
  date: string
  bookingRef?: string
}

interface Notification {
  id: string
  type: 'booking' | 'payment' | 'promotion' | 'loyalty' | 'general'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionRequired: boolean
  actionUrl?: string
}

export default function GuestPortal() {
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'loyalty' | 'notifications'>('bookings')
  const [bookingFilter, setBookingFilter] = useState<'all' | 'upcoming' | 'active' | 'completed'>('all')
  const [showBookingDetails, setShowBookingDetails] = useState<Booking | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mock data
  const guestProfile: GuestProfile = {
    id: 'guest-001',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1985-06-15',
    nationality: 'United States',
    passportNumber: 'US123456789',
    preferences: {
      roomType: ['Deluxe Suite', 'Standard King'],
      floor: 'high',
      bedType: 'king',
      smokingPreference: 'non-smoking',
      dietaryRestrictions: ['Vegetarian'],
      specialNeeds: ['Accessible room']
    },
    loyaltyProgram: {
      memberNumber: 'LP789012',
      tier: 'gold',
      points: 15750,
      benefits: ['Room upgrades', 'Late checkout', 'Welcome amenity', 'Priority support']
    },
    joinDate: '2022-03-15',
    lastLogin: new Date().toISOString()
  }

  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: 'booking-001',
      confirmationNumber: 'BG-2024-001234',
      propertyName: 'Baithaka GHAR Downtown',
      propertyLocation: 'New York, NY',
      checkInDate: '2024-02-15',
      checkOutDate: '2024-02-18',
      roomType: 'Deluxe King Suite',
      roomNumber: '1205',
      guests: 2,
      status: 'upcoming',
      totalAmount: 750,
      paidAmount: 750,
      balanceAmount: 0,
      specialRequests: ['Late checkout', 'High floor', 'Welcome champagne'],
      amenities: ['WiFi', 'Breakfast', 'Spa access', 'Parking'],
      images: ['/room1.jpg', '/room2.jpg'],
      canModify: true,
      canCancel: true,
      checkInInstructions: 'Check-in is available from 3:00 PM. Use mobile check-in for faster service.',
      qrCode: 'qr-code-data-here'
    },
    {
      id: 'booking-002',
      confirmationNumber: 'BG-2024-000987',
      propertyName: 'Baithaka GHAR Resort',
      propertyLocation: 'Miami, FL',
      checkInDate: '2024-01-10',
      checkOutDate: '2024-01-15',
      roomType: 'Ocean View Suite',
      roomNumber: '805',
      guests: 3,
      status: 'completed',
      totalAmount: 1200,
      paidAmount: 1200,
      balanceAmount: 0,
      specialRequests: ['Ocean view', 'Baby crib'],
      amenities: ['WiFi', 'Beach access', 'Pool', 'Restaurant'],
      images: ['/ocean1.jpg', '/ocean2.jpg'],
      canModify: false,
      canCancel: false
    },
    {
      id: 'booking-003',
      confirmationNumber: 'BG-2024-001456',
      propertyName: 'Baithaka GHAR Business',
      propertyLocation: 'Chicago, IL',
      checkInDate: '2024-03-20',
      checkOutDate: '2024-03-22',
      roomType: 'Executive Room',
      guests: 1,
      status: 'upcoming',
      totalAmount: 320,
      paidAmount: 160,
      balanceAmount: 160,
      specialRequests: ['Business center access'],
      amenities: ['WiFi', 'Business center', 'Gym'],
      images: ['/business1.jpg'],
      canModify: true,
      canCancel: true
    }
  ])

  const loyaltyActivities: LoyaltyActivity[] = [
    {
      id: 'activity-001',
      type: 'earn',
      points: 750,
      description: 'Earned points from Miami stay',
      date: '2024-01-15',
      bookingRef: 'BG-2024-000987'
    },
    {
      id: 'activity-002',
      type: 'bonus',
      points: 500,
      description: 'Birthday bonus points',
      date: '2024-06-15'
    },
    {
      id: 'activity-003',
      type: 'redeem',
      points: -1000,
      description: 'Redeemed for room upgrade',
      date: '2024-01-10',
      bookingRef: 'BG-2024-000987'
    }
  ]

  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 'notif-001',
      type: 'booking',
      title: 'Check-in Reminder',
      message: 'Your check-in for Downtown location is tomorrow at 3:00 PM',
      timestamp: '2024-02-14T10:00:00Z',
      read: false,
      actionRequired: true,
      actionUrl: '/mobile-checkin'
    },
    {
      id: 'notif-002',
      type: 'loyalty',
      title: 'Points Earned',
      message: 'You earned 750 loyalty points from your recent stay',
      timestamp: '2024-01-16T08:30:00Z',
      read: false,
      actionRequired: false
    },
    {
      id: 'notif-003',
      type: 'promotion',
      title: 'Special Offer',
      message: '20% off your next stay - Book by March 1st',
      timestamp: '2024-01-12T12:00:00Z',
      read: true,
      actionRequired: false
    }
  ])

  const filteredBookings = bookings.filter(booking => {
    if (bookingFilter === 'all') return true
    return booking.status === bookingFilter
  }).filter(booking => {
    if (!searchQuery) return true
    return booking.confirmationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
           booking.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           booking.propertyLocation.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const unreadNotifications = notifications.filter(n => !n.read).length

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800'
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600'
      case 'silver': return 'text-gray-600'
      case 'gold': return 'text-yellow-600'
      case 'platinum': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'gold': return '🏆'
      case 'silver': return '🥈'
      case 'bronze': return '🥉'
      case 'platinum': return '💎'
      default: return '⭐'
    }
  }

  const markNotificationRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
  }

  const renderBookings = () => (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {[
          { id: 'all', label: 'All' },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Past' }
        ].map(filter => (
          <Button
            key={filter.id}
            variant={bookingFilter === filter.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBookingFilter(filter.id as any)}
            className="whitespace-nowrap"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Booking List */}
      <div className="space-y-3">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No bookings found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map(booking => (
            <Card key={booking.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getStatusColor(booking.status)} text-xs capitalize`}>
                        {booking.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{booking.confirmationNumber}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{booking.propertyName}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {booking.propertyLocation}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${booking.totalAmount}</p>
                    {booking.balanceAmount > 0 && (
                      <p className="text-xs text-red-600">Balance: ${booking.balanceAmount}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Check-in</p>
                    <p className="font-medium">{booking.checkInDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Check-out</p>
                    <p className="font-medium">{booking.checkOutDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Room</p>
                    <p className="font-medium">{booking.roomType}</p>
                    {booking.roomNumber && (
                      <p className="text-xs text-gray-500">Room {booking.roomNumber}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-500">Guests</p>
                    <p className="font-medium">{booking.guests}</p>
                  </div>
                </div>

                {booking.amenities.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {booking.amenities.slice(0, 3).map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity === 'WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                          {amenity === 'Parking' && <Car className="w-3 h-3 mr-1" />}
                          {amenity === 'Breakfast' && <Coffee className="w-3 h-3 mr-1" />}
                          {amenity === 'Gym' && <Dumbbell className="w-3 h-3 mr-1" />}
                          {amenity === 'Pool' && <Swimming className="w-3 h-3 mr-1" />}
                          {amenity}
                        </Badge>
                      ))}
                      {booking.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{booking.amenities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBookingDetails(booking)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {booking.canModify && (
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Modify
                    </Button>
                  )}
                  {booking.status === 'upcoming' && booking.qrCode && (
                    <Button size="sm" variant="outline">
                      <QrCode className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Plus className="w-6 h-6" />
              <span className="text-sm">New Booking</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <Search className="w-6 h-6" />
              <span className="text-sm">Find Booking</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <QrCode className="w-6 h-6" />
              <span className="text-sm">Mobile Check-in</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2">
              <HelpCircle className="w-6 h-6" />
              <span className="text-sm">Help & Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderProfile = () => (
    <div className="space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{guestProfile.firstName} {guestProfile.lastName}</h2>
              <p className="text-gray-600">{guestProfile.email}</p>
              <p className="text-sm text-gray-500">Member since {new Date(guestProfile.joinDate).toLocaleDateString()}</p>
            </div>
            <Button size="sm" variant="outline">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium">{guestProfile.email}</p>
              <p className="text-xs text-gray-500">Primary email</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium">{guestProfile.phone}</p>
              <p className="text-xs text-gray-500">Mobile phone</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-gray-400" />
            <div className="flex-1">
              <p className="font-medium">{guestProfile.nationality}</p>
              <p className="text-xs text-gray-500">Nationality</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-medium text-sm mb-2">Room Preferences</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-gray-500">Room Type</p>
                <p>{guestProfile.preferences.roomType.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Floor</p>
                <p className="capitalize">{guestProfile.preferences.floor}</p>
              </div>
              <div>
                <p className="text-gray-500">Bed Type</p>
                <p className="capitalize">{guestProfile.preferences.bedType}</p>
              </div>
              <div>
                <p className="text-gray-500">Smoking</p>
                <p className="capitalize">{guestProfile.preferences.smokingPreference}</p>
              </div>
            </div>
          </div>

          {guestProfile.preferences.dietaryRestrictions.length > 0 && (
            <div>
              <p className="font-medium text-sm mb-2">Dietary Restrictions</p>
              <div className="flex flex-wrap gap-1">
                {guestProfile.preferences.dietaryRestrictions.map((restriction, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {restriction}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {guestProfile.preferences.specialNeeds.length > 0 && (
            <div>
              <p className="font-medium text-sm mb-2">Special Needs</p>
              <div className="flex flex-wrap gap-1">
                {guestProfile.preferences.specialNeeds.map((need, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {need}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="ghost" className="w-full justify-start">
            <Shield className="w-4 h-4 mr-3" />
            Security & Privacy
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Bell className="w-4 h-4 mr-3" />
            Notification Preferences
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <CreditCard className="w-4 h-4 mr-3" />
            Payment Methods
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Download className="w-4 h-4 mr-3" />
            Download My Data
          </Button>
          <Separator />
          <Button variant="ghost" className="w-full justify-start text-red-600">
            <LogOut className="w-4 h-4 mr-3" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderLoyalty = () => (
    <div className="space-y-4">
      {/* Loyalty Status */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl mb-2">{getTierIcon(guestProfile.loyaltyProgram?.tier || '')}</div>
            <h2 className={`text-xl font-bold capitalize ${getTierColor(guestProfile.loyaltyProgram?.tier || '')}`}>
              {guestProfile.loyaltyProgram?.tier} Member
            </h2>
            <p className="text-gray-600">Member #{guestProfile.loyaltyProgram?.memberNumber}</p>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{guestProfile.loyaltyProgram?.points.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Available Points</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Platinum</span>
              <span>15,750 / 25,000</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${(15750 / 25000) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">9,250 points to next tier</p>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guestProfile.loyaltyProgram?.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Point Redemption */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redeem Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="border rounded-lg p-3 text-center">
              <Gift className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Room Upgrade</p>
              <p className="text-xs text-gray-500">5,000 points</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <Coffee className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Free Breakfast</p>
              <p className="text-xs text-gray-500">2,500 points</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <Car className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Free Parking</p>
              <p className="text-xs text-gray-500">1,000 points</p>
            </div>
            <div className="border rounded-lg p-3 text-center">
              <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="font-medium text-sm">Late Checkout</p>
              <p className="text-xs text-gray-500">1,500 points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loyaltyActivities.map(activity => (
              <div key={activity.id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'earn' ? 'bg-green-100' :
                  activity.type === 'redeem' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'earn' ? '🟢' : activity.type === 'redeem' ? '🔴' : '🎁'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{activity.description}</p>
                  <p className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</p>
                </div>
                <div className={`font-bold text-sm ${
                  activity.type === 'redeem' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {activity.type === 'redeem' ? '-' : '+'}{Math.abs(activity.points)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderNotifications = () => (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No notifications</p>
            <p className="text-sm text-gray-400">You're all caught up!</p>
          </CardContent>
        </Card>
      ) : (
        notifications.map(notification => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-all ${
              !notification.read ? 'border-blue-200 bg-blue-50' : ''
            }`}
            onClick={() => markNotificationRead(notification.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  notification.type === 'booking' ? 'bg-blue-100' :
                  notification.type === 'loyalty' ? 'bg-purple-100' :
                  notification.type === 'promotion' ? 'bg-green-100' :
                  notification.type === 'payment' ? 'bg-yellow-100' : 'bg-gray-100'
                }`}>
                  {notification.type === 'booking' && <Calendar className="w-4 h-4 text-blue-600" />}
                  {notification.type === 'loyalty' && <Star className="w-4 h-4 text-purple-600" />}
                  {notification.type === 'promotion' && <Gift className="w-4 h-4 text-green-600" />}
                  {notification.type === 'payment' && <CreditCard className="w-4 h-4 text-yellow-600" />}
                  {notification.type === 'general' && <Bell className="w-4 h-4 text-gray-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm">{notification.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                  {notification.actionRequired && notification.actionUrl && (
                    <Button size="sm" variant="outline" className="mt-3">
                      Take Action
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )

  const renderBookingDetails = () => (
    showBookingDetails && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Booking Details</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowBookingDetails(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Badge className={`${getStatusColor(showBookingDetails.status)} mb-2`}>
                {showBookingDetails.status}
              </Badge>
              <h3 className="font-bold text-lg">{showBookingDetails.propertyName}</h3>
              <p className="text-gray-600">{showBookingDetails.propertyLocation}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Confirmation</p>
                <p className="font-medium">{showBookingDetails.confirmationNumber}</p>
              </div>
              <div>
                <p className="text-gray-500">Room</p>
                <p className="font-medium">{showBookingDetails.roomType}</p>
                {showBookingDetails.roomNumber && (
                  <p className="text-xs text-gray-500">Room {showBookingDetails.roomNumber}</p>
                )}
              </div>
              <div>
                <p className="text-gray-500">Check-in</p>
                <p className="font-medium">{showBookingDetails.checkInDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Check-out</p>
                <p className="font-medium">{showBookingDetails.checkOutDate}</p>
              </div>
              <div>
                <p className="text-gray-500">Guests</p>
                <p className="font-medium">{showBookingDetails.guests}</p>
              </div>
              <div>
                <p className="text-gray-500">Total</p>
                <p className="font-medium">${showBookingDetails.totalAmount}</p>
              </div>
            </div>

            {showBookingDetails.specialRequests.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-2">Special Requests</p>
                <div className="flex flex-wrap gap-1">
                  {showBookingDetails.specialRequests.map((request, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {request}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {showBookingDetails.amenities.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-2">Included Amenities</p>
                <div className="flex flex-wrap gap-1">
                  {showBookingDetails.amenities.map((amenity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {showBookingDetails.checkInInstructions && (
              <Alert>
                <AlertDescription className="text-sm">
                  {showBookingDetails.checkInInstructions}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {showBookingDetails.canModify && (
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Modify
                </Button>
              )}
              {showBookingDetails.qrCode && (
                <Button variant="outline" size="sm">
                  <QrCode className="w-4 h-4 mr-2" />
                  QR Code
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Guest Portal</h1>
              <p className="text-blue-100 text-sm">Welcome back, {guestProfile.firstName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 relative">
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">{unreadNotifications}</span>
                  </div>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pb-20">
          {activeTab === 'bookings' && renderBookings()}
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'loyalty' && renderLoyalty()}
          {activeTab === 'notifications' && renderNotifications()}
        </div>

        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200">
          <div className="grid grid-cols-4 h-16">
            {[
              { id: 'bookings', icon: Calendar, label: 'Bookings' },
              { id: 'loyalty', icon: Star, label: 'Loyalty' },
              { id: 'notifications', icon: Bell, label: 'Alerts' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex flex-col items-center justify-center gap-1 relative ${
                  activeTab === id ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
                {id === 'notifications' && unreadNotifications > 0 && (
                  <div className="absolute top-1 right-6 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {renderBookingDetails()}
      </div>
    </div>
  )
}