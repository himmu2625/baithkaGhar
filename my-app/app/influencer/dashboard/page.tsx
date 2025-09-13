"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw,
  LogOut,
  Settings,
  Share2,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  Heart,
  MessageCircle,
  Target,
  Award,
  BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { ModernDashboardLayout } from '@/components/dashboard/modern-dashboard-layout';
import { AnalyticsCard, StatsGrid, CommissionCard, BookingsCard } from '@/components/ui/analytics-card';
import { RevenueTrendChart, CommissionBreakdownChart, PerformanceBarChart, ChartsGrid } from '@/components/charts/interactive-charts';
import { InfluencerSocialDashboard, SocialMediaCard, SocialMediaOverview } from '@/components/ui/social-media-integration';
import { CommissionCalculator, CommissionTiers, CommissionHistory } from '@/components/ui/commission-calculator';
import { SwipeableCards, MobileCardGrid } from '@/components/ui/swipeable-cards';
import { LoadingOverlay, CardSkeleton, LoadingButton } from '@/components/ui/loading-states';
import { NotificationCenter, QuickActionsPanel, FloatingNotificationBell } from '@/components/ui/notification-center';

interface Influencer {
  id: string;
  name: string;
  email: string;
  platform: string;
  handle: string;
  referralCode: string;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  totalEarnings: number;
  totalBookings: number;
  totalClicks: number;
  conversionRate: number;
  status: string;
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

interface SocialStats {
  followers: number;
  engagement: number;
  reach: number;
  impressions: number;
}

export default function InfluencerDashboard() {
  const router = useRouter();
  const [influencer, setInfluencer] = useState<Influencer | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demo
  const mockInfluencer: Influencer = {
    id: '1',
    name: 'Sarah Thompson',
    email: 'sarah@example.com',
    platform: 'instagram',
    handle: '@sarahtravels',
    referralCode: 'SARAH2024',
    commissionType: 'percentage',
    commissionRate: 8,
    totalEarnings: 45750,
    totalBookings: 23,
    totalClicks: 1250,
    conversionRate: 1.84,
    status: 'active',
    joinedAt: '2024-01-15',
    lastActiveAt: new Date().toISOString()
  };

  const mockBookings: Booking[] = [
    {
      id: '1',
      bookingCode: 'BK001',
      propertyName: 'Luxury Beach Resort',
      dateFrom: '2024-01-20',
      dateTo: '2024-01-25',
      totalPrice: 35000,
      commissionAmount: 2800,
      status: 'confirmed',
      createdAt: '2024-01-15'
    },
    {
      id: '2',
      bookingCode: 'BK002',
      propertyName: 'Mountain Villa Retreat',
      dateFrom: '2024-02-01',
      dateTo: '2024-02-05',
      totalPrice: 28000,
      commissionAmount: 2240,
      status: 'pending',
      createdAt: '2024-01-18'
    }
  ];

  const mockSocialAccounts = [
    {
      platform: 'instagram' as const,
      username: 'sarahtravels',
      followers: 125000,
      engagement: 4.2,
      verified: true,
      profileUrl: 'https://instagram.com/sarahtravels',
      lastPost: {
        date: '2 hours ago',
        likes: 3200,
        comments: 145,
        shares: 89
      }
    },
    {
      platform: 'youtube' as const,
      username: 'SarahTravelVlogs',
      followers: 85000,
      engagement: 6.8,
      verified: false,
      profileUrl: 'https://youtube.com/@SarahTravelVlogs',
      lastPost: {
        date: '1 day ago',
        likes: 1850,
        comments: 92,
        shares: 34
      }
    }
  ];

  const mockSocialStats = {
    totalFollowers: 210000,
    avgEngagement: 5.5,
    totalPosts: 342,
    reachThisMonth: 2100000
  };

  const mockCommissionHistory = [
    {
      id: '1',
      date: '2024-01-15',
      bookingId: 'BK001',
      propertyName: 'Luxury Beach Resort',
      bookingAmount: 35000,
      commissionAmount: 2800,
      status: 'paid' as const,
      tier: 'Gold'
    },
    {
      id: '2',
      date: '2024-01-10',
      bookingId: 'BK002',
      propertyName: 'Mountain Villa',
      bookingAmount: 28000,
      commissionAmount: 2240,
      status: 'pending' as const,
      tier: 'Silver'
    }
  ];

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'New Commission Earned',
      message: 'You earned ₹2,800 from a luxury resort booking',
      type: 'commission' as const,
      timestamp: new Date().toISOString(),
      read: false,
      priority: 'high' as const,
      category: 'Earnings'
    },
    {
      id: '2',
      title: 'Social Media Update',
      message: 'Your Instagram post reached 15,000+ users',
      type: 'social' as const,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      priority: 'medium' as const,
      category: 'Social Media'
    }
  ]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setInfluencer(mockInfluencer);
      setBookings(mockBookings);
      setSocialStats({
        followers: 125000,
        engagement: 4.2,
        reach: 2100000,
        impressions: 5200000
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard",
        variant: "destructive"
      });
      router.push('/influencer');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLogout = async () => {
    try {
      await fetch('/api/influencers/logout', { method: 'POST' });
      router.push('/influencer');
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

  // Mock chart data
  const revenueData = [
    { name: 'Jan', value: 4500 },
    { name: 'Feb', value: 5200 },
    { name: 'Mar', value: 4800 },
    { name: 'Apr', value: 6100 },
    { name: 'May', value: 5500 },
    { name: 'Jun', value: 6700 },
  ];

  const performanceData = [
    { name: 'Clicks', value: 1250 },
    { name: 'Bookings', value: 23 },
    { name: 'Commission', value: 45750 },
    { name: 'Conversion', value: 1.84 },
  ];

  const platformData = [
    { name: 'Instagram', value: 125000 },
    { name: 'YouTube', value: 85000 },
    { name: 'Facebook', value: 45000 },
    { name: 'Twitter', value: 28000 },
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Share Referral Link',
      description: 'Get your unique referral code',
      icon: Share2,
      onClick: () => {
        navigator.clipboard.writeText(`https://baithakaghar.com/ref/${influencer?.referralCode}`);
        toast({ title: "Copied!", description: "Referral link copied to clipboard" });
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
      title: 'Social Media',
      description: 'Manage your social accounts',
      icon: Instagram,
      onClick: () => {
        const socialTab = document.querySelector('[data-value="social"]') as HTMLElement;
        if (socialTab) socialTab.click();
      },
      color: 'from-pink-500 to-purple-600'
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
        message="Loading influencer dashboard..."
        progress={80}
      />
    );
  }

  if (!influencer) {
    return (
      <ModernDashboardLayout
        title="Access Denied"
        subtitle="Please login as an influencer"
        user={null}
      >
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Access denied. Please login as an influencer.</p>
          <Button onClick={() => router.push('/influencer')}>
            Go to Login
          </Button>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout
      title="Influencer Dashboard"
      subtitle={`Welcome back, ${influencer.name}`}
      user={{
        name: influencer.name,
        role: 'Influencer'
      }}
      notifications={notifications.filter(n => !n.read).length}
      quickActions={[
        {
          label: 'Share Link',
          icon: Share2,
          onClick: () => {
            navigator.clipboard.writeText(`https://baithakaghar.com/ref/${influencer.referralCode}`);
            toast({ title: "Copied!", description: "Referral link copied" });
          }
        },
        {
          label: 'Analytics',
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
        <AnalyticsCard
          title="Total Earnings"
          value={influencer.totalEarnings}
          format="currency"
          icon={DollarSign}
          gradient="from-green-500 to-emerald-600"
          trend="up"
          trendValue={12}
          subtitle="Commission earned"
        />
        <BookingsCard
          bookings={influencer.totalBookings}
          icon={Calendar}
          subtitle="Successful referrals"
        />
        <AnalyticsCard
          title="Total Clicks"
          value={influencer.totalClicks}
          icon={Eye}
          gradient="from-purple-500 to-pink-600"
          trend="up"
          trendValue={8}
          subtitle="Link visits"
        />
        <AnalyticsCard
          title="Conversion Rate"
          value={influencer.conversionRate}
          format="percentage"
          icon={Target}
          gradient="from-orange-500 to-red-600"
          trend="up"
          trendValue={3}
          subtitle="Click to booking"
        />
      </StatsGrid>

      {/* Quick Actions Panel */}
      <QuickActionsPanel actions={quickActions} className="mb-8" />

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Charts Section */}
          <ChartsGrid>
            <RevenueTrendChart 
              data={revenueData}
              timeRange="6m"
              onTimeRangeChange={(range) => console.log('Time range changed:', range)}
            />
            <CommissionBreakdownChart data={performanceData} />
          </ChartsGrid>

          {/* Recent Bookings */}
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
          <CommissionCalculator currentBookings={influencer.totalBookings} />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <InfluencerSocialDashboard
            accounts={mockSocialAccounts}
            stats={mockSocialStats}
            onAddAccount={(account) => console.log('Add account:', account)}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Performance Charts */}
          <ChartsGrid>
            <PerformanceBarChart data={performanceData} />
            <CommissionBreakdownChart data={platformData} />
          </ChartsGrid>

          {/* Commission Tiers */}
          <CommissionTiers currentBookings={influencer.totalBookings} />

          {/* Commission History */}
          <CommissionHistory history={mockCommissionHistory} />

          {/* Detailed Performance Metrics */}
          <StatsGrid>
            <AnalyticsCard
              title="Click-Through Rate"
              value={2.8}
              format="percentage"
              icon={Eye}
              gradient="from-blue-500 to-indigo-600"
              trend="up"
              trendValue={5}
            />
            <AnalyticsCard
              title="Average Commission"
              value={1989}
              format="currency"
              icon={DollarSign}
              gradient="from-green-500 to-emerald-600"
              trend="up"
              trendValue={8}
            />
            <AnalyticsCard
              title="Social Reach"
              value={2100000}
              icon={Users}
              gradient="from-purple-500 to-pink-600"
              trend="up"
              trendValue={12}
            />
            <AnalyticsCard
              title="Engagement Rate"
              value={4.2}
              format="percentage"
              icon={Heart}
              gradient="from-pink-500 to-rose-600"
              trend="up"
              trendValue={3}
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