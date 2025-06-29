"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  CalendarDays,
  CreditCard,
  DollarSign,
  HomeIcon,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

// Placeholder chart components
// In a real implementation, you would use Chart.js, Recharts, or another charting library
const LineChart = ({ className, data }: { className?: string, data?: any[] }) => (
  <div className={cn("h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center", className)}>
    <p className="text-gray-500 flex items-center gap-2">
      <BarChart3 className="h-5 w-5" />
      Chart placeholder (integrate with Chart.js or Recharts)
      {data && ` - ${data.length} data points`}
    </p>
  </div>
)

const BarChart = ({ className, data }: { className?: string, data?: any[] }) => (
  <div className={cn("h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center", className)}>
    <p className="text-gray-500 flex items-center gap-2">
      <BarChart3 className="h-5 w-5" />
      Chart placeholder (integrate with Chart.js or Recharts)
      {data && ` - ${data.length} data points`}
    </p>
  </div>
)

const CalendarView = ({ className }: { className?: string }) => (
  <div className={cn("h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center", className)}>
    <p className="text-gray-500 flex items-center gap-2">
      <CalendarDays className="h-5 w-5" />
      Calendar view placeholder
    </p>
  </div>
)

// Stat card component
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  change?: number
  trend?: "up" | "down" | "neutral"
  description?: string
  className?: string
  isLoading?: boolean
}

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
  description,
  className,
  isLoading = false
}: StatCardProps) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
      <Icon className="h-4 w-4 text-gray-500" />
    </CardHeader>
    <CardContent>
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      ) : (
        <>
          <div className="text-2xl font-bold">{value}</div>
          {(change !== undefined || description) && (
            <p className="mt-1 flex items-center text-xs text-gray-500">
              {change !== undefined && (
                <>
                  {trend === "up" && <TrendingUp className="mr-1 h-3 w-3 text-green-500" />}
                  {trend === "down" && <TrendingDown className="mr-1 h-3 w-3 text-red-500" />}
                  <span className={cn(
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500"
                  )}>
                    {change > 0 && "+"}
                    {change}%
                  </span>
                  <span className="mx-1">•</span>
                </>
              )}
              {description || "vs. previous period"}
            </p>
          )}
        </>
      )}
    </CardContent>
  </Card>
)

export default function DashboardOverview() {
  const [timeframe, setTimeframe] = useState("7days")
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Fetch analytics data when timeframe changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/host/analytics?timeframe=${timeframe}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch analytics data");
        }

        const data = await response.json();
        setAnalyticsData(data);
      } catch (error: any) {
        console.error("Error fetching analytics:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to fetch analytics data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={isLoading ? "—" : analyticsData?.totalRevenue ? `₹${analyticsData.totalRevenue}` : "₹0"}
          icon={DollarSign}
          change={12.5}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Bookings"
          value={isLoading ? "—" : analyticsData?.totalBookings ?? 0}
          icon={CalendarDays}
          change={8.3}
          trend="up"
          isLoading={isLoading}
        />
        <StatCard
          title="Occupancy Rate"
          value={isLoading ? "—" : analyticsData?.occupancyRate ? `${analyticsData.occupancyRate}%` : "0%"}
          icon={HomeIcon}
          change={-2.4}
          trend="down"
          description="vs. last month"
          isLoading={isLoading}
        />
        <StatCard
          title="Avg. Rating"
          value={isLoading ? "—" : analyticsData?.avgRating ?? 0}
          icon={Star}
          change={0.2}
          trend="up"
          description={analyticsData?.properties ? `from ${analyticsData.properties.length} properties` : "from 0 properties"}
          isLoading={isLoading}
        />
      </div>

      {/* Revenue and bookings charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <Tabs
              value={timeframe}
              onValueChange={setTimeframe}
              className="ml-auto"
            >
              <TabsList className="bg-gray-100 h-8">
                <TabsTrigger value="7days" className="text-xs h-6">7D</TabsTrigger>
                <TabsTrigger value="30days" className="text-xs h-6">30D</TabsTrigger>
                <TabsTrigger value="90days" className="text-xs h-6">90D</TabsTrigger>
                <TabsTrigger value="year" className="text-xs h-6">1Y</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <LineChart data={analyticsData?.revenueTimeline} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <BarChart data={analyticsData?.bookingTimeline} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties & occupancy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : analyticsData?.properties && analyticsData.properties.length > 0 ? (
              <div className="space-y-4">
                {analyticsData.properties.slice(0, 3).map((property: any) => (
                  <div key={property.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium">{property.title}</p>
                      <p className="text-sm text-gray-500">{property.location.city}, {property.location.state}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-darkGreen">₹{property.price}/night</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        {property.rating || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
                {analyticsData.properties.length > 3 && (
                  <p className="text-sm text-center text-darkGreen hover:underline cursor-pointer">
                    View all {analyticsData.properties.length} properties
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No properties listed yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Occupancy Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[200px] w-full bg-gray-100 rounded-md flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <CalendarView />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : analyticsData?.properties && analyticsData.properties.length > 0 ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-md">
                <h4 className="font-medium flex items-center text-blue-800">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Price Optimization
                </h4>
                <p className="mt-1 text-sm text-blue-700">
                  Consider increasing your weekday rates by 10-15% for the {analyticsData.properties[0].title} property. Recent bookings suggest higher demand.
                </p>
              </div>

              <div className="p-4 bg-green-50 border border-green-100 rounded-md">
                <h4 className="font-medium flex items-center text-green-800">
                  <Users className="h-4 w-4 mr-2" />
                  Guest Preferences
                </h4>
                <p className="mt-1 text-sm text-green-700">
                  75% of your recent guests mentioned "peaceful environment" as a highlight. Consider emphasizing this in your property descriptions.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-md">
                <h4 className="font-medium flex items-center text-yellow-800">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Booking Opportunity
                </h4>
                <p className="mt-1 text-sm text-yellow-700">
                  You have a 5-day gap between bookings on {analyticsData.properties[0].title} (June 15-20). Consider offering a special rate to fill this period.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">List properties to get personalized insights</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 