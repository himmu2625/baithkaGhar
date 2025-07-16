"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Download, Search, Filter, ChevronDown, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Payment {
  id: string;
  bookingId: string;
  propertyName: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  status: "completed" | "pending" | "failed" | "refunded";
  paymentMethod: string;
  paymentId: string | null;
  date: string;
  bookingDetails: {
    dateFrom: string;
    dateTo: string;
    guests: number;
  };
}

interface PaymentSummary {
  totalRevenue: number;
  pendingAmount: number;
  refundedAmount: number;
  totalTransactions: number;
  completedCount: number;
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
}

export default function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Payment;
    direction: "ascending" | "descending";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch payments from API
  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      
      const response = await fetch(`/api/admin/payments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }
      
      const data = await response.json();
      setPayments(data.payments || []);
      setFilteredPayments(data.payments || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch payments");
      setPayments([]);
      setFilteredPayments([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, fetchPayments]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Handle search and filtering
  useEffect(() => {
    let result = [...payments];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (payment) =>
          payment.id.toLowerCase().includes(query) ||
          payment.bookingId.toLowerCase().includes(query) ||
          payment.propertyName.toLowerCase().includes(query) ||
          payment.guestName.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((payment) => payment.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig !== null) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        const aValue = a[key];
        const bValue = b[key];
        
        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return direction === "ascending" ? 1 : -1;
        if (bValue == null) return direction === "ascending" ? -1 : 1;
        
        if (aValue < bValue) {
          return direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredPayments(result);
  }, [searchQuery, statusFilter, sortConfig, payments]);

  const handleSort = (key: keyof Payment) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold flex items-center">Payment Management</h1>
    </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-darkGreen" />
          <span className="ml-2">Loading payment data...</span>
        </div>
      ) : error ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPayments}>Try Again</Button>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payments.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  All time payment records
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary?.totalRevenue?.toLocaleString() || '0'}</div>
                <p className="text-xs text-gray-500 mt-1">
                  From completed payments
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Pending Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{summary?.pendingAmount?.toLocaleString() || '0'}</div>
                <p className="text-xs text-gray-500 mt-1">
                  From pending payments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by ID, booking, property or guest..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-1/4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-auto mt-4 md:mt-0">
                <Button variant="outline" className="w-full md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </Button>
              </div>
              <div className="w-full md:w-auto ml-auto">
                <Button variant="outline" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="p-0 h-auto font-medium"
                    >
                      Payment ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("bookingId")}
                      className="p-0 h-auto font-medium"
                    >
                      Booking ID
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amount")}
                      className="p-0 h-auto font-medium"
                    >
                      Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("status")}
                      className="p-0 h-auto font-medium"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("date")}
                      className="p-0 h-auto font-medium"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.bookingId}</TableCell>
                      <TableCell>{payment.propertyName}</TableCell>
                      <TableCell>{payment.guestName}</TableCell>
                      <TableCell>₹{payment.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(payment.status)}
                        >
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <span className="sr-only">Open menu</span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View details</DropdownMenuItem>
                            <DropdownMenuItem>Download receipt</DropdownMenuItem>
                            {payment.status === "pending" && (
                              <DropdownMenuItem>Mark as completed</DropdownMenuItem>
                            )}
                            {payment.status === "completed" && (
                              <DropdownMenuItem>Process refund</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      No payment records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
} 