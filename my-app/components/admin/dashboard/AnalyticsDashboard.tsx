"use client"

import React from 'react'
import { 
  Card, 
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { RevenueChart, BookingsChart, UserActivityChart, StatsCard } from "@/components/admin/charts"
import { 
  Users, 
  Home, 
  CreditCard, 
  Calendar,
  Globe,
  Star,
  TrendingUp
} from "lucide-react"

interface DataTimeframe {
  value: string
  label: string
}

interface AnalyticsDashboardProps {
  metrics?: {
    totalUsers: number
    newUsers: number
    userGrowth: number
    totalProperties: number
    activeProperties: number
    propertyGrowth: number
    totalBookings: number
    pendingBookings: number
    bookingGrowth: number
    totalRevenue: number
    pendingRevenue: number
    revenueGrowth: number
    avgRating: number
    ratingGrowth: number
    conversionRate: number
    topLocations: {
      name: string
      count: number
      growth: number
    }[]
  }
  timeframes?: DataTimeframe[]
  defaultTimeframe?: string
  isLoading?: boolean
  onTimeframeChange?: (timeframe: string) => void
}

export function AnalyticsDashboard({
  metrics = {
    totalUsers: 0,
    newUsers: 0,
    userGrowth: 0,
    totalProperties: 0,
    activeProperties: 0,
    propertyGrowth: 0,
    totalBookings: 0,
    pendingBookings: 0,
    bookingGrowth: 0,
    totalRevenue: 0,
    pendingRevenue: 0,
    revenueGrowth: 0,
    avgRating: 0,
    ratingGrowth: 0,
    conversionRate: 0,
    topLocations: []
  },
  timeframes = [
    { value: "7d", label: "7 days" },
    { value: "30d", label: "30 days" },
    { value: "90d", label: "90 days" },
    { value: "1y", label: "1 year" }
  ],
  defaultTimeframe = "30d",
  isLoading = false,
  onTimeframeChange
}: AnalyticsDashboardProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Mock chart data - in a real implementation, this would be fetched from an API
  const mockChartData = {
    revenue: [
      { date: "Jan", amount: 250000 },
      { date: "Feb", amount: 320000 },
      { date: "Mar", amount: 280000 },
      { date: "Apr", amount: 410000 },
      { date: "May", amount: 530000 },
      { date: "Jun", amount: 620000 },
      { date: "Jul", amount: 750000 },
    ],
    bookings: [
      { date: "Jan", count: 45 },
      { date: "Feb", count: 52 },
      { date: "Mar", count: 49 },
      { date: "Apr", count: 65 },
      { date: "May", count: 78 },
      { date: "Jun", count: 87 },
      { date: "Jul", count: 105 },
    ],
    users: [
      { date: "Jan", newUsers: 120, activeUsers: 450 },
      { date: "Feb", newUsers: 135, activeUsers: 480 },
      { date: "Mar", newUsers: 128, activeUsers: 510 },
      { date: "Apr", newUsers: 156, activeUsers: 580 },
      { date: "May", newUsers: 189, activeUsers: 645 },
      { date: "Jun", newUsers: 210, activeUsers: 720 },
      { date: "Jul", newUsers: 245, activeUsers: 825 },
    ]
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <Tabs 
          defaultValue={defaultTimeframe} 
          onValueChange={onTimeframeChange}
        >
          <TabsList>
            {timeframes.map((timeframe) => (
              <TabsTrigger key={timeframe.value} value={timeframe.value}>
                {timeframe.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          change={metrics.userGrowth}
          trend={metrics.userGrowth >= 0 ? "up" : "down"}
          description={`${metrics.newUsers} new in this period`}
          isLoading={isLoading}
        />
        <StatsCard
          title="Properties"
          value={metrics.totalProperties}
          icon={Home}
          change={metrics.propertyGrowth}
          trend={metrics.propertyGrowth >= 0 ? "up" : "down"}
          description={`${metrics.activeProperties} active`}
          isLoading={isLoading}
        />
        <StatsCard
          title="Bookings"
          value={metrics.totalBookings}
          icon={Calendar}
          change={metrics.bookingGrowth}
          trend={metrics.bookingGrowth >= 0 ? "up" : "down"}
          description={`${metrics.pendingBookings} pending`}
          isLoading={isLoading}
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          icon={CreditCard}
          change={metrics.revenueGrowth}
          trend={metrics.revenueGrowth >= 0 ? "up" : "down"}
          description={`${formatCurrency(metrics.pendingRevenue)} pending`}
          isLoading={isLoading}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart 
          data={mockChartData.revenue}
          timeframe={defaultTimeframe}
          loading={isLoading}
        />
        <BookingsChart 
          data={mockChartData.bookings}
          timeframe={defaultTimeframe}
          loading={isLoading}
        />
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UserActivityChart 
          data={mockChartData.users}
          timeframe={defaultTimeframe}
          loading={isLoading}
        />
        
        {/* Conversion Rate Card */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
            <CardDescription>
              Percentage of searches that result in bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[250px]">
              {isLoading ? (
                <div className="h-36 w-36 bg-gray-100 animate-pulse rounded-full"></div>
              ) : (
                <>
                  <div className="relative w-36 h-36 mb-4">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <TrendingUp className="h-12 w-12 text-gray-200" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">
                      {metrics.conversionRate}%
                    </div>
                  </div>
                  <div className="text-sm text-center text-muted-foreground">
                    <span className={metrics.bookingGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                      {metrics.bookingGrowth >= 0 ? "+" : ""}{metrics.bookingGrowth}%
                    </span>{" "}
                    from previous period
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Top Locations Card */}
        <Card>
          <CardHeader>
            <CardTitle>Top Locations</CardTitle>
            <CardDescription>
              Most popular destinations by booking volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-1/3"></div>
                    <div className="h-4 bg-gray-100 animate-pulse rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : metrics.topLocations.length > 0 ? (
              <div className="space-y-3">
                {metrics.topLocations.map((location, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{location.name}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">{location.count} bookings</span>
                      <span className={
                        location.growth > 0 
                          ? "text-green-500" 
                          : location.growth < 0 
                          ? "text-red-500" 
                          : "text-gray-500"
                      }>
                        {location.growth > 0 ? "+" : ""}{location.growth}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No location data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Rating Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Overview</CardTitle>
          <CardDescription>
            Average property ratings and reviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-6">
            {isLoading ? (
              <>
                <div className="h-36 w-36 bg-gray-100 animate-pulse rounded-full"></div>
                <div className="space-y-3 w-full max-w-md">
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-full"></div>
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-5/6"></div>
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-4/6"></div>
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-3/6"></div>
                  <div className="h-4 bg-gray-100 animate-pulse rounded w-2/6"></div>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-36 h-36">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star className="h-12 w-12 text-amber-300" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold">{metrics.avgRating.toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">out of 5</div>
                    <div className="text-xs mt-1">
                      <span className={metrics.ratingGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                        {metrics.ratingGrowth >= 0 ? "+" : ""}{metrics.ratingGrowth}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 w-full max-w-md">
                  {/* This would normally be dynamically generated from real data */}
                  <div className="flex items-center">
                    <div className="text-sm w-8">5★</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                    <div className="text-sm w-8">70%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm w-8">4★</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                    <div className="text-sm w-8">20%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm w-8">3★</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: "7%" }}></div>
                    </div>
                    <div className="text-sm w-8">7%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm w-8">2★</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: "2%" }}></div>
                    </div>
                    <div className="text-sm w-8">2%</div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-sm w-8">1★</div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="bg-amber-400 h-2.5 rounded-full" style={{ width: "1%" }}></div>
                    </div>
                    <div className="text-sm w-8">1%</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 