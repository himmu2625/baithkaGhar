"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Download,
  FileText,
  Calendar as CalendarIcon,
  Filter,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
  FileImage,
  Package,
  Settings,
  Database,
  Users,
  IndianRupee,
  Clock,
  Mail
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subMonths } from 'date-fns'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface BookingExportProps {
  propertyId: string
  triggerButton?: React.ReactNode
  selectedBookings?: string[]
}

interface ExportFilters {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  status: string[]
  paymentStatus: string[]
  includePersonalInfo: boolean
  includePaymentInfo: boolean
  includeNotes: boolean
}

interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf'
  fields: string[]
  filters: ExportFilters
}

const EXPORT_FORMATS = [
  {
    value: 'csv',
    label: 'CSV (Comma Separated)',
    icon: <FileText className="h-4 w-4" />,
    description: 'Compatible with Excel, Google Sheets',
    fileExtension: '.csv'
  },
  {
    value: 'excel',
    label: 'Excel Workbook',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Native Excel format with formatting',
    fileExtension: '.xlsx'
  },
  {
    value: 'pdf',
    label: 'PDF Report',
    icon: <FileImage className="h-4 w-4" />,
    description: 'Formatted report for printing',
    fileExtension: '.pdf'
  }
]

const EXPORT_FIELDS = [
  { id: 'bookingId', label: 'Booking ID', category: 'basic', required: true },
  { id: 'guestName', label: 'Guest Name', category: 'guest', required: true },
  { id: 'guestEmail', label: 'Guest Email', category: 'guest' },
  { id: 'guestPhone', label: 'Guest Phone', category: 'guest' },
  { id: 'checkIn', label: 'Check-in Date', category: 'dates', required: true },
  { id: 'checkOut', label: 'Check-out Date', category: 'dates', required: true },
  { id: 'nights', label: 'Number of Nights', category: 'dates' },
  { id: 'adults', label: 'Adults', category: 'guests' },
  { id: 'children', label: 'Children', category: 'guests' },
  { id: 'rooms', label: 'Rooms', category: 'booking' },
  { id: 'totalAmount', label: 'Total Amount', category: 'payment', required: true },
  { id: 'status', label: 'Booking Status', category: 'status', required: true },
  { id: 'paymentStatus', label: 'Payment Status', category: 'payment' },
  { id: 'paymentId', label: 'Payment ID', category: 'payment' },
  { id: 'specialRequests', label: 'Special Requests', category: 'details' },
  { id: 'adminNotes', label: 'Admin Notes', category: 'details' },
  { id: 'checkInTime', label: 'Actual Check-in Time', category: 'dates' },
  { id: 'checkOutTime', label: 'Actual Check-out Time', category: 'dates' },
  { id: 'createdAt', label: 'Booking Created', category: 'dates' },
  { id: 'updatedAt', label: 'Last Updated', category: 'dates' },
  { id: 'source', label: 'Booking Source', category: 'booking' },
  { id: 'rating', label: 'Guest Rating', category: 'details' },
  { id: 'review', label: 'Guest Review', category: 'details' }
]

const FIELD_CATEGORIES = [
  { id: 'basic', label: 'Basic Information', icon: <Package className="h-4 w-4" /> },
  { id: 'guest', label: 'Guest Details', icon: <Users className="h-4 w-4" /> },
  { id: 'dates', label: 'Dates & Timeline', icon: <CalendarIcon className="h-4 w-4" /> },
  { id: 'guests', label: 'Guest Count', icon: <Users className="h-4 w-4" /> },
  { id: 'booking', label: 'Booking Details', icon: <Database className="h-4 w-4" /> },
  { id: 'payment', label: 'Payment Information', icon: <IndianRupee className="h-4 w-4" /> },
  { id: 'status', label: 'Status Information', icon: <CheckCircle className="h-4 w-4" /> },
  { id: 'details', label: 'Additional Details', icon: <FileText className="h-4 w-4" /> }
]

const DATE_PRESETS = [
  {
    label: 'This Month',
    getValue: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
  },
  {
    label: 'Last Month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    }
  },
  {
    label: 'This Year',
    getValue: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({ from: subDays(new Date(), 30), to: new Date() })
  },
  {
    label: 'Last 90 Days',
    getValue: () => ({ from: subDays(new Date(), 90), to: new Date() })
  }
]

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'completed', label: 'Completed' }
]

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Payment Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Payment Failed' },
  { value: 'refunded', label: 'Refunded' }
]

export function BookingExport({ propertyId, triggerButton, selectedBookings }: BookingExportProps) {
  const { toast } = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    format: 'csv',
    fields: ['bookingId', 'guestName', 'checkIn', 'checkOut', 'totalAmount', 'status'],
    filters: {
      dateRange: { from: undefined, to: undefined },
      status: [],
      paymentStatus: [],
      includePersonalInfo: true,
      includePaymentInfo: true,
      includeNotes: false
    }
  })

  const updateConfig = (updates: Partial<ExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }))
  }

  const updateFilters = (updates: Partial<ExportFilters>) => {
    setExportConfig(prev => ({
      ...prev,
      filters: { ...prev.filters, ...updates }
    }))
  }

  const handleFieldChange = (fieldId: string, checked: boolean) => {
    const field = EXPORT_FIELDS.find(f => f.id === fieldId)
    if (field?.required && !checked) return // Prevent unchecking required fields

    const newFields = checked
      ? [...exportConfig.fields, fieldId]
      : exportConfig.fields.filter(f => f !== fieldId)

    updateConfig({ fields: newFields })
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    const categoryFields = EXPORT_FIELDS.filter(f => f.category === categoryId)
    let newFields = [...exportConfig.fields]

    categoryFields.forEach(field => {
      if (checked && !newFields.includes(field.id)) {
        newFields.push(field.id)
      } else if (!checked && !field.required) {
        newFields = newFields.filter(f => f !== field.id)
      }
    })

    updateConfig({ fields: newFields })
  }

  const handleDatePreset = (preset: { from: Date; to: Date }) => {
    updateFilters({ dateRange: preset })
  }

  const handleStatusChange = (status: string, checked: boolean) => {
    const newStatus = checked
      ? [...exportConfig.filters.status, status]
      : exportConfig.filters.status.filter(s => s !== status)
    updateFilters({ status: newStatus })
  }

  const handlePaymentStatusChange = (status: string, checked: boolean) => {
    const newPaymentStatus = checked
      ? [...exportConfig.filters.paymentStatus, status]
      : exportConfig.filters.paymentStatus.filter(s => s !== status)
    updateFilters({ paymentStatus: newPaymentStatus })
  }

  const executeExport = async () => {
    setIsExporting(true)

    try {
      const payload = {
        format: exportConfig.format,
        fields: exportConfig.fields,
        filters: exportConfig.filters,
        selectedBookings: selectedBookings || []
      }

      const response = await fetch(`/api/os/bookings/${propertyId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      const formatConfig = EXPORT_FORMATS.find(f => f.value === exportConfig.format)
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      link.download = `bookings-export-${timestamp}${formatConfig?.fileExtension || '.csv'}`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Completed",
        description: `Booking data exported successfully as ${exportConfig.format.toUpperCase()}`
      })

      setIsDialogOpen(false)
    } catch (error) {
      console.error('Export error:', error)
      toast({
        title: "Export Failed",
        description: "Failed to export booking data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }

  const getSelectedFieldsCount = () => exportConfig.fields.length
  const getTotalFieldsCount = () => EXPORT_FIELDS.length

  const getCategoryFieldsCount = (categoryId: string) => {
    const categoryFields = EXPORT_FIELDS.filter(f => f.category === categoryId)
    const selectedCategoryFields = categoryFields.filter(f => exportConfig.fields.includes(f.id))
    return { selected: selectedCategoryFields.length, total: categoryFields.length }
  }

  const isCategorySelected = (categoryId: string) => {
    const { selected, total } = getCategoryFieldsCount(categoryId)
    return selected === total
  }

  const isCategoryPartiallySelected = (categoryId: string) => {
    const { selected, total } = getCategoryFieldsCount(categoryId)
    return selected > 0 && selected < total
  }

  const defaultTrigger = (
    <Button variant="outline">
      <Download className="h-4 w-4 mr-2" />
      Export Data
    </Button>
  )

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || defaultTrigger}
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Booking Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Format</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {EXPORT_FORMATS.map((format) => (
                  <div
                    key={format.value}
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      exportConfig.format === format.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => updateConfig({ format: format.value as 'csv' | 'excel' | 'pdf' })}
                  >
                    <div className="flex items-center space-x-3">
                      {format.icon}
                      <div>
                        <div className="font-medium">{format.label}</div>
                        <div className="text-sm text-gray-500">{format.description}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Field Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Data Fields</span>
                <Badge variant="outline">
                  {getSelectedFieldsCount()} of {getTotalFieldsCount()} selected
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {FIELD_CATEGORIES.map((category) => {
                const { selected, total } = getCategoryFieldsCount(category.id)
                const isSelected = isCategorySelected(category.id)
                const isPartial = isCategoryPartiallySelected(category.id)

                return (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isSelected}
                          ref={(ref) => {
                            if (ref) ref.indeterminate = isPartial
                          }}
                          onCheckedChange={(checked) => handleCategoryToggle(category.id, !!checked)}
                        />
                        <div className="flex items-center space-x-2">
                          {category.icon}
                          <span className="font-medium">{category.label}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {selected}/{total}
                      </Badge>
                    </div>

                    <div className="ml-6 grid grid-cols-2 md:grid-cols-3 gap-2">
                      {EXPORT_FIELDS.filter(f => f.category === category.id).map((field) => (
                        <div key={field.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={field.id}
                            checked={exportConfig.fields.includes(field.id)}
                            onCheckedChange={(checked) => handleFieldChange(field.id, !!checked)}
                            disabled={field.required}
                          />
                          <Label
                            htmlFor={field.id}
                            className={cn(
                              "text-sm cursor-pointer",
                              field.required && "font-medium text-blue-600"
                            )}
                          >
                            {field.label}
                            {field.required && " *"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Export Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range Filter */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Date Range</Label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {DATE_PRESETS.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleDatePreset(preset.getValue())}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {exportConfig.filters.dateRange.from ? (
                        exportConfig.filters.dateRange.to ? (
                          <>
                            {format(exportConfig.filters.dateRange.from, "LLL dd, y")} -{" "}
                            {format(exportConfig.filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(exportConfig.filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        "Select date range (optional)"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={exportConfig.filters.dateRange.from}
                      selected={exportConfig.filters.dateRange}
                      onSelect={(range) =>
                        updateFilters({ dateRange: { from: range?.from, to: range?.to } })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Booking Status</Label>
                  <div className="space-y-2">
                    {STATUS_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={exportConfig.filters.status.includes(option.value)}
                          onCheckedChange={(checked) =>
                            handleStatusChange(option.value, !!checked)
                          }
                        />
                        <Label htmlFor={`status-${option.value}`} className="text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Status Filter */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Payment Status</Label>
                  <div className="space-y-2">
                    {PAYMENT_STATUS_OPTIONS.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${option.value}`}
                          checked={exportConfig.filters.paymentStatus.includes(option.value)}
                          onCheckedChange={(checked) =>
                            handlePaymentStatusChange(option.value, !!checked)
                          }
                        />
                        <Label htmlFor={`payment-${option.value}`} className="text-sm font-normal">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy Options */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Privacy & Data Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePersonalInfo"
                      checked={exportConfig.filters.includePersonalInfo}
                      onCheckedChange={(checked) =>
                        updateFilters({ includePersonalInfo: !!checked })
                      }
                    />
                    <Label htmlFor="includePersonalInfo" className="text-sm">
                      Include personal information (names, emails, phones)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includePaymentInfo"
                      checked={exportConfig.filters.includePaymentInfo}
                      onCheckedChange={(checked) =>
                        updateFilters({ includePaymentInfo: !!checked })
                      }
                    />
                    <Label htmlFor="includePaymentInfo" className="text-sm">
                      Include payment information (payment IDs, amounts)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeNotes"
                      checked={exportConfig.filters.includeNotes}
                      onCheckedChange={(checked) =>
                        updateFilters({ includeNotes: !!checked })
                      }
                    />
                    <Label htmlFor="includeNotes" className="text-sm">
                      Include notes and reviews
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Bookings Info */}
          {selectedBookings && selectedBookings.length > 0 && (
            <Alert>
              <Package className="h-4 w-4" />
              <AlertDescription>
                Exporting {selectedBookings.length} selected booking(s). Filters will be applied to these bookings only.
              </AlertDescription>
            </Alert>
          )}

          {/* Export Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Format</div>
                    <div className="font-medium capitalize">{exportConfig.format}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Fields</div>
                    <div className="font-medium">{getSelectedFieldsCount()} columns</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Date Range</div>
                    <div className="font-medium">
                      {exportConfig.filters.dateRange.from && exportConfig.filters.dateRange.to
                        ? `${format(exportConfig.filters.dateRange.from, "MMM d")} - ${format(exportConfig.filters.dateRange.to, "MMM d")}`
                        : "All dates"
                      }
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Filters</div>
                    <div className="font-medium">
                      {exportConfig.filters.status.length || exportConfig.filters.paymentStatus.length
                        ? `${exportConfig.filters.status.length + exportConfig.filters.paymentStatus.length} applied`
                        : "None"
                      }
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={executeExport}
              disabled={isExporting || exportConfig.fields.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}