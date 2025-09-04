'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Users, DollarSign, Clock, TrendingUp, MapPin, Package, UserCheck } from 'lucide-react';
import Link from 'next/link';

interface EventStats {
  totalBookings: number;
  upcomingEvents: number;
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  popularVenues: Array<{ name: string; bookings: number }>;
  recentBookings: Array<{
    id: string;
    eventName: string;
    date: string;
    venue: string;
    status: string;
    amount: number;
  }>;
}

export default function EventsDashboard() {
  const { propertyId } = useParams();
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/events/stats/${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch event stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchStats();
    }
  }, [propertyId]);

  const quickActions = [
    {
      title: 'New Event Booking',
      description: 'Create a new event booking',
      icon: CalendarDays,
      href: `/os/events/bookings/${propertyId}/new`,
      color: 'bg-blue-500'
    },
    {
      title: 'Venue Management',
      description: 'Manage event venues',
      icon: MapPin,
      href: `/os/events/venues/${propertyId}`,
      color: 'bg-green-500'
    },
    {
      title: 'Package Management',
      description: 'Configure event packages',
      icon: Package,
      href: `/os/events/packages/${propertyId}`,
      color: 'bg-purple-500'
    },
    {
      title: 'Staff Scheduling',
      description: 'Schedule event staff',
      icon: UserCheck,
      href: `/os/events/staff/${propertyId}`,
      color: 'bg-orange-500'
    }
  ];

  const navigationTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'calendar', label: 'Calendar', icon: CalendarDays },
    { id: 'bookings', label: 'Bookings', icon: Users },
    { id: 'billing', label: 'Billing', icon: DollarSign }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage your property's events and bookings</p>
        </div>
        <Button asChild>
          <Link href={`/os/events/bookings/${propertyId}/new`}>
            <CalendarDays className="mr-2 h-4 w-4" />
            New Event
          </Link>
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Card key={action.title} className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href={action.href}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${action.color} text-white`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
              <p className="text-xs text-muted-foreground">Next 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.averageBookingValue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Per event</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {navigationTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Venues */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Venues</CardTitle>
                <CardDescription>Most booked venues this month</CardDescription>
              </CardHeader>
              <CardContent>
                {stats?.popularVenues.map((venue, index) => (
                  <div key={venue.name} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{venue.name}</span>
                    <Badge variant="secondary">{venue.bookings} bookings</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest event bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{booking.eventName}</p>
                        <p className="text-xs text-gray-600">{booking.venue} • {booking.date}</p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={booking.status === 'confirmed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
                        </Badge>
                        <p className="text-sm font-medium">₹{booking.amount.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <CardTitle>Event Calendar</CardTitle>
              <CardDescription>View and manage your event schedule</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Calendar view coming soon...</p>
                <Button asChild className="mt-4">
                  <Link href={`/os/events/calendar/${propertyId}`}>
                    Go to Full Calendar
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Event Bookings</CardTitle>
              <CardDescription>Manage all your event bookings</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Bookings management interface coming soon...</p>
                <Button asChild className="mt-4">
                  <Link href={`/os/events/bookings/${propertyId}`}>
                    Go to Bookings
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Event Billing</CardTitle>
              <CardDescription>Manage invoices and payments</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Billing interface coming soon...</p>
                <Button asChild className="mt-4">
                  <Link href={`/os/events/billing/${propertyId}`}>
                    Go to Billing
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}