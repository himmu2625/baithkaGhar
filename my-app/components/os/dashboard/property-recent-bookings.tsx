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
import { Calendar } from "lucide-react"

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Recent Bookings
          <Badge variant="secondary" className="ml-2">
            {bookings?.length || 0}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Booked</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings && bookings.length > 0 ? (
              bookings.map((booking: any, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {booking.userId?.name || "Guest"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.userId?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {booking.checkInDate
                      ? new Date(booking.checkInDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {booking.checkOutDate
                      ? new Date(booking.checkOutDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(booking.totalAmount || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(booking.status)}>
                      {booking.status || "pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {booking.createdAt
                      ? new Date(booking.createdAt).toLocaleDateString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-gray-600 py-6"
                >
                  No recent bookings
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

