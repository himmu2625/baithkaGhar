"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Clock,
  MapPin,
  Eye,
  Search,
  Filter,
  Plus,
  Download,
  RefreshCw,
  LogOut,
  Settings,
  Wallet,
  BarChart3,
  Globe,
  Target,
  AlertCircle
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { ModernDashboardLayout } from '@/components/dashboard/modern-dashboard-layout';
import { AnalyticsCard, StatsGrid, RevenueCard, CommissionCard, BookingsCard } from '@/components/ui/analytics-card';
import { RevenueTrendChart, CommissionBreakdownChart, PerformanceBarChart, ChartsGrid } from '@/components/charts/interactive-charts';
import { CommissionCalculator, CommissionTiers, CommissionHistory } from '@/components/ui/commission-calculator';
import { SwipeableCards, MobileCardGrid } from '@/components/ui/swipeable-cards';
import { LoadingOverlay, CardSkeleton, LoadingButton } from '@/components/ui/loading-states';
import { NotificationCenter, QuickActionsPanel, FloatingNotificationBell } from '@/components/ui/notification-center';
import { EnhancedProgress } from '@/components/ui/enhanced-progress';

interface TravelAgent {
  id: string;
  name: string;
  email: string;
  companyName: string;
  status: string;
  referralCode: string;
  commissionDisplay: string;
  walletBalance: number;
  totalEarnings: number;
  totalBookings: number;
  totalRevenue: number;
  totalClients: number;
  averageBookingValue: number;
  joinedAt: string;
  lastActiveAt?: string;
}

interface Booking {
  id: string;
  bookingCode: string;
  propertyName: string;
  dateFrom: string;
  dateTo: string;
  totalPrice: number;
  commissionAmount: number;
  status: string;
  createdAt: string;
}

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  stayTypes: string[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  amenities: string[];
}

interface Analytics {
  monthly: {
    bookings: number;
    revenue: number;
    commission: number;
  };
  yearly: {
    bookings: number;
    revenue: number;
    commission: number;
  };
  total: {
    bookings: number;
    revenue: number;
    earnings: number;
    clients: number;
  };
}

export default function TravelAgentDashboard() {
  const router = useRouter();
  const [travelAgent, setTravelAgent] = useState<TravelAgent | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStayType, setSelectedStayType] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'New Booking Confirmed',
      message: 'Your client has confirmed the booking for Luxury Villa Mumbai',
      type: 'booking' as const,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high' as const,
      category: 'Bookings'
    },
    {
      id: '2',
      title: 'Commission Earned',
      message: 'You earned ₹2,500 commission from recent booking',
      type: 'commission' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
      priority: 'medium' as const,
      category: 'Earnings'
    }
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/travel-agents/dashboard');
      const data = await response.json();

      if (data.success) {
        setTravelAgent(data.dashboard.agent);
        setBookings(data.dashboard.recentBookings);
        setAnalytics(data.dashboard.analytics);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to load dashboard",
          variant: "destructive"
        });
        router.push('/travel-agent');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      });
      router.push('/travel-agent');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const fetchProperties = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedStayType) params.append('stayType', selectedStayType);
      if (selectedCity) params.append('city', selectedCity);

      const response = await fetch(`/api/properties?${params}`);
      const data = await response.json();

      if (data.success) {
        setProperties(data.properties);
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/travel-agents/logout', { method: 'POST' });
      router.push('/travel-agent');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: { variant: "default" as const, color: "text-green-600" },
      pending: { variant: "secondary" as const, color: "text-yellow-600" },
      cancelled: { variant: "destructive" as const, color: "text-red-600" },
      completed: { variant: "outline" as const, color: "text-blue-600" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Mock data for charts
  const revenueData = [
    { name: 'Jan', value: 45000 },
    { name: 'Feb', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Apr', value: 61000 },
    { name: 'May', value: 55000 },
    { name: 'Jun', value: 67000 },
  ];

  const commissionData = [
    { name: 'Hotels', value: 12000 },
    { name: 'Resorts', value: 8500 },
    { name: 'Villas', value: 6200 },
    { name: 'Apartments', value: 4300 },
  ];

  const performanceData = [
    { name: 'Bookings', value: 23 },
    { name: 'Revenue', value: 67000 },
    { name: 'Commission', value: 8500 },
    { name: 'Clients', value: 18 },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Browse Properties',
      description: 'Find perfect stays for your clients',
      icon: Globe,
      onClick: () => {
        const propertiesTab = document.querySelector('[data-value="properties"]') as HTMLElement;
        if (propertiesTab) propertiesTab.click();
      },
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: '2',
      title: 'View Analytics',
      description: 'Track your performance metrics',
      icon: BarChart3,
      onClick: () => {
        const analyticsTab = document.querySelector('[data-value="analytics"]') as HTMLElement;
        if (analyticsTab) analyticsTab.click();
      },
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: '3',
      title: 'Commission Calculator',
      description: 'Calculate potential earnings',
      icon: Target,
      onClick: () => {},
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  if (loading) {
    return (
      <LoadingOverlay 
        visible={true}
        message="Loading dashboard..."
        progress={75}
      />
    );
  }

  if (!travelAgent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Access denied. Please login as a travel agent.</p>
          <Button onClick={() => router.push('/travel-agent')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ModernDashboardLayout
      title="Travel Agent Dashboard"
      subtitle={`Welcome back, ${travelAgent.name}`}
      user={{
        name: travelAgent.name,
        role: 'Travel Agent'
      }}
      notifications={notifications.filter(n => !n.read).length}
      quickActions={[
        {
          label: 'Browse Properties',
          icon: Globe,
          onClick: () => {
            const propertiesTab = document.querySelector('[data-value="properties"]') as HTMLElement;
            if (propertiesTab) propertiesTab.click();
          }
        },
        {
          label: 'View Analytics',
          icon: BarChart3,
          onClick: () => {
            const analyticsTab = document.querySelector('[data-value="analytics"]') as HTMLElement;
            if (analyticsTab) analyticsTab.click();
          }
        }
      ]}
      onLogout={handleLogout}
    >

        {/* Enhanced Stats Cards */}
        <StatsGrid className="mb-8">
          <BookingsCard
            bookings={analytics?.total.bookings || 0}
            previousBookings={analytics?.monthly.bookings || 0}
            icon={Calendar}
            subtitle="+{analytics?.monthly.bookings || 0} this month"
          />
          <RevenueCard
            revenue={analytics?.total.revenue || 0}
            previousRevenue={analytics?.monthly.revenue || 0}
            subtitle="+{formatCurrency(analytics?.monthly.revenue || 0)} this month"
          />
          <CommissionCard
            commission={analytics?.total.earnings || 0}
            previousCommission={analytics?.monthly.commission || 0}
            subtitle="+{formatCurrency(analytics?.monthly.commission || 0)} this month"
          />
          <AnalyticsCard
            title="Wallet Balance"
            value={travelAgent.walletBalance}
            format="currency"
            icon={Wallet}
            gradient="from-orange-500 to-red-600"
            subtitle="Available for withdrawal"
          />
        </StatsGrid>

        {/* Quick Actions Panel */}
        <QuickActionsPanel actions={quickActions} className="mb-8" />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts Section */}
            <ChartsGrid>
              <RevenueTrendChart 
                data={revenueData}
                timeRange="30d"
                onTimeRangeChange={(range) => console.log('Time range changed:', range)}
              />
              <CommissionBreakdownChart data={commissionData} />
            </ChartsGrid>

            {/* Recent Activity with Swipeable Cards */}
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No bookings yet</p>
                ) : (
                  <SwipeableCards
                    cards={bookings.map((booking) => ({
                      id: booking.id,
                      title: booking.propertyName,
                      content: (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {new Date(booking.dateFrom).toLocaleDateString()} - {new Date(booking.dateTo).toLocaleDateString()}
                            </span>
                            {getStatusBadge(booking.status)}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{formatCurrency(booking.totalPrice)}</span>
                            <span className="text-sm text-green-600">+{formatCurrency(booking.commissionAmount)}</span>
                          </div>
                          <p className="text-xs text-gray-500">Booking: {booking.bookingCode}</p>
                        </div>
                      ),
                      badge: booking.status,
                    }))}
                    cardWidth="320px"
                    showNavigation={true}
                    showPagination={true}
                  />
                )}
              </CardContent>
            </Card>

            {/* Commission Calculator */}
            <CommissionCalculator currentBookings={travelAgent.totalBookings} />
          </TabsContent>

          <TabsContent value="bookings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No bookings found</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Booking Code</th>
                            <th className="text-left py-2">Property</th>
                            <th className="text-left py-2">Dates</th>
                            <th className="text-left py-2">Amount</th>
                            <th className="text-left py-2">Commission</th>
                            <th className="text-left py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((booking) => (
                            <tr key={booking.id} className="border-b">
                              <td className="py-2 font-mono text-sm">{booking.bookingCode}</td>
                              <td className="py-2">{booking.propertyName}</td>
                              <td className="py-2 text-sm">
                                {new Date(booking.dateFrom).toLocaleDateString()} - {new Date(booking.dateTo).toLocaleDateString()}
                              </td>
                              <td className="py-2 font-medium">{formatCurrency(booking.totalPrice)}</td>
                              <td className="py-2 text-green-600 font-medium">+{formatCurrency(booking.commissionAmount)}</td>
                              <td className="py-2">{getStatusBadge(booking.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Browse Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Label>Search Properties</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search properties..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Stay Type</Label>
                    <Select value={selectedStayType} onValueChange={setSelectedStayType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All types</SelectItem>
                        <SelectItem value="corporate-stay">Corporate Stay</SelectItem>
                        <SelectItem value="family-stay">Family Stay</SelectItem>
                        <SelectItem value="couple-stay">Couple Stay</SelectItem>
                        <SelectItem value="banquet-events">Banquet & Events</SelectItem>
                        <SelectItem value="travel-agent">Travel Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>City</Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger>
                        <SelectValue placeholder="All cities" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All cities</SelectItem>
                        <SelectItem value="mumbai">Mumbai</SelectItem>
                        <SelectItem value="delhi">Delhi</SelectItem>
                        <SelectItem value="bangalore">Bangalore</SelectItem>
                        <SelectItem value="chennai">Chennai</SelectItem>
                        <SelectItem value="kolkata">Kolkata</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={fetchProperties}>
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </div>

                {/* Properties Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 col-span-full">No properties found</p>
                  ) : (
                    properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="relative h-48 bg-gray-200">
                          <Image
                            src={property.image}
                            alt={property.title}
                            className="w-full h-full object-cover"
                            fill
                            sizes="100vw"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2">{property.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {property.location}
                          </p>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold">{formatCurrency(
                              typeof property.price === 'object' && property.price !== null
                                ? (property.price as { base: number }).base
                                : property.price
                            )}</span>
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm">{property.rating}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{property.bedrooms} beds</span>
                            <span>{property.bathrooms} baths</span>
                            <span>Max {property.maxGuests} guests</span>
                          </div>
                          <Button className="w-full mt-4" onClick={() => router.push(`/property/${property.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Performance Charts */}
            <ChartsGrid>
              <PerformanceBarChart data={performanceData} />
              <RevenueTrendChart 
                data={revenueData}
                timeRange="1y"
                onTimeRangeChange={(range) => console.log('Time range changed:', range)}
              />
            </ChartsGrid>

            {/* Commission Tiers */}
            <CommissionTiers currentBookings={travelAgent.totalBookings} />

            {/* Detailed Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Monthly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Bookings</span>
                      <span className="font-semibold">{analytics?.monthly.bookings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Revenue</span>
                      <span className="font-semibold">{formatCurrency(analytics?.monthly.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Commission</span>
                      <span className="font-semibold text-green-600">{formatCurrency(analytics?.monthly.commission || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Yearly Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Bookings</span>
                      <span className="font-semibold">{analytics?.yearly.bookings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Revenue</span>
                      <span className="font-semibold">{formatCurrency(analytics?.yearly.revenue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Commission</span>
                      <span className="font-semibold text-green-600">{formatCurrency(analytics?.yearly.commission || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics Grid */}
            <StatsGrid>
              <AnalyticsCard
                title="Total Bookings"
                value={travelAgent.totalBookings}
                icon={Calendar}
                gradient="from-blue-500 to-indigo-600"
              />
              <AnalyticsCard
                title="Total Revenue"
                value={travelAgent.totalRevenue}
                format="currency"
                icon={DollarSign}
                gradient="from-green-500 to-emerald-600"
              />
              <AnalyticsCard
                title="Total Earnings"
                value={travelAgent.totalEarnings}
                format="currency"
                icon={Wallet}
                gradient="from-purple-500 to-pink-600"
              />
              <AnalyticsCard
                title="Avg. Booking Value"
                value={travelAgent.averageBookingValue}
                format="currency"
                icon={TrendingUp}
                gradient="from-orange-500 to-red-600"
              />
            </StatsGrid>
          </TabsContent>
        </Tabs>

        {/* Notification Center */}
        <NotificationCenter
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDeleteNotification={handleDeleteNotification}
          className="mt-8"
        />

        {/* Floating Notification Bell */}
        <FloatingNotificationBell
          notificationCount={notifications.filter(n => !n.read).length}
          onClick={() => {
            const notificationSection = document.querySelector('.notification-center');
            if (notificationSection) {
              notificationSection.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        />
    </ModernDashboardLayout>
  );
} 