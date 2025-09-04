"use client"

import React, { useEffect, useState } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  IndianRupee,
  BedIcon,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DailyReportData {
  date: string
  occupancyRate: number
  totalRooms: number
  occupiedRooms: number
  revenue: number
  checkIns: number
  checkOuts: number
  noShows: number
  cancellations: number
  avgRoomRate: number
  totalGuests: number
  pendingTasks: number
  housekeepingTasks: {
    clean: number
    dirty: number
    maintenance: number
    inspected: number
  }
  bookingSources: Array<{
    source: string
    bookings: number
    revenue: number
  }>
}

export default function DailyReportsPage() {
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [reportData, setReportData] = useState<DailyReportData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, router])

  const fetchDailyReport = async (date: string) => {
    try {
      setIsLoadingData(true)
      
      if (!user?.propertyId) {
        throw new Error("Property ID not found")
      }

      // Fetch real daily report data from API
      const response = await fetch(`/api/os/reports/daily?propertyId=${user.propertyId}&date=${date}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch daily report')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
      } else {
        throw new Error(data.error || 'Failed to fetch daily report')
      }
    } catch (error) {
      console.error("Error fetching daily report:", error)
      setError("Failed to load daily report")
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && user?.propertyId) {
      fetchDailyReport(selectedDate)
    }
  }, [isAuthenticated, user, selectedDate])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading daily reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={() => fetchDailyReport(selectedDate)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No report data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push(`/os/dashboard/${user?.propertyId}`)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Daily Reports
                </h1>
                <p className="text-blue-100 mt-2">
                  {formatDate(reportData.date)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger className="w-48 bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Select date" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = new Date()
                  date.setDate(date.getDate() - i)
                  const dateString = date.toISOString().split('T')[0]
                  return (
                    <SelectItem key={dateString} value={dateString}>
                      {date.toLocaleDateString("en-IN")}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            <Button variant="secondary" onClick={() => window.print()}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="secondary" onClick={() => fetchDailyReport(selectedDate)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {formatCurrency(reportData.revenue)}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              Avg Rate: {formatCurrency(reportData.avgRoomRate)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">
              Occupancy Rate
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {reportData.occupancyRate}%
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {reportData.occupiedRooms} of {reportData.totalRooms} rooms
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">
              Check-ins/Outs
            </CardTitle>
            <Activity className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-xl font-bold text-purple-900">
                  {reportData.checkIns}
                </div>
                <p className="text-xs text-purple-600">Check-ins</p>
              </div>
              <div className="h-8 w-px bg-purple-300"></div>
              <div>
                <div className="text-xl font-bold text-purple-900">
                  {reportData.checkOuts}
                </div>
                <p className="text-xs text-purple-600">Check-outs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">
              Total Guests
            </CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {reportData.totalGuests}
            </div>
            <p className="text-xs text-orange-600 mt-1">
              Currently in-house
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Housekeeping Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Housekeeping Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-green-100">
                <span className="font-medium text-green-800">Clean</span>
                <span className="font-bold text-green-800">
                  {reportData.housekeepingTasks.clean}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-red-100">
                <span className="font-medium text-red-800">Dirty</span>
                <span className="font-bold text-red-800">
                  {reportData.housekeepingTasks.dirty}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-orange-100">
                <span className="font-medium text-orange-800">Maintenance</span>
                <span className="font-bold text-orange-800">
                  {reportData.housekeepingTasks.maintenance}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-purple-100">
                <span className="font-medium text-purple-800">Inspected</span>
                <span className="font-bold text-purple-800">
                  {reportData.housekeepingTasks.inspected}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Booking Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData.bookingSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">{source.source}</p>
                    <p className="text-sm text-gray-600">{source.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(source.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues and Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Daily Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-red-50">
              <div className="text-2xl font-bold text-red-600">{reportData.noShows}</div>
              <p className="text-sm text-red-600 mt-1">No Shows</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-orange-50">
              <div className="text-2xl font-bold text-orange-600">{reportData.cancellations}</div>
              <p className="text-sm text-orange-600 mt-1">Cancellations</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50">
              <div className="text-2xl font-bold text-blue-600">{reportData.pendingTasks}</div>
              <p className="text-sm text-blue-600 mt-1">Pending Tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}