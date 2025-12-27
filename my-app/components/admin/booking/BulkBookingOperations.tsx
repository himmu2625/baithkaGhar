"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Edit,
  XCircle,
  CheckCircle,
  Check,
  FileText,
  Calendar as CalendarIcon,
  Home,
  AlertTriangle,
  Users,
  Settings,
  Play,
  Loader2,
  CheckSquare,
  Square
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"

interface BulkOperationConfig {
  key: string
  label: string
  description: string
  fields: string[]
  icon: string
  warning?: string
}

interface SelectedBooking {
  id: string
  bookingCode: string
  status: string
  guestName: string
  propertyName: string
  dateFrom: string
  dateTo: string
  totalPrice: number
  canCancel?: boolean
  canConfirm?: boolean
  canComplete?: boolean
}

interface BulkOperationResult {
  success: Array<{
    bookingId: string
    bookingCode: string
    operation: string
    guestName: string
    propertyName: string
    refundAmount?: number
  }>
  failed: Array<{
    bookingId: string
    bookingCode: string
    error: string
    guestName: string
    propertyName: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
    totalRefunded: number
    totalValue: number
  }
}

interface BulkBookingOperationsProps {
  selectedBookings: SelectedBooking[]
  onSelectionChange: (bookingIds: string[]) => void
  onOperationComplete: () => void
  allBookings: SelectedBooking[]
}

export default function BulkBookingOperations({
  selectedBookings,
  onSelectionChange,
  onOperationComplete,
  allBookings
}: BulkBookingOperationsProps) {
  const [operations, setOperations] = useState<BulkOperationConfig[]>([])
  const [selectedOperation, setSelectedOperation] = useState<string>("")
  const [operationData, setOperationData] = useState<any>({})
  const [showOperationDialog, setShowOperationDialog] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null)
  const [showResultDialog, setShowResultDialog] = useState(false)

  useEffect(() => {
    fetchOperations()
  }, [])

  const fetchOperations = async () => {
    try {
      const response = await fetch('/api/admin/bookings/bulk')
      if (response.ok) {
        const data = await response.json()
        setOperations(data.operations)
      }
    } catch (error) {
      // Failed to fetch operations
    }
  }

  const getOperationIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      edit: Edit,
      'x-circle': XCircle,
      'check-circle': CheckCircle,
      check: Check,
      'file-text': FileText,
      calendar: CalendarIcon,
      home: Home
    }
    const IconComponent = icons[iconName] || Settings
    return <IconComponent className="h-4 w-4" />
  }

  const canPerformOperation = (operation: string) => {
    switch (operation) {
      case 'cancel':
        return selectedBookings.some(b => ['pending', 'confirmed'].includes(b.status))
      case 'confirm':
        return selectedBookings.some(b => b.status === 'pending')
      case 'complete':
        return selectedBookings.some(b => b.status === 'confirmed')
      default:
        return selectedBookings.length > 0
    }
  }

  const handleOperationSelect = (operationKey: string) => {
    setSelectedOperation(operationKey)
    setOperationData({
      notifyGuests: false,
      notes: "",
      reason: "",
      newDateFrom: "",
      newDateTo: ""
    })
    setShowOperationDialog(true)
  }

  const executeOperation = async () => {
    setProcessing(true)
    setShowConfirmDialog(false)
    
    try {
      const requestData = {
        operation: selectedOperation,
        bookingIds: selectedBookings.map(b => b.id),
        data: operationData
      }

      const response = await fetch('/api/admin/bookings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (response.ok) {
        setOperationResult(result)
        setShowResultDialog(true)
        onOperationComplete()
        
        toast({
          title: "Bulk Operation Completed",
          description: `${result.summary.successful}/${result.summary.total} bookings processed successfully`,
          variant: result.summary.failed > 0 ? "default" : "default"
        })
      } else {
        throw new Error(result.error || 'Operation failed')
      }
    } catch (error: any) {
      toast({
        title: "Operation Failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setProcessing(false)
      setShowOperationDialog(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(allBookings.map(b => b.id))
    } else {
      onSelectionChange([])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const selectedOperation_ = operations.find(op => op.key === selectedOperation)

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      {selectedBookings.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold">{selectedBookings.length} bookings selected</span>
                </div>
                <Badge variant="secondary">
                  Total Value: {formatCurrency(selectedBookings.reduce((sum, b) => sum + b.totalPrice, 0))}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onSelectionChange([])}
              >
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {operations.map((operation) => {
          const isEnabled = selectedBookings.length > 0 && canPerformOperation(operation.key)
          
          return (
            <Button
              key={operation.key}
              variant={operation.key === 'cancel' ? "destructive" : "outline"}
              className={`h-auto p-4 text-left ${!isEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!isEnabled}
              onClick={() => handleOperationSelect(operation.key)}
            >
              <div className="flex items-start space-x-3">
                {getOperationIcon(operation.icon)}
                <div>
                  <div className="font-semibold">{operation.label}</div>
                  <div className="text-xs opacity-75 mt-1">{operation.description}</div>
                  {operation.warning && (
                    <div className="flex items-center space-x-1 mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="text-xs">{operation.warning}</span>
                    </div>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Quick Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center">
            <CheckSquare className="h-4 w-4 mr-2" />
            Quick Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange(allBookings.filter(b => b.status === 'pending').map(b => b.id))}
            >
              Select Pending ({allBookings.filter(b => b.status === 'pending').length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange(allBookings.filter(b => b.status === 'confirmed').map(b => b.id))}
            >
              Select Confirmed ({allBookings.filter(b => b.status === 'confirmed').length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectionChange(allBookings.filter(b => new Date(b.dateFrom) <= new Date(Date.now() + 7*24*60*60*1000)).map(b => b.id))}
            >
              Select Check-in This Week
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Operation Configuration Dialog */}
      <Dialog open={showOperationDialog} onOpenChange={setShowOperationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {selectedOperation_ && getOperationIcon(selectedOperation_.icon)}
              <span className="ml-2">{selectedOperation_?.label}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedOperation_?.description}
              <br />
              <span className="font-semibold">{selectedBookings.length} bookings will be affected</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status Selection */}
            {selectedOperation_?.fields.includes('status') && (
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select
                  value={operationData.status || ''}
                  onValueChange={(value) => setOperationData({...operationData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            {selectedOperation_?.fields.includes('notes') && (
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  placeholder="Add notes about this operation..."
                  value={operationData.notes || ''}
                  onChange={(e) => setOperationData({...operationData, notes: e.target.value})}
                />
              </div>
            )}

            {/* Cancellation Reason */}
            {selectedOperation_?.fields.includes('reason') && (
              <div className="space-y-2">
                <Label>Cancellation Reason</Label>
                <Textarea
                  placeholder="Why are these bookings being cancelled?"
                  value={operationData.reason || ''}
                  onChange={(e) => setOperationData({...operationData, reason: e.target.value})}
                />
              </div>
            )}

            {/* Date Updates */}
            {selectedOperation_?.fields.includes('newDateFrom') && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>New Check-in Date</Label>
                  <Input
                    type="date"
                    value={operationData.newDateFrom || ''}
                    onChange={(e) => setOperationData({...operationData, newDateFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Check-out Date</Label>
                  <Input
                    type="date"
                    value={operationData.newDateTo || ''}
                    onChange={(e) => setOperationData({...operationData, newDateTo: e.target.value})}
                  />
                </div>
              </div>
            )}

            {/* Notify Guests */}
            {selectedOperation_?.fields.includes('notifyGuests') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyGuests"
                  checked={operationData.notifyGuests || false}
                  onCheckedChange={(checked) => 
                    setOperationData({...operationData, notifyGuests: checked})
                  }
                />
                <Label htmlFor="notifyGuests">Send email notifications to guests</Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOperationDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => setShowConfirmDialog(true)}
              variant={selectedOperation === 'cancel' ? "destructive" : "default"}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Confirm Bulk Operation
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to perform "{selectedOperation_?.label}" on {selectedBookings.length} bookings.
              {selectedOperation === 'cancel' && " This will process refunds automatically."}
              {operationData.notifyGuests && " Email notifications will be sent to all affected guests."}
              <br /><br />
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeOperation}
              className={selectedOperation === 'cancel' ? "bg-red-600 hover:bg-red-700" : ""}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Execute Operation
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Operation Results</DialogTitle>
            <DialogDescription>
              Operation completed. Here's what happened:
            </DialogDescription>
          </DialogHeader>

          {operationResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{operationResult.summary.total}</div>
                  <div className="text-sm text-blue-700">Total Processed</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{operationResult.summary.successful}</div>
                  <div className="text-sm text-green-700">Successful</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="text-2xl font-bold text-red-900">{operationResult.summary.failed}</div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                {operationResult.summary.totalRefunded > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-lg font-bold text-purple-900">
                      {formatCurrency(operationResult.summary.totalRefunded)}
                    </div>
                    <div className="text-sm text-purple-700">Total Refunded</div>
                  </div>
                )}
              </div>

              {/* Success List */}
              {operationResult.success.length > 0 && (
                <div>
                  <h4 className="font-semibold text-green-900 mb-2">Successful Operations</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {operationResult.success.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-green-50 p-2 rounded">
                        <span>{item.bookingCode} - {item.guestName}</span>
                        {item.refundAmount && (
                          <Badge variant="secondary">{formatCurrency(item.refundAmount)} refunded</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Failure List */}
              {operationResult.failed.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-900 mb-2">Failed Operations</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {operationResult.failed.map((item, index) => (
                      <div key={index} className="text-sm bg-red-50 p-2 rounded">
                        <div className="font-medium">{item.bookingCode} - {item.guestName}</div>
                        <div className="text-red-600 text-xs">{item.error}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowResultDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}