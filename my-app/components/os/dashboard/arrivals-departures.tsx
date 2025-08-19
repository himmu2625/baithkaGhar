"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  User,
  MapPin,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"
import { useOSDashboard } from "@/hooks/use-os-dashboard"

interface Guest {
  id: string
  name: string
  room: string
  time: string
  status: "pending" | "completed" | "overdue"
  type: "arrival" | "departure"
}

export function ArrivalsDepartures() {
  const { data, loading, error } = useOSDashboard()

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "overdue":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />
      case "overdue":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getGuestStatus = (
    booking: any,
    type: "arrival" | "departure"
  ): "pending" | "completed" | "overdue" => {
    const now = new Date()
    const checkTime =
      type === "arrival" ? new Date(booking.dateFrom) : new Date(booking.dateTo)

    if (booking.status === "completed") return "completed"
    if (checkTime < now) return "overdue"
    return "pending"
  }

  // Transform real booking data to guest format
  const transformBookingsToGuests = (
    bookings: any[],
    type: "arrival" | "departure"
  ): Guest[] => {
    return bookings.map((booking) => ({
      id: booking._id,
      name: booking.userId?.name || "Unknown Guest",
      room: booking.propertyId?.title || "Unknown Property",
      time:
        type === "arrival"
          ? formatTime(booking.dateFrom)
          : formatTime(booking.dateTo),
      status: getGuestStatus(booking, type),
      type,
    }))
  }

  const arrivals = data?.bookings.arrivals
    ? transformBookingsToGuests(data.bookings.arrivals, "arrival")
    : []
  const departures = data?.bookings.departures
    ? transformBookingsToGuests(data.bookings.departures, "departure")
    : []

  const allGuests = [...arrivals, ...departures].slice(0, 4)

  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Today's Arrivals & Departures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <p className="text-gray-500">Loading arrivals and departures...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">
            Today's Arrivals & Departures
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <p>Error loading data</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          Today's Arrivals & Departures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ArrowUpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {arrivals.length}
            </p>
            <p className="text-sm text-blue-600">Arrivals</p>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <ArrowDownCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {departures.length}
            </p>
            <p className="text-sm text-orange-600">Departures</p>
          </div>
        </div>

        {/* Guest List */}
        <div className="space-y-3">
          {allGuests.length > 0 ? (
            allGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      guest.type === "arrival" ? "bg-blue-100" : "bg-orange-100"
                    }`}
                  >
                    {guest.type === "arrival" ? (
                      <ArrowUpCircle className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{guest.name}</p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <p className="text-sm text-gray-600">{guest.room}</p>
                      <span className="text-sm text-gray-500">•</span>
                      <p className="text-sm text-gray-600">{guest.time}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(guest.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(guest.status)}
                      <span className="text-xs capitalize">{guest.status}</span>
                    </div>
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No arrivals or departures today</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        <div className="pt-2">
          <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all arrivals & departures →
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
