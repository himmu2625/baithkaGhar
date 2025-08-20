"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PropertyArrivalsDeparturesProps {
  arrivals: any[]
  departures: any[]
}

export function PropertyArrivalsDepartures({
  arrivals,
  departures,
}: PropertyArrivalsDeparturesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Today's Arrivals & Departures</span>
          <Badge variant="secondary" className="ml-2">
            {(arrivals?.length || 0) + (departures?.length || 0)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Arrivals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                Arrivals ({arrivals?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {arrivals && arrivals.length > 0 ? (
                <div className="space-y-3">
                  {arrivals.map((booking: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {booking.userId?.name || "Guest"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.userId?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.userId?.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {booking.checkInDate
                              ? new Date(
                                  booking.checkInDate
                                ).toLocaleDateString()
                              : "-"}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.totalGuests || booking.guests || 0} guests
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No arrivals today</p>
              )}
            </CardContent>
          </Card>

          {/* Departures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-4 w-4 mr-2 text-blue-600" />
                Departures ({departures?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {departures && departures.length > 0 ? (
                <div className="space-y-3">
                  {departures.map((booking: any, index: number) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {booking.userId?.name || "Guest"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.userId?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.userId?.phone}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">
                            {booking.checkOutDate
                              ? new Date(
                                  booking.checkOutDate
                                ).toLocaleDateString()
                              : "-"}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.totalGuests || booking.guests || 0} guests
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">No departures today</p>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}

