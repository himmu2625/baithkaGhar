"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  Users,
  Clock,
} from "lucide-react"

interface PropertyArrivalsDeparturesProps {
  arrivals: any[]
  departures: any[]
}

export function PropertyArrivalsDepartures({
  arrivals,
  departures,
}: PropertyArrivalsDeparturesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Enhanced Arrivals */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-2">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span>Arrivals Today</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/20"
            >
              {arrivals?.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {arrivals && arrivals.length > 0 ? (
            <div className="space-y-4">
              {arrivals.map((booking: any, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">
                            {(booking.userId?.name || "G")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">
                            {booking.userId?.name || "Guest"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 ml-10">
                        {booking.userId?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-700">
                              {booking.userId.email}
                            </span>
                          </div>
                        )}
                        {booking.userId?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-700">
                              {booking.userId.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {booking.checkInDate
                          ? new Date(booking.checkInDate).toLocaleDateString()
                          : "-"}
                      </Badge>
                      <div className="flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          {booking.totalGuests || booking.guests || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-green-600 font-medium">
                No arrivals scheduled for today
              </p>
              <p className="text-green-500 text-sm">
                All quiet on the front desk!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Departures */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-white/20 rounded-lg mr-2">
                <TrendingDown className="h-5 w-5" />
              </div>
              <span>Departures Today</span>
            </div>
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/20"
            >
              {departures?.length || 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {departures && departures.length > 0 ? (
            <div className="space-y-4">
              {departures.map((booking: any, index: number) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {(booking.userId?.name || "G")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900">
                            {booking.userId?.name || "Guest"}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1 ml-10">
                        {booking.userId?.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-700">
                              {booking.userId.email}
                            </span>
                          </div>
                        )}
                        {booking.userId?.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-blue-700">
                              {booking.userId.phone}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {booking.checkOutDate
                          ? new Date(booking.checkOutDate).toLocaleDateString()
                          : "-"}
                      </Badge>
                      <div className="flex items-center justify-end space-x-1">
                        <Users className="h-3 w-3 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          {booking.totalGuests || booking.guests || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 text-blue-300 mx-auto mb-3" />
              <p className="text-blue-600 font-medium">
                No departures scheduled for today
              </p>
              <p className="text-blue-500 text-sm">Everyone's staying put!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
