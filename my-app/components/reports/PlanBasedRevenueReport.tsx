"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Coffee, Utensils, Users, TrendingUp, DollarSign, Calendar } from "lucide-react"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface PlanBasedRevenueReportProps {
  propertyId?: string
  startDate: Date
  endDate: Date
}

interface ReportData {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalRevenue: number
    totalBookings: number
    averageBookingValue: number
  }
  byPlanType: Array<{
    planType: string
    planName: string
    revenue: number
    bookings: number
    nights: number
    avgPrice: number
    percentage: number
  }>
  byOccupancyType: Array<{
    occupancyType: string
    occupancyName: string
    revenue: number
    bookings: number
    avgPrice: number
    percentage: number
  }>
  byRoomCategory: Array<{
    category: string
    revenue: number
    bookings: number
    avgPrice: number
    percentage: number
  }>
  insights: {
    mostPopularPlan: string
    mostPopularOccupancy: string
    highestRevenueCategory: string
  }
}

const planIcons: Record<string, any> = {
  EP: null,
  CP: Coffee,
  MAP: Utensils,
  AP: Utensils
}

const planColors: Record<string, string> = {
  EP: "bg-gray-100 text-gray-800",
  CP: "bg-blue-100 text-blue-800",
  MAP: "bg-purple-100 text-purple-800",
  AP: "bg-green-100 text-green-800"
}

export function PlanBasedRevenueReport({
  propertyId,
  startDate,
  endDate
}: PlanBasedRevenueReportProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })

        if (propertyId) {
          params.append('propertyId', propertyId)
        }

        const response = await fetch(`/api/reports/plan-based-revenue?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch report')
        }

        const data = await response.json()

        if (data.success) {
          setReportData(data.report)
        } else {
          setError('Failed to load report data')
        }
      } catch (err) {
        console.error('Error fetching plan-based revenue report:', err)
        setError('Unable to load report')
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [propertyId, startDate, endDate])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !reportData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-red-600">{error || 'No data available'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                ₹{reportData.summary.totalRevenue.toLocaleString()}
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {reportData.summary.totalBookings}
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Booking Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                ₹{Math.round(reportData.summary.averageBookingValue).toLocaleString()}
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>
            Period: {format(new Date(reportData.period.start), 'MMM dd, yyyy')} - {format(new Date(reportData.period.end), 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Most Popular Meal Plan</p>
              <p className="text-lg font-bold text-blue-600">{reportData.insights.mostPopularPlan}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm font-medium text-purple-900 mb-1">Most Popular Occupancy</p>
              <p className="text-lg font-bold text-purple-600">{reportData.insights.mostPopularOccupancy}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-1">Top Revenue Category</p>
              <p className="text-lg font-bold text-green-600">{reportData.insights.highestRevenueCategory}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Plan Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Revenue by Meal Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan Type</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Nights</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.byPlanType.map((plan) => {
                const Icon = planIcons[plan.planType]
                return (
                  <TableRow key={plan.planType}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4" />}
                        <div>
                          <div className="font-medium">{plan.planType}</div>
                          <div className="text-xs text-gray-500">{plan.planName}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{plan.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{plan.bookings}</TableCell>
                    <TableCell className="text-right">{plan.nights}</TableCell>
                    <TableCell className="text-right">
                      ₹{Math.round(plan.avgPrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className={planColors[plan.planType] || 'bg-gray-100'}>
                        {plan.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue by Occupancy Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Revenue by Occupancy Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Occupancy Type</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Avg Price</TableHead>
                <TableHead className="text-right">% of Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.byOccupancyType.map((occupancy) => (
                <TableRow key={occupancy.occupancyType}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{occupancy.occupancyType}</div>
                      <div className="text-xs text-gray-500">{occupancy.occupancyName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ₹{occupancy.revenue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{occupancy.bookings}</TableCell>
                  <TableCell className="text-right">
                    ₹{Math.round(occupancy.avgPrice).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">
                      {occupancy.percentage.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue by Room Category */}
      {reportData.byRoomCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room Category</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Avg Price</TableHead>
                  <TableHead className="text-right">% of Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.byRoomCategory.map((category) => (
                  <TableRow key={category.category}>
                    <TableCell className="font-medium">{category.category}</TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{category.revenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{category.bookings}</TableCell>
                    <TableCell className="text-right">
                      ₹{Math.round(category.avgPrice).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">
                        {category.percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
