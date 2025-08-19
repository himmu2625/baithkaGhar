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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Financial Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive financial overview and revenue analytics
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.revenue.thisMonth)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {financialData.revenue.growth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(financialData.revenue.growth).toFixed(1)}% from last
              month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.profit.net)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.profit.margin.toFixed(1)}% profit margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Booking
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(financialData.bookings.averageValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialData.bookings.completedBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {financialData.bookings.pendingPayments}
            </div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Analysis with Accordions */}
      <Accordion
        type="multiple"
        defaultValue={[
          "revenue-analysis",
          "payment-history",
          "expense-breakdown",
        ]}
        className="w-full"
      >
        {/* Revenue Analysis */}
        <AccordionItem value="revenue-analysis">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Revenue Analysis & Breakdown
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData.revenue.bySource.map((source, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium">
                            {source.source}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(source.amount)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {source.percentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          This Month
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(financialData.revenue.thisMonth)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Last Month
                        </p>
                        <p className="text-xl font-bold text-gray-900">
                          {formatCurrency(financialData.revenue.lastMonth)}
                        </p>
                      </div>
                      <BarChart3 className="h-6 w-6 text-gray-600" />
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium">Growth Rate</p>
                      <div className="flex items-center mt-1">
                        {financialData.revenue.growth >= 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                        )}
                        <span
                          className={`font-bold ${
                            financialData.revenue.growth >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {Math.abs(financialData.revenue.growth).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Payment History */}
        <AccordionItem value="payment-history">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Payment History & Transactions
              <Badge variant="secondary" className="ml-2">
                {financialData.payments.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Booking ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financialData.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <p className="font-medium">{payment.guestName}</p>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {payment.bookingId.slice(-8)}
                          </code>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {formatCurrency(payment.amount)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getPaymentStatusBadge(payment.status)}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">
                            {payment.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(payment.date).toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </AccordionContent>
        </AccordionItem>

        {/* Expense Breakdown */}
        <AccordionItem value="expense-breakdown">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <Receipt className="h-5 w-5 mr-2" />
              Expense Breakdown & Analysis
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Expense Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {financialData.expenses.categories.map(
                      (category, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span className="text-sm font-medium">
                              {category.category}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {formatCurrency(category.amount)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {category.percentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Gross Revenue</span>
                        <span className="font-medium">
                          {formatCurrency(financialData.revenue.thisMonth)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Expenses</span>
                        <span className="font-medium text-red-600">
                          -{formatCurrency(financialData.expenses.thisMonth)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Gross Profit
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(financialData.profit.gross)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Net Profit</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(financialData.profit.net)}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-900">
                          Profit Margin
                        </span>
                        <span className="text-xl font-bold text-blue-900">
                          {financialData.profit.margin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tax Information */}
        <AccordionItem value="tax-information">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Tax Information & Compliance
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tax Collected</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialData.taxes.totalCollected)}
                  </div>
                  <p className="text-sm text-gray-600">
                    At {financialData.taxes.rate}% rate
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pending Tax</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financialData.taxes.pending)}
                  </div>
                  <p className="text-sm text-gray-600">To be collected</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tax Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {financialData.taxes.rate}%
                  </div>
                  <p className="text-sm text-gray-600">
                    Current applicable rate
                  </p>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
