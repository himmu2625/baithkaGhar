"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { PricingCalendar } from "@/components/ui/pricing-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  IndianRupee,
  TrendingUp,
  Calendar,
  Upload,
  Download,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle2,
  X,
  Eye,
  Edit,
  Trash2,
  Target,
  Clock,
  Zap,
  Shield,
  Globe,
  Wifi,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Building,
  ArrowLeft,
  Hotel
} from "lucide-react"

// Types
interface RateRule {
  _id: string
  name: string
  ruleType: string
  roomTypeIds: string[]
  roomTypeName?: string
  basePrice: number
  multiplier?: number
  adjustment?: number
  currency: string
  isActive: boolean
  priority: number
  validFrom: string
  validTo: string
  description: string
  conditions: {
    minStay?: number
    maxStay?: number
    advanceBooking?: number
    occupancyThreshold?: number
    maxIncrease?: number
  }
}

interface RoomType {
  id: string
  name: string
  description: string
  basePrice: number
  count: number
  maxGuests: number
}

interface Property {
  id: string
  name: string
}

export default function RateManagement() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  const propertyId = params.propertyId as string

  // State
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [rateRules, setRateRules] = useState<RateRule[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [property, setProperty] = useState<Property | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRoomType, setSelectedRoomType] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedRuleType, setSelectedRuleType] = useState("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDynamicPricingDialog, setShowDynamicPricingDialog] = useState(false)
  const [showOTADialog, setShowOTADialog] = useState(false)
  const [selectedRule, setSelectedRule] = useState<RateRule | null>(null)
  const [otaConnections, setOtaConnections] = useState([
    { id: 'booking', name: 'Booking.com', connected: true, lastSync: '2 hours ago', status: 'active' },
    { id: 'expedia', name: 'Expedia', connected: true, lastSync: '5 hours ago', status: 'active' },
    { id: 'airbnb', name: 'Airbnb', connected: false, lastSync: 'Never', status: 'inactive' },
    { id: 'agoda', name: 'Agoda', connected: true, lastSync: '1 hour ago', status: 'active' },
    { id: 'makemytrip', name: 'MakeMyTrip', connected: true, lastSync: '3 hours ago', status: 'active' }
  ])
  const [dynamicPricing, setDynamicPricing] = useState({
    enabled: false,
    basePrice: 0,
    minPrice: 0,
    maxPrice: 0,
    demandMultiplier: 1.2,
    occupancyThreshold: 80,
    seasonalAdjustment: 0,
    weekendMultiplier: 1.1
  })

  // Calendar-based pricing state
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [customPrices, setCustomPrices] = useState<Array<{
    startDate: string
    endDate: string
    price: number
    reason: string
    isActive: boolean
  }>>([])
  const [seasonalRules, setSeasonalRules] = useState<Array<{
    id: string
    name: string
    startDate: string
    endDate: string
    multiplier: number
    isActive: boolean
  }>>([])
  const [newCustomPrice, setNewCustomPrice] = useState({
    price: 0,
    reason: ""
  })
  const [newRule, setNewRule] = useState({
    name: "",
    description: "",
    ruleType: "base_rate",
    roomTypeIds: [],
    basePrice: 0,
    validFrom: "",
    validTo: "",
    isActive: true,
    conditions: {
      minStay: 1,
      maxStay: 30,
    }
  })

  // Import state
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importData, setImportData] = useState<any[]>([])
  const [importHeaders, setImportHeaders] = useState<string[]>([])
  const [importMapping, setImportMapping] = useState({
    roomTypeName: "",
    basePrice: "",
    startDate: "",
    endDate: ""
  })

  // Data fetching
  useEffect(() => {
    if (propertyId && session?.user) {
      fetchData()
    }
  }, [propertyId, session])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔄 [Rate Management] Starting data fetch for property:", propertyId)

      // Fetch rate rules and room types in parallel
      const [rateRulesResponse, roomTypesResponse] = await Promise.allSettled([
        fetch(`/api/inventory/rate-rules?propertyId=${propertyId}`),
        fetch(`/api/admin/properties/${propertyId}/pricing`)
      ])

      // Handle rate rules response
      if (rateRulesResponse.status === 'fulfilled') {
        try {
          const rateRulesData = await rateRulesResponse.value.json()
          console.log("📊 [Rate Management] Rate rules response:", rateRulesData)

          if (rateRulesData.success && rateRulesData.rateRules) {
            setRateRules(rateRulesData.rateRules)
            setProperty(rateRulesData.property)
            console.log("✅ [Rate Management] Rate rules loaded:", rateRulesData.rateRules.length)
          } else {
            console.warn("⚠️ [Rate Management] No rate rules data")
            setRateRules([])
          }
        } catch (error) {
          console.error("❌ [Rate Management] Error parsing rate rules:", error)
          setRateRules([])
        }
      }

      // Handle room types response
      if (roomTypesResponse.status === 'fulfilled') {
        try {
          const roomTypesData = await roomTypesResponse.value.json()
          console.log("🏠 [Rate Management] Room types response:", roomTypesData)

          if (roomTypesResponse.value.ok && roomTypesData.roomCategories) {
            const transformedRoomTypes = roomTypesData.roomCategories.map((category: any) => ({
              id: category.id,
              name: category.name,
              description: category.description,
              basePrice: category.price,
              count: category.count,
              maxGuests: category.maxGuests
            }))
            setRoomTypes(transformedRoomTypes)
            console.log("✅ [Rate Management] Room types loaded:", transformedRoomTypes.length)
          } else {
            console.warn("⚠️ [Rate Management] No room categories data")
            setRoomTypes([])
          }
        } catch (error) {
          console.error("❌ [Rate Management] Error parsing room types:", error)
          setRoomTypes([])
        }
      }

      console.log("✅ [Rate Management] Data fetch completed")
    } catch (error) {
      console.error("❌ [Rate Management] Unexpected error during data fetch:", error)
      setRateRules([])
      setRoomTypes([])
    } finally {
      setLoading(false)
      console.log("🏁 [Rate Management] Loading state set to false")
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
    toast({
      title: "Success",
      description: "Rate data refreshed successfully",
    })
  }

  // Filter rules
  const filteredRules = rateRules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRoomType = selectedRoomType === "all" ||
                           rule.roomTypeIds.includes(selectedRoomType) ||
                           rule.roomTypeName?.toLowerCase().includes(selectedRoomType.toLowerCase())
    const matchesStatus = selectedStatus === "all" ||
                         (selectedStatus === "active" && rule.isActive) ||
                         (selectedStatus === "inactive" && !rule.isActive)
    const matchesRuleType = selectedRuleType === "all" || rule.ruleType === selectedRuleType

    return matchesSearch && matchesRoomType && matchesStatus && matchesRuleType
  })

  // Create new rule
  const handleCreateRule = async () => {
    try {
      const response = await fetch(`/api/inventory/rate-rules?propertyId=${propertyId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRule),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Rate rule created successfully",
        })
        setShowCreateDialog(false)
        setNewRule({
          name: "",
          description: "",
          ruleType: "base_rate",
          roomTypeIds: [],
          basePrice: 0,
          validFrom: "",
          validTo: "",
          isActive: true,
          conditions: {
            minStay: 1,
            maxStay: 30,
          }
        })
        await fetchData()
      } else {
        throw new Error('Failed to create rule')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create rate rule",
        variant: "destructive",
      })
    }
  }

  // Handle file import
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)

    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          const headers = lines[0].split(',').map(h => h.trim())
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim())
            const obj: any = {}
            headers.forEach((header, index) => {
              obj[header] = values[index] || ''
            })
            return obj
          })

          setImportHeaders(headers)
          setImportData(data)

          // Auto-map common headers
          const autoMapping = {
            roomTypeName: headers.find(h =>
              h.toLowerCase().includes('room') ||
              h.toLowerCase().includes('type') ||
              h.toLowerCase().includes('name')
            ) || '',
            basePrice: headers.find(h =>
              h.toLowerCase().includes('price') ||
              h.toLowerCase().includes('rate') ||
              h.toLowerCase().includes('amount')
            ) || '',
            startDate: headers.find(h =>
              h.toLowerCase().includes('start') ||
              h.toLowerCase().includes('from')
            ) || '',
            endDate: headers.find(h =>
              h.toLowerCase().includes('end') ||
              h.toLowerCase().includes('to')
            ) || ''
          }

          setImportMapping(autoMapping)
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to parse file. Please ensure it's a valid CSV format.",
            variant: "destructive",
          })
        }
      }

      reader.readAsText(file)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      })
    }
  }

  // Apply dynamic pricing to all OTAs
  const applyDynamicPricing = async (ruleId: string) => {
    try {
      const connectedOTAs = otaConnections.filter(ota => ota.connected)

      for (const ota of connectedOTAs) {
        await fetch(`/api/integrations/ota/${ota.id}/sync-rates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            ruleId,
            dynamicPricing
          }),
        })
      }

      // Update local OTA sync status
      setOtaConnections(prev => prev.map(ota =>
        ota.connected ? { ...ota, lastSync: 'Just now', status: 'active' } : ota
      ))

      toast({
        title: "Success",
        description: `Pricing updated across ${connectedOTAs.length} connected OTAs`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync pricing with OTAs",
        variant: "destructive",
      })
    }
  }

  // Update dynamic pricing for a specific rule
  const updateDynamicPricing = async (rule: RateRule) => {
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ruleId: rule._id,
          dynamicPricing: {
            ...dynamicPricing,
            basePrice: rule.basePrice
          },
          customPrices,
          seasonalRules
        }),
      })

      if (response.ok) {
        await applyDynamicPricing(rule._id)
        await fetchData()
        setShowDynamicPricingDialog(false)
        toast({
          title: "Success",
          description: `Calendar-based pricing updated with ${customPrices.length} custom price periods and synced across all OTAs`,
        })
      } else {
        throw new Error('Failed to update pricing')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update dynamic pricing",
        variant: "destructive",
      })
    }
  }

  // Sync with specific OTA
  const syncWithOTA = async (otaId: string) => {
    try {
      const response = await fetch(`/api/integrations/ota/${otaId}/sync-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          rateRules,
          roomTypes
        }),
      })

      if (response.ok) {
        setOtaConnections(prev => prev.map(ota =>
          ota.id === otaId ? { ...ota, lastSync: 'Just now', status: 'active' } : ota
        ))

        toast({
          title: "Success",
          description: `Successfully synced with ${otaConnections.find(o => o.id === otaId)?.name}`,
        })
      } else {
        throw new Error('Sync failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync with OTA",
        variant: "destructive",
      })
    }
  }

  // Handle calendar date selection
  const handleDateSelection = (dates: Date[]) => {
    setSelectedDates(dates)
  }

  // Add custom price for selected dates
  const addCustomPrice = () => {
    if (selectedDates.length === 0 || newCustomPrice.price <= 0) return

    const startDate = selectedDates[0]
    const endDate = selectedDates[selectedDates.length - 1]

    const customPrice = {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      price: newCustomPrice.price,
      reason: newCustomPrice.reason || 'Custom pricing',
      isActive: true
    }

    setCustomPrices(prev => [...prev, customPrice])
    setSelectedDates([])
    setNewCustomPrice({ price: 0, reason: "" })
  }

  // Remove custom price
  const removeCustomPrice = (index: number) => {
    setCustomPrices(prev => prev.filter((_, i) => i !== index))
  }

  // Process import
  const processImport = async () => {
    try {
      for (const row of importData) {
        const ruleData = {
          name: row[importMapping.roomTypeName] || `Imported Rule ${Date.now()}`,
          description: `Imported from Excel file`,
          ruleType: 'custom_rate',
          roomTypeIds: [],
          basePrice: parseFloat(row[importMapping.basePrice]) || 0,
          validFrom: row[importMapping.startDate] || new Date().toISOString().split('T')[0],
          validTo: row[importMapping.endDate] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true,
          conditions: {
            minStay: 1,
            maxStay: 30,
          }
        }

        await fetch(`/api/inventory/rate-rules?propertyId=${propertyId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ruleData),
        })
      }

      await fetchData()
      setShowImportDialog(false)
      setImportFile(null)
      setImportData([])
      setImportHeaders([])

      toast({
        title: "Success",
        description: `Imported ${importData.length} rate rules successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import rate rules",
        variant: "destructive",
      })
    }
  }

  // Get rule type badge and icon
  const getRuleTypeConfig = (ruleType: string) => {
    const configs = {
      base_rate: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Shield,
        label: "Base Rate"
      },
      seasonal: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: Calendar,
        label: "Seasonal"
      },
      demand_based: {
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: TrendingUp,
        label: "Demand Based"
      },
      custom_rate: {
        color: "bg-purple-100 text-purple-800 border-purple-200",
        icon: Target,
        label: "Custom Rate"
      }
    }
    return configs[ruleType as keyof typeof configs] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Settings,
      label: "Unknown"
    }
  }

  // Calculate stats
  const stats = {
    totalRules: rateRules.length,
    activeRules: rateRules.filter(r => r.isActive).length,
    avgBaseRate: Math.round(rateRules.reduce((sum, rule) => sum + rule.basePrice, 0) / (rateRules.length || 1)),
    roomTypes: roomTypes.length,
    upcomingExpiry: rateRules.filter(r => {
      const expiryDate = new Date(r.validTo)
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      return expiryDate <= thirtyDaysFromNow && r.isActive
    }).length
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <IndianRupee className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Rate Management...</p>
          <p className="mt-2 text-sm text-gray-500">Setting up your pricing dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header Section - Matching Room Types Style */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 m-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90"></div>
          <div className="relative">
            <div className="flex justify-between items-start">
              <div className="space-y-4">
                {/* Back Button */}
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/os/inventory/dashboard/${propertyId}`)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 h-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Inventory
                </Button>

                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <IndianRupee className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">
                      Rate Management
                    </h1>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-white/80" />
                        <span className="text-white/90">Advanced pricing control</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="h-4 w-4 text-white/80" />
                        <span className="text-white/90">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowOTADialog(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  OTA Sync ({otaConnections.filter(o => o.connected).length}/5)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Rates
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rate Rule
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid - Matching Room Types Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mx-6">
          {/* Total Rules */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl p-6 border border-teal-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-teal-700 font-medium">Total Rules</h3>
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <BarChart3 className="h-6 w-6 text-teal-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-teal-900 mb-2">{stats.totalRules}</div>
            <div className="flex items-center text-teal-600 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              {stats.activeRules} active
            </div>
          </div>

          {/* Room Types */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-blue-700 font-medium">Room Types</h3>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Hotel className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-blue-900 mb-2">{stats.roomTypes}</div>
            <div className="flex items-center text-blue-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Available categories
            </div>
          </div>

          {/* Average Rate */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-purple-700 font-medium">Avg Base Rate</h3>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <IndianRupee className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-purple-900 mb-2">₹{stats.avgBaseRate}</div>
            <div className="flex items-center text-purple-600 text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              across all rules
            </div>
          </div>

          {/* Active Rules */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-orange-700 font-medium">Active Rules</h3>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-orange-900 mb-2">{stats.activeRules}</div>
            <div className="flex items-center text-orange-600 text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Currently running
            </div>
          </div>

          {/* Expiring Soon */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-red-700 font-medium">Expiring Soon</h3>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-red-900 mb-2">{stats.upcomingExpiry}</div>
            <div className="flex items-center text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Within 30 days
            </div>
          </div>
        </div>

        {/* Search Section - Matching Room Types Style */}
        <div className="mx-6 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Find Rate Rules</h3>
                  <p className="text-gray-600">Search and filter rate categories by various criteria</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  {filteredRules.length} rules found
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-12 text-base border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Room Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Room Type</Label>
                <Select value={selectedRoomType} onValueChange={setSelectedRoomType}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="All Room Types (2)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Room Types ({roomTypes.length})</SelectItem>
                    {roomTypes.map((roomType) => (
                      <SelectItem key={roomType.id} value={roomType.id}>
                        {roomType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="All Status (2)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status ({rateRules.length})</SelectItem>
                    <SelectItem value="active">Active ({stats.activeRules})</SelectItem>
                    <SelectItem value="inactive">Inactive ({rateRules.length - stats.activeRules})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rule Type Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Rule Type</Label>
                <Select value={selectedRuleType} onValueChange={setSelectedRuleType}>
                  <SelectTrigger className="h-11 border-gray-200">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="base_rate">Base Rate</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="demand_based">Demand Based</SelectItem>
                    <SelectItem value="custom_rate">Custom Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Actions</Label>
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full h-11 border-gray-200 hover:bg-gray-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Rules Grid - Matching Room Types Style */}
        <div className="mx-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRules.map((rule) => {
            const ruleConfig = getRuleTypeConfig(rule.ruleType)
            const IconComponent = ruleConfig.icon
            const isExpiringSoon = new Date(rule.validTo) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            return (
              <div key={rule._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-gray-900 font-semibold text-lg">{rule.name}</h3>
                    <p className="text-gray-500 text-sm">{rule.description}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${
                    rule.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Base Price</span>
                    <span className="font-semibold text-gray-900">₹{rule.basePrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Type</span>
                    <span className="text-gray-700 capitalize text-sm">{ruleConfig.label}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-sm">Valid Until</span>
                    <span className="text-gray-700 text-sm">{new Date(rule.validTo).toLocaleDateString()}</span>
                  </div>
                  {rule.conditions && rule.conditions.minStay && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">Min Stay</span>
                      <span className="text-gray-700 text-sm">{rule.conditions.minStay} nights</span>
                    </div>
                  )}
                  {isExpiringSoon && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                      <div className="flex items-center text-amber-700 text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expires in {Math.ceil((new Date(rule.validTo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedRule(rule)
                      setDynamicPricing(prev => ({ ...prev, basePrice: rule.basePrice }))
                      setShowDynamicPricingDialog(true)
                    }}
                    className="flex-1 text-sm"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Dynamic Pricing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => applyDynamicPricing(rule._id)}
                    className="flex-1 text-sm text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Sync to OTAs
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enhanced Empty State */}
        {filteredRules.length === 0 && (
          <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
            <CardContent className="flex flex-col items-center justify-center py-20">
              <div className="p-6 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full mb-6">
                <BarChart3 className="h-16 w-16 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No rate rules found</h3>
              <p className="text-gray-600 text-center max-w-md mb-6">
                {searchTerm || selectedRoomType !== "all" || selectedStatus !== "all" || selectedRuleType !== "all"
                  ? "Try adjusting your filters or search terms to find more results"
                  : "Get started by creating your first rate rule to begin managing your pricing strategy"}
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Rate Rule
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Rule Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Create New Rate Rule</DialogTitle>
              <DialogDescription>
                Add a new pricing rule to optimize your revenue strategy
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input
                  id="name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Enter a descriptive rule name"
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Describe when this rule applies"
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ruleType">Rule Type</Label>
                <Select value={newRule.ruleType} onValueChange={(value) => setNewRule({ ...newRule, ruleType: value })}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select rule type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base_rate">Base Rate</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                    <SelectItem value="demand_based">Demand Based</SelectItem>
                    <SelectItem value="custom_rate">Custom Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="basePrice">Base Price (₹)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  value={newRule.basePrice}
                  onChange={(e) => setNewRule({ ...newRule, basePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter base price"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="validFrom">Valid From</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={newRule.validFrom}
                    onChange={(e) => setNewRule({ ...newRule, validFrom: e.target.value })}
                    className="h-11"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validTo">Valid To</Label>
                  <Input
                    id="validTo"
                    type="date"
                    value={newRule.validTo}
                    onChange={(e) => setNewRule({ ...newRule, validTo: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={newRule.isActive}
                  onCheckedChange={(checked) => setNewRule({ ...newRule, isActive: checked as boolean })}
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Activate this rule immediately
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateRule} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Import Rate Rules</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import multiple rate rules at once
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="file">CSV File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="h-11"
                />
              </div>

              {importHeaders.length > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Map CSV Columns</h4>
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Room Type Name</Label>
                        <Select
                          value={importMapping.roomTypeName}
                          onValueChange={(value) => setImportMapping({ ...importMapping, roomTypeName: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {importHeaders.map((header) => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Base Price</Label>
                        <Select
                          value={importMapping.basePrice}
                          onValueChange={(value) => setImportMapping({ ...importMapping, basePrice: value })}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Select column" />
                          </SelectTrigger>
                          <SelectContent>
                            {importHeaders.map((header) => (
                              <SelectItem key={header} value={header}>{header}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Start Date</Label>
                          <Select
                            value={importMapping.startDate}
                            onValueChange={(value) => setImportMapping({ ...importMapping, startDate: value })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {importHeaders.map((header) => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label>End Date</Label>
                          <Select
                            value={importMapping.endDate}
                            onValueChange={(value) => setImportMapping({ ...importMapping, endDate: value })}
                          >
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select column" />
                            </SelectTrigger>
                            <SelectContent>
                              {importHeaders.map((header) => (
                                <SelectItem key={header} value={header}>{header}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">
                      Ready to import {importData.length} rate rules
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Please review the column mapping above before proceeding
                    </p>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={processImport}
                disabled={!importFile || importHeaders.length === 0}
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                Import {importData.length} Rules
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dynamic Pricing Dialog */}
        <Dialog open={showDynamicPricingDialog} onOpenChange={setShowDynamicPricingDialog}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dynamic Pricing - {selectedRule?.name}
              </DialogTitle>
              <DialogDescription>
                Configure calendar-based pricing with intelligent rules that automatically adjust rates based on demand, occupancy, and market conditions
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 max-h-[calc(90vh-200px)]">
              <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="calendar">Calendar Pricing</TabsTrigger>
                  <TabsTrigger value="dynamic">Dynamic Rules</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-6 mt-6">
                  {/* Calendar Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Calendar-Based Pricing</h3>
                      <p className="text-sm text-gray-600">Set custom prices for specific dates and date ranges</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      ₹{selectedRule?.basePrice || 0} Base Price
                    </Badge>
                  </div>

                  {/* Pricing Calendar */}
                  <div className="border rounded-lg p-4 bg-white">
                    <PricingCalendar
                      basePrice={selectedRule?.basePrice || 0}
                      customPrices={customPrices}
                      seasonalRules={seasonalRules}
                      mode="range"
                      selectedDates={selectedDates}
                      onDateSelect={handleDateSelection}
                      showPrices={true}
                      className="w-full"
                    />
                  </div>

                  {/* Custom Price Input */}
                  {selectedDates.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <h4 className="font-medium text-amber-900 mb-3">Set Custom Price for Selected Dates</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Custom Price (₹)</Label>
                          <Input
                            type="number"
                            value={newCustomPrice.price}
                            onChange={(e) => setNewCustomPrice(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            placeholder="Enter price"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reason (Optional)</Label>
                          <Input
                            value={newCustomPrice.reason}
                            onChange={(e) => setNewCustomPrice(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="e.g., Peak season, Holiday"
                            className="h-10"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-amber-700">
                          Selected: {format(selectedDates[0], 'MMM dd')} - {format(selectedDates[selectedDates.length - 1], 'MMM dd, yyyy')}
                        </span>
                        <Button onClick={addCustomPrice} size="sm" className="bg-amber-600 hover:bg-amber-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Custom Price
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Custom Prices List */}
                  {customPrices.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium">Custom Prices</h4>
                      {customPrices.map((price, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">₹{price.price}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(price.startDate), 'MMM dd')} - {format(new Date(price.endDate), 'MMM dd, yyyy')}
                            </div>
                            {price.reason && (
                              <div className="text-xs text-gray-500">{price.reason}</div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomPrice(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="dynamic" className="space-y-6 mt-6">
                  {/* Enable Toggle */}
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <Label className="text-base font-medium">Enable Dynamic Pricing</Label>
                      <p className="text-sm text-gray-600">Automatically adjust rates based on market conditions</p>
                    </div>
                    <Checkbox
                      checked={dynamicPricing.enabled}
                      onCheckedChange={(checked) => setDynamicPricing(prev => ({ ...prev, enabled: checked as boolean }))}
                    />
                  </div>

                  {/* Pricing Configuration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Price (₹)</Label>
                      <Input
                        type="number"
                        value={dynamicPricing.basePrice}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Demand Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dynamicPricing.demandMultiplier}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, demandMultiplier: parseFloat(e.target.value) || 1 }))}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Minimum Price (₹)</Label>
                      <Input
                        type="number"
                        value={dynamicPricing.minPrice}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum Price (₹)</Label>
                      <Input
                        type="number"
                        value={dynamicPricing.maxPrice}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 0 }))}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Occupancy Threshold (%)</Label>
                      <Input
                        type="number"
                        value={dynamicPricing.occupancyThreshold}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, occupancyThreshold: parseFloat(e.target.value) || 80 }))}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weekend Multiplier</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={dynamicPricing.weekendMultiplier}
                        onChange={(e) => setDynamicPricing(prev => ({ ...prev, weekendMultiplier: parseFloat(e.target.value) || 1.1 }))}
                        className="h-11"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-6 mt-6">
                  {/* Price Preview */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-4">Price Preview</h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-white rounded border">
                        <p className="text-green-600 mb-1">Low Demand</p>
                        <p className="text-2xl font-bold text-green-900">₹{Math.round(dynamicPricing.basePrice * 0.9)}</p>
                        <p className="text-xs text-gray-500">10% reduction</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded border">
                        <p className="text-green-600 mb-1">Normal Demand</p>
                        <p className="text-2xl font-bold text-green-900">₹{dynamicPricing.basePrice}</p>
                        <p className="text-xs text-gray-500">Base price</p>
                      </div>
                      <div className="text-center p-3 bg-white rounded border">
                        <p className="text-green-600 mb-1">High Demand</p>
                        <p className="text-2xl font-bold text-green-900">₹{Math.round(dynamicPricing.basePrice * dynamicPricing.demandMultiplier)}</p>
                        <p className="text-xs text-gray-500">{Math.round((dynamicPricing.demandMultiplier - 1) * 100)}% increase</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom Prices Summary */}
                  {customPrices.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-3">Custom Price Summary</h4>
                      <div className="space-y-2">
                        {customPrices.map((price, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-blue-700">
                              {format(new Date(price.startDate), 'MMM dd')} - {format(new Date(price.endDate), 'MMM dd')}
                            </span>
                            <span className="font-semibold text-blue-900">₹{price.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button variant="outline" onClick={() => setShowDynamicPricingDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedRule && updateDynamicPricing(selectedRule)} className="bg-gradient-to-r from-blue-500 to-indigo-600">
                <RotateCcw className="h-4 w-4 mr-2" />
                Apply & Sync to OTAs
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* OTA Management Dialog */}
        <Dialog open={showOTADialog} onOpenChange={setShowOTADialog}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                OTA Integration & Sync Management
              </DialogTitle>
              <DialogDescription>
                Manage your connections to Online Travel Agencies and sync pricing across all platforms
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4 overflow-y-auto flex-1 max-h-[calc(90vh-200px)]">
              {/* Connected OTAs Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{otaConnections.filter(o => o.connected).length}</div>
                  <div className="text-xs text-green-600">Connected</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{rateRules.length}</div>
                  <div className="text-xs text-blue-600">Rate Rules</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">{roomTypes.length}</div>
                  <div className="text-xs text-purple-600">Room Types</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-900">24/7</div>
                  <div className="text-xs text-orange-600">Auto Sync</div>
                </div>
              </div>

              {/* OTA List */}
              <div className="space-y-3">
                <h4 className="font-medium">Connected Platforms</h4>
                {otaConnections.map((ota) => (
                  <div key={ota.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${ota.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Building className={`h-5 w-5 ${ota.connected ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="font-medium">{ota.name}</div>
                        <div className="text-sm text-gray-500">Last sync: {ota.lastSync}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={ota.connected ? "default" : "secondary"}>
                        {ota.connected ? "Connected" : "Disconnected"}
                      </Badge>
                      {ota.connected && (
                        <Button size="sm" variant="outline" onClick={() => syncWithOTA(ota.id)}>
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Sync Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bulk Actions */}
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">Bulk Actions</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Apply changes to all connected OTAs simultaneously
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      otaConnections.filter(o => o.connected).forEach(ota => syncWithOTA(ota.id))
                    }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Sync All OTAs
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      rateRules.forEach(rule => applyDynamicPricing(rule._id))
                    }}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Apply All Pricing Rules
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0 border-t pt-4">
              <Button variant="outline" onClick={() => setShowOTADialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}