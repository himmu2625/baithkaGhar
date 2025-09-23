'use client'

import React, { useRef, useCallback } from 'react'
import { useMobileCheckIn } from '@/hooks/useMobileCheckIn'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Camera,
  Upload,
  CreditCard,
  Shield,
  CheckCircle,
  AlertCircle,
  Users,
  Bed,
  Wifi,
  Car,
  X,
  ChevronLeft,
  ChevronRight,
  Home,
  Key,
  Bell,
  MessageCircle
} from 'lucide-react'

interface CheckInStep {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
}

interface DocumentUpload {
  id: string
  type: 'id' | 'passport' | 'visa' | 'other'
  name: string
  file: File | null
  uploaded: boolean
  verified: boolean
}

interface ServiceRequest {
  id: string
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'dining' | 'transport'
  title: string
  description: string
  urgency: 'low' | 'medium' | 'high'
  status: 'pending' | 'acknowledged' | 'completed'
  timestamp: string
}

export default function MobileCheckInApp() {
  const { state, actions } = useMobileCheckIn()
  const [bookingLookup, setBookingLookup] = React.useState('')
  const [showServiceRequest, setShowServiceRequest] = React.useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const checkInSteps: CheckInStep[] = [
    {
      id: 'lookup',
      title: 'Find Booking',
      description: 'Enter confirmation number or email',
      completed: false,
      required: true
    },
    {
      id: 'verify',
      title: 'Verify Details',
      description: 'Confirm guest information',
      completed: false,
      required: true
    },
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'ID verification and travel documents',
      completed: false,
      required: true
    },
    {
      id: 'preferences',
      title: 'Room Preferences',
      description: 'Special requests and preferences',
      completed: false,
      required: false
    },
    {
      id: 'payment',
      title: 'Payment & Deposit',
      description: 'Confirm payment method',
      completed: false,
      required: true
    },
    {
      id: 'complete',
      title: 'Check-In Complete',
      description: 'Get your digital room key',
      completed: false,
      required: true
    }
  ]

  const handleFileUpload = useCallback((type: DocumentUpload['type']) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === 'id' ? 'image/*' : 'image/*,application/pdf'
      fileInputRef.current.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          await actions.uploadDocument(type, file)
        }
      }
      fileInputRef.current.click()
    }
  }, [actions])

  const submitServiceRequest = async (type: ServiceRequest['type'], description: string, urgency: ServiceRequest['urgency']) => {
    await actions.submitServiceRequest(type, description, urgency)
    setShowServiceRequest(false)
  }

  const renderBookingLookup = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
        <p className="text-gray-600">Let's get you checked in quickly</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="booking-lookup">Confirmation Number or Email</Label>
              <Input
                id="booking-lookup"
                placeholder="BG-2024-001234 or email@example.com"
                value={bookingLookup}
                onChange={(e) => setBookingLookup(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => actions.lookupBooking(bookingLookup)}
              className="w-full"
              disabled={!bookingLookup.trim() || state.isLoading}
            >
              {state.isLoading ? 'Searching...' : 'Find My Booking'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-500 mb-2">Having trouble?</p>
        <Button variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-2" />
          Contact Front Desk
        </Button>
      </div>
    </div>
  )

  const renderBookingVerification = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => actions.setCurrentStep(0)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="secondary">Step 2 of 6</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Booking Found
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Confirmation</p>
              <p className="font-semibold">{state.booking?.confirmationNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Guest Name</p>
              <p className="font-semibold">{state.booking?.guestName}</p>
            </div>
            <div>
              <p className="text-gray-500">Check-in</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {state.booking?.checkInDate}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Check-out</p>
              <p className="font-semibold flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {state.booking?.checkOutDate}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Room</p>
              <p className="font-semibold flex items-center gap-1">
                <Bed className="w-4 h-4" />
                {state.booking?.roomNumber} - {state.booking?.roomType}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Guests</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="w-4 h-4" />
                {state.booking?.guests}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-gray-500 text-sm mb-2">Included Amenities</p>
            <div className="flex flex-wrap gap-2">
              {state.booking?.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {amenity === 'WiFi' && <Wifi className="w-3 h-3 mr-1" />}
                  {amenity === 'Parking' && <Car className="w-3 h-3 mr-1" />}
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={state.guestInfo.firstName}
                onChange={(e) => actions.updateGuestInfo({ firstName: e.target.value })}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={state.guestInfo.lastName}
                onChange={(e) => actions.updateGuestInfo({ lastName: e.target.value })}
                placeholder="Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={state.guestInfo.email}
                onChange={(e) => actions.updateGuestInfo({ email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={state.guestInfo.phone}
                onChange={(e) => actions.updateGuestInfo({ phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <Button
            onClick={() => actions.setCurrentStep(2)}
            className="w-full"
            disabled={!state.guestInfo.firstName || !state.guestInfo.lastName || !state.guestInfo.email || !state.guestInfo.phone || state.isLoading}
          >
            Continue to Documents
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderDocumentUpload = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => actions.setCurrentStep(1)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="secondary">Step 3 of 6</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Identity Verification
          </CardTitle>
          <p className="text-sm text-gray-600">Upload required documents for verification</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {[
              { type: 'id' as const, label: 'Government ID', required: true },
              { type: 'passport' as const, label: 'Passport', required: false },
              { type: 'visa' as const, label: 'Visa (if applicable)', required: false }
            ].map(({ type, label, required }) => (
              <div key={type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{label}</span>
                  {required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                </div>

                {state.documents.find(doc => doc.type === type) ? (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-700">Verified</span>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFileUpload(type)}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {label}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <input type="file" ref={fileInputRef} style={{ display: 'none' }} />

          <div className="space-y-2">
            <Label htmlFor="idNumber">ID Number</Label>
            <Input
              id="idNumber"
              value={state.guestInfo.idNumber}
              onChange={(e) => actions.updateGuestInfo({ idNumber: e.target.value })}
              placeholder="Enter ID number"
            />
          </div>

          <Button
            onClick={() => actions.setCurrentStep(3)}
            className="w-full"
            disabled={!state.documents.find(doc => doc.type === 'id' && doc.verified) || !state.guestInfo.idNumber || state.isLoading}
          >
            Continue to Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => actions.setCurrentStep(2)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="secondary">Step 4 of 6</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Preferences & Requests</CardTitle>
          <p className="text-sm text-gray-600">Help us make your stay perfect</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={state.guestInfo.address}
              onChange={(e) => actions.updateGuestInfo({ address: e.target.value })}
              placeholder="Enter your home address"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                value={state.guestInfo.emergencyContact}
                onChange={(e) => actions.updateGuestInfo({ emergencyContact: e.target.value })}
                placeholder="Contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Emergency Phone</Label>
              <Input
                id="emergencyPhone"
                value={state.guestInfo.emergencyPhone}
                onChange={(e) => actions.updateGuestInfo({ emergencyPhone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests</Label>
            <Textarea
              id="specialRequests"
              value={state.guestInfo.specialRequests}
              onChange={(e) => actions.updateGuestInfo({ specialRequests: e.target.value })}
              placeholder="Any special requests or preferences..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Additional Services</h4>
            <div className="grid gap-2">
              {[
                'Wake-up call service',
                'Newspaper delivery',
                'Extra towels',
                'Late checkout',
                'Airport transfer'
              ].map((service, index) => (
                <label key={index} className="flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={() => actions.setCurrentStep(4)} className="w-full" disabled={state.isLoading}>
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderPaymentConfirmation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => actions.setCurrentStep(3)}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <Badge variant="secondary">Step 5 of 6</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Payment & Deposit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Payment Confirmed</span>
            </div>
            <p className="text-sm text-green-700">Your payment method ending in ****4567 is on file</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Room Total</span>
              <span className="font-semibold">${state.booking?.totalAmount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Security Deposit</span>
              <span className="font-semibold">$100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Taxes & Fees</span>
              <span className="font-semibold">$67.50</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Authorized</span>
              <span>${((state.booking?.totalAmount || 0) + 100 + 67.50).toFixed(2)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• Security deposit will be returned within 7-10 business days after checkout</p>
            <p>• Incidental charges may apply for room service, minibar, etc.</p>
            <p>• City tax may be collected separately at the property</p>
          </div>

          <Button onClick={() => actions.completeCheckIn()} className="w-full" disabled={state.isLoading}>
            Confirm & Complete Check-In
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderCheckInComplete = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Baithaka GHAR!</h2>
        <p className="text-gray-600">Your check-in is complete</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Key className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Room {state.booking?.roomNumber}</h3>
              <p className="text-gray-600">{state.booking?.roomType}</p>
            </div>
            <Button className="w-full" size="lg">
              <Key className="w-5 h-5 mr-2" />
              Open Digital Room Key
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <MapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Property Map</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Wifi className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">WiFi Details</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Bell className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Services</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <MessageCircle className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium">Concierge</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Service Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'housekeeping', label: 'Housekeeping', icon: '🧹' },
              { type: 'maintenance', label: 'Maintenance', icon: '🔧' },
              { type: 'concierge', label: 'Concierge', icon: '🛎️' },
              { type: 'dining', label: 'Room Service', icon: '🍽️' }
            ].map(({ type, label, icon }) => (
              <Button
                key={type}
                variant="outline"
                size="sm"
                onClick={() => setShowServiceRequest(true)}
                className="h-auto p-3 flex-col gap-1"
              >
                <span className="text-lg">{icon}</span>
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {state.serviceRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {state.serviceRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="text-sm font-medium">{request.title}</p>
                    <p className="text-xs text-gray-500">{request.description}</p>
                  </div>
                  <Badge variant={request.status === 'completed' ? 'default' : 'secondary'}>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderServiceRequestModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Service Request</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setShowServiceRequest(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Request Type</Label>
              <select className="w-full p-2 border rounded">
                <option value="housekeeping">Housekeeping</option>
                <option value="maintenance">Maintenance</option>
                <option value="concierge">Concierge</option>
                <option value="dining">Room Service</option>
              </select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Describe your request..." rows={3} />
            </div>
            <div>
              <Label>Urgency</Label>
              <select className="w-full p-2 border rounded">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <Button
              onClick={() => submitServiceRequest('housekeeping', 'Extra towels needed', 'low')}
              className="w-full"
            >
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Mobile Check-In</h1>
            {state.currentStep < 5 && (
              <div className="flex space-x-1">
                {checkInSteps.slice(0, -1).map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full ${
                      index <= state.currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {state.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{state.error}</p>
              <Button variant="ghost" size="sm" onClick={actions.clearError} className="mt-2">
                Dismiss
              </Button>
            </div>
          )}
          {state.currentStep === 0 && renderBookingLookup()}
          {state.currentStep === 1 && renderBookingVerification()}
          {state.currentStep === 2 && renderDocumentUpload()}
          {state.currentStep === 3 && renderPreferences()}
          {state.currentStep === 4 && renderPaymentConfirmation()}
          {state.currentStep === 5 && renderCheckInComplete()}
        </div>

        {showServiceRequest && renderServiceRequestModal()}
      </div>
    </div>
  )
}