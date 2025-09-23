"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Eye,
  User,
  Calendar,
  Users,
  IndianRupee,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CreditCard,
  MessageSquare,
  FileText,
  Download,
  Printer,
  Share2,
  History,
  Star,
  Bed,
  Utensils,
  Car,
  Wifi,
  Shield
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface Booking {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
    phone?: string
  }
  propertyId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  dateFrom: string
  dateTo: string
  totalAmount: number
  adults: number
  children: number
  rooms: number
  specialRequests?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  contactDetails?: {
    name: string
    email: string
    phone: string
  }
  checkInTime?: string
  checkOutTime?: string
  rating?: number
  review?: string
  paymentId?: string
  refundAmount?: number
  refundReason?: string
  allocatedRoom?: {
    unitTypeCode: string
    unitTypeName: string
    roomNumber: string
    roomId: string
  }
}

interface BookingDetailsViewProps {
  booking: Booking
  triggerButton?: React.ReactNode
  onActionComplete?: () => void
}

const STATUS_CONFIG = {
  pending: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    label: 'Pending'
  },
  confirmed: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle2,
    label: 'Confirmed'
  },
  cancelled: {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    label: 'Cancelled'
  },
  completed: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Star,
    label: 'Completed'
  }
}

const PAYMENT_STATUS_CONFIG = {
  pending: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    label: 'Payment Pending'
  },
  paid: {
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Paid'
  },
  failed: {
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Payment Failed'
  },
  refunded: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    label: 'Refunded'
  }
}

export function BookingDetailsView({
  booking,
  triggerButton,
  onActionComplete
}: BookingDetailsViewProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const statusConfig = STATUS_CONFIG[booking.status]
  const paymentConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus || 'pending']
  const StatusIcon = statusConfig.icon

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy - h:mm a')
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'EEEE, MMMM d, yyyy')
  }

  const checkInDate = new Date(booking.dateFrom)
  const checkOutDate = new Date(booking.dateTo)
  const nights = differenceInDays(checkOutDate, checkInDate)
  const pricePerNight = booking.totalAmount / nights

  const guestName = booking.contactDetails?.name || booking.userId.name
  const guestEmail = booking.contactDetails?.email || booking.userId.email
  const guestPhone = booking.contactDetails?.phone || booking.userId.phone

  const downloadInvoice = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch(`/api/os/bookings/${booking.propertyId}/${booking._id}/invoice`)

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `invoice-${booking._id.slice(-8)}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        toast({
          title: "Invoice Downloaded",
          description: "Booking invoice has been downloaded successfully."
        })
      } else {
        throw new Error('Failed to download invoice')
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download invoice. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const shareBooking = async () => {
    const bookingUrl = `${window.location.origin}/booking/${booking._id}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking Details - ${guestName}`,
          text: `Booking from ${format(checkInDate, 'MMM d')} to ${format(checkOutDate, 'MMM d')}`,
          url: bookingUrl
        })
      } catch (error) {
        // Share cancelled or failed
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(bookingUrl)
      toast({
        title: "Link Copied",
        description: "Booking link has been copied to clipboard."
      })
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Eye className="h-4 w-4 mr-1" />
      View Details
    </Button>
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <StatusIcon className="h-6 w-6" />
            <div>
              <span>Booking Details</span>
              <div className="text-sm font-normal text-gray-500 mt-1">
                ID: {booking._id.slice(-8)} • {guestName}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <Badge className={paymentConfig.color}>
                    <CreditCard className="h-3 w-3 mr-1" />
                    {paymentConfig.label}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    Created {formatDateTime(booking.createdAt)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                  <div className="text-sm text-gray-500">Total Amount</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="guest">Guest Info</TabsTrigger>
              <TabsTrigger value="stay">Stay Details</TabsTrigger>
              <TabsTrigger value="payment">Payment</TabsTrigger>
              <TabsTrigger value="notes">Notes & History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Booking Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Booking Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-500">Check-in</div>
                        <div className="font-medium">{formatDate(booking.dateFrom)}</div>
                        <div className="text-xs text-gray-400">2:00 PM onwards</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Check-out</div>
                        <div className="font-medium">{formatDate(booking.dateTo)}</div>
                        <div className="text-xs text-gray-400">11:00 AM</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-gray-500">Nights</div>
                        <div className="text-xl font-bold">{nights}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Guests</div>
                        <div className="text-xl font-bold">{booking.adults + booking.children}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Rooms</div>
                        <div className="text-xl font-bold">{booking.rooms}</div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Rate per night:</span>
                        <span>{formatCurrency(pricePerNight)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{nights} nights:</span>
                        <span>{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={downloadInvoice}
                      disabled={isDownloading}
                      className="w-full"
                      variant="outline"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Downloading...' : 'Download Invoice'}
                    </Button>

                    <Button onClick={shareBooking} className="w-full" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Booking
                    </Button>

                    <Button className="w-full" variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Print Details
                    </Button>

                    <Button className="w-full" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Guest
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Room Allocation */}
              {booking.allocatedRoom && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bed className="h-5 w-5" />
                      Room Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Room Number</div>
                          <div className="font-semibold">{booking.allocatedRoom.roomNumber}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Room Type</div>
                          <div className="font-semibold">{booking.allocatedRoom.unitTypeName}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Unit Code</div>
                          <div className="font-semibold">{booking.allocatedRoom.unitTypeCode}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Room ID</div>
                          <div className="font-semibold text-xs">{booking.allocatedRoom.roomId}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Guest Info Tab */}
            <TabsContent value="guest" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="" alt={guestName} />
                      <AvatarFallback className="text-lg">
                        {guestName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{guestName}</h3>
                        <p className="text-gray-600">Primary Guest</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">{guestEmail}</div>
                          </div>
                        </div>

                        {guestPhone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                            <div>
                              <div className="text-sm text-gray-500">Phone</div>
                              <div className="font-medium">{guestPhone}</div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          <Users className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Guest Count</div>
                            <div className="font-medium">
                              {booking.adults} Adults
                              {booking.children > 0 && `, ${booking.children} Children`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Member Since</div>
                            <div className="font-medium">
                              {format(new Date(booking.createdAt), 'MMM yyyy')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Guest Preferences */}
              {booking.specialRequests && (
                <Card>
                  <CardHeader>
                    <CardTitle>Special Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{booking.specialRequests}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Stay Details Tab */}
            <TabsContent value="stay" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Check-in/out Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Check-in & Check-out</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Check-in Time</span>
                        {booking.checkInTime ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <div className="font-medium">
                        {booking.checkInTime
                          ? formatDateTime(booking.checkInTime)
                          : `${formatDate(booking.dateFrom)} - 2:00 PM onwards`
                        }
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Check-out Time</span>
                        {booking.checkOutTime ? (
                          <Badge className="bg-blue-100 text-blue-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Checked Out
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                      <div className="font-medium">
                        {booking.checkOutTime
                          ? formatDateTime(booking.checkOutTime)
                          : `${formatDate(booking.dateTo)} - 11:00 AM`
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Property Amenities */}
                <Card>
                  <CardHeader>
                    <CardTitle>Property Amenities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Free WiFi</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Parking</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Utensils className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Restaurant</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">24/7 Security</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Guest Review */}
              {booking.rating && (booking.review || booking.rating) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5" />
                      Guest Review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {booking.rating && (
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-5 w-5",
                                  i < booking.rating!
                                    ? "text-yellow-400 fill-current"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{booking.rating}/5</span>
                        </div>
                      )}
                      {booking.review && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 italic">"{booking.review}"</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Payment Status</div>
                      <Badge className={paymentConfig.color}>
                        {paymentConfig.label}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="font-semibold text-lg">{formatCurrency(booking.totalAmount)}</div>
                    </div>
                  </div>

                  {booking.paymentId && (
                    <div>
                      <div className="text-sm text-gray-500">Payment ID</div>
                      <div className="font-mono text-sm">{booking.paymentId}</div>
                    </div>
                  )}

                  {booking.refundAmount && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div>Refund Amount: {formatCurrency(booking.refundAmount)}</div>
                          {booking.refundReason && (
                            <div className="text-sm">Reason: {booking.refundReason}</div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Payment Breakdown</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Room charges ({nights} nights):</span>
                        <span>{formatCurrency(booking.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes & fees:</span>
                        <span>Included</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Total paid:</span>
                        <span>{formatCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notes & History Tab */}
            <TabsContent value="notes" className="space-y-4">
              {/* Admin Notes */}
              {booking.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-gray-700">{booking.adminNotes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Booking History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Booking History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Booking Created</div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(booking.createdAt)}
                        </div>
                      </div>
                    </div>

                    {booking.checkInTime && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Guest Checked In</div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(booking.checkInTime)}
                          </div>
                        </div>
                      </div>
                    )}

                    {booking.checkOutTime && (
                      <div className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <div className="font-medium">Guest Checked Out</div>
                          <div className="text-sm text-gray-500">
                            {formatDateTime(booking.checkOutTime)}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-gray-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium">Last Updated</div>
                        <div className="text-sm text-gray-500">
                          {formatDateTime(booking.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Footer Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}