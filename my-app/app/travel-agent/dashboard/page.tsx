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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Building className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Travel Agent Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome back, {travelAgent.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-sm">
                {travelAgent.referralCode}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.total.bookings || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{analytics?.monthly.bookings || 0} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.total.revenue || 0)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatCurrency(analytics?.monthly.revenue || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics?.total.earnings || 0)}</div>
              <p className="text-xs text-muted-foreground">
                +{formatCurrency(analytics?.monthly.commission || 0)} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(travelAgent.walletBalance)}</div>
              <p className="text-xs text-muted-foreground">
                Available for withdrawal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No bookings yet</p>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{booking.propertyName}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.dateFrom).toLocaleDateString()} - {new Date(booking.dateTo).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">Booking: {booking.bookingCode}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(booking.totalPrice)}</p>
                          <p className="text-sm text-green-600">+{formatCurrency(booking.commissionAmount)}</p>
                          {getStatusBadge(booking.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                  <h3 className="text-lg font-semibold mb-2">Browse Properties</h3>
                  <p className="text-sm text-gray-600 mb-4">Find properties for your clients</p>
                  <Button onClick={() => {
                    const propertiesTab = document.querySelector('[data-value="properties"]') as HTMLElement;
                    if (propertiesTab) {
                      propertiesTab.click();
                    }
                  }}>
                    Explore Properties
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Target className="h-12 w-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-semibold mb-2">Commission Rate</h3>
                  <p className="text-2xl font-bold text-green-600 mb-2">{travelAgent.commissionDisplay}</p>
                  <p className="text-sm text-gray-600">Your current commission rate</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                  <h3 className="text-lg font-semibold mb-2">Total Clients</h3>
                  <p className="text-2xl font-bold text-purple-600 mb-2">{travelAgent.totalClients}</p>
                  <p className="text-sm text-gray-600">Clients served</p>
                </CardContent>
              </Card>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
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

              <Card>
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

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{travelAgent.totalBookings}</p>
                    <p className="text-sm text-gray-600">Total Bookings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(travelAgent.totalRevenue)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(travelAgent.totalEarnings)}</p>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(travelAgent.averageBookingValue)}</p>
                    <p className="text-sm text-gray-600">Avg. Booking Value</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 