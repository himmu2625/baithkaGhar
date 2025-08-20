"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  CreditCard,
  FileText,
  BarChart3,
  PieChart,
  DollarSign,
  Receipt,
  Target,
  Timer,
  CheckCircle2,
  Calculator,
  Wallet,
  LineChart,
  Building,
  Users,
  Clock,
  CreditCard as CreditCardIcon,
  Banknote,
  TrendingUp as TrendingUpIcon,
  Activity,
  DollarSign as DollarSignIcon,
  PieChart as PieChartIcon,
  BarChart,
  Coins,
  Percent,
  FileBarChart,
  Zap,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Filter,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Separator } from "@/components/ui/separator"
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

interface FinancialData {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
    daily: Array<{ date: string; amount: number }>
    bySource: Array<{ source: string; amount: number; percentage: number }>
  }
  expenses: {
    total: number
    thisMonth: number
    categories: Array<{ category: string; amount: number; percentage: number }>
  }
  profit: {
    gross: number
    net: number
    margin: number
  }
  bookings: {
    totalValue: number
    averageValue: number
    completedBookings: number
    pendingPayments: number
  }
  payments: Array<{
    id: string
    bookingId: string
    guestName: string
    amount: number
    method: string
    status: string
    date: string
    type: string
  }>
  taxes: {
    totalCollected: number
    pending: number
    rate: number
  }
}

export default function FinancialReportsPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState("thisMonth")

  const propertyId = (params as { id?: string } | null)?.id as string

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setIsLoadingData(true)
        const response = await fetch(
          `/api/os/financial/${propertyId}?period=${selectedPeriod}`
        )
        if (!response.ok) {
          throw new Error("Failed to fetch financial data")
        }
        const data = await response.json()
        setFinancialData(data.financials)
      } catch (error) {
        console.error("Error fetching financial data:", error)
        setError("Failed to load financial data")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (propertyId && isAuthenticated) {
      fetchFinancialData()
    }
  }, [propertyId, isAuthenticated, selectedPeriod])

  // Authentication and access control
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.propertyId !== propertyId) {
        setError("You don't have access to this property")
      }
    } else if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading financial reports...</p>
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
            <Button onClick={() => router.push("/os/login")} variant="outline">
              Return to login
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!financialData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Financial data not available</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "default"
      case "pending":
        return "secondary"
      case "failed":
        return "destructive"
      case "refunded":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in-0 duration-300">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 border border-violet-100/50">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-indigo-500/5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-300/20 to-indigo-300/20 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-300/20 to-violet-300/20 rounded-full blur-2xl transform -translate-x-24 translate-y-24"></div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg flex items-center justify-center">
                    <BarChart className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-700 bg-clip-text text-transparent">
                    Financial Reports & Analytics
                  </h1>
                  <p className="text-violet-600/80 font-medium">
                    Comprehensive financial overview and revenue analytics
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 lg:mt-0 flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-4 text-sm text-violet-600">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live Data</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Timer className="h-4 w-4" />
                  <span>Real-time Analytics</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Select
                  value={selectedPeriod}
                  onValueChange={setSelectedPeriod}
                >
                  <SelectTrigger className="w-40 border-violet-200 hover:border-violet-300 focus:border-violet-400 bg-white/70 backdrop-blur-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="last3Months">Last 3 Months</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="border-violet-200 hover:border-violet-300 hover:bg-violet-50 text-violet-700 transition-all duration-200"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-800">
              Total Revenue
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-2">
              {formatCurrency(financialData.revenue.thisMonth)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                {financialData.revenue.growth >= 0 ? (
                  <ArrowUpRight className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={`text-xs font-medium ${
                    financialData.revenue.growth >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {Math.abs(financialData.revenue.growth).toFixed(1)}% from last
                  month
                </span>
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-1.5">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min(
                      Math.abs(financialData.revenue.growth) * 10,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-blue-800">
              Net Profit
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-2">
              {formatCurrency(financialData.profit.net)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <Percent className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">
                  {financialData.profit.margin.toFixed(1)}% profit margin
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${financialData.profit.margin}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-purple-800">
              Average Booking
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Calculator className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-2">
              {formatCurrency(financialData.bookings.averageValue)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600 font-medium">
                  {financialData.bookings.completedBookings} completed bookings
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Activity className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-purple-600">
                  Strong performance
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-orange-800">
              Pending Payments
            </CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-2">
              {financialData.bookings.pendingPayments}
            </div>
            <div className="space-y-1">
              <div className="flex items-center space-x-1">
                <AlertTriangle className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-orange-600 font-medium">
                  Require follow-up
                </span>
              </div>
              {financialData.bookings.pendingPayments > 0 && (
                <div className="flex items-center space-x-1">
                  <Zap className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">Action needed</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Financial Analysis with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={[
          "revenue-analysis",
          "payment-history",
          "expense-breakdown",
        ]}
        className="w-full"
      >
        {/* Enhanced Revenue Analysis */}
        <AccordionItem
          value="revenue-analysis"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                <LineChart className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-emerald-800">
                Revenue Analysis & Breakdown
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                    <PieChart className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-blue-800">
                    Revenue by Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData.revenue.bySource.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/90 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded-full ${
                              index === 0
                                ? "bg-blue-500"
                                : index === 1
                                ? "bg-emerald-500"
                                : index === 2
                                ? "bg-purple-500"
                                : "bg-orange-500"
                            }`}
                          ></div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800">
                              {source.source}
                            </span>
                            <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-1000 ${
                                  index === 0
                                    ? "bg-blue-500"
                                    : index === 1
                                    ? "bg-emerald-500"
                                    : index === 2
                                    ? "bg-purple-500"
                                    : "bg-orange-500"
                                }`}
                                style={{ width: `${source.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">
                            {formatCurrency(source.amount)}
                          </p>
                          <p className="text-xs text-slate-600 font-medium">
                            {source.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-emerald-800">
                    Monthly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20"></div>
                      <div className="relative flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Sparkles className="h-4 w-4" />
                            <p className="text-sm font-semibold">This Month</p>
                          </div>
                          <p className="text-2xl font-bold">
                            {formatCurrency(financialData.revenue.thisMonth)}
                          </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <TrendingUp className="h-8 w-8" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-white/70 rounded-xl border border-slate-200">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-slate-600" />
                          <p className="text-sm font-semibold text-slate-800">
                            Last Month
                          </p>
                        </div>
                        <p className="text-xl font-bold text-slate-800">
                          {formatCurrency(financialData.revenue.lastMonth)}
                        </p>
                      </div>
                      <div className="p-3 bg-slate-100 rounded-xl">
                        <BarChart3 className="h-6 w-6 text-slate-600" />
                      </div>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-violet-800 mb-1">
                            Growth Rate
                          </p>
                          <div className="flex items-center space-x-2">
                            {financialData.revenue.growth >= 0 ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            )}
                            <span
                              className={`text-xl font-bold ${
                                financialData.revenue.growth >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {Math.abs(financialData.revenue.growth).toFixed(
                                1
                              )}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              financialData.revenue.growth >= 0
                                ? "bg-green-100"
                                : "bg-red-100"
                            }`}
                          >
                            {financialData.revenue.growth >= 0 ? (
                              <TrendingUp className="h-8 w-8 text-green-600" />
                            ) : (
                              <TrendingDown className="h-8 w-8 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Payment History */}
        <AccordionItem
          value="payment-history"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 mt-6"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                <Wallet className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-blue-800">
                Payment History & Transactions
              </span>
              <Badge
                variant="secondary"
                className="ml-3 bg-blue-100 text-blue-700 border-blue-200"
              >
                {financialData.payments.length} transactions
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <Card className="border-0 shadow-none">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>Guest</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Booking ID</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <IndianRupee className="h-4 w-4" />
                            <span>Amount</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>Method</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Status</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <Activity className="h-4 w-4" />
                            <span>Type</span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Date</span>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {financialData.payments.map((payment, index) => (
                        <TableRow
                          key={payment.id}
                          className={`hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-gray-50/50 transition-all duration-200 ${
                            index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                          }`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <Users className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800">
                                  {payment.guestName}
                                </p>
                                <p className="text-xs text-slate-500">Guest</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                                <FileText className="h-3 w-3 text-slate-600" />
                              </div>
                              <code className="text-xs bg-slate-100 px-2 py-1 rounded-md font-mono text-slate-700">
                                {payment.bookingId.slice(-8)}
                              </code>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <IndianRupee className="h-4 w-4 text-emerald-600" />
                              <p className="font-bold text-slate-800">
                                {formatCurrency(payment.amount)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {payment.method}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getPaymentStatusBadge(payment.status)}
                              className="font-medium"
                            >
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  payment.type === "advance"
                                    ? "bg-orange-500"
                                    : payment.type === "full"
                                    ? "bg-green-500"
                                    : "bg-blue-500"
                                }`}
                              ></div>
                              <span className="text-sm capitalize font-medium text-slate-700">
                                {payment.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3 text-slate-500" />
                              <span className="text-sm text-slate-600 font-medium">
                                {new Date(payment.date).toLocaleDateString()}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {financialData.payments.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Wallet className="h-10 w-10 text-slate-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-slate-600 font-medium">
                        No payment transactions
                      </p>
                      <p className="text-sm text-slate-500">
                        Payment history will appear here once transactions are
                        made
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Expense Breakdown */}
        <AccordionItem
          value="expense-breakdown"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 mt-6"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-red-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-red-500/20 mr-3">
                <Receipt className="h-5 w-5 text-red-600" />
              </div>
              <span className="text-red-800">Expense Breakdown & Analysis</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 rounded-lg bg-red-500/20 mr-3">
                    <PieChart className="h-5 w-5 text-red-600" />
                  </div>
                  <CardTitle className="text-red-800">
                    Expense Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData.expenses.categories.map(
                      (category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-white/70 rounded-lg hover:bg-white/90 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-4 h-4 rounded-full ${
                                index === 0
                                  ? "bg-red-500"
                                  : index === 1
                                  ? "bg-orange-500"
                                  : index === 2
                                  ? "bg-pink-500"
                                  : "bg-rose-500"
                              }`}
                            ></div>
                            <div>
                              <span className="text-sm font-semibold text-slate-800">
                                {category.category}
                              </span>
                              <div className="w-20 bg-slate-200 rounded-full h-1.5 mt-1">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-1000 ${
                                    index === 0
                                      ? "bg-red-500"
                                      : index === 1
                                      ? "bg-orange-500"
                                      : index === 2
                                      ? "bg-pink-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${category.percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">
                              {formatCurrency(category.amount)}
                            </p>
                            <p className="text-xs text-slate-600 font-medium">
                              {category.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardHeader className="flex flex-row items-center space-y-0 pb-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 mr-3">
                    <Calculator className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-emerald-800">
                    Profit Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-slate-800">
                          Gross Revenue
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700">
                        {formatCurrency(financialData.revenue.thisMonth)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-white/70 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium text-slate-800">
                          Total Expenses
                        </span>
                      </div>
                      <span className="font-bold text-red-600">
                        -{formatCurrency(financialData.expenses.thisMonth)}
                      </span>
                    </div>

                    <div className="h-px bg-slate-200 my-3"></div>

                    <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-200">
                      <div className="flex items-center space-x-2">
                        <Target className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          Gross Profit
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 text-lg">
                        {formatCurrency(financialData.profit.gross)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-200">
                      <div className="flex items-center space-x-2">
                        <Coins className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-800">
                          Net Profit
                        </span>
                      </div>
                      <span className="font-bold text-emerald-700 text-lg">
                        {formatCurrency(financialData.profit.net)}
                      </span>
                    </div>

                    <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 p-4 text-white">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-green-600/20"></div>
                      <div className="relative flex justify-between items-center">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Percent className="h-4 w-4" />
                            <span className="text-sm font-semibold">
                              Profit Margin
                            </span>
                          </div>
                          <span className="text-2xl font-bold">
                            {financialData.profit.margin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                          <TrendingUp className="h-8 w-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Enhanced Tax Information */}
        <AccordionItem
          value="tax-information"
          className="border-0 shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-white to-slate-50 mt-6"
        >
          <AccordionTrigger className="text-lg font-semibold hover:no-underline px-6 py-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-amber-500/20 mr-3">
                <FileBarChart className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-amber-800">
                Tax Information & Compliance
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-green-800">
                    Tax Collected
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-green-900 mb-2">
                    {formatCurrency(financialData.taxes.totalCollected)}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Percent className="h-3 w-3 text-green-600" />
                    <p className="text-xs text-green-600 font-medium">
                      At {financialData.taxes.rate}% rate
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-orange-800">
                    Pending Tax
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-orange-900 mb-2">
                    {formatCurrency(financialData.taxes.pending)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <p className="text-xs text-orange-600 font-medium">
                        To be collected
                      </p>
                    </div>
                    {financialData.taxes.pending > 0 && (
                      <div className="flex items-center space-x-1">
                        <Zap className="h-3 w-3 text-red-600" />
                        <p className="text-xs text-red-600">Action needed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-semibold text-blue-800">
                    Tax Rate
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                    <Percent className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-blue-900 mb-2">
                    {financialData.taxes.rate}%
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3 text-blue-600" />
                    <p className="text-xs text-blue-600 font-medium">
                      Current applicable rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
