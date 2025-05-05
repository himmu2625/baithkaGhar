"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Home, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight,
  Star,
  Clock
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

// Placeholder chart component - in a real app, use a charting library
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div className="bg-gray-100 rounded-md h-[300px] flex items-center justify-center p-4">
    <div className="text-center">
      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">
        {title} chart would display here
      </p>
      <p className="text-xs text-gray-400 mt-1">
        (Will be implemented with Chart.js or Recharts)
      </p>
    </div>
  </div>
)

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState("30d")
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, change: 0 },
    properties: { total: 0, active: 0, change: 0 },
    bookings: { total: 0, pending: 0, change: 0 },
    revenue: { total: 0, pending: 0, change: 0 },
    ratings: { average: 0, count: 0 }
  })
  
  // Simulate fetching dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // In a real implementation, this would be an actual API call
        // For now, simulate an API response with mock data
        const mockData = {
          users: { 
            total: 534, 
            new: 48, 
            change: 12.3
          },
          properties: { 
            total: 126, 
            active: 98, 
            change: 3.7
          },
          bookings: { 
            total: 287, 
            pending: 32, 
            change: 5.2
          },
          revenue: { 
            total: 895000, 
            pending: 125000, 
            change: -2.1
          },
          ratings: { 
            average: 4.3, 
            count: 203 
          }
        }
        
        // Simulate API delay
        setTimeout(() => {
          setStats(mockData)
          setIsLoading(false)
        }, 1000)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
        setIsLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [timeframe])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Tabs defaultValue="30d" value={timeframe} onValueChange={setTimeframe}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="3m">3m</TabsTrigger>
            <TabsTrigger value="1y">1y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats.users.total} 
          change={stats.users.change} 
          trend={stats.users.change >= 0 ? "up" : "down"}
          description={`${stats.users.new} new this period`}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard 
          title="Properties" 
          value={stats.properties.total} 
          change={stats.properties.change} 
          trend={stats.properties.change >= 0 ? "up" : "down"}
          description={`${stats.properties.active} active listings`}
          icon={Home}
          isLoading={isLoading}
        />
        <StatCard 
          title="Bookings" 
          value={stats.bookings.total} 
          change={stats.bookings.change} 
          trend={stats.bookings.change >= 0 ? "up" : "down"}
          description={`${stats.bookings.pending} pending`}
          icon={Calendar}
          isLoading={isLoading}
        />
        <StatCard 
          title="Revenue" 
          value={formatCurrency(stats.revenue.total)} 
          change={stats.revenue.change} 
          trend={stats.revenue.change >= 0 ? "up" : "down"}
          description={`${formatCurrency(stats.revenue.pending)} pending`}
          icon={CreditCard}
          isLoading={isLoading}
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Revenue" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartPlaceholder title="Bookings" />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="flex-1">
                    <div className="h-4 w-2/3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 w-1/3 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              // Activity items
              <>
                <ActivityItem 
                  icon={<Users className="h-4 w-4 text-blue-500" />}
                  title="New user registered"
                  description="Amit Patel signed up as a new user"
                  time="10 minutes ago"
                />
                <ActivityItem 
                  icon={<Home className="h-4 w-4 text-green-500" />}
                  title="New property listed"
                  description="Mountain View Cottage was added by Ravi Kumar"
                  time="35 minutes ago"
                />
                <ActivityItem 
                  icon={<Calendar className="h-4 w-4 text-purple-500" />}
                  title="New booking confirmed"
                  description="Lakeside Villa booked for 5 nights"
                  time="2 hours ago"
                />
                <ActivityItem 
                  icon={<CreditCard className="h-4 w-4 text-amber-500" />}
                  title="Payment received"
                  description="₹15,000 payment for Garden Homestay"
                  time="5 hours ago"
                />
                <ActivityItem 
                  icon={<Star className="h-4 w-4 text-yellow-500" />}
                  title="New review submitted"
                  description="4.5 star review for Riverside Cottage"
                  time="8 hours ago"
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  change: number
  trend: "up" | "down"
  description: string
  icon: React.ElementType
  isLoading?: boolean
}

function StatCard({ title, value, change, trend, description, icon: Icon, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-5 w-5 text-gray-500" />
          {isLoading ? (
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
              <span className="text-sm font-medium">
                {change > 0 ? "+" : ""}{change}%
              </span>
              {trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 ml-1" />
              ) : (
                <ArrowDownRight className="h-4 w-4 ml-1" />
              )}
            </div>
          )}
        </div>
        
        {isLoading ? (
          <>
            <div className="h-7 w-24 bg-gray-200 rounded mb-3 animate-pulse"></div>
            <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
          </>
        ) : (
          <>
            <div className="text-2xl font-bold mb-1">{value}</div>
            <div className="text-sm text-gray-500">{title}</div>
            <div className="text-xs text-gray-400 mt-2">{description}</div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  icon: React.ReactNode
  title: string
  description: string
  time: string
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start">
      <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="text-xs text-gray-400 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        {time}
      </div>
    </div>
  )
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount)
} 