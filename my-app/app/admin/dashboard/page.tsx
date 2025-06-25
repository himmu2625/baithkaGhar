"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Clock,
  Settings,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

// Placeholder chart component - in a real app, use a charting library
const ChartPlaceholder = ({ title }: { title: string }) => (
  <div className="bg-gray-100 rounded-md h-[300px] flex items-center justify-center p-4">
    <div className="text-center">
      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
      <p className="text-sm text-gray-500">{title} chart would display here</p>
      <p className="text-xs text-gray-400 mt-1">
        (Will be implemented with Chart.js or Recharts)
      </p>
    </div>
  </div>
);

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const [timeframe, setTimeframe] = useState("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, new: 0, change: 0 },
    properties: { total: 0, active: 0, change: 0 },
    bookings: { total: 0, pending: 0, change: 0 },
    revenue: { total: 0, pending: 0, change: 0 },
    ratings: { average: 0, count: 0 },
    propertyRequests: { total: 0, change: 0 },
  });

  useEffect(() => {
    setTimeout(() => {
      if (sessionStorage.getItem("lastNavPath") === "/admin/dashboard") {
        sessionStorage.removeItem("lastNavPath");
        sessionStorage.removeItem("lastNavTime");
        console.log(
          "Admin dashboard loaded successfully, cleared navigation tracking"
        );
      }

      if (
        status === "authenticated" &&
        sessionStorage.getItem("adminAuthenticated") === "true"
      ) {
        const roleDisplay =
          session?.user?.role === "super_admin"
            ? "super admin"
            : "administrator";

        toast({
          title: `Welcome to Admin Dashboard`,
          description: `You have successfully logged in as ${roleDisplay}`,
        });
        sessionStorage.removeItem("adminAuthenticated");
      }
    }, 1000);
  }, [session, status]);

  // Fetch real dashboard data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('🚀 STARTING TO FETCH DASHBOARD DATA...');
      setIsLoading(true);
      try {
        // Fetch property requests stats
        const propertyRequestsResponse = await fetch("/api/admin/property-requests?status=pending&limit=1");
        const propertyRequestsData = await propertyRequestsResponse.json();
        
        if (propertyRequestsData.success) {
          setStats({
            ...stats,
            propertyRequests: {
              total: propertyRequestsData.pagination.total,
              change: 0,
            },
          });
        }

        console.log(`📡 MAKING API CALL: /api/admin/analytics?period=${timeframe}`);
        
        const response = await fetch(
          `/api/admin/analytics?period=${timeframe}`
        );
        
        console.log('📊 API RESPONSE STATUS:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ API ERROR:', errorData);
          throw new Error(errorData.error || "Failed to fetch dashboard data");
        }
        
        const data = await response.json();
        console.log('📋 RAW API DATA RECEIVED:', data);

        // Check if this is real data or if something is wrong
        if (!data || Object.keys(data).length === 0) {
          console.error('⚠️ RECEIVED EMPTY DATA - POSSIBLE MOCK DATA FALLBACK');
        } else {
          console.log('✅ RECEIVED REAL DATA FROM DATABASE');
          console.log('🔍 DETAILED DATA BREAKDOWN:');
          console.log('👥 Users - Total:', data.users.total, 'New:', data.users.new, 'Growth:', data.users.growth + '%');
          console.log('🏠 Properties - Total:', data.properties.total, 'New:', data.properties.new, 'Growth:', data.properties.growth + '%');
          console.log('📅 Bookings - Total:', data.bookings.total, 'New:', data.bookings.new, 'Growth:', data.bookings.growth + '%');
          console.log('💰 Revenue - Total: ₹' + data.revenue.total, 'New: ₹' + data.revenue.new, 'Growth:', data.revenue.growth + '%');
        }
        
        // Transform API data to fit the existing stats structure
        setStats({
          users: {
            total: data.users.total,
            new: data.users.new,
            change: data.users.growth, // API provides 'growth' as percentage
          },
          properties: {
            total: data.properties.total,
            active: data.properties.new, // Using 'new' for description, API gives 'new' not 'active' for period
            change: data.properties.growth,
          },
          bookings: {
            total: data.bookings.total,
            pending: data.bookings.new, // Using 'new' for description, API gives 'new' not 'pending' for period
            change: data.bookings.growth,
          },
          revenue: {
            total: data.revenue.total,
            pending: data.revenue.new, // Using 'new' for description for the period
            change: data.revenue.growth,
          },
          ratings: {
            // Real ratings from database
            average: data.ratings?.average || 0,
            count: data.ratings?.count || 0,
          },
          propertyRequests: {
            total: data.propertyRequests?.total || 0,
            change: data.propertyRequests?.change || 0,
          },
        });
        
        console.log('✅ DASHBOARD UPDATED WITH DATA');
        console.log('📊 FINAL STATS DISPLAYED ON SCREEN:');
        console.log('👥 Total Users Displayed:', stats.users.total);
        console.log('🏠 Total Properties Displayed:', stats.properties.total);
        console.log('📅 Total Bookings Displayed:', stats.bookings.total);
        console.log('💰 Total Revenue Displayed: ₹' + stats.revenue.total);
      } catch (error: any) {
        console.error("❌ ERROR FETCHING DASHBOARD DATA:", error);
        console.log('🔄 POSSIBLE FALLBACK TO MOCK DATA OR API FAILURE');
        toast({
          title: "Error Loading Data",
          description: error.message || "Failed to load dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeframe]);

  return (
    <div className="space-y-6 mt-12">
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

      {/* Real-time Stats Cards */}
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
          description={`${stats.properties.active} new this period`}
          icon={Home}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Bookings"
          value={stats.bookings.total}
          change={stats.bookings.change}
          trend={stats.bookings.change >= 0 ? "up" : "down"}
          description={`${stats.bookings.pending} new this period`}
          icon={Calendar}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Revenue"
          value={`₹${formatCurrency(stats.revenue.total)}`}
          change={stats.revenue.change}
          trend={stats.revenue.change >= 0 ? "up" : "down"}
          description={`₹${formatCurrency(stats.revenue.pending)} pending`}
          icon={CreditCard}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Property Requests"
          value={stats.propertyRequests.total}
          change={stats.propertyRequests.change}
          trend={stats.propertyRequests.change >= 0 ? "up" : "down"}
          description={`${stats.propertyRequests.change > 0 ? "+" : ""}${stats.propertyRequests.change}%`}
          icon={ClipboardCheck}
          isLoading={isLoading}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="min-h-[350px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
          <Card className="min-h-[350px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        </div>
      ) : stats.users.total === 0 && stats.bookings.total === 0 && stats.properties.total === 0 ? (
        /* Empty State Charts */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-md h-[300px] flex items-center justify-center p-4">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No revenue data available yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Revenue data will appear here once you have bookings
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bookings Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-md h-[300px] flex items-center justify-center p-4">
                <div className="text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">No booking data available yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Booking statistics will appear here as users make reservations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Charts with Data */
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
      )}

      {/* Recent Activity - Empty State */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Recent Activity</h3>
            <p className="text-sm text-gray-500 text-center max-w-md">
              When users register, list properties, or make bookings, those activities will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Settings & Access Requests Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Configure application settings and permissions.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/admin/settings'}
              >
                <Settings className="mr-2 h-4 w-4" />
                Manage Settings
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Access Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Review and manage admin access requests.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/admin/requests'}
              >
                <Users className="mr-2 h-4 w-4" />
                View Access Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
}

function StatCard({
  title,
  value,
  change,
  trend,
  description,
  icon: Icon,
  isLoading,
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-5 w-5 text-gray-500" />
          {isLoading ? (
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <div
              className={`flex items-center ${
                trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              <span className="text-sm font-medium">
                {change > 0 ? "+" : ""}
                {change}%
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
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
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
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
