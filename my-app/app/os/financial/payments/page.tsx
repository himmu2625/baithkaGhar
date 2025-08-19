"use client"

import React from "react"
import { RequireOSAccess } from "@/components/os/auth/rbac-protected-route"
import { MainLayout } from "@/components/os/layout"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
} from "lucide-react"

const mockPayments = [
  {
    id: 1,
    guest: "John Doe",
    room: "101",
    amount: 2500,
    method: "credit_card",
    status: "completed",
    date: "2024-01-15",
    time: "14:30",
    transactionId: "TXN-001",
  },
  {
    id: 2,
    guest: "Jane Smith",
    room: "203",
    amount: 1800,
    method: "cash",
    status: "pending",
    date: "2024-01-15",
    time: "16:45",
    transactionId: "TXN-002",
  },
  {
    id: 3,
    guest: "Mike Johnson",
    room: "105",
    amount: 3500,
    method: "online",
    status: "failed",
    date: "2024-01-15",
    time: "18:20",
    transactionId: "TXN-003",
  },
  {
    id: 4,
    guest: "Sarah Wilson",
    room: "201",
    amount: 2200,
    method: "debit_card",
    status: "completed",
    date: "2024-01-15",
    time: "19:15",
    transactionId: "TXN-004",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-800"
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "failed":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getMethodIcon = (method: string) => {
  switch (method) {
    case "credit_card":
    case "debit_card":
      return <CreditCard className="h-4 w-4" />
    case "cash":
      return <DollarSign className="h-4 w-4" />
    case "online":
      return <TrendingUp className="h-4 w-4" />
    default:
      return <CreditCard className="h-4 w-4" />
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-600" />
    case "failed":
      return <AlertCircle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

export default function PaymentsPage() {
  return (
    <RequireOSAccess>
      <MainLayout
        title="Payment Management"
        description="Track and manage all payment transactions"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Payment Management
              </h1>
              <p className="text-gray-600">
                Track and manage all payment transactions
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Payment
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹45,200</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">
                  Successful payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting confirmation
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">
                  Failed transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payment List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Payments</CardTitle>
                  <CardDescription>Latest payment transactions</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getMethodIcon(payment.method)}
                        <div>
                          <p className="font-medium">{payment.guest}</p>
                          <p className="text-sm text-muted-foreground">
                            Room {payment.room}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">₹{payment.amount}</p>
                        <p className="text-sm text-muted-foreground">
                          {payment.date} {payment.time}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                        {getStatusIcon(payment.status)}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {payment.transactionId}
                      </div>

                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </RequireOSAccess>
  )
}
