"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  CheckSquare,
  Square,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle,
  Mail,
  Printer,
  Download,
  CreditCard,
  RefreshCw,
  Trash2,
  Edit,
  Send,
  Calendar,
  IndianRupee,
  Users,
  Clock,
  Package
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

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
  contactDetails?: {
    name: string
    email: string
    phone: string
  }
}

interface BulkBookingOperationsProps {
  bookings: Booking[]
  selectedBookings: string[]
  onSelectionChange: (bookingIds: string[]) => void
  onBulkOperationComplete: () => void
}

interface BulkOperation {
  type: 'status' | 'payment' | 'email' | 'export' | 'delete' | 'notes'
  label: string
  icon: React.ReactNode
  description: string
  requiresConfirmation: boolean
  dangerousAction?: boolean
}

const BULK_OPERATIONS: BulkOperation[] = [
  {
    type: 'status',
    label: 'Update Status',
    icon: <Check className="h-4 w-4" />,
    description: 'Change booking status for selected bookings',
    requiresConfirmation: true
  },
  {
    type: 'payment',
    label: 'Update Payment',
    icon: <CreditCard className="h-4 w-4" />,
    description: 'Change payment status for selected bookings',
    requiresConfirmation: true
  },
  {
    type: 'email',
    label: 'Send Email',
    icon: <Mail className="h-4 w-4" />,
    description: 'Send email notifications to selected guests',
    requiresConfirmation: true
  },
  {
    type: 'export',
    label: 'Export Data',
    icon: <Download className="h-4 w-4" />,
    description: 'Export selected bookings to CSV/Excel',
    requiresConfirmation: false
  },
  {
    type: 'delete',
    label: 'Cancel Bookings',
    icon: <X className="h-4 w-4" />,
    description: 'Cancel multiple bookings at once',
    requiresConfirmation: true,
    dangerousAction: true
  }
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-100 text-blue-800' }
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Payment Pending', color: 'bg-orange-100 text-orange-800' },
  { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
  { value: 'failed', label: 'Payment Failed', color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-100 text-purple-800' }
]

const EMAIL_TEMPLATES = [
  { value: 'confirmation', label: 'Booking Confirmation' },
  { value: 'reminder', label: 'Check-in Reminder' },
  { value: 'feedback', label: 'Feedback Request' },
  { value: 'thankyou', label: 'Thank You Message' },
  { value: 'custom', label: 'Custom Message' }
]

export function BulkBookingOperations({
  bookings,
  selectedBookings,
  onSelectionChange,
  onBulkOperationComplete
}: BulkBookingOperationsProps) {
  const { toast } = useToast()
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false)
  const [currentOperation, setCurrentOperation] = useState<BulkOperation | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Operation-specific states
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [emailTemplate, setEmailTemplate] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [cancellationReason, setCancellationReason] = useState('')
  const [refundAmount, setRefundAmount] = useState('')

  const selectedBookingObjects = bookings.filter(booking => selectedBookings.includes(booking._id))

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(bookings.map(booking => booking._id))
    }
  }

  const handleSelectBooking = (bookingId: string) => {
    if (selectedBookings.includes(bookingId)) {
      onSelectionChange(selectedBookings.filter(id => id !== bookingId))
    } else {
      onSelectionChange([...selectedBookings, bookingId])
    }
  }

  const openOperationDialog = (operation: BulkOperation) => {
    setCurrentOperation(operation)
    setIsOperationDialogOpen(true)
    // Reset form states
    setNewStatus('')
    setNewPaymentStatus('')
    setEmailTemplate('')
    setCustomMessage('')
    setCancellationReason('')
    setRefundAmount('')
  }

  const executeOperation = async () => {
    if (!currentOperation || selectedBookings.length === 0) return

    setIsProcessing(true)

    try {
      let endpoint = ''
      let payload: any = {
        bookingIds: selectedBookings
      }

      switch (currentOperation.type) {
        case 'status':
          endpoint = `/api/os/bookings/bulk/status`
          payload.status = newStatus
          break

        case 'payment':
          endpoint = `/api/os/bookings/bulk/payment`
          payload.paymentStatus = newPaymentStatus
          break

        case 'email':
          endpoint = `/api/os/bookings/bulk/email`
          payload.template = emailTemplate
          if (emailTemplate === 'custom') {
            payload.customMessage = customMessage
          }
          break

        case 'export':
          endpoint = `/api/os/bookings/bulk/export`
          // Handle export differently - download file
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (response.ok) {
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast({
              title: "Export Completed",
              description: `${selectedBookings.length} bookings exported successfully`
            })
          }
          setIsOperationDialogOpen(false)
          setIsProcessing(false)
          return

        case 'delete':
          endpoint = `/api/os/bookings/bulk/cancel`
          payload.reason = cancellationReason
          if (refundAmount) {
            payload.refundAmount = parseFloat(refundAmount)
          }
          break

        default:
          throw new Error('Unknown operation type')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Operation Completed",
          description: `${currentOperation.label} applied to ${selectedBookings.length} booking(s)`
        })

        setIsOperationDialogOpen(false)
        onSelectionChange([]) // Clear selection
        onBulkOperationComplete() // Refresh data
      } else {
        throw new Error(result.error || 'Operation failed')
      }
    } catch (error) {
      console.error('Bulk operation error:', error)
      toast({
        title: "Operation Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getTotalAmount = () => {
    return selectedBookingObjects.reduce((total, booking) => total + booking.totalAmount, 0)
  }

  const getTotalGuests = () => {
    return selectedBookingObjects.reduce((total, booking) => total + booking.adults + booking.children, 0)
  }

  const getStatusDistribution = () => {
    const distribution: Record<string, number> = {}
    selectedBookingObjects.forEach(booking => {
      distribution[booking.status] = (distribution[booking.status] || 0) + 1
    })
    return distribution
  }

  if (bookings.length === 0) {
    return null
  }

  return (
    <>
      {/* Selection Controls */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Checkbox
                checked={selectedBookings.length === bookings.length && bookings.length > 0}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-blue-600"
              />
              <div className="text-sm">
                {selectedBookings.length === 0 ? (
                  "Select bookings for bulk operations"
                ) : (
                  <span className="font-medium">
                    {selectedBookings.length} of {bookings.length} booking(s) selected
                  </span>
                )}
              </div>

              {selectedBookings.length > 0 && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <IndianRupee className="h-4 w-4" />
                    <span>{formatCurrency(getTotalAmount())}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{getTotalGuests()} guests</span>
                  </div>
                </div>
              )}
            </div>

            {selectedBookings.length > 0 && (
              <div className="flex items-center space-x-2">
                {BULK_OPERATIONS.map((operation) => (
                  <Button
                    key={operation.type}
                    variant="outline"
                    size="sm"
                    onClick={() => openOperationDialog(operation)}
                    className={cn(
                      "flex items-center space-x-1",
                      operation.dangerousAction && "border-red-200 text-red-700 hover:bg-red-50"
                    )}
                  >
                    {operation.icon}
                    <span>{operation.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Selection Summary */}
          {selectedBookings.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Status Distribution</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.entries(getStatusDistribution()).map(([status, count]) => {
                      const statusConfig = STATUS_OPTIONS.find(s => s.value === status)
                      return (
                        <Badge
                          key={status}
                          className={statusConfig?.color || "bg-gray-100 text-gray-800"}
                          variant="outline"
                        >
                          {statusConfig?.label || status}: {count}
                        </Badge>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">Date Range</div>
                  <div className="font-medium">
                    {selectedBookingObjects.length > 0 && (
                      <>
                        {new Date(Math.min(...selectedBookingObjects.map(b => new Date(b.dateFrom).getTime()))).toLocaleDateString()}
                        {" - "}
                        {new Date(Math.max(...selectedBookingObjects.map(b => new Date(b.dateTo).getTime()))).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">Total Rooms</div>
                  <div className="font-medium">
                    {selectedBookingObjects.reduce((total, booking) => total + booking.rooms, 0)}
                  </div>
                </div>

                <div>
                  <div className="text-gray-500">Avg. Amount</div>
                  <div className="font-medium">
                    {formatCurrency(getTotalAmount() / selectedBookings.length)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Operation Dialog */}
      <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentOperation?.icon}
              {currentOperation?.label}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                This operation will be applied to {selectedBookings.length} selected booking(s).
              </AlertDescription>
            </Alert>

            {/* Operation-specific forms */}
            {currentOperation?.type === 'status' && (
              <div>
                <Label htmlFor="newStatus">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentOperation?.type === 'payment' && (
              <div>
                <Label htmlFor="newPaymentStatus">New Payment Status</Label>
                <Select value={newPaymentStatus} onValueChange={setNewPaymentStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new payment status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentOperation?.type === 'email' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emailTemplate">Email Template</Label>
                  <Select value={emailTemplate} onValueChange={setEmailTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select email template" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((template) => (
                        <SelectItem key={template.value} value={template.value}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {emailTemplate === 'custom' && (
                  <div>
                    <Label htmlFor="customMessage">Custom Message</Label>
                    <Textarea
                      id="customMessage"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Enter your custom message..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            )}

            {currentOperation?.type === 'delete' && (
              <div className="space-y-4">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    This action will cancel {selectedBookings.length} booking(s). This action cannot be undone.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="cancellationReason">Cancellation Reason *</Label>
                  <Textarea
                    id="cancellationReason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Provide a reason for cancellation..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="refundAmount">Refund Amount (optional)</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="refundAmount"
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      placeholder="Enter refund amount"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentOperation?.type === 'export' && (
              <div>
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertDescription>
                    A CSV file containing {selectedBookings.length} booking(s) will be downloaded to your device.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Selected Bookings Preview */}
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-3">Selected Bookings Preview</h4>
              <div className="space-y-2">
                {selectedBookingObjects.slice(0, 5).map((booking) => (
                  <div key={booking._id} className="flex items-center justify-between text-sm border rounded p-2">
                    <div>
                      <div className="font-medium">
                        {booking.contactDetails?.name || booking.userId.name}
                      </div>
                      <div className="text-gray-500">
                        {new Date(booking.dateFrom).toLocaleDateString()} - {new Date(booking.dateTo).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(booking.totalAmount)}</div>
                      <Badge className={STATUS_OPTIONS.find(s => s.value === booking.status)?.color || "bg-gray-100"}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {selectedBookingObjects.length > 5 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    ... and {selectedBookingObjects.length - 5} more booking(s)
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOperationDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={executeOperation}
              disabled={
                isProcessing ||
                (currentOperation?.type === 'status' && !newStatus) ||
                (currentOperation?.type === 'payment' && !newPaymentStatus) ||
                (currentOperation?.type === 'email' && !emailTemplate) ||
                (currentOperation?.type === 'delete' && !cancellationReason) ||
                (emailTemplate === 'custom' && !customMessage)
              }
              className={cn(
                currentOperation?.dangerousAction && "bg-red-600 hover:bg-red-700"
              )}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentOperation?.icon}
                  <span className="ml-2">
                    {currentOperation?.type === 'delete' ? 'Cancel Bookings' : 'Execute Operation'}
                  </span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}