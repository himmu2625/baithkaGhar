"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

interface DirectPricingFormProps {
  propertyId: string
  roomCategories: Array<{
    code: string
    name: string
    basePrice: number
  }>
}

interface DirectPricingEntry {
  _id?: string
  roomCategory: string
  planType: string
  occupancyType: string
  startDate: Date | string
  endDate: Date | string
  price: number
  reason: string
}

const PLAN_TYPES = [
  { code: 'EP', name: 'Room Only (EP)' },
  { code: 'CP', name: 'Room + Breakfast (CP)' },
  { code: 'MAP', name: 'Room + Breakfast + Dinner (MAP)' },
  { code: 'AP', name: 'All Meals (AP)' },
]

const OCCUPANCY_TYPES = [
  { code: 'SINGLE', name: 'Single' },
  { code: 'DOUBLE', name: 'Double' },
  { code: 'TRIPLE', name: 'Triple' },
  { code: 'QUAD', name: 'Quad' },
]

export default function DirectPricingForm({
  propertyId,
  roomCategories,
}: DirectPricingFormProps) {
  const { toast } = useToast()
  const [entries, setEntries] = useState<DirectPricingEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<DirectPricingEntry | null>(null)

  const [formData, setFormData] = useState<DirectPricingEntry>({
    roomCategory: '',
    planType: 'EP',
    occupancyType: 'DOUBLE',
    startDate: new Date(),
    endDate: new Date(),
    price: 0,
    reason: '',
  })

  useEffect(() => {
    fetchEntries()
  }, [propertyId])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/properties/${propertyId}/direct-pricing`
      )
      const data = await response.json()

      if (data.success) {
        setEntries(data.directPricing || [])
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load direct pricing entries',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (entry?: DirectPricingEntry) => {
    if (entry) {
      setEditingEntry(entry)
      setFormData({
        ...entry,
        startDate: new Date(entry.startDate),
        endDate: new Date(entry.endDate),
      })
    } else {
      setEditingEntry(null)
      setFormData({
        roomCategory: roomCategories[0]?.code || '',
        planType: 'EP',
        occupancyType: 'DOUBLE',
        startDate: new Date(),
        endDate: new Date(),
        price: 0,
        reason: '',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    try {
      if (!formData.roomCategory || !formData.price || formData.price <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        })
        return
      }

      const method = editingEntry ? 'PUT' : 'POST'
      const body = editingEntry
        ? {
            pricingId: editingEntry._id,
            ...formData,
            startDate: format(new Date(formData.startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(formData.endDate), 'yyyy-MM-dd'),
          }
        : {
            ...formData,
            startDate: format(new Date(formData.startDate), 'yyyy-MM-dd'),
            endDate: format(new Date(formData.endDate), 'yyyy-MM-dd'),
          }

      const response = await fetch(
        `/api/admin/properties/${propertyId}/direct-pricing`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
        })
        setDialogOpen(false)
        fetchEntries()
      } else {
        throw new Error(data.error || 'Failed to save')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save entry',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (pricingId: string) => {
    if (!confirm('Are you sure you want to delete this pricing entry?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/properties/${propertyId}/direct-pricing?pricingId=${pricingId}`,
        { method: 'DELETE' }
      )

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Pricing entry deleted successfully',
        })
        fetchEntries()
      } else {
        throw new Error(data.error || 'Failed to delete')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to delete entry',
        variant: 'destructive',
      })
    }
  }

  const getRoomCategoryName = (code: string) => {
    return roomCategories.find((cat) => cat.code === code)?.name || code
  }

  const getPlanName = (code: string) => {
    return PLAN_TYPES.find((plan) => plan.code === code)?.name || code
  }

  const getOccupancyName = (code: string) => {
    return OCCUPANCY_TYPES.find((occ) => occ.code === code)?.name || code
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Direct Pricing Overrides</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Set specific prices for date ranges, room types, plans, and occupancy
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading entries...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No direct pricing entries yet. Click "Add Entry" to create one.
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry._id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getRoomCategoryName(entry.roomCategory)}
                    </span>
                    <Badge variant="outline">{getPlanName(entry.planType)}</Badge>
                    <Badge variant="outline">
                      {getOccupancyName(entry.occupancyType)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(entry.startDate), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(entry.endDate), 'MMM dd, yyyy')}
                  </div>
                  {entry.reason && (
                    <div className="text-xs text-muted-foreground">
                      {entry.reason}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-2xl font-bold">₹{entry.price}</div>
                    <div className="text-xs text-muted-foreground">per night</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(entry)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(entry._id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dialog for Add/Edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit' : 'Add'} Direct Pricing
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Room Category</Label>
                  <Select
                    value={formData.roomCategory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, roomCategory: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomCategories.map((cat) => (
                        <SelectItem key={cat.code} value={cat.code}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Plan Type</Label>
                  <Select
                    value={formData.planType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, planType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((plan) => (
                        <SelectItem key={plan.code} value={plan.code}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Occupancy Type</Label>
                  <Select
                    value={formData.occupancyType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, occupancyType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {OCCUPANCY_TYPES.map((occ) => (
                        <SelectItem key={occ.code} value={occ.code}>
                          {occ.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Price per Night</Label>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.startDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate
                          ? format(new Date(formData.startDate), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(formData.startDate)}
                        onSelect={(date) =>
                          date &&
                          setFormData({ ...formData, startDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !formData.endDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate
                          ? format(new Date(formData.endDate), 'PPP')
                          : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={new Date(formData.endDate)}
                        onSelect={(date) =>
                          date && setFormData({ ...formData, endDate: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label>Reason (Optional)</Label>
                <Input
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="e.g., Holiday special, Peak season"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingEntry ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
