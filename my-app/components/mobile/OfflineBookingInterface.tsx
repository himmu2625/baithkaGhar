'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Wifi,
  WifiOff,
  CloudOff,
  Sync,
  CheckCircle,
  AlertCircle,
  Clock,
  Upload,
  Download,
  RefreshCw,
  Signal,
  Database,
  Calendar,
  Users,
  Bed,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Save,
  Trash2,
  Edit,
  Eye,
  AlertTriangle
} from 'lucide-react'
import { OfflineBookingService } from '@/lib/services/offline-booking-service'

interface OfflineBooking {
  id: string
  propertyId: string
  roomType: string
  checkInDate: string
  checkOutDate: string
  guests: number
  guestInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address?: string
    specialRequests?: string
  }
  pricing: {
    baseRate: number
    taxes: number
    fees: number
    total: number
  }
  status: 'draft' | 'pending-sync' | 'synced' | 'failed'
  createdAt: string
  lastModified: string
  syncAttempts: number
  errorMessage?: string
}

interface NetworkStatus {
  online: boolean
  quality?: 'good' | 'slow' | 'poor'
}

export default function OfflineBookingInterface() {
  const [offlineService] = useState(() => new OfflineBookingService())
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({ online: true })
  const [offlineBookings, setOfflineBookings] = useState<OfflineBooking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<OfflineBooking | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingSync: 0,
    synced: 0,
    failed: 0,
    lastSync: undefined as string | undefined
  })

  // Form state for new booking
  const [bookingForm, setBookingForm] = useState({
    propertyId: 'prop-001',
    roomType: 'Standard King',
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    guestInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      specialRequests: ''
    },
    pricing: {
      baseRate: 150,
      taxes: 22.5,
      fees: 10,
      total: 182.5
    }
  })

  useEffect(() => {
    initializeOfflineInterface()
    setupNetworkMonitoring()
    loadOfflineBookings()
  }, [])

  const initializeOfflineInterface = async () => {
    try {
      const status = await offlineService.getNetworkStatus()
      setNetworkStatus(status)

      const offlineStats = await offlineService.getOfflineStats()
      setStats(offlineStats)
    } catch (error) {
      // Failed to initialize offline interface
    }
  }

  const setupNetworkMonitoring = () => {
    const updateNetworkStatus = async () => {
      const status = await offlineService.getNetworkStatus()
      setNetworkStatus(status)
    }

    window.addEventListener('online', updateNetworkStatus)
    window.addEventListener('offline', updateNetworkStatus)

    // Check network quality periodically
    const qualityCheck = setInterval(updateNetworkStatus, 30000)

    return () => {
      window.removeEventListener('online', updateNetworkStatus)
      window.removeEventListener('offline', updateNetworkStatus)
      clearInterval(qualityCheck)
    }
  }

  const loadOfflineBookings = async () => {
    try {
      const bookings = await offlineService.getAllOfflineBookings()
      setOfflineBookings(bookings)

      const offlineStats = await offlineService.getOfflineStats()
      setStats(offlineStats)
    } catch (error) {
      // Failed to load offline bookings
    }
  }

  const handleCreateOfflineBooking = async () => {
    try {
      const bookingId = await offlineService.createOfflineBooking(bookingForm)

      // Reset form
      setBookingForm({
        ...bookingForm,
        guestInfo: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: '',
          specialRequests: ''
        }
      })

      setShowBookingForm(false)
      await loadOfflineBookings()
    } catch (error) {
      // Failed to create offline booking
    }
  }

  const handleSyncBookings = async () => {
    setSyncInProgress(true)
    try {
      const result = await offlineService.syncPendingBookings()
      await loadOfflineBookings()
    } catch (error) {
      // Sync failed
    } finally {
      setSyncInProgress(false)
    }
  }

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await offlineService.deleteOfflineBooking(bookingId)
      await loadOfflineBookings()
    } catch (error) {
      // Failed to delete booking
    }
  }

  const getStatusIcon = (status: OfflineBooking['status']) => {
    switch (status) {
      case 'draft':
        return <Edit className="w-4 h-4 text-gray-500" />
      case 'pending-sync':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'synced':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: OfflineBooking['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      case 'pending-sync':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'synced':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getNetworkIcon = () => {
    if (!networkStatus.online) {
      return <WifiOff className="w-5 h-5 text-red-500" />
    }

    switch (networkStatus.quality) {
      case 'good':
        return <Wifi className="w-5 h-5 text-green-500" />
      case 'slow':
        return <Signal className="w-5 h-5 text-yellow-500" />
      case 'poor':
        return <Signal className="w-5 h-5 text-red-500" />
      default:
        return <Wifi className="w-5 h-5 text-blue-500" />
    }
  }

  const renderNetworkStatus = () => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getNetworkIcon()}
            <div>
              <p className="font-medium text-sm">
                {networkStatus.online ? 'Online' : 'Offline'}
              </p>
              {networkStatus.online && networkStatus.quality && (
                <p className="text-xs text-gray-500 capitalize">
                  Connection: {networkStatus.quality}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.pendingSync > 0 && (
              <Badge variant="outline" className="text-yellow-600">
                {stats.pendingSync} pending
              </Badge>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncBookings}
              disabled={!networkStatus.online || syncInProgress}
            >
              {syncInProgress ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sync className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderStats = () => (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{stats.totalBookings}</div>
          <p className="text-xs text-gray-600">Total Bookings</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-green-600">{stats.synced}</div>
          <p className="text-xs text-gray-600">Synced</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-yellow-600">{stats.pendingSync}</div>
          <p className="text-xs text-gray-600">Pending</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3 text-center">
          <div className="text-xl font-bold text-red-600">{stats.failed}</div>
          <p className="text-xs text-gray-600">Failed</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderBookingList = () => (
    <div className="space-y-3">
      {offlineBookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No offline bookings</p>
            <p className="text-sm text-gray-400">Create a booking to get started</p>
          </CardContent>
        </Card>
      ) : (
        offlineBookings.map((booking) => (
          <Card key={booking.id} className={`border-l-4 ${getStatusColor(booking.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(booking.status)}
                    <span className="font-medium text-sm">
                      {booking.guestInfo.firstName} {booking.guestInfo.lastName}
                    </span>
                    <Badge variant="outline" className="text-xs capitalize">
                      {booking.status.replace('-', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">
                    {booking.roomType} • {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {booking.checkInDate}
                    </span>
                    <span>to {booking.checkOutDate}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">${booking.pricing.total}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {booking.errorMessage && (
                <Alert className="mt-2">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription className="text-xs">
                    {booking.errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between items-center mt-3">
                <div className="text-xs text-gray-500">
                  {booking.syncAttempts > 0 && (
                    <span>Sync attempts: {booking.syncAttempts}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {booking.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBooking(booking.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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

  const renderBookingForm = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudOff className="w-5 h-5" />
            Create Offline Booking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Room Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Check-in Date</Label>
              <Input
                type="date"
                value={bookingForm.checkInDate}
                onChange={(e) => setBookingForm(prev => ({ ...prev, checkInDate: e.target.value }))}
              />
            </div>
            <div>
              <Label>Check-out Date</Label>
              <Input
                type="date"
                value={bookingForm.checkOutDate}
                onChange={(e) => setBookingForm(prev => ({ ...prev, checkOutDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Room Type</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={bookingForm.roomType}
                onChange={(e) => setBookingForm(prev => ({ ...prev, roomType: e.target.value }))}
              >
                <option value="Standard King">Standard King</option>
                <option value="Standard Queen">Standard Queen</option>
                <option value="Deluxe Suite">Deluxe Suite</option>
              </select>
            </div>
            <div>
              <Label>Guests</Label>
              <Input
                type="number"
                min="1"
                max="4"
                value={bookingForm.guests}
                onChange={(e) => setBookingForm(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
              />
            </div>
          </div>

          <Separator />

          {/* Guest Information */}
          <div className="space-y-3">
            <h3 className="font-medium">Guest Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  value={bookingForm.guestInfo.firstName}
                  onChange={(e) => setBookingForm(prev => ({
                    ...prev,
                    guestInfo: { ...prev.guestInfo, firstName: e.target.value }
                  }))}
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  value={bookingForm.guestInfo.lastName}
                  onChange={(e) => setBookingForm(prev => ({
                    ...prev,
                    guestInfo: { ...prev.guestInfo, lastName: e.target.value }
                  }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={bookingForm.guestInfo.email}
                onChange={(e) => setBookingForm(prev => ({
                  ...prev,
                  guestInfo: { ...prev.guestInfo, email: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={bookingForm.guestInfo.phone}
                onChange={(e) => setBookingForm(prev => ({
                  ...prev,
                  guestInfo: { ...prev.guestInfo, phone: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label>Special Requests</Label>
              <Textarea
                value={bookingForm.guestInfo.specialRequests}
                onChange={(e) => setBookingForm(prev => ({
                  ...prev,
                  guestInfo: { ...prev.guestInfo, specialRequests: e.target.value }
                }))}
                placeholder="Any special requests..."
                rows={2}
              />
            </div>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="space-y-2">
            <h3 className="font-medium">Pricing</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Base Rate</span>
                <span>${bookingForm.pricing.baseRate}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes</span>
                <span>${bookingForm.pricing.taxes}</span>
              </div>
              <div className="flex justify-between">
                <span>Fees</span>
                <span>${bookingForm.pricing.fees}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${bookingForm.pricing.total}</span>
              </div>
            </div>
          </div>

          <Alert>
            <CloudOff className="w-4 h-4" />
            <AlertDescription className="text-xs">
              This booking will be stored offline and synced when connection is restored.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowBookingForm(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreateOfflineBooking}
              disabled={!bookingForm.guestInfo.firstName || !bookingForm.guestInfo.lastName || !bookingForm.guestInfo.email}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Offline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBookingDetails = () => (
    selectedBooking && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(selectedBooking.status)}
                Booking Details
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(null)}>
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={getStatusColor(selectedBooking.status)} variant="outline">
                {selectedBooking.status.replace('-', ' ')}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-gray-600">Guest</p>
              <p className="font-medium">
                {selectedBooking.guestInfo.firstName} {selectedBooking.guestInfo.lastName}
              </p>
              <p className="text-sm">{selectedBooking.guestInfo.email}</p>
              <p className="text-sm">{selectedBooking.guestInfo.phone}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Stay Details</p>
              <p className="font-medium">{selectedBooking.roomType}</p>
              <p className="text-sm">{selectedBooking.guests} guest{selectedBooking.guests > 1 ? 's' : ''}</p>
              <p className="text-sm">{selectedBooking.checkInDate} to {selectedBooking.checkOutDate}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Pricing</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Base Rate</span>
                  <span>${selectedBooking.pricing.baseRate}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes</span>
                  <span>${selectedBooking.pricing.taxes}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fees</span>
                  <span>${selectedBooking.pricing.fees}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${selectedBooking.pricing.total}</span>
                </div>
              </div>
            </div>

            {selectedBooking.guestInfo.specialRequests && (
              <div>
                <p className="text-sm text-gray-600">Special Requests</p>
                <p className="text-sm">{selectedBooking.guestInfo.specialRequests}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
            </div>

            {selectedBooking.errorMessage && (
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription className="text-xs">
                  {selectedBooking.errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Offline Bookings</h1>
              <p className="text-blue-100 text-sm">Manage offline reservations</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-blue-700"
              onClick={() => setShowBookingForm(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          {renderNetworkStatus()}
          {renderStats()}
          {renderBookingList()}
        </div>

        {showBookingForm && renderBookingForm()}
        {renderBookingDetails()}
      </div>
    </div>
  )
}