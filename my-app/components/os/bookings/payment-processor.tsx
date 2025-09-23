"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  CreditCard,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Smartphone,
  Wallet,
  Building2,
  User,
  Calendar,
  RefreshCw,
  Receipt,
  Download,
  Eye,
  Search,
  Filter,
  TrendingUp,
  DollarSign,
  Percent,
  CreditCard as CardIcon,
} from "lucide-react"

interface Payment {
  id: string
  bookingId: string
  guestName: string
  amount: number
  currency: "INR"
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "refunded"
    | "partially_refunded"
  method: "card" | "upi" | "netbanking" | "wallet"
  razorpayPaymentId?: string
  razorpayOrderId?: string
  razorpaySignature?: string
  createdAt: string
  updatedAt: string
  failureReason?: string
  refundAmount?: number
  fees?: number
  gateway: "razorpay"
  notes?: string
}

interface PaymentStats {
  totalPayments: number
  totalAmount: number
  completedPayments: number
  completedAmount: number
  pendingPayments: number
  pendingAmount: number
  failedPayments: number
  failedAmount: number
  refundedPayments: number
  refundedAmount: number
  todayRevenue: number
  monthlyRevenue: number
  averageTransaction: number
  successRate: number
}

interface PaymentProcessorProps {
  propertyId: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    label: "Pending",
  },
  processing: {
    icon: RefreshCw,
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    label: "Processing",
  },
  completed: {
    icon: CheckCircle2,
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    label: "Failed",
  },
  refunded: {
    icon: TrendingUp,
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    label: "Refunded",
  },
  partially_refunded: {
    icon: Percent,
    color: "bg-orange-500",
    textColor: "text-orange-700",
    bgColor: "bg-orange-50",
    label: "Partially Refunded",
  },
}

const methodConfig = {
  card: {
    icon: CreditCard,
    label: "Credit/Debit Card",
    color: "text-blue-600",
  },
  upi: {
    icon: Smartphone,
    label: "UPI",
    color: "text-green-600",
  },
  netbanking: {
    icon: Building2,
    label: "Net Banking",
    color: "text-purple-600",
  },
  wallet: {
    icon: Wallet,
    label: "Digital Wallet",
    color: "text-orange-600",
  },
}

export default function PaymentProcessor({
  propertyId,
}: PaymentProcessorProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [methodFilter, setMethodFilter] = useState<string>("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)

  useEffect(() => {
    fetchPayments()
  }, [propertyId])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      // Mock data - replace with actual API call
      const mockPayments: Payment[] = [
        {
          id: "pay_1",
          bookingId: "book_001",
          guestName: "John Doe",
          amount: 15000,
          currency: "INR",
          status: "completed",
          method: "card",
          razorpayPaymentId: "pay_razorpay_123",
          razorpayOrderId: "order_razorpay_123",
          createdAt: "2025-09-21T10:00:00Z",
          updatedAt: "2025-09-21T10:05:00Z",
          fees: 300,
          gateway: "razorpay",
        },
        {
          id: "pay_2",
          bookingId: "book_002",
          guestName: "Jane Smith",
          amount: 8500,
          currency: "INR",
          status: "pending",
          method: "upi",
          razorpayOrderId: "order_razorpay_124",
          createdAt: "2025-09-21T11:00:00Z",
          updatedAt: "2025-09-21T11:00:00Z",
          gateway: "razorpay",
        },
        {
          id: "pay_3",
          bookingId: "book_003",
          guestName: "Mike Wilson",
          amount: 22000,
          currency: "INR",
          status: "failed",
          method: "netbanking",
          failureReason: "Insufficient funds",
          createdAt: "2025-09-21T09:30:00Z",
          updatedAt: "2025-09-21T09:35:00Z",
          gateway: "razorpay",
        },
        {
          id: "pay_4",
          bookingId: "book_004",
          guestName: "Sarah Johnson",
          amount: 12000,
          currency: "INR",
          status: "refunded",
          method: "card",
          razorpayPaymentId: "pay_razorpay_125",
          refundAmount: 12000,
          createdAt: "2025-09-20T15:00:00Z",
          updatedAt: "2025-09-21T08:00:00Z",
          gateway: "razorpay",
        },
      ]

      const mockStats: PaymentStats = {
        totalPayments: 24,
        totalAmount: 486000,
        completedPayments: 18,
        completedAmount: 420000,
        pendingPayments: 3,
        pendingAmount: 35000,
        failedPayments: 2,
        failedAmount: 19000,
        refundedPayments: 1,
        refundedAmount: 12000,
        todayRevenue: 45600,
        monthlyRevenue: 1850000,
        averageTransaction: 20250,
        successRate: 85.7,
      }

      setPayments(mockPayments)
      setStats(mockStats)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const initiateRazorpayPayment = async (bookingId: string, amount: number) => {
    try {
      setProcessing(bookingId)

      // Create Razorpay order
      const orderResponse = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "INR",
          receipt: `booking_${bookingId}`,
        }),
      })

      const order = await orderResponse.json()

      if (!order.success) {
        throw new Error("Failed to create payment order")
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Baithaka GHAR",
        description: `Booking Payment - ${bookingId}`,
        order_id: order.id,
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                bookingId,
              }),
            })

            const verification = await verifyResponse.json()

            if (verification.success) {
              // Payment successful
              await fetchPayments()
              alert("Payment completed successfully!")
            } else {
              throw new Error("Payment verification failed")
            }
          } catch (error) {
            console.error("Payment verification error:", error)
            alert("Payment verification failed. Please contact support.")
          } finally {
            setProcessing(null)
          }
        },
        prefill: {
          name: "Guest Name",
          email: "guest@example.com",
          contact: "9999999999",
        },
        notes: {
          property_id: propertyId,
          booking_id: bookingId,
        },
        theme: {
          color: "#16a34a",
        },
        modal: {
          ondismiss: () => {
            setProcessing(null)
          },
        },
      }

      // @ts-ignore
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error("Payment initiation error:", error)
      setProcessing(null)
      alert("Failed to initiate payment. Please try again.")
    }
  }

  const refundPayment = async (paymentId: string, refundAmount: number) => {
    try {
      setProcessing(paymentId)

      const response = await fetch("/api/payments/refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, amount: refundAmount }),
      })

      const result = await response.json()

      if (result.success) {
        await fetchPayments()
        alert("Refund processed successfully!")
      } else {
        throw new Error(result.error || "Refund failed")
      }
    } catch (error) {
      console.error("Refund error:", error)
      alert("Failed to process refund. Please try again.")
    } finally {
      setProcessing(null)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter
    const matchesMethod =
      methodFilter === "all" || payment.method === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading payment data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="transactions"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Transactions
          </TabsTrigger>
          <TabsTrigger
            value="refunds"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Refunds
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Payment Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">
                  Total Revenue
                </CardTitle>
                <IndianRupee className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {formatCurrency(stats?.completedAmount || 0)}
                </div>
                <p className="text-xs text-green-600">
                  {stats?.completedPayments || 0} successful payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">
                  Success Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {stats?.successRate || 0}%
                </div>
                <Progress
                  value={stats?.successRate || 0}
                  className="w-full mt-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700">
                  Pending
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">
                  {formatCurrency(stats?.pendingAmount || 0)}
                </div>
                <p className="text-xs text-yellow-600">
                  {stats?.pendingPayments || 0} pending payments
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">
                  Today's Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(stats?.todayRevenue || 0)}
                </div>
                <p className="text-xs text-purple-600">Daily earnings</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Quick Payment Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setActiveTab("transactions")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View All Transactions
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("refunds")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Process Refunds
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("analytics")}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Label htmlFor="search">Search Payments</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by guest name, booking ID, or payment ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="method-filter">Payment Method</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {Object.entries(methodConfig).map(([method, config]) => (
                        <SelectItem key={method} value={method}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment List */}
          <div className="grid gap-4">
            {filteredPayments.map((payment) => {
              const config = statusConfig[payment.status]
              const methodConf = methodConfig[payment.method]
              const Icon = config.icon
              const MethodIcon = methodConf.icon

              return (
                <Card
                  key={payment.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${config.bgColor}`}>
                          <Icon className={`h-6 w-6 ${config.textColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {payment.guestName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Booking: {payment.bookingId}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <MethodIcon
                              className={`h-4 w-4 ${methodConf.color}`}
                            />
                            <span className="text-sm text-gray-600">
                              {methodConf.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <Badge className={`${config.color} text-white`}>
                          {config.label}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPayment(payment)
                            setShowPaymentDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {payment.status === "completed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              refundPayment(payment.id, payment.amount)
                            }
                            disabled={processing === payment.id}
                          >
                            {processing === payment.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              "Refund"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {payment.failureReason && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Failure Reason:</strong>{" "}
                          {payment.failureReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Refunds Tab */}
        <TabsContent value="refunds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Refund Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {payments
                  .filter(
                    (p) =>
                      p.status === "refunded" ||
                      p.status === "partially_refunded"
                  )
                  .map((payment) => (
                    <div key={payment.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{payment.guestName}</h4>
                          <p className="text-sm text-gray-600">
                            Original: {formatCurrency(payment.amount)} |
                            Refunded:{" "}
                            {formatCurrency(payment.refundAmount || 0)}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {payment.status === "refunded"
                            ? "Full Refund"
                            : "Partial Refund"}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(methodConfig).map(([method, config]) => {
                    const count = payments.filter(
                      (p) => p.method === method
                    ).length
                    const percentage =
                      payments.length > 0 ? (count / payments.length) * 100 : 0

                    return (
                      <div
                        key={method}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {React.createElement(config.icon, {
                            className: `h-4 w-4 ${config.color}`,
                          })}
                          <span>{config.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-xs text-gray-500">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Today's Revenue</span>
                    <span className="font-semibold">
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Monthly Revenue</span>
                    <span className="font-semibold">
                      {formatCurrency(stats?.monthlyRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Transaction</span>
                    <span className="font-semibold">
                      {formatCurrency(stats?.averageTransaction || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment ID</Label>
                  <div className="font-mono text-sm">{selectedPayment.id}</div>
                </div>
                <div>
                  <Label>Booking ID</Label>
                  <div className="font-mono text-sm">
                    {selectedPayment.bookingId}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <div>{selectedPayment.guestName}</div>
                </div>
                <div>
                  <Label>Amount</Label>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedPayment.amount)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Badge
                    className={`${
                      statusConfig[selectedPayment.status].color
                    } text-white`}
                  >
                    {statusConfig[selectedPayment.status].label}
                  </Badge>
                </div>
                <div>
                  <Label>Payment Method</Label>
                  <div className="flex items-center gap-2">
                    {React.createElement(
                      methodConfig[selectedPayment.method].icon,
                      {
                        className: `h-4 w-4 ${
                          methodConfig[selectedPayment.method].color
                        }`,
                      }
                    )}
                    {methodConfig[selectedPayment.method].label}
                  </div>
                </div>
              </div>

              {selectedPayment.razorpayPaymentId && (
                <div>
                  <Label>Razorpay Payment ID</Label>
                  <div className="font-mono text-sm">
                    {selectedPayment.razorpayPaymentId}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Created</Label>
                  <div>{formatDate(selectedPayment.createdAt)}</div>
                </div>
                <div>
                  <Label>Updated</Label>
                  <div>{formatDate(selectedPayment.updatedAt)}</div>
                </div>
              </div>

              {selectedPayment.fees && (
                <div>
                  <Label>Gateway Fees</Label>
                  <div>{formatCurrency(selectedPayment.fees)}</div>
                </div>
              )}

              {selectedPayment.failureReason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Failure Reason:</strong>{" "}
                    {selectedPayment.failureReason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
