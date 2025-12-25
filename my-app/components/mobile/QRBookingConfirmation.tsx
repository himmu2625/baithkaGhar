'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  QrCode,
  Download,
  Share2,
  Smartphone,
  Calendar,
  MapPin,
  User,
  Bed,
  Clock,
  CheckCircle,
  AlertCircle,
  Camera,
  ScanLine,
  X,
  Mail,
  MessageSquare,
  Printer
} from 'lucide-react'

interface BookingDetails {
  id: string
  confirmationNumber: string
  guestName: string
  email: string
  phone: string
  checkInDate: string
  checkOutDate: string
  roomNumber: string
  roomType: string
  guests: number
  totalAmount: number
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled'
  qrCode?: string
  specialRequests?: string[]
  amenities?: string[]
}

interface QRScanResult {
  bookingId: string
  confirmationNumber: string
  action: 'checkin' | 'verify' | 'service' | 'checkout'
  timestamp: string
}

export default function QRBookingConfirmation() {
  const [booking, setBooking] = useState<BookingDetails | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string>('')
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<QRScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shareOptions, setShareOptions] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Mock booking data
  const mockBooking: BookingDetails = {
    id: 'booking-001',
    confirmationNumber: 'BG-2024-001234',
    guestName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    checkInDate: '2024-01-15',
    checkOutDate: '2024-01-18',
    roomNumber: '205',
    roomType: 'Deluxe King Room',
    guests: 2,
    totalAmount: 450,
    status: 'confirmed',
    specialRequests: ['Late checkout', 'High floor'],
    amenities: ['WiFi', 'Breakfast', 'Parking', 'Gym Access']
  }

  useEffect(() => {
    setBooking(mockBooking)
    generateQRCode(mockBooking)
  }, [])

  const generateQRCode = async (bookingData: BookingDetails) => {
    setIsLoading(true)
    try {
      // Create QR code data with booking information
      const qrData = {
        type: 'booking_confirmation',
        bookingId: bookingData.id,
        confirmationNumber: bookingData.confirmationNumber,
        guestName: bookingData.guestName,
        checkInDate: bookingData.checkInDate,
        roomNumber: bookingData.roomNumber,
        action: 'checkin',
        timestamp: new Date().toISOString(),
        verificationCode: Math.random().toString(36).substring(2, 15)
      }

      const qrString = JSON.stringify(qrData)
      setQrCodeData(qrString)

      // Generate QR code canvas
      await generateQRCanvas(qrString)
    } catch (error) {
      console.error('Error generating QR code:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateQRCanvas = async (data: string) => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simple QR code visualization (in production, use a proper QR library like qrcode)
    const size = 200
    canvas.width = size
    canvas.height = size

    // Fill background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, size, size)

    // Draw QR pattern (simplified visualization)
    ctx.fillStyle = '#000000'
    const moduleSize = size / 25

    // Draw corner markers
    const cornerSize = 7 * moduleSize
    [[0, 0], [0, 18], [18, 0]].forEach(([x, y]) => {
      // Outer square
      ctx.fillRect(x * moduleSize, y * moduleSize, cornerSize, cornerSize)
      // Inner white square
      ctx.fillStyle = '#ffffff'
      ctx.fillRect((x + 1) * moduleSize, (y + 1) * moduleSize, (cornerSize - 2 * moduleSize), (cornerSize - 2 * moduleSize))
      // Inner black square
      ctx.fillStyle = '#000000'
      ctx.fillRect((x + 2) * moduleSize, (y + 2) * moduleSize, (cornerSize - 4 * moduleSize), (cornerSize - 4 * moduleSize))
    })

    // Draw data pattern (random for demo)
    for (let x = 0; x < 25; x++) {
      for (let y = 0; y < 25; y++) {
        // Skip corner markers
        if ((x < 9 && y < 9) || (x < 9 && y > 15) || (x > 15 && y < 9)) continue

        // Random data pattern based on string hash
        const hash = data.charCodeAt((x + y) % data.length)
        if (hash % 2 === 0) {
          ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize)
        }
      }
    }
  }

  const downloadQRCode = () => {
    if (!canvasRef.current || !booking) return

    const canvas = canvasRef.current
    const link = document.createElement('a')
    link.download = `booking-qr-${booking.confirmationNumber}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const shareQRCode = async (method: 'email' | 'sms' | 'social') => {
    if (!booking) return

    const shareText = `Your booking confirmation for ${booking.roomType} at Baithaka Ghar. Check-in: ${booking.checkInDate}. Confirmation: ${booking.confirmationNumber}`
    const shareUrl = `${window.location.origin}/booking/${booking.id}`

    switch (method) {
      case 'email':
        const emailUrl = `mailto:${booking.email}?subject=Booking Confirmation - ${booking.confirmationNumber}&body=${encodeURIComponent(shareText + '\n\nView details: ' + shareUrl)}`
        window.open(emailUrl)
        break
      case 'sms':
        const smsUrl = `sms:${booking.phone}?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
        window.open(smsUrl)
        break
      case 'social':
        if (navigator.share) {
          try {
            await navigator.share({
              title: 'Booking Confirmation',
              text: shareText,
              url: shareUrl
            })
          } catch (error) {
            console.error('Error sharing:', error)
          }
        }
        break
    }
    setShareOptions(false)
  }

  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowScanner(true)
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      alert('Camera access is required for QR scanning')
    }
  }

  const stopQRScanner = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setShowScanner(false)
  }

  const simulateQRScan = () => {
    // Simulate scanning a QR code
    const mockScanResult: QRScanResult = {
      bookingId: 'booking-001',
      confirmationNumber: 'BG-2024-001234',
      action: 'checkin',
      timestamp: new Date().toISOString()
    }
    setScanResult(mockScanResult)
    stopQRScanner()
  }

  const printQRCode = () => {
    if (!canvasRef.current || !booking) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Booking QR Code - ${booking.confirmationNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .booking-details {
              margin: 20px 0;
              border: 1px solid #ccc;
              padding: 15px;
              display: inline-block;
            }
            .qr-code {
              margin: 20px 0;
            }
            @media print {
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Baithaka Ghar - Booking Confirmation</h1>
          <div class="booking-details">
            <h2>Booking Details</h2>
            <p><strong>Confirmation Number:</strong> ${booking.confirmationNumber}</p>
            <p><strong>Guest:</strong> ${booking.guestName}</p>
            <p><strong>Room:</strong> ${booking.roomNumber} - ${booking.roomType}</p>
            <p><strong>Check-in:</strong> ${booking.checkInDate}</p>
            <p><strong>Check-out:</strong> ${booking.checkOutDate}</p>
            <p><strong>Guests:</strong> ${booking.guests}</p>
          </div>
          <div class="qr-code">
            <h3>Check-in QR Code</h3>
            <img src="${dataUrl}" alt="Booking QR Code" style="width: 200px; height: 200px;">
            <p><small>Show this QR code at check-in for fast service</small></p>
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
    `)

    printWindow.document.close()
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <QrCode className="w-8 h-8 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Booking QR Code</h1>
            <p className="text-blue-100 text-sm">Your digital confirmation</p>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Booking Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge
                  variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                  className="capitalize"
                >
                  {booking.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {booking.status}
                </Badge>
                <span className="text-sm text-gray-500">{booking.confirmationNumber}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Guest</p>
                  <p className="font-medium flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {booking.guestName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Room</p>
                  <p className="font-medium flex items-center gap-1">
                    <Bed className="w-4 h-4" />
                    {booking.roomNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Check-in</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {booking.checkInDate}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out</p>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {booking.checkOutDate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Display */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-lg">Your Check-in QR Code</CardTitle>
              <p className="text-center text-sm text-gray-600">
                Show this code at the front desk for instant check-in
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                {isLoading ? (
                  <div className="w-48 h-48 mx-auto flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <canvas
                    ref={canvasRef}
                    className="mx-auto border border-gray-200 rounded"
                    style={{ maxWidth: '200px', maxHeight: '200px' }}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={downloadQRCode}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShareOptions(true)}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={printQRCode}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" size="sm" onClick={startQRScanner}>
                  <Camera className="w-4 h-4 mr-2" />
                  Scan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">At Check-in</p>
                  <p className="text-sm text-gray-600">Show this QR code to front desk staff for instant verification</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Self-Service Kiosks</p>
                  <p className="text-sm text-gray-600">Use our lobby kiosks to scan and check-in automatically</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Room Access</p>
                  <p className="text-sm text-gray-600">Use mobile check-in to get your digital room key</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Data Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">QR Code Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono text-gray-600 break-all">
                {qrCodeData ? qrCodeData.substring(0, 100) + '...' : 'Generating...'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Options Modal */}
        {shareOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Share QR Code</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShareOptions(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareQRCode('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email to myself
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareQRCode('sms')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send via SMS
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => shareQRCode('social')}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share to other apps
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* QR Scanner Modal */}
        {showScanner && (
          <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Scanner overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-white rounded-lg relative">
                    <ScanLine className="w-full h-6 text-white absolute top-1/2 left-0 transform -translate-y-1/2 animate-pulse" />
                  </div>
                  <p className="text-white text-center mt-4">Position QR code within the frame</p>
                </div>
              </div>

              {/* Scanner controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between">
                <Button variant="secondary" onClick={stopQRScanner}>
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button variant="secondary" onClick={simulateQRScan}>
                  Simulate Scan
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scan Result Modal */}
        {scanResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  QR Code Scanned
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Confirmation Number</p>
                  <p className="font-medium">{scanResult.confirmationNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Action</p>
                  <p className="font-medium capitalize">{scanResult.action}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scanned At</p>
                  <p className="font-medium">{new Date(scanResult.timestamp).toLocaleString()}</p>
                </div>
                <Button
                  className="w-full"
                  onClick={() => setScanResult(null)}
                >
                  Continue
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}