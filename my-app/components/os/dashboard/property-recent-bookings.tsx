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
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-emerald-50/20 to-green-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
      <CardContent className="p-0">
        {bookings && bookings.length > 0 ? (
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-emerald-100/80 via-green-100/80 to-teal-100/80 border-0 backdrop-blur-sm">
                  <TableHead className="font-bold text-emerald-900 py-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg shadow-sm">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <span className="text-lg">Guest Details</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-emerald-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg shadow-sm">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-lg">Check-in</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-emerald-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg shadow-sm">
                        <Clock className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-lg">Check-out</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-emerald-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg shadow-sm">
                        <IndianRupee className="h-5 w-5 text-yellow-600" />
                      </div>
                      <span className="text-lg">Amount</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-emerald-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-lg">Status</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-bold text-emerald-900">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-lg">Booked</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking: any, index: number) => (
                  <TableRow
                    key={index}
                    className="group hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-green-50/50 transition-all duration-300 border-0 border-b border-emerald-200/30 hover:border-emerald-300/50 hover:shadow-lg hover:scale-[1.01]"
                  >
                    <TableCell className="py-6">
                      <div className="flex items-center space-x-4">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                            <span className="text-white font-bold text-lg">
                              {(booking.userId?.name || "G")
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-emerald-900 text-lg">
                            {booking.userId?.name || "Guest"}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="p-1 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded">
                              <Mail className="h-3 w-3 text-blue-600" />
                            </div>
                            <p className="text-sm text-blue-700 font-medium">
                              {booking.userId?.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-white/80 to-green-50/80 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                        <div className="p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg shadow-sm">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <div className="font-bold text-green-900">
                            {booking.checkInDate
                              ? new Date(booking.checkInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : "-"}
                          </div>
                          <div className="text-xs text-green-600">Check-in</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-white/80 to-purple-50/80 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                        <div className="p-2 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-lg shadow-sm">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        </div>
                        <div>
                          <div className="font-bold text-purple-900">
                            {booking.checkOutDate
                              ? new Date(booking.checkOutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : "-"}
                          </div>
                          <div className="text-xs text-purple-600">Check-out</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="bg-gradient-to-r from-white/80 to-emerald-50/80 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                        <div className="font-bold text-2xl text-emerald-900 mb-1">
                          {formatCurrency(booking.totalAmount || 0)}
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="p-1 bg-gradient-to-r from-emerald-100/80 to-green-100/80 rounded">
                            <IndianRupee className="h-3 w-3 text-emerald-600" />
                          </div>
                          <span className="text-xs text-emerald-600 font-medium">Total Amount</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border-0 shadow-lg font-bold text-sm px-4 py-2 ${
                          booking.status === 'confirmed' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                            : booking.status === 'pending' 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                            : booking.status === 'checked_in' 
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
                            : booking.status === 'completed' 
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
                        }`}
                      >
                        {(booking.status || "pending").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3 bg-gradient-to-r from-white/80 to-indigo-50/80 p-3 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                        <div className="p-2 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 rounded-lg shadow-sm">
                          <Calendar className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <div className="font-bold text-indigo-900">
                            {booking.createdAt
                              ? new Date(booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                              : "-"}
                          </div>
                          <div className="text-xs text-indigo-600">Booking Date</div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-r from-emerald-50/80 to-green-50/80 rounded-2xl border-2 border-dashed border-emerald-300">
            <div className="p-8 bg-emerald-100 rounded-full w-fit mx-auto mb-6 shadow-lg">
              <Calendar className="h-20 w-20 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-emerald-900 mb-3">No Recent Bookings</h3>
            <p className="text-emerald-700 font-medium text-lg mb-2">
              Your latest reservations will appear here
            </p>
            <p className="text-emerald-600 text-sm">
              Check back soon for new guest bookings and reservations
            </p>
            <div className="mt-6 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-600 text-sm font-medium">Monitoring for new bookings</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
