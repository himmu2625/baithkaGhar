"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calendar,
  Mail,
  User,
  Clock,
  IndianRupee,
  CheckCircle2,
} from "lucide-react"

interface PropertyRecentBookingsProps {
  bookings: any[]
  formatCurrency: (amount: number) => string
  getStatusBadgeVariant: (status: string) => any
}

export function PropertyRecentBookings({
  bookings,
  formatCurrency,
  getStatusBadgeVariant,
}: PropertyRecentBookingsProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-white">
      <CardContent className="p-0">
        {bookings && bookings.length > 0 ? (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-gray-100 to-gray-50 border-0">
                  <TableHead className="font-semibold text-gray-700 py-4">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>Guest Details</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Check-in</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Check-out</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <IndianRupee className="h-4 w-4" />
                      <span>Amount</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>Booked</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any, index: number) => (
                  <TableRow
                    key={index}
                    className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border-0 border-b border-gray-100"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {(booking.userId?.name || "G")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {booking.userId?.name || "Guest"}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <p className="text-sm text-gray-600">
                              {booking.userId?.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {booking.checkInDate
                            ? new Date(booking.checkInDate).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="font-medium text-gray-900">
                          {booking.checkOutDate
                            ? new Date(
                                booking.checkOutDate
                              ).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full inline-flex items-center">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {formatCurrency(booking.totalAmount || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(booking.status)}
                        className="font-medium"
                      >
                        {booking.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium text-lg">
              No recent bookings
            </p>
            <p className="text-gray-500 text-sm">
              New bookings will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
