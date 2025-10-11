"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import {
  DollarSign,
  Upload,
  Calendar,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Plan types
const PLAN_TYPES = [
  { code: 'EP', name: 'Room Only' },
  { code: 'CP', name: 'Room + Breakfast' },
  { code: 'MAP', name: 'Room + 2 Meals' },
  { code: 'AP', name: 'All Meals' },
]

const OCCUPANCY_TYPES = [
  { code: 'SINGLE', name: 'Single' },
  { code: 'DOUBLE', name: 'Double' },
  { code: 'TRIPLE', name: 'Triple' },
  { code: 'QUAD', name: 'Quad' },
]

interface PropertyUnit {
  unitTypeName: string
  unitTypeCode: string
  count: number
  pricing: {
    price: string
  }
}

interface Property {
  _id: string
  title: string
  propertyUnits: PropertyUnit[]
}

interface BasePricing {
  [roomCategory: string]: {
    [planType: string]: {
      [occupancyType: string]: number
    }
  }
}

interface DirectPriceEntry {
  _id?: string
  date: Date
  roomCategory: string
  planType: string
  occupancyType: string
  price: number
  reason: string
  isActive: boolean
}

export default function PropertyPricingManagement() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const propertyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)

  // Base Pricing State
  const [basePricing, setBasePricing] = useState<BasePricing>({})

  // Direct Pricing State
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [directPrices, setDirectPrices] = useState<DirectPriceEntry[]>([])
  const [newDirectPrice, setNewDirectPrice] = useState({
    roomCategory: '',
    planType: 'EP',
    occupancyType: 'DOUBLE',
    price: 0,
    reason: '',
  })

  // Excel Import State
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Load property data
  useEffect(() => {
    loadPropertyData()
    loadDirectPrices()
  }, [propertyId])

  async function loadPropertyData() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/properties/${propertyId}`)

      if (!response.ok) {
        throw new Error('Failed to load property')
      }

      const data = await response.json()
      setProperty(data.property)

      // Load base pricing
      await loadBasePricing()
    } catch (error) {
      console.error('Error loading property:', error)
      toast({
        title: "Error",
        description: "Failed to load property data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function loadBasePricing() {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/base`)

      if (response.ok) {
        const data = await response.json()
        setBasePricing(data.basePricing || {})
      }
    } catch (error) {
      console.error('Error loading base pricing:', error)
    }
  }

  async function loadDirectPrices() {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/direct`)

      if (response.ok) {
        const data = await response.json()
        setDirectPrices(data.directPrices || [])
      }
    } catch (error) {
      console.error('Error loading direct prices:', error)
    }
  }

  // Save Base Pricing
  async function saveBasePricing() {
    try {
      setSaving(true)

      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/base`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePricing }),
      })

      if (!response.ok) {
        throw new Error('Failed to save base pricing')
      }

      toast({
        title: "Success",
        description: "Base pricing saved successfully",
      })
    } catch (error) {
      console.error('Error saving base pricing:', error)
      toast({
        title: "Error",
        description: "Failed to save base pricing",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Update base price for a specific combination
  function updateBasePrice(roomCategory: string, planType: string, occupancyType: string, price: number) {
    setBasePricing(prev => ({
      ...prev,
      [roomCategory]: {
        ...prev[roomCategory],
        [planType]: {
          ...prev[roomCategory]?.[planType],
          [occupancyType]: price
        }
      }
    }))
  }

  // Get base price for display
  function getBasePrice(roomCategory: string, planType: string, occupancyType: string): number {
    return basePricing[roomCategory]?.[planType]?.[occupancyType] || 0
  }

  // Save Direct Price
  async function saveDirectPrice() {
    if (!selectedDate || !newDirectPrice.roomCategory) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/direct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          ...newDirectPrice,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save direct price')
      }

      toast({
        title: "Success",
        description: "Direct price saved successfully",
      })

      // Reset form
      setSelectedDate(undefined)
      setNewDirectPrice({
        roomCategory: '',
        planType: 'EP',
        occupancyType: 'DOUBLE',
        price: 0,
        reason: '',
      })

      // Reload direct prices
      loadDirectPrices()
    } catch (error) {
      console.error('Error saving direct price:', error)
      toast({
        title: "Error",
        description: "Failed to save direct price",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle Excel Import
  async function handleExcelImport() {
    if (!excelFile) {
      toast({
        title: "Error",
        description: "Please select an Excel file",
        variant: "destructive",
      })
      return
    }

    try {
      setImporting(true)

      const formData = new FormData()
      formData.append('file', excelFile)

      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/import`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to import pricing')
      }

      const result = await response.json()

      toast({
        title: "Success",
        description: `Imported ${result.count} pricing entries`,
      })

      setExcelFile(null)
      loadBasePricing()
    } catch (error) {
      console.error('Error importing Excel:', error)
      toast({
        title: "Error",
        description: "Failed to import pricing data",
        variant: "destructive",
      })
    } finally {
      setImporting(false)
    }
  }

  // Delete Direct Price
  async function deleteDirectPrice(id: string) {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing/direct/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete direct price')
      }

      toast({
        title: "Success",
        description: "Direct price deleted successfully",
      })

      loadDirectPrices()
    } catch (error) {
      console.error('Error deleting direct price:', error)
      toast({
        title: "Error",
        description: "Failed to delete direct price",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="container mx-auto p-6">
        <p>Property not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/admin/properties/${propertyId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Property
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mt-2">{property.title}</h1>
          <p className="text-gray-500">Pricing Management</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="base" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="base">
            <DollarSign className="h-4 w-4 mr-2" />
            Base Pricing
          </TabsTrigger>
          <TabsTrigger value="excel">
            <Upload className="h-4 w-4 mr-2" />
            Excel Import
          </TabsTrigger>
          <TabsTrigger value="direct">
            <Calendar className="h-4 w-4 mr-2" />
            Direct Pricing
          </TabsTrigger>
        </TabsList>

        {/* BASE PRICING TAB */}
        <TabsContent value="base">
          <Card>
            <CardHeader>
              <CardTitle>Base Pricing - Default Prices</CardTitle>
              <CardDescription>
                Set default prices for each room category, plan type, and occupancy combination.
                These prices apply to all dates unless overridden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {property.propertyUnits && property.propertyUnits.length > 0 ? (
                property.propertyUnits.map((unit) => (
                  <div key={unit.unitTypeCode} className="space-y-4">
                    <h3 className="text-lg font-semibold">{unit.unitTypeName}</h3>

                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Plan Type</TableHead>
                            <TableHead>Single</TableHead>
                            <TableHead>Double</TableHead>
                            <TableHead>Triple</TableHead>
                            <TableHead>Quad</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {PLAN_TYPES.map((plan) => (
                            <TableRow key={plan.code}>
                              <TableCell className="font-medium">{plan.name}</TableCell>
                              {OCCUPANCY_TYPES.map((occupancy) => (
                                <TableCell key={occupancy.code}>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={getBasePrice(unit.unitTypeCode, plan.code, occupancy.code) || ''}
                                    onChange={(e) => updateBasePrice(
                                      unit.unitTypeCode,
                                      plan.code,
                                      occupancy.code,
                                      parseInt(e.target.value) || 0
                                    )}
                                    className="w-full"
                                  />
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No room categories found</p>
              )}

              <div className="flex justify-end">
                <Button onClick={saveBasePricing} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Base Pricing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXCEL IMPORT TAB */}
        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle>Plan-Based Pricing - Excel Import</CardTitle>
              <CardDescription>
                Upload an Excel file to set prices for specific date ranges.
                These prices override base pricing for the specified dates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Excel Template Format</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-mono">
                      Category | Plan | Sharing | Start Date | End Date | Price | Reason
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Example: deluxe | EP | DOUBLE | 2025-12-20 | 2025-12-31 | 8000 | Peak Season
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="excel-file">Upload Excel File</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className="mt-2"
                  />
                </div>

                {excelFile && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm">
                      Selected: <span className="font-medium">{excelFile.name}</span>
                    </p>
                  </div>
                )}

                <Button onClick={handleExcelImport} disabled={!excelFile || importing} className="w-full">
                  {importing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Pricing Data
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DIRECT PRICING TAB */}
        <TabsContent value="direct">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Direct Price Form */}
            <Card>
              <CardHeader>
                <CardTitle>Add Direct Price Override</CardTitle>
                <CardDescription>
                  Set a specific price for an exact date. This overrides all other pricing.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Date</Label>
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border mt-2"
                  />
                </div>

                <div>
                  <Label>Room Category</Label>
                  <Select
                    value={newDirectPrice.roomCategory}
                    onValueChange={(value) => setNewDirectPrice(prev => ({ ...prev, roomCategory: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {property.propertyUnits?.map((unit) => (
                        <SelectItem key={unit.unitTypeCode} value={unit.unitTypeCode}>
                          {unit.unitTypeName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Plan Type</Label>
                  <Select
                    value={newDirectPrice.planType}
                    onValueChange={(value) => setNewDirectPrice(prev => ({ ...prev, planType: value }))}
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

                <div>
                  <Label>Occupancy</Label>
                  <Select
                    value={newDirectPrice.occupancyType}
                    onValueChange={(value) => setNewDirectPrice(prev => ({ ...prev, occupancyType: value }))}
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
                  <Label>Price</Label>
                  <Input
                    type="number"
                    placeholder="Enter price"
                    value={newDirectPrice.price || ''}
                    onChange={(e) => setNewDirectPrice(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label>Reason</Label>
                  <Input
                    placeholder="e.g., New Year Special"
                    value={newDirectPrice.reason}
                    onChange={(e) => setNewDirectPrice(prev => ({ ...prev, reason: e.target.value }))}
                  />
                </div>

                <Button onClick={saveDirectPrice} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Direct Price
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Direct Prices List */}
            <Card>
              <CardHeader>
                <CardTitle>Active Direct Prices</CardTitle>
                <CardDescription>
                  Current price overrides for specific dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {directPrices.length > 0 ? (
                  <div className="space-y-2">
                    {directPrices.map((price) => (
                      <div key={price._id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {format(new Date(price.date), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {price.roomCategory} • {price.planType} • {price.occupancyType}
                            </p>
                            <p className="text-lg font-bold text-green-600 mt-1">
                              ₹{price.price.toLocaleString()}
                            </p>
                            {price.reason && (
                              <p className="text-xs text-gray-500 mt-1">{price.reason}</p>
                            )}
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => price._id && deleteDirectPrice(price._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No direct price overrides set
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
