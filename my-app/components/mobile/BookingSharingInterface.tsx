'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Share2,
  Link,
  Mail,
  MessageSquare,
  Download,
  Copy,
  QrCode,
  Calendar,
  MapPin,
  Users,
  Bed,
  DollarSign,
  Clock,
  Phone,
  Send,
  Check,
  X,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  WhatsApp,
  MessageCircle,
  Printer,
  FileText,
  Image,
  Globe,
  Camera,
  RefreshCw,
  ExternalLink,
  Heart,
  Star,
  Gift,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield
} from 'lucide-react'

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  propertyName: string
  propertyLocation: string
  propertyImage: string
  checkInDate: string
  checkOutDate: string
  roomType: string
  roomNumber?: string
  guests: number
  totalAmount: number
  specialRequests: string[]
  amenities: string[]
  qrCode?: string
  shareableUrl?: string
}

interface ShareOption {
  id: string
  name: string
  icon: React.ComponentType<any>
  color: string
  description: string
  type: 'social' | 'messaging' | 'email' | 'link' | 'file'
}

interface ShareTemplate {
  id: string
  name: string
  title: string
  message: string
  includeImage: boolean
  includeQR: boolean
  includeDetails: boolean
}

interface ContactGroup {
  id: string
  name: string
  contacts: ShareContact[]
}

interface ShareContact {
  id: string
  name: string
  email?: string
  phone?: string
  avatar?: string
  lastShared?: string
}

export default function BookingSharingInterface() {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [shareMethod, setShareMethod] = useState<'quick' | 'custom' | 'contacts'>('quick')
  const [selectedTemplate, setSelectedTemplate] = useState<ShareTemplate | null>(null)
  const [customMessage, setCustomMessage] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [shareUrl, setShareUrl] = useState('')
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [shareHistory, setShareHistory] = useState<any[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mock booking data
  const mockBooking: BookingDetails = {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    propertyName: 'Baithaka Ghar Downtown',
    propertyLocation: 'New York, NY',
    propertyImage: '/hotel-exterior.jpg',
    checkInDate: '2024-02-15',
    checkOutDate: '2024-02-18',
    roomType: 'Deluxe King Suite',
    roomNumber: '1205',
    guests: 2,
    totalAmount: 750,
    specialRequests: ['Late checkout', 'High floor', 'Welcome champagne'],
    amenities: ['WiFi', 'Breakfast', 'Spa access', 'Parking'],
    qrCode: 'booking-qr-code-data'
  }

  const shareOptions: ShareOption[] = [
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-500',
      description: 'Share via WhatsApp',
      type: 'messaging'
    },
    {
      id: 'email',
      name: 'Email',
      icon: Mail,
      color: 'bg-blue-500',
      description: 'Send via email',
      type: 'email'
    },
    {
      id: 'sms',
      name: 'SMS',
      icon: MessageSquare,
      color: 'bg-purple-500',
      description: 'Send text message',
      type: 'messaging'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600',
      description: 'Share on Facebook',
      type: 'social'
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500',
      description: 'Share on Twitter',
      type: 'social'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-pink-500',
      description: 'Share on Instagram',
      type: 'social'
    },
    {
      id: 'copy-link',
      name: 'Copy Link',
      icon: Link,
      color: 'bg-gray-500',
      description: 'Copy shareable link',
      type: 'link'
    },
    {
      id: 'qr-code',
      name: 'QR Code',
      icon: QrCode,
      color: 'bg-indigo-500',
      description: 'Share QR code',
      type: 'file'
    },
    {
      id: 'pdf',
      name: 'PDF',
      icon: FileText,
      color: 'bg-red-500',
      description: 'Generate PDF',
      type: 'file'
    }
  ]

  const shareTemplates: ShareTemplate[] = [
    {
      id: 'invitation',
      name: 'Travel Invitation',
      title: 'Join me at {propertyName}!',
      message: 'Hey! I booked a stay at {propertyName} in {propertyLocation} from {checkIn} to {checkOut}. Would you like to join me? The {roomType} looks amazing! 🏨✨',
      includeImage: true,
      includeQR: false,
      includeDetails: true
    },
    {
      id: 'confirmation',
      name: 'Booking Confirmation',
      title: 'My Hotel Booking - {confirmationNumber}',
      message: 'Here are my hotel booking details for {propertyName}. Check-in: {checkIn}, Check-out: {checkOut}. Room: {roomType}. Can\'t wait for this trip! 🎉',
      includeImage: true,
      includeQR: true,
      includeDetails: true
    },
    {
      id: 'itinerary',
      name: 'Travel Itinerary',
      title: 'Travel Plans - {propertyLocation}',
      message: 'Sharing my travel itinerary with you. Staying at {propertyName} from {checkIn} to {checkOut}. Looking forward to exploring {propertyLocation}! 🧳',
      includeImage: true,
      includeQR: false,
      includeDetails: true
    },
    {
      id: 'recommendation',
      name: 'Hotel Recommendation',
      title: 'Check out this amazing hotel!',
      message: 'I just booked {propertyName} in {propertyLocation} and it looks incredible! You should definitely consider it for your next trip. The amenities are fantastic! ⭐',
      includeImage: true,
      includeQR: false,
      includeDetails: false
    },
    {
      id: 'emergency',
      name: 'Emergency Contact Info',
      title: 'My Hotel Information - Emergency',
      message: 'For emergency purposes, here\'s where I\'ll be staying: {propertyName}, {propertyLocation}. Check-in: {checkIn}, Check-out: {checkOut}. Confirmation: {confirmationNumber}',
      includeImage: false,
      includeQR: true,
      includeDetails: true
    }
  ]

  const contactGroups: ContactGroup[] = [
    {
      id: 'family',
      name: 'Family',
      contacts: [
        { id: 'contact-1', name: 'Mom', email: 'mom@example.com', phone: '+1234567890' },
        { id: 'contact-2', name: 'Dad', email: 'dad@example.com', phone: '+1234567891' },
        { id: 'contact-3', name: 'Sister', email: 'sister@example.com', phone: '+1234567892' }
      ]
    },
    {
      id: 'friends',
      name: 'Friends',
      contacts: [
        { id: 'contact-4', name: 'Alice', email: 'alice@example.com', phone: '+1234567893' },
        { id: 'contact-5', name: 'Bob', email: 'bob@example.com', phone: '+1234567894' },
        { id: 'contact-6', name: 'Charlie', email: 'charlie@example.com', phone: '+1234567895' }
      ]
    },
    {
      id: 'work',
      name: 'Work',
      contacts: [
        { id: 'contact-7', name: 'Manager', email: 'manager@company.com' },
        { id: 'contact-8', name: 'Assistant', email: 'assistant@company.com' }
      ]
    }
  ]

  React.useEffect(() => {
    setBooking(mockBooking)
    generateShareableUrl()
  }, [])

  const generateShareableUrl = async () => {
    setIsGeneratingLink(true)
    try {
      // Simulate API call to generate shareable link
      await new Promise(resolve => setTimeout(resolve, 1000))
      const baseUrl = window.location.origin
      const shareId = Math.random().toString(36).substring(2, 15)
      const url = `${baseUrl}/booking/share/${shareId}`
      setShareUrl(url)
    } catch (error) {
      console.error('Failed to generate shareable URL:', error)
    } finally {
      setIsGeneratingLink(false)
    }
  }

  const handleQuickShare = async (optionId: string) => {
    if (!booking) return

    const option = shareOptions.find(opt => opt.id === optionId)
    if (!option) return

    const shareData = formatShareData(booking, shareTemplates[0])

    try {
      switch (optionId) {
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.message + '\n\n' + shareUrl)}`
          window.open(whatsappUrl, '_blank')
          break

        case 'email':
          const emailUrl = `mailto:?subject=${encodeURIComponent(shareData.title)}&body=${encodeURIComponent(shareData.message + '\n\n' + shareUrl)}`
          window.open(emailUrl)
          break

        case 'sms':
          const smsUrl = `sms:?body=${encodeURIComponent(shareData.message + ' ' + shareUrl)}`
          window.open(smsUrl)
          break

        case 'facebook':
          const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareData.message)}`
          window.open(fbUrl, '_blank')
          break

        case 'twitter':
          const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.message)}&url=${encodeURIComponent(shareUrl)}`
          window.open(twitterUrl, '_blank')
          break

        case 'copy-link':
          await navigator.clipboard.writeText(shareUrl)
          showSuccessMessage('Link copied to clipboard!')
          break

        case 'qr-code':
          generateQRCode()
          break

        case 'pdf':
          generatePDF()
          break

        default:
          if (navigator.share) {
            await navigator.share({
              title: shareData.title,
              text: shareData.message,
              url: shareUrl
            })
          }
      }

      // Log share activity
      logShareActivity(optionId, option.name)
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const formatShareData = (booking: BookingDetails, template: ShareTemplate) => {
    let message = template.message
      .replace('{propertyName}', booking.propertyName)
      .replace('{propertyLocation}', booking.propertyLocation)
      .replace('{checkIn}', booking.checkInDate)
      .replace('{checkOut}', booking.checkOutDate)
      .replace('{roomType}', booking.roomType)
      .replace('{confirmationNumber}', booking.confirmationNumber)

    let title = template.title
      .replace('{propertyName}', booking.propertyName)
      .replace('{propertyLocation}', booking.propertyLocation)
      .replace('{confirmationNumber}', booking.confirmationNumber)

    return { title, message }
  }

  const generateQRCode = () => {
    if (!canvasRef.current || !shareUrl) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simple QR code generation (in production, use a proper QR library)
    const size = 200
    canvas.width = size
    canvas.height = size

    // Fill background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Draw QR pattern
    ctx.fillStyle = '#000000'
    const moduleSize = size / 25

    // Simple pattern based on URL
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        const hash = shareUrl.charCodeAt((x + y) % shareUrl.length)
        if (hash % 2 === 0) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        }
      }
    }

    // Download QR code
    const link = document.createElement('a')
    link.download = `booking-${booking?.confirmationNumber}-qr.png`
    link.href = canvas.toDataURL()
    link.click()

    showSuccessMessage('QR code downloaded!')
  }

  const generatePDF = () => {
    if (!booking) return

    // In production, use a proper PDF library like jsPDF
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking Details - ${booking.confirmationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; color: #1e40af; margin-bottom: 30px; }
            .booking-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .label { font-weight: bold; color: #374151; }
            .amenities { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .amenity { background: #f3f4f6; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Booking Confirmation</h1>
            <h2>${booking.propertyName}</h2>
            <p>${booking.propertyLocation}</p>
          </div>

          <div class="booking-card">
            <div class="detail-row">
              <span class="label">Confirmation Number:</span>
              <span>${booking.confirmationNumber}</span>
            </div>
            <div class="detail-row">
              <span class="label">Guest Name:</span>
              <span>${booking.guestName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Check-in Date:</span>
              <span>${booking.checkInDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Check-out Date:</span>
              <span>${booking.checkOutDate}</span>
            </div>
            <div class="detail-row">
              <span class="label">Room Type:</span>
              <span>${booking.roomType}</span>
            </div>
            ${booking.roomNumber ? `
            <div class="detail-row">
              <span class="label">Room Number:</span>
              <span>${booking.roomNumber}</span>
            </div>
            ` : ''}
            <div class="detail-row">
              <span class="label">Number of Guests:</span>
              <span>${booking.guests}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Amount:</span>
              <span>$${booking.totalAmount}</span>
            </div>
          </div>

          ${booking.amenities.length > 0 ? `
          <div class="booking-card">
            <h3>Included Amenities</h3>
            <div class="amenities">
              ${booking.amenities.map(amenity => `<span class="amenity">${amenity}</span>`).join('')}
            </div>
          </div>
          ` : ''}

          ${booking.specialRequests.length > 0 ? `
          <div class="booking-card">
            <h3>Special Requests</h3>
            <ul>
              ${booking.specialRequests.map(request => `<li>${request}</li>`).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="booking-card">
            <h3>Booking Details URL</h3>
            <p>${shareUrl}</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()

    showSuccessMessage('PDF generated and ready to print!')
  }

  const logShareActivity = (methodId: string, methodName: string) => {
    const activity = {
      id: Date.now().toString(),
      method: methodName,
      timestamp: new Date().toISOString(),
      bookingId: booking?.id
    }

    setShareHistory(prev => [activity, ...prev.slice(0, 9)]) // Keep last 10
  }

  const showSuccessMessage = (message: string) => {
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  const handleCustomShare = async () => {
    if (!selectedTemplate || !booking) return

    const shareData = formatShareData(booking, selectedTemplate)
    const finalMessage = customMessage || shareData.message

    // Handle custom sharing logic here
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: finalMessage,
          url: shareUrl
        })
        showSuccessMessage('Shared successfully!')
      } catch (error) {
        console.error('Share failed:', error)
      }
    }
  }

  const renderQuickShare = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {shareOptions.map(option => (
          <Button
            key={option.id}
            variant="outline"
            className="h-auto p-4 flex-col gap-2"
            onClick={() => handleQuickShare(option.id)}
          >
            <div className={`w-8 h-8 rounded-full ${option.color} flex items-center justify-center`}>
              <option.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs">{option.name}</span>
          </Button>
        ))}
      </div>

      {shareUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shareable Link</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleQuickShare('copy-link')}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Anyone with this link can view your booking details
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderCustomShare = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Choose Template</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {shareTemplates.map(template => (
              <div
                key={template.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs text-gray-600">{template.message.substring(0, 100)}...</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Customize Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={customMessage || formatShareData(booking!, selectedTemplate).message}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  placeholder="Customize your message..."
                />
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTemplate.includeImage}
                  readOnly
                />
                <span>Include hotel image</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTemplate.includeQR}
                  readOnly
                />
                <span>Include QR code</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTemplate.includeDetails}
                  readOnly
                />
                <span>Include booking details</span>
              </div>

              <Button onClick={handleCustomShare} className="w-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share with Custom Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderContactShare = () => (
    <div className="space-y-4">
      {contactGroups.map(group => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle className="text-lg">{group.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.contacts.map(contact => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                    selectedContacts.includes(contact.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedContacts(prev =>
                      prev.includes(contact.id)
                        ? prev.filter(id => id !== contact.id)
                        : [...prev, contact.id]
                    )
                  }}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{contact.name}</p>
                    {contact.email && (
                      <p className="text-xs text-gray-500">{contact.email}</p>
                    )}
                  </div>
                  {selectedContacts.includes(contact.id) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {selectedContacts.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading booking details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <div className="text-center">
            <Share2 className="w-8 h-8 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Share Booking</h1>
            <p className="text-blue-100 text-sm">Share your travel plans</p>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="p-4">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Bed className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{booking.propertyName}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {booking.propertyLocation}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.checkInDate} - {booking.checkOutDate}
                  </p>
                  <p className="text-sm font-medium">{booking.roomType}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">${booking.totalAmount}</p>
                  <p className="text-xs text-gray-500">{booking.confirmationNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Share Method Tabs */}
          <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
            {[
              { id: 'quick', label: 'Quick' },
              { id: 'custom', label: 'Custom' },
              { id: 'contacts', label: 'Contacts' }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setShareMethod(method.id as any)}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  shareMethod === method.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {shareMethod === 'quick' && renderQuickShare()}
          {shareMethod === 'custom' && renderCustomShare()}
          {shareMethod === 'contacts' && renderContactShare()}

          {/* Recent Shares */}
          {shareHistory.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Recent Shares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {shareHistory.slice(0, 3).map(activity => (
                    <div key={activity.id} className="flex justify-between items-center">
                      <span className="text-sm">{activity.method}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="text-sm">Shared successfully!</span>
            </div>
          </div>
        )}

        {/* Hidden canvas for QR generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  )
}