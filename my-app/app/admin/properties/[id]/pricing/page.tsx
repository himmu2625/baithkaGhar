"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar } from "@/components/ui/calendar"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import {
  IndianRupee,
  Calendar as CalendarIcon,
  TrendingUp,
  Settings,
  History,
  Ban,
  Info,
  Lightbulb,
  Eye,
  Save,
  RefreshCw,
  ArrowLeft,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
  Brain,
  Zap,
  BarChart3,
  Clock,
  Users,
  Plus,
  Utensils,
  Upload,
  FileText,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { PricingCalendar } from "@/components/ui/pricing-calendar"
import PlanSelector, { OccupancySelector } from "@/components/ui/plan-selector"
import EnhancedPricingCalendar from "@/components/ui/enhanced-pricing-calendar"
import ExcelImportDialog from "@/components/ui/excel-import-dialog"
import PlanOccupancyGrid from "@/components/ui/plan-occupancy-grid"
import DirectPricingForm from "@/components/ui/direct-pricing-form"

interface Property {
  _id: string
  name: string
  title: string
  location: string
  basePrice: number
  currency: string
  totalHotelRooms: string
  maxGuests: number
  propertyUnits?: Array<{
    unitTypeName: string
    unitTypeCode: string
    count: number
    pricing: {
      price: string
      pricePerWeek: string
      pricePerMonth: string
    }
  }>
  categories?: Array<{
    id: string
    name: string
    description?: string
    price: number
    maxGuests: number
    amenities?: string[]
  }>
  dynamicPricing?: {
    enabled: boolean
    factors: {
      seasonality: { enabled: boolean; multiplier: number }
      demand: { enabled: boolean; multiplier: number }
      lastMinute: { enabled: boolean; multiplier: number }
      events: { enabled: boolean; multiplier: number }
    }
  }
}

interface BlockedDate {
  date: Date
  reason: string
  type: "maintenance" | "personal" | "event" | "other"
}

interface AIcSuggestion {
  field: string
  current: number
  suggested: number
  confidence: number
  reason: string
  impact: string
}

interface LivePreview {
  selectedDate: Date
  basePrice: number
  finalPrice: number
  discounts: any[]
  occupancyRate: number
  demandLevel: "low" | "medium" | "high"
}

// Helper to format date as string key
const formatDateKey = (date: Date) => format(date, "yyyy-MM-dd")

export default function EnhancedPropertyPricingPage() {
  const params = useParams()
  const propertyId = params?.id as string
  const { toast } = useToast()

  // State management
  const [activeTab, setActiveTab] = useState("base-price")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingRules, setLoadingRules] = useState(false)
  const [property, setProperty] = useState<Property | null>(null)
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [aiSuggestions, setAISuggestions] = useState<AIcSuggestion[]>([])
  const [dynamicPricing, setDynamicPricing] = useState<any>(null)
  const [showExcelImportDialog, setShowExcelImportDialog] = useState(false)
  const [showFormatGuide, setShowFormatGuide] = useState(false)

  // Room category state
  const [selectedRoomCategory, setSelectedRoomCategory] = useState<
    string | null
  >(null)
  const [roomCategories, setRoomCategories] = useState<
    Array<{
      id: string
      name: string
      description?: string
      price: number
      count: number
      maxGuests: number
    }>
  >([])

  // Live preview state
  const [livePreview, setLivePreview] = useState<LivePreview>({
    selectedDate: new Date(),
    basePrice: 0,
    finalPrice: 0,
    discounts: [],
    occupancyRate: 0,
    demandLevel: "medium",
  })

  // UI state
  const [showAISuggestions, setShowAISuggestions] = useState(true)
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Add state for direct pricing
  const [directPricingData, setDirectPricingData] = useState<{
    [key: string]: number
  }>({})
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [isRangeMode, setIsRangeMode] = useState(false)
  const [customPriceForm, setCustomPriceForm] = useState<{
    dates: Date[]
    price: number
    reason: string
    planType?: string
    occupancyType?: string
  }>({
    dates: [],
    price: 0,
    reason: "custom",
  })
  const [directPricingDialogOpen, setDirectPricingDialogOpen] = useState(false)

  // Blocked dates state
  const [selectedBlockDates, setSelectedBlockDates] = useState<Date[]>([])
  const [isBlockRangeMode, setIsBlockRangeMode] = useState(false)
  const [blockDateForm, setBlockDateForm] = useState({
    dates: [] as Date[],
    reason: "",
    categoryId: "",
    editIndex: -1,
  })
  const [blockDateDialogOpen, setBlockDateDialogOpen] = useState(false)

  const fetchPropertyData = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()

      if (data && data._id) {
        setProperty(data)
        const basePrice = data.basePrice || 0
        setLivePreview((prev) => ({
          ...prev,
          basePrice: basePrice,
          finalPrice: basePrice,
        }))

        // Process room categories
        let categories: Array<{
          id: string
          name: string
          description?: string
          price: number
          count: number
          maxGuests: number
        }> = []

        if (
          data.propertyUnits &&
          Array.isArray(data.propertyUnits) &&
          data.propertyUnits.length > 0
        ) {
          // Convert propertyUnits to categories
          categories = data.propertyUnits.map((unit: any) => ({
            id:
              unit.unitTypeCode ||
              `unit-${Math.random().toString(36).substr(2, 9)}`,
            name: unit.unitTypeName || "Standard Room",
            description: `${unit.unitTypeName} with ${unit.count} available rooms`,
            price: parseFloat(unit.pricing?.price) || basePrice || 0,
            count: unit.count || 1,
            maxGuests: 3, // Default, could be made configurable
          }))
        } else if (
          data.categories &&
          Array.isArray(data.categories) &&
          data.categories.length > 0
        ) {
          // Use existing categories
          categories = data.categories.map((cat: any) => ({
            id:
              cat.id ||
              cat._id ||
              `cat-${Math.random().toString(36).substr(2, 9)}`,
            name: cat.name || "Standard Room",
            description: cat.description || "",
            price: cat.price || basePrice || 0,
            count: cat.count || 1,
            maxGuests: cat.maxGuests || 3,
          }))
        } else {
          // Create default categories if none exist
          categories = [
            {
              id: "standard",
              name: "Standard Room",
              description: "Comfortable standard room with essential amenities",
              price: basePrice || 2500,
              count: parseInt(data.totalHotelRooms) || 1,
              maxGuests: 3,
            },
          ]
        }

        setRoomCategories(categories)

        // Set the first category as selected by default
        if (categories.length > 0) {
          setSelectedRoomCategory(categories[0].id)
        }
      } else {
        throw new Error("Invalid property data received")
      }
    } catch (error) {
      console.error("Error fetching property:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load property data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [propertyId, toast])

  const fetchPricingData = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `/api/admin/properties/${propertyId}/pricing`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.message ||
            `Failed to fetch pricing data: ${response.status}`
        )
      }

      const data = await response.json()

      if (data.dynamicPricing) {
        // Ensure availabilityControl is properly initialized
        if (!data.dynamicPricing.availabilityControl) {
          data.dynamicPricing.availabilityControl = {
            enabled: false,
            blockedDates: [],
          }
        }

        // Ensure blockedDates is always an array
        if (
          !Array.isArray(data.dynamicPricing.availabilityControl.blockedDates)
        ) {
          data.dynamicPricing.availabilityControl.blockedDates = []
        }

        // Ensure directPricing is properly initialized
        if (!data.dynamicPricing.directPricing) {
          data.dynamicPricing.directPricing = {
            enabled: false,
            customPrices: [],
          }
        }

        // Ensure customPrices is always an array
        if (!Array.isArray(data.dynamicPricing.directPricing.customPrices)) {
          data.dynamicPricing.directPricing.customPrices = []
        }

        setDynamicPricing(data.dynamicPricing)
      } else {
        // Initialize with default structure if no dynamic pricing exists
        const defaultDynamicPricing = {
          enabled: false,
          basePrice: data.basePrice || 0,
          minPrice: 0,
          maxPrice: 0,
          directPricing: {
            enabled: false,
            customPrices: [],
          },
          availabilityControl: {
            enabled: false,
            blockedDates: [],
          },
        }
        setDynamicPricing(defaultDynamicPricing)
      }
    } catch (error) {
      console.error("Error fetching pricing data:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch pricing data",
        variant: "destructive",
      })

      // Set a minimal fallback structure to prevent crashes
      setDynamicPricing({
        enabled: false,
        basePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        directPricing: { enabled: false, customPrices: [] },
        availabilityControl: { enabled: false, blockedDates: [] },
      })
    } finally {
      setLoading(false)
    }
  }, [propertyId, toast])

  const fetchAISuggestions = useCallback(async () => {
    try {
      // Try to fetch real AI suggestions first
      try {
        const response = await fetch(
          `/api/admin/properties/${propertyId}/ai-pricing-suggestions`
        )
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.suggestions) {
            setAISuggestions(data.suggestions)
          } else {
            // No suggestions available
            setAISuggestions([])
          }
        } else {
          // API not available or no suggestions
          setAISuggestions([])
        }
      } catch (error) {
        console.log("AI suggestions API not available")
        setAISuggestions([])
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error)
    }
  }, [propertyId])

  useEffect(() => {
    if (propertyId) {
      fetchPropertyData()
      fetchPricingData()
      fetchAISuggestions()
    }
  }, [propertyId, fetchPropertyData, fetchPricingData, fetchAISuggestions])

  // Update live preview when property data changes
  useEffect(() => {
    if (property) {
      // Get base price from selected room category or fallback to property base price
      const selectedCategory = roomCategories.find(
        (c) => c.id === selectedRoomCategory
      )
      const basePrice = selectedCategory?.price || property.basePrice || 0
      let finalPrice = basePrice

      // Check for custom pricing first (direct pricing takes priority)
      const customPrices = dynamicPricing?.directPricing?.customPrices || []
      const dateKey = formatDateKey(livePreview.selectedDate)
      const customPrice = customPrices.find((cp: any) => {
        if (!cp.isActive) return false

        // For single date pricing (startDate equals endDate)
        if (cp.startDate === cp.endDate) {
          return dateKey === cp.startDate
        }

        // For range pricing (startDate different from endDate)
        return cp.startDate <= dateKey && cp.endDate >= dateKey
      })

      if (customPrice) {
        finalPrice = customPrice.price
      } else {
        // Apply pricing rules if no custom price
        // Dynamic rules functionality removed
      }

      setLivePreview((prev) => ({
        ...prev,
        basePrice: basePrice,
        finalPrice: Math.round(finalPrice),
        occupancyRate: 0, // Remove mock data
        demandLevel: "low", // Remove mock data
      }))
    }
  }, [
    property,
    livePreview.selectedDate,
    dynamicPricing,
    selectedRoomCategory,
    roomCategories,
  ])

  // Calculate live preview
  const calculateLivePreview = useMemo(() => {
    if (!property) return livePreview

    let finalPrice = property.basePrice || 0

    // Check for custom pricing first (direct pricing takes priority)
    const customPrices = dynamicPricing?.directPricing?.customPrices || []
    const dateKey = formatDateKey(livePreview.selectedDate)
    const customPrice = customPrices.find((cp: any) => {
      if (!cp.isActive) return false

      // For single date pricing (startDate equals endDate)
      if (cp.startDate === cp.endDate) {
        return dateKey === cp.startDate
      }

      // For range pricing (startDate different from endDate)
      return cp.startDate <= dateKey && cp.endDate >= dateKey
    })

    if (customPrice) {
      finalPrice = customPrice.price
    } else {
      // Apply pricing rules if no custom price
      // Dynamic rules functionality removed
    }

    return {
      ...livePreview,
      basePrice: property.basePrice || 0,
      finalPrice: Math.round(finalPrice),
    }
  }, [property, dynamicPricing, livePreview])

  // Generate calendar heatmap data
  const calendarHeatmapData = useMemo(() => {
    const startDate = startOfMonth(calendarMonth)
    const endDate = endOfMonth(calendarMonth)
    const days = eachDayOfInterval({ start: startDate, end: endDate })

    return days.map((date) => {
      let price = property?.basePrice || 0
      let intensity = "low"
      let hasCustomPrice = false

      // Check for custom pricing first
      const customPrices = dynamicPricing?.directPricing?.customPrices || []
      const dateKey = formatDateKey(date)
      const customPrice = customPrices.find((cp: any) => {
        if (!cp.isActive) return false

        // For single date pricing (startDate equals endDate)
        if (cp.startDate === cp.endDate) {
          return dateKey === cp.startDate
        }

        // For range pricing (startDate different from endDate)
        return cp.startDate <= dateKey && cp.endDate >= dateKey
      })

      if (customPrice) {
        price = customPrice.price
        hasCustomPrice = true
        intensity = "custom" // Special intensity for custom prices
      } else {
        // Apply pricing rules if no custom price
        // Dynamic rules functionality removed

        // Determine intensity based on price difference
        const priceRatio = price / (property?.basePrice || 1)
        if (priceRatio >= 1.5) intensity = "very-high"
        else if (priceRatio >= 1.3) intensity = "high"
        else if (priceRatio >= 1.1) intensity = "medium"
        else intensity = "low"
      }

      const isBlocked = blockedDates.some(
        (blocked) =>
          format(blocked.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      )

      return {
        date,
        price: Math.round(price),
        intensity,
        isBlocked,
        hasCustomPrice,
      }
    })
  }, [property, blockedDates, calendarMonth, dynamicPricing])

  const InfoTooltip = ({ content }: { content: string }) => (
    <Tooltip>
      <TooltipTrigger>
        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>{content}</p>
      </TooltipContent>
    </Tooltip>
  )

  const AISuggestionChip = ({ suggestion }: { suggestion: AIcSuggestion }) => (
    <Tooltip>
      <TooltipTrigger>
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-full text-xs cursor-pointer hover:shadow-md transition-shadow">
          <Brain className="h-3 w-3 text-purple-600" />
          <span className="text-purple-700 font-medium">
            AI: ₹{suggestion.suggested.toLocaleString()}
          </span>
          <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
          <span className="text-purple-600">
            {Math.round(suggestion.confidence * 100)}%
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="space-y-2">
          <div className="font-medium">AI Recommendation</div>
          <div className="text-sm">{suggestion.reason}</div>
          <div className="text-xs text-green-600 font-medium">
            {suggestion.impact}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )

  // Seasonal rules functionality removed
  // Demand and event rules functionality removed

  // Minimum stay rules functionality removed

  // Helper to normalize custom price objects before sending to backend
  function normalizeCustomPrices(customPrices: any[]): any[] {
    return customPrices.map((cp) => {
      const start =
        typeof cp.startDate === "string" ? new Date(cp.startDate) : cp.startDate
      let end =
        typeof cp.endDate === "string" ? new Date(cp.endDate) : cp.endDate
      // If start and end are the same day, set end to start + 1 day
      if (formatDateKey(start) === formatDateKey(end)) {
        end = addDays(start, 1)
      }
      return {
        startDate: formatDateKey(start),
        endDate: formatDateKey(end),
        price: Math.max(1, Number(cp.price)),
        reason: ["event", "holiday", "custom", "demand_control"].includes(
          cp.reason
        )
          ? cp.reason
          : "custom",
        isActive: typeof cp.isActive === "boolean" ? cp.isActive : true,
      }
    })
  }

  // Helper to get a fully populated dynamicPricing object
  function getFullDynamicPricing(partial: any, property: any): any {
    return {
      enabled: partial?.enabled ?? false,
      basePrice: partial?.basePrice ?? (property?.basePrice || 0),
      minPrice: partial?.minPrice ?? 0,
      maxPrice: partial?.maxPrice ?? 0,
      // Only include seasonal rates if they actually exist
      seasonalRates: partial?.seasonalRates,
      // Only include weekly rates if they actually exist
      weeklyRates: partial?.weeklyRates,
      // Only include demand pricing if it actually exists
      demandPricing: partial?.demandPricing,
      competitionSensitivity: partial?.competitionSensitivity,
      // Only include advance booking discounts if they actually exist
      advanceBookingDiscounts: partial?.advanceBookingDiscounts,
      // Only include event pricing if it actually exists
      eventPricing: partial?.eventPricing,
      lastMinutePremium: partial?.lastMinutePremium,
      // Only include auto pricing if it actually exists
      autoPricing: partial?.autoPricing,
      directPricing: partial?.directPricing,
      // Only include availability control if it actually exists
      availabilityControl: partial?.availabilityControl,
      // Only include dynamic stay rules if they actually exist
      dynamicStayRules: partial?.dynamicStayRules,
    }
  }

  // Update syncDirectPricingToBackend to always send a full dynamicPricing object
  async function syncDirectPricingToBackend(customPrices: any[]) {
    setLoadingRules(true)
    try {
      const normalized = normalizeCustomPrices(customPrices)
      const newDynamicPricing = getFullDynamicPricing(
        {
          ...dynamicPricing,
          directPricing: {
            enabled: true,
            customPrices: normalized,
          },
        },
        property
      )
      const res = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dynamicPricing: newDynamicPricing }),
      })
      if (!res.ok) throw new Error("Failed to update direct pricing")
      const data = await res.json()
      setDynamicPricing(data.dynamicPricing)
      toast({
        title: "Success",
        description: "Direct pricing updated successfully",
      })
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" })
    } finally {
      setLoadingRules(false)
    }
  }

  // Function to save custom price
  function saveCustomPrice() {
    const currentCustomPrices =
      dynamicPricing?.directPricing?.customPrices || []
    let newCustomPrices = [...currentCustomPrices]

    if (customPriceForm.dates.length === 0) return

    // For date ranges or multiple dates
    if (isRangeMode && customPriceForm.dates.length > 1) {
      const startDate = customPriceForm.dates[0]
      const endDate = customPriceForm.dates[customPriceForm.dates.length - 1]

      // Remove any existing overlapping prices
      newCustomPrices = newCustomPrices.filter((cp: any) => {
        const cpStart = new Date(cp.startDate)
        const cpEnd = new Date(cp.endDate)
        return !(cpStart <= endDate && cpEnd > startDate)
      })

      // Add new range price - use inclusive end date
      newCustomPrices.push({
        startDate: formatDateKey(startDate),
        endDate: formatDateKey(endDate), // Keep end date inclusive
        price: customPriceForm.price,
        reason: customPriceForm.reason,
        isActive: true,
        ...(customPriceForm.planType && { planType: customPriceForm.planType }),
        ...(customPriceForm.occupancyType && {
          occupancyType: customPriceForm.occupancyType,
        }),
      })
    } else {
      // For single dates
      customPriceForm.dates.forEach((date) => {
        const dateStr = formatDateKey(date)

        // Remove existing price for this date
        newCustomPrices = newCustomPrices.filter(
          (cp: any) => !(cp.startDate <= dateStr && cp.endDate > dateStr)
        )

        // Add new price - for single date, use the same date for start and end
        newCustomPrices.push({
          startDate: dateStr,
          endDate: dateStr, // Single date, so start and end are the same
          price: customPriceForm.price,
          reason: customPriceForm.reason,
          isActive: true,
          ...(customPriceForm.planType && {
            planType: customPriceForm.planType,
          }),
          ...(customPriceForm.occupancyType && {
            occupancyType: customPriceForm.occupancyType,
          }),
        })
      })
    }

    // Call backend sync once with all changes
    syncDirectPricingToBackend(newCustomPrices)
    setDirectPricingDialogOpen(false)
    setSelectedDates([])
    setCustomPriceForm((prev) => ({
      ...prev,
      dates: [],
      price: 0,
      planType: undefined,
      occupancyType: undefined,
    }))
  }

  // Function to delete custom price
  function deleteCustomPrice(startDate: string, endDate: string) {
    const currentCustomPrices =
      dynamicPricing?.directPricing?.customPrices || []
    const newCustomPrices = currentCustomPrices.filter(
      (cp: any) => !(cp.startDate === startDate && cp.endDate === endDate)
    )
    syncDirectPricingToBackend(newCustomPrices)
  }

  // Function to get custom price for a specific date
  function getCustomPriceForDate(date: Date) {
    const customPrices = dynamicPricing?.directPricing?.customPrices || []
    const dateKey = formatDateKey(date)
    return customPrices.find((cp: any) => {
      if (!cp.isActive) return false

      // For single date pricing (startDate equals endDate)
      if (cp.startDate === cp.endDate) {
        return dateKey === cp.startDate
      }

      // For range pricing (startDate different from endDate)
      return cp.startDate <= dateKey && cp.endDate >= dateKey
    })
  }

  // Function to toggle custom price active status
  function toggleCustomPriceActive(startDate: string, endDate: string) {
    const currentCustomPrices =
      dynamicPricing?.directPricing?.customPrices || []
    const newCustomPrices = currentCustomPrices.map((cp: any) =>
      cp.startDate === startDate && cp.endDate === endDate
        ? { ...cp, isActive: !cp.isActive }
        : cp
    )
    syncDirectPricingToBackend(newCustomPrices)
  }

  // Function to save all changes to the backend
  const handleSaveChanges = async () => {
    if (!property || !propertyId) return

    try {
      setSaving(true)

      // First, check if there are any pending direct pricing changes and save them
      if (customPriceForm.dates.length > 0 && customPriceForm.price > 0) {

        const currentCustomPrices =
          dynamicPricing?.directPricing?.customPrices || []
        let newCustomPrices = [...currentCustomPrices]

        // For date ranges or multiple dates
        if (isRangeMode && customPriceForm.dates.length > 1) {
          const startDate = customPriceForm.dates[0]
          const endDate =
            customPriceForm.dates[customPriceForm.dates.length - 1]

          // Remove any existing overlapping prices
          newCustomPrices = newCustomPrices.filter((cp: any) => {
            const cpStart = new Date(cp.startDate)
            const cpEnd = new Date(cp.endDate)
            return !(cpStart <= endDate && cpEnd > startDate)
          })

          // Add new range price - use inclusive end date
          newCustomPrices.push({
            startDate: formatDateKey(startDate),
            endDate: formatDateKey(endDate), // Keep end date inclusive
            price: customPriceForm.price,
            reason: customPriceForm.reason,
            isActive: true,
          })
        } else {
          // For single dates
          customPriceForm.dates.forEach((date) => {
            const dateStr = formatDateKey(date)

            // Remove existing price for this date
            newCustomPrices = newCustomPrices.filter(
              (cp: any) => !(cp.startDate <= dateStr && cp.endDate > dateStr)
            )

            // Add new price - for single date, use the same date for start and end
            newCustomPrices.push({
              startDate: dateStr,
              endDate: dateStr, // Single date, so start and end are the same
              price: customPriceForm.price,
              reason: customPriceForm.reason,
              isActive: true,
            })
          })
        }

        // Update the dynamicPricing state with the new custom prices
        const updatedDynamicPricing = {
          ...dynamicPricing,
          directPricing: {
            enabled: true,
            customPrices: newCustomPrices,
          },
        }
        setDynamicPricing(updatedDynamicPricing)

        // Clear the pending changes
        setSelectedDates([])
        setCustomPriceForm((prev) => ({ ...prev, dates: [], price: 0 }))
      }

      // Save property base data
      const propertyResponse = await fetch(
        `/api/admin/properties/${propertyId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            basePrice: property.basePrice,
            currency: property.currency,
            // Save room category changes as propertyUnits
            propertyUnits: roomCategories.map((category) => ({
              unitTypeName: category.name,
              unitTypeCode: category.id,
              count: category.count,
              pricing: {
                price: category.price.toString(),
                pricePerWeek: (category.price * 7).toString(),
                pricePerMonth: (category.price * 30).toString(),
              },
            })),
          }),
        }
      )

      if (!propertyResponse.ok) {
        throw new Error("Failed to save property data")
      }

      // Save dynamic pricing data if it exists
      if (dynamicPricing) {
        // Ensure we have the latest dynamic pricing data with any direct pricing changes
        const updatedDynamicPricing = getFullDynamicPricing(
          dynamicPricing,
          property
        )

        const pricingResponse = await fetch(
          `/api/admin/properties/${propertyId}/pricing`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dynamicPricing: updatedDynamicPricing }),
          }
        )

        if (!pricingResponse.ok) {
          throw new Error("Failed to save dynamic pricing data")
        }

        // Update local state with saved data
        const savedData = await pricingResponse.json()
        if (savedData.dynamicPricing) {
          setDynamicPricing(savedData.dynamicPricing)
        }
      }

      toast({
        title: "Success",
        description: "All pricing changes have been saved successfully",
      })

      // Refresh data to ensure consistency
      await fetchPropertyData()
      await fetchPricingData()
    } catch (error) {
      console.error("Error saving changes:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Blocked dates functions - memoized to prevent excessive re-renders
  const getBlockedDatesForCategory = useCallback((categoryId: string) => {
    if (
      !dynamicPricing?.availabilityControl?.blockedDates ||
      !Array.isArray(dynamicPricing.availabilityControl.blockedDates)
    ) {
      return []
    }

    return dynamicPricing.availabilityControl.blockedDates.filter((blocked: any) => {
      const matchesCategory = !blocked.categoryId || blocked.categoryId === categoryId
      const isActive = blocked.isActive !== false
      return isActive && matchesCategory
    })
  }, [dynamicPricing?.availabilityControl?.blockedDates])

  const isDateBlocked = useCallback((date: Date, categoryId: string) => {
    return getBlockedDatesForCategory(categoryId).some((blocked: any) => {
      const startDate = new Date(blocked.startDate)
      const endDate = new Date(blocked.endDate)
      return date >= startDate && date <= endDate
    })
  }, [getBlockedDatesForCategory])

  const toggleBlockedDateActive = async (index: number, checked: boolean) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return

    try {
      setSaving(true)

      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.map(
            (blocked: any, i: number) =>
              i === index ? { ...blocked, isActive: checked } : blocked
          ),
        },
      }

      // Save to database
      const response = await fetch(
        `/api/admin/properties/${propertyId}/pricing`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dynamicPricing: updatedDynamicPricing }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update blocked date status")
      }

      const data = await response.json()
      setDynamicPricing(data.dynamicPricing)

      toast({
        title: "Success",
        description: `Blocked date ${
          checked ? "activated" : "deactivated"
        } successfully`,
      })
    } catch (error) {
      console.error("Error updating blocked date:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update blocked date",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const deleteBlockedDate = async (index: number) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return

    try {
      setSaving(true)

      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.filter(
            (_: any, i: number) => i !== index
          ),
        },
      }

      // Save to database
      const response = await fetch(
        `/api/admin/properties/${propertyId}/pricing`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dynamicPricing: updatedDynamicPricing }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete blocked date")
      }

      const data = await response.json()
      setDynamicPricing(data.dynamicPricing)

      toast({
        title: "Success",
        description: "Blocked date deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting blocked date:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete blocked date",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const saveBlockedDates = async () => {
    if (!dynamicPricing || blockDateForm.dates.length === 0) return

    try {
      setSaving(true)

      const startDate = blockDateForm.dates[0]
      const endDate = blockDateForm.dates[blockDateForm.dates.length - 1]
      const newBlockedDate = {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        reason: blockDateForm.reason,
        isActive: true,
        categoryId: blockDateForm.categoryId,
      }

      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          enabled: true,
          blockedDates:
            blockDateForm.editIndex >= 0
              ? dynamicPricing.availabilityControl?.blockedDates?.map(
                  (blocked: any, i: number) =>
                    i === blockDateForm.editIndex ? newBlockedDate : blocked
                ) || [newBlockedDate]
              : [
                  ...(dynamicPricing.availabilityControl?.blockedDates || []),
                  newBlockedDate,
                ],
        },
      }

      // Save to database
      const response = await fetch(
        `/api/admin/properties/${propertyId}/pricing`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dynamicPricing: updatedDynamicPricing }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || "Failed to save blocked dates")
      }

      const data = await response.json()

      // Update local state with the response from server
      setDynamicPricing(data.dynamicPricing)

      // Clear selections and form
      setSelectedBlockDates([])
      setBlockDateDialogOpen(false)
      setBlockDateForm({
        dates: [],
        reason: "",
        categoryId: "",
        editIndex: -1,
      })

      // Force refresh of pricing data to ensure consistency
      await fetchPricingData()

      toast({
        title: "Success",
        description: `${blockDateForm.dates.length} date${
          blockDateForm.dates.length > 1 ? "s have" : " has"
        } been blocked successfully`,
      })
    } catch (error) {
      console.error("Error saving blocked dates:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save blocked dates",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const unblockDates = async (dates: Date[]) => {
    if (!dynamicPricing?.availabilityControl?.blockedDates) return

    try {
      setSaving(true)

      const datesToUnblock = dates.map((date) => format(date, "yyyy-MM-dd"))
      const updatedDynamicPricing = {
        ...dynamicPricing,
        availabilityControl: {
          ...dynamicPricing.availabilityControl,
          blockedDates: dynamicPricing.availabilityControl.blockedDates.filter(
            (blocked: any) => {
              const blockedStart = format(
                new Date(blocked.startDate),
                "yyyy-MM-dd"
              )
              const blockedEnd = format(new Date(blocked.endDate), "yyyy-MM-dd")
              return !datesToUnblock.some(
                (date) => date >= blockedStart && date <= blockedEnd
              )
            }
          ),
        },
      }

      // Save to database
      const response = await fetch(
        `/api/admin/properties/${propertyId}/pricing`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dynamicPricing: updatedDynamicPricing }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to unblock dates")
      }

      const data = await response.json()
      setDynamicPricing(data.dynamicPricing)
      setSelectedBlockDates([])

      toast({
        title: "Success",
        description: "Selected dates have been unblocked successfully",
      })
    } catch (error) {
      console.error("Error unblocking dates:", error)
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to unblock dates",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loadingRules)
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
      </div>
    )

  if (!property && !loading) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-xl">⚠️</div>
            <h3 className="text-lg font-semibold">Failed to Load Property</h3>
            <p className="text-muted-foreground">
              Unable to fetch property data. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      {/* Main container */}
      <div className="container mx-auto px-2 sm:px-4 py-6 max-w-7xl min-h-screen flex flex-col">
        {/* Header, AI Suggestions, and divider (single instance) */}
        <div className="flex flex-col gap-2 mb-4 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">Pricing Management</h1>
              <div className="text-xl font-semibold text-gray-900 truncate max-w-full">
                {property?.title || property?.name || "Loading..."}
              </div>
              <div className="text-gray-500 text-base truncate max-w-full">
                {property?.location || "Loading location..."}
              </div>
              {property && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    Base Price: ₹{property.basePrice?.toLocaleString() || "0"}
                  </span>
                  <span>•</span>
                  <span>{property.totalHotelRooms} rooms</span>
                  <span>•</span>
                  <span>Max {property.maxGuests} guests</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-start sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAISuggestions(!showAISuggestions)}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </Button>
              <Button variant="outline" onClick={fetchPricingData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Debug information available in console
                }}
              >
                Debug
              </Button>
              <Button onClick={handleSaveChanges} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
          {/* AI Suggestions Alert at top for visibility */}
          {showAISuggestions && aiSuggestions.length > 0 && (
            <Alert className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 mt-4">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <AlertDescription>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="font-medium text-purple-800">
                      AI has {aiSuggestions.length} pricing suggestions
                    </span>
                    <span className="text-purple-600 ml-2">
                      Potential revenue increase: +₹
                      {aiSuggestions
                        .reduce((sum, s) => sum + (s.suggested - s.current), 0)
                        .toLocaleString()}
                      /night
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-purple-200"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Apply All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          <div className="border-b border-gray-200 mb-6" />
        </div>
        {/* Responsive main grid with stable layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 w-full max-w-full flex-1 items-start">
          {/* Main Content (single instance) */}
          <div className="min-w-0 w-full max-w-full flex flex-col gap-8">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6 md:p-8 w-full">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-4"
              >
                <TabsList className="overflow-x-auto whitespace-nowrap w-full max-w-full gap-1 mb-4">
                  <TabsTrigger
                    value="base-price"
                    className="flex items-center gap-2"
                  >
                    <IndianRupee className="h-4 w-4" />
                    Base Price
                  </TabsTrigger>
                  <TabsTrigger
                    value="direct-overrides"
                    className="flex items-center gap-2"
                  >
                    <Target className="h-4 w-4" />
                    Direct Overrides
                  </TabsTrigger>
                  <TabsTrigger
                    value="blocked-dates"
                    className="flex items-center gap-2"
                  >
                    <Ban className="h-4 w-4" />
                    Blocked Dates
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="flex items-center gap-2"
                  >
                    <History className="h-4 w-4" />
                    History
                  </TabsTrigger>
                </TabsList>

                {/* Base Price Tab - REDESIGNED */}
                <TabsContent value="base-price" className="space-y-6">
                  {/* Step 1: Select Room Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IndianRupee className="h-5 w-5 text-green-600" />
                        Plan & Occupancy Based Pricing
                        <InfoTooltip content="Select a room category and set prices for different meal plans and occupancy types" />
                      </CardTitle>
                      <div className="text-sm text-muted-foreground mt-2">
                        Step 1: Select a room category, then configure pricing for different plan types (EP, CP, MAP, AP) and occupancy levels
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Room Category Selector */}
                      <div className="space-y-2">
                        <Label>Select Room Category</Label>
                        <Select
                          value={selectedRoomCategory}
                          onValueChange={setSelectedRoomCategory}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a room category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {roomCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedRoomCategory && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowExcelImportDialog(true)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Excel
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Step 2: Plan & Occupancy Grid */}
                  {selectedRoomCategory && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-blue-600" />
                          Pricing Grid
                          <InfoTooltip content="Set prices for different meal plans and occupancy combinations. Toggle plans on/off to control frontend visibility." />
                        </CardTitle>
                        <div className="text-sm text-muted-foreground mt-2">
                          Step 2: Fill in prices for each plan and occupancy combination. Disable plans that are not available.
                        </div>
                      </CardHeader>
                      <CardContent>
                        <PlanOccupancyGrid
                          propertyId={propertyId}
                          roomCategories={roomCategories.map(cat => ({
                            code: cat.id,
                            name: cat.name,
                            basePrice: cat.price
                          }))}
                          selectedCategory={selectedRoomCategory}
                          onSave={fetchPropertyData}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {!selectedRoomCategory && (
                    <Card>
                      <CardContent className="py-12">
                        <div className="text-center">
                          <IndianRupee className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <h3 className="text-lg font-medium mb-2">No Room Category Selected</h3>
                          <p className="text-muted-foreground mb-4">
                            Please select a room category above to start configuring plan-based pricing
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                </TabsContent>

                <TabsContent value="blocked-dates" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ban className="h-5 w-5 text-red-600" />
                        Blocked Dates Management
                        <InfoTooltip content="Block specific dates for maintenance, personal use, or availability control per room category" />
                      </CardTitle>

                      {/* Room Category Selection */}
                      {selectedRoomCategory ? (
                        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-red-600" />
                            <span className="font-medium text-red-900">
                              Configuring:{" "}
                              {
                                roomCategories.find(
                                  (c) => c.id === selectedRoomCategory
                                )?.name
                              }
                            </span>
                            <Badge variant="outline">
                              {
                                roomCategories.find(
                                  (c) => c.id === selectedRoomCategory
                                )?.count
                              }{" "}
                              rooms
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab("base-price")}
                          >
                            Change Category
                          </Button>
                        </div>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab
                            before configuring blocked dates.
                            <Button
                              variant="link"
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab("base-price")}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardHeader>
                    <CardContent>
                      {selectedRoomCategory ? (
                        <>
                          {/* Block Date Controls */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">
                                  Block Dates Calendar
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Click on dates to block them for the selected
                                  room category
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setIsBlockRangeMode(!isBlockRangeMode)
                                  }
                                >
                                  {isBlockRangeMode
                                    ? "Range Mode"
                                    : "Single Date"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedBlockDates([])}
                                  disabled={selectedBlockDates.length === 0}
                                >
                                  Clear Selection
                                </Button>
                              </div>
                            </div>

                            {/* Blocked Dates Calendar */}
                            <div className="border rounded-lg p-4 bg-white">
                              <PricingCalendar
                                basePrice={
                                  roomCategories.find(
                                    (c) => c.id === selectedRoomCategory
                                  )?.price || 0
                                }
                                customPrices={[]} // Not showing prices for blocked dates
                                seasonalRules={[]}
                                mode={isBlockRangeMode ? "range" : "multiple"}
                                selectedDates={selectedBlockDates}
                                onDateSelect={(dates) => {
                                  console.log(
                                    "Calendar date selection changed:",
                                    dates
                                  )
                                  setSelectedBlockDates(dates)
                                }}
                                minDate={new Date()}
                                showPrices={false}
                                blockedDates={getBlockedDatesForCategory(
                                  selectedRoomCategory
                                ).map((blocked: any) => {
                                  // Ensure proper date format for calendar
                                  const startDate =
                                    typeof blocked.startDate === "string"
                                      ? blocked.startDate
                                      : format(blocked.startDate, "yyyy-MM-dd")
                                  const endDate =
                                    typeof blocked.endDate === "string"
                                      ? blocked.endDate
                                      : format(blocked.endDate, "yyyy-MM-dd")

                                  return {
                                    ...blocked,
                                    startDate,
                                    endDate,
                                    isActive: blocked.isActive !== false, // Ensure it's treated as active by default
                                  }
                                })}
                                variant="blocking"
                                className="w-full"
                              />
                            </div>

                            {/* Selected Dates Info */}
                            {selectedBlockDates.length > 0 && (
                              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <h5 className="font-medium text-red-900 mb-2">
                                  Selected: {selectedBlockDates.length} date
                                  {selectedBlockDates.length > 1 ? "s" : ""}
                                </h5>
                                <div className="text-sm text-red-700 mb-3">
                                  {selectedBlockDates.length === 1
                                    ? format(
                                        selectedBlockDates[0],
                                        "MMM dd, yyyy"
                                      )
                                    : `${format(
                                        selectedBlockDates[0],
                                        "MMM dd"
                                      )} - ${format(
                                        selectedBlockDates[
                                          selectedBlockDates.length - 1
                                        ],
                                        "MMM dd, yyyy"
                                      )}`}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setBlockDateForm((prev) => ({
                                        ...prev,
                                        dates: selectedBlockDates,
                                        categoryId: selectedRoomCategory,
                                      }))
                                      setBlockDateDialogOpen(true)
                                    }}
                                  >
                                    Block These Dates
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      unblockDates(selectedBlockDates)
                                    }
                                    disabled={
                                      !selectedBlockDates.some((date) =>
                                        isDateBlocked(
                                          date,
                                          selectedRoomCategory
                                        )
                                      )
                                    }
                                  >
                                    Unblock These Dates
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                                <span>Available</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-red-500 rounded"></div>
                                <span>Blocked</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                                <span>Past Dates</span>
                              </div>
                            </div>
                          </div>

                          <Separator className="my-6" />

                          {/* Existing Blocked Dates List */}
                          <div className="space-y-4">
                            <h4 className="font-medium flex items-center gap-2">
                              <Ban className="h-4 w-4 text-red-600" />
                              Active Blocked Periods (
                              {
                                getBlockedDatesForCategory(selectedRoomCategory)
                                  .length
                              }
                              )
                            </h4>

                            <div className="space-y-3">
                              {getBlockedDatesForCategory(
                                selectedRoomCategory
                              ).map((blockedPeriod: any, index: number) => {
                                const isRange =
                                  blockedPeriod.startDate !==
                                  blockedPeriod.endDate
                                const startDate = new Date(
                                  blockedPeriod.startDate
                                )
                                const endDate = new Date(blockedPeriod.endDate)

                                return (
                                  <div
                                    key={index}
                                    className="p-4 border border-red-200 rounded-lg bg-red-50"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-medium text-red-900">
                                          {isRange
                                            ? `${format(
                                                startDate,
                                                "MMM dd, yyyy"
                                              )} - ${format(
                                                endDate,
                                                "MMM dd, yyyy"
                                              )}`
                                            : format(startDate, "MMM dd, yyyy")}
                                        </div>
                                        <div className="text-sm text-red-700 mt-1">
                                          <span className="capitalize">
                                            {blockedPeriod.reason}
                                          </span>
                                          {isRange && (
                                            <span className="ml-2">
                                              (
                                              {Math.ceil(
                                                (endDate.getTime() -
                                                  startDate.getTime()) /
                                                  (1000 * 60 * 60 * 24)
                                              ) + 1}{" "}
                                              days)
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Switch
                                          checked={blockedPeriod.isActive}
                                          onCheckedChange={(checked) =>
                                            toggleBlockedDateActive(
                                              index,
                                              checked
                                            )
                                          }
                                        />
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const dates = []
                                            const currentDate = new Date(
                                              blockedPeriod.startDate
                                            )
                                            const endDate = new Date(
                                              blockedPeriod.endDate
                                            )

                                            while (currentDate <= endDate) {
                                              dates.push(new Date(currentDate))
                                              currentDate.setDate(
                                                currentDate.getDate() + 1
                                              )
                                            }

                                            setBlockDateForm({
                                              dates,
                                              reason: blockedPeriod.reason,
                                              categoryId: selectedRoomCategory,
                                              editIndex: index,
                                            })
                                            setBlockDateDialogOpen(true)
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() =>
                                            deleteBlockedDate(index)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}

                              {getBlockedDatesForCategory(selectedRoomCategory)
                                .length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                                  <Ban className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <div className="font-medium">
                                    No blocked dates
                                  </div>
                                  <div className="text-sm">
                                    Click on calendar dates to block them
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            Please select a room category in the Base Price tab
                            before configuring blocked dates.
                            <Button
                              variant="link"
                              className="ml-2 p-0 h-auto"
                              onClick={() => setActiveTab("base-price")}
                            >
                              Go to Base Price →
                            </Button>
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>

                  {/* Block Date Dialog */}
                  <Dialog
                    open={blockDateDialogOpen}
                    onOpenChange={setBlockDateDialogOpen}
                  >
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {blockDateForm.editIndex !== undefined
                            ? "Edit"
                            : "Block"}{" "}
                          Dates
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Selected Dates</Label>
                          <div className="text-sm text-muted-foreground">
                            {blockDateForm.dates.length === 1
                              ? format(blockDateForm.dates[0], "MMM dd, yyyy")
                              : blockDateForm.dates.length > 1
                              ? `${format(
                                  blockDateForm.dates[0],
                                  "MMM dd"
                                )} - ${format(
                                  blockDateForm.dates[
                                    blockDateForm.dates.length - 1
                                  ],
                                  "MMM dd, yyyy"
                                )} (${blockDateForm.dates.length} days)`
                              : "No dates selected"}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="blockReason">
                            Reason for Blocking
                          </Label>
                          <Select
                            value={blockDateForm.reason}
                            onValueChange={(value) =>
                              setBlockDateForm((prev) => ({
                                ...prev,
                                reason: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="maintenance">
                                Maintenance
                              </SelectItem>
                              <SelectItem value="personal">
                                Personal Use
                              </SelectItem>
                              <SelectItem value="demand_control">
                                Demand Control
                              </SelectItem>
                              <SelectItem value="event">
                                Event Conflict
                              </SelectItem>
                              <SelectItem value="renovation">
                                Renovation
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <div className="text-sm text-yellow-800">
                            <div className="font-medium mb-1">Impact:</div>
                            <div>
                              • Room Category:{" "}
                              {
                                roomCategories.find(
                                  (c) => c.id === selectedRoomCategory
                                )?.name
                              }
                            </div>
                            <div>
                              • Affected Rooms:{" "}
                              {
                                roomCategories.find(
                                  (c) => c.id === selectedRoomCategory
                                )?.count
                              }
                            </div>
                            <div>
                              • Duration: {blockDateForm.dates.length} day
                              {blockDateForm.dates.length > 1 ? "s" : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setBlockDateDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={saveBlockedDates}
                          disabled={
                            blockDateForm.dates.length === 0 ||
                            !blockDateForm.reason
                          }
                        >
                          {blockDateForm.editIndex !== undefined
                            ? "Update"
                            : "Block"}{" "}
                          Dates
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Pricing History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        Pricing history and analytics coming soon...
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Direct Overrides Tab - NEW */}
                <TabsContent value="direct-overrides" className="space-y-6">
                  <DirectPricingForm
                    propertyId={propertyId}
                    roomCategories={roomCategories}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
          {/* Sidebar: wider, smaller font, less padding */}
          <div className="w-full max-w-full mt-6 lg:mt-0 lg:w-[340px]">
            <div className="bg-gray-50 border border-gray-200 rounded-xl shadow-sm p-3 flex flex-col gap-3 pb-6 lg:pb-0 max-w-full">
              {/* Live Preview Card - smaller font, wider container */}
              <Card className="max-w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 whitespace-normal break-words max-w-full text-base">
                    <Eye className="h-5 w-5 text-purple-600" />
                    <span className="truncate max-w-[70%]">Live Preview</span>
                    <InfoTooltip content="See how your pricing changes affect the final price in real-time" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-w-full text-[15px]">
                  {/* Selected Room Category */}
                  {selectedRoomCategory && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">
                        Room Category
                      </Label>
                      <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="font-medium text-blue-900">
                          {
                            roomCategories.find(
                              (c) => c.id === selectedRoomCategory
                            )?.name
                          }
                        </div>
                        <div className="text-blue-700">
                          {
                            roomCategories.find(
                              (c) => c.id === selectedRoomCategory
                            )?.count
                          }{" "}
                          rooms available
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground break-words max-w-full">
                      Preview Date
                    </Label>
                    <Calendar
                      mode="single"
                      selected={livePreview.selectedDate}
                      onSelect={(date) =>
                        date &&
                        setLivePreview((prev) => ({
                          ...prev,
                          selectedDate: date,
                        }))
                      }
                      className="rounded-md border max-w-full"
                    />
                  </div>
                  <Separator />
                  <div className="space-y-2 max-w-full">
                    <div className="flex justify-between items-center max-w-full">
                      <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                        {selectedRoomCategory
                          ? "Category Price:"
                          : "Base Price:"}
                      </span>
                      <span className="font-medium truncate max-w-[40%] text-base">
                        ₹{calculateLivePreview.basePrice.toLocaleString()}
                      </span>
                    </div>
                    {/* Dynamic rules functionality removed */}
                    <Separator />
                    <div className="flex justify-between items-center max-w-full">
                      <span className="font-medium truncate max-w-[60%] text-xs">
                        Final Price:
                      </span>
                      <span className="text-xl font-bold text-green-600 truncate max-w-[40%]">
                        ₹{calculateLivePreview.finalPrice.toLocaleString()}
                      </span>
                    </div>
                    {calculateLivePreview.finalPrice !==
                      calculateLivePreview.basePrice && (
                      <div className="text-center max-w-full">
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 whitespace-normal break-words max-w-full text-xs"
                        >
                          +
                          {Math.round(
                            (calculateLivePreview.finalPrice /
                              calculateLivePreview.basePrice -
                              1) *
                              100
                          )}
                          % from base
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-1 max-w-full">
                    <div className="flex items-center gap-2 text-xs max-w-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        Active Rules:
                      </span>
                      <span className="font-medium truncate max-w-[40%]">
                        0
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs max-w-full">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-muted-foreground truncate max-w-[60%]">
                        Custom Prices:
                      </span>
                      <span className="font-medium truncate max-w-[40%]">
                        {
                          (dynamicPricing?.directPricing?.customPrices || [])
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Quick Actions - smaller font, wider container */}
              <Card className="max-w-full">
                <CardHeader>
                  <CardTitle className="text-xs truncate max-w-full">
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 max-w-full">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start truncate max-w-full text-xs"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="truncate">Apply Weekend Premium</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start truncate max-w-full text-xs"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    <span className="truncate">Copy from Similar Property</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start truncate max-w-full text-xs"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    <span className="truncate">View Analytics</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {/* Modal for add/edit rule - functionality removed */}

      {/* Excel Import Dialog */}
      <ExcelImportDialog
        isOpen={showExcelImportDialog}
        onClose={() => setShowExcelImportDialog(false)}
        propertyId={propertyId}
        onImportComplete={(result) => {
          setShowExcelImportDialog(false)
          if (result.success) {
            toast({
              title: "Success!",
              description: "Plan-based pricing data imported successfully.",
            })
            // Refresh pricing data if needed
          } else {
            toast({
              title: "Import Failed",
              description:
                result.errors?.join(", ") || "Failed to import pricing data",
              variant: "destructive",
            })
          }
        }}
      />

      {/* Format Guide Dialog */}
      <Dialog open={showFormatGuide} onOpenChange={setShowFormatGuide}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-purple-600" />
              <span>Excel Import Format Guide</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                This guide explains the exact format needed for Excel files to
                import pricing data successfully.
              </AlertDescription>
            </Alert>

            {/* Required Columns */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Required Columns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        roomCategory
                      </code>{" "}
                      - Room type (e.g., "DELUXE ROOM")
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        checkInDate
                      </code>{" "}
                      - Format: YYYY-MM-DD
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        checkOutDate
                      </code>{" "}
                      - Format: YYYY-MM-DD
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        pricePerNight
                      </code>{" "}
                      - Numeric value
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Plan & Occupancy</h4>
                  <ul className="text-sm space-y-1">
                    <li>
                      <code className="bg-gray-200 px-1 rounded">planType</code>{" "}
                      - EP, CP, MAP, or AP
                    </li>
                    <li>
                      <code className="bg-gray-200 px-1 rounded">
                        occupancyType
                      </code>{" "}
                      - SINGLE, DOUBLE, TRIPLE, or QUAD
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Plan Types */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Plan Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-900">EP</div>
                  <div className="text-sm text-blue-700">Room Only</div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-medium text-green-900">CP</div>
                  <div className="text-sm text-green-700">Room + Breakfast</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="font-medium text-orange-900">MAP</div>
                  <div className="text-sm text-orange-700">
                    Room + Breakfast + 1 Meal
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-medium text-purple-900">AP</div>
                  <div className="text-sm text-purple-700">
                    Room + All Meals
                  </div>
                </div>
              </div>
            </div>

            {/* Occupancy Types */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Occupancy Types</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">SINGLE</div>
                  <div className="text-sm text-gray-600">1 Guest</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">DOUBLE</div>
                  <div className="text-sm text-gray-600">2 Guests</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">TRIPLE</div>
                  <div className="text-sm text-gray-600">3 Guests</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="font-medium">QUAD</div>
                  <div className="text-sm text-gray-600">4 Guests</div>
                </div>
              </div>
            </div>

            {/* Example Data */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Example Excel Data</h3>
              <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 border-r">roomCategory</th>
                      <th className="text-left p-2 border-r">checkInDate</th>
                      <th className="text-left p-2 border-r">checkOutDate</th>
                      <th className="text-left p-2 border-r">planType</th>
                      <th className="text-left p-2 border-r">occupancyType</th>
                      <th className="text-left p-2">pricePerNight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 border-r">DELUXE ROOM</td>
                      <td className="p-2 border-r">2024-12-25</td>
                      <td className="p-2 border-r">2024-12-26</td>
                      <td className="p-2 border-r">EP</td>
                      <td className="p-2 border-r">DOUBLE</td>
                      <td className="p-2">5000</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 border-r">DELUXE ROOM</td>
                      <td className="p-2 border-r">2024-12-25</td>
                      <td className="p-2 border-r">2024-12-26</td>
                      <td className="p-2 border-r">CP</td>
                      <td className="p-2 border-r">DOUBLE</td>
                      <td className="p-2">6000</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r">STANDARD ROOM</td>
                      <td className="p-2 border-r">2024-12-31</td>
                      <td className="p-2 border-r">2025-01-01</td>
                      <td className="p-2 border-r">MAP</td>
                      <td className="p-2 border-r">SINGLE</td>
                      <td className="p-2">4500</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Important Notes */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Important Notes</h3>
              <div className="space-y-2">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Date Format:</strong> Use YYYY-MM-DD format only
                    (e.g., 2024-12-25)
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Case Sensitive:</strong> Plan types and occupancy
                    types must match exactly (EP, CP, MAP, AP for plans; SINGLE,
                    DOUBLE, TRIPLE, QUAD for occupancy)
                  </AlertDescription>
                </Alert>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pricing:</strong> Enter prices as numbers only
                    (e.g., 5000, not "₹5000" or "5,000")
                  </AlertDescription>
                </Alert>
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Tip:</strong> Download the template first to ensure
                    proper formatting
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowFormatGuide(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
