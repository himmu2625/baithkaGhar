"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Eye, 
  UserCheck, 
  UserX,
  TrendingUp,
  Users,
  IndianRupee
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ModernDashboardLayout } from '@/components/dashboard/modern-dashboard-layout';
import { AnalyticsCard, StatsGrid } from '@/components/ui/analytics-card';
import { RevenueTrendChart, CommissionBreakdownChart, ChartsGrid } from '@/components/charts/interactive-charts';
import { InfluencerSocialDashboard, SocialMediaCard } from '@/components/ui/social-media-integration';
import { CommissionHistory } from '@/components/ui/commission-calculator';
import { SwipeableCards } from '@/components/ui/swipeable-cards';
import { LoadingButton, CardSkeleton } from '@/components/ui/loading-states';
import { QuickActionsPanel } from '@/components/ui/notification-center';

interface Influencer {
  _id: string;
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
  status: 'pending' | 'active' | 'suspended' | 'inactive';
  joinedAt: string;
  lastActiveAt?: string;
  createdBy?: {
    name: string;
    email: string;
  };
}

interface InfluencerFormData {
  name: string;
  email: string;
  phone: string;
  platform: 'youtube' | 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'blog' | 'other';
  handle: string;
  followerCount: number;
  niche: string;
  referralCode: string;
  commissionType: 'percentage' | 'fixed';
  commissionRate: number;
  notes: string;
  tags: string;
}

interface Application {
  _id: string;
  fullName: string;
  email: string;
  primaryPlatform: string;
  followerCount: number;
  niche?: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'contacted';
  submittedAt: string;
}

export default function AdminInfluencersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<InfluencerFormData>({
    name: "",
    email: "",
    phone: "",
    platform: "instagram",
    handle: "",
    followerCount: 0,
    niche: "",
    referralCode: "",
    commissionType: "percentage",
    commissionRate: 5,
    notes: "",
    tags: ""
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [activeTab, setActiveTab] = useState<'influencers' | 'applications'>('influencers');
  const [applications, setApplications] = useState<Application[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [appSearch, setAppSearch] = useState('');
  const [appStatusFilter, setAppStatusFilter] = useState('all');
  const [isAppDialogOpen, setIsAppDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [appActionLoading, setAppActionLoading] = useState(false);

  // Mock data for enhanced UI
  const mockSocialAccounts = [
    {
      platform: 'instagram' as const,
      username: 'travel_influencer',
      followers: 125000,
      engagement: 4.2,
      verified: true,
      profileUrl: 'https://instagram.com/travel_influencer',
      lastPost: {
        date: '2 hours ago',
        likes: 3200,
        comments: 145,
        shares: 89
      }
    },
    {
      platform: 'youtube' as const,
      username: 'TravelVlogs',
      followers: 85000,
      engagement: 6.8,
      verified: false,
      profileUrl: 'https://youtube.com/@TravelVlogs',
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
      bookingAmount: 25000,
      commissionAmount: 2500,
      status: 'paid' as const,
      tier: 'Gold'
    },
    {
      id: '2',
      date: '2024-01-10',
      bookingId: 'BK002',
      propertyName: 'Mountain Villa',
      bookingAmount: 18000,
      commissionAmount: 1800,
      status: 'pending' as const,
      tier: 'Silver'
    }
  ];

  const quickActions = [
    {
      id: '1',
      title: 'Add Influencer',
      description: 'Create new influencer partnership',
      icon: Plus,
      onClick: () => setIsCreateDialogOpen(true),
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: '2',
      title: 'Review Applications',
      description: 'Process pending applications',
      icon: Eye,
      onClick: () => setActiveTab('applications'),
      color: 'from-green-500 to-emerald-600',
      badge: applications.filter(app => app.status === 'pending').length.toString()
    },
    {
      id: '3',
      title: 'Analytics Dashboard',
      description: 'View performance metrics',
      icon: TrendingUp,
      onClick: () => {},
      color: 'from-purple-500 to-pink-600'
    }
  ];

  // Mock chart data
  const performanceData = [
    { name: 'Instagram', value: influencers.filter(i => i.platform === 'instagram').length },
    { name: 'YouTube', value: influencers.filter(i => i.platform === 'youtube').length },
    { name: 'Facebook', value: influencers.filter(i => i.platform === 'facebook').length },
    { name: 'Twitter', value: influencers.filter(i => i.platform === 'twitter').length },
  ];

  const earningsData = [
    { name: 'Jan', value: 45000 },
    { name: 'Feb', value: 52000 },
    { name: 'Mar', value: 48000 },
    { name: 'Apr', value: 61000 },
    { name: 'May', value: 55000 },
    { name: 'Jun', value: 67000 },
  ];

  // Fetch influencers
  const fetchInfluencers = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
        platform: platformFilter
      });

      const response = await fetch(`/api/admin/influencers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInfluencers(data.influencers || []);
        setPagination(data.pagination);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch influencers",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching influencers:", error);
      toast({
        title: "Error",
        description: "Failed to fetch influencers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, searchTerm, statusFilter, platformFilter, toast]);

  // Fetch applications
  const fetchApplications = useCallback(async (page = 1) => {
    setAppLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        search: appSearch,
        status: appStatusFilter,
      });

      const response = await fetch(`/api/admin/influencer-applications?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || []);
        setPagination({
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.pages,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch applications",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setAppLoading(false);
    }
  }, [pagination.limit, appSearch, appStatusFilter, toast]);

  // Check admin permissions
  useEffect(() => {
    if (session && !["admin", "super_admin"].includes(session.user?.role || "")) {
      router.push("/admin/login");
    }
  }, [session, router]);
  
  useEffect(() => {
    if (activeTab === 'influencers') {
      fetchInfluencers(1); // Reset to page 1 on filter change
    }
  }, [searchTerm, statusFilter, platformFilter, activeTab, fetchInfluencers]);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications(1); // Reset to page 1 on filter change
    }
  }, [appSearch, appStatusFilter, activeTab, fetchApplications]);

  useEffect(() => {
    // When tab switches, fetch the first page of the new tab's data
    // to ensure pagination is reset correctly.
    if (activeTab === 'influencers') {
      fetchInfluencers(1);
    } else if (activeTab === 'applications') {
      fetchApplications(1);
    }
  }, [activeTab, fetchInfluencers, fetchApplications]);

  // Generate referral code from name
  const generateReferralCode = () => {
    if (formData.name) {
      const nameCode = formData.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
      const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      setFormData(prev => ({ ...prev, referralCode: `${nameCode}${randomCode}` }));
    }
  };

  // Create influencer
  const handleCreateInfluencer = async () => {
    try {
      const payload = {
        ...formData,
        followerCount: formData.followerCount || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };
      
      const response = await fetch('/api/admin/influencers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Influencer created successfully",
        });
        setIsCreateDialogOpen(false);
        setFormData({
          name: "",
          email: "",
          phone: "",
          platform: "instagram",
          handle: "",
          followerCount: 0,
          niche: "",
          referralCode: "",
          commissionType: "percentage",
          commissionRate: 5,
          notes: "",
          tags: ""
        });
        fetchInfluencers();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create influencer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating influencer:", error);
      toast({
        title: "Error",
        description: "Failed to create influencer",
        variant: "destructive",
      });
    }
  };

  // Update influencer status
  const updateInfluencerStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/influencers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Influencer ${status === 'active' ? 'activated' : 'suspended'} successfully`,
        });
        fetchInfluencers(pagination.page);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  // Handle pagination change
  const handlePageChange = (newPage: number) => {
    if (activeTab === 'influencers') {
      fetchInfluencers(newPage);
    } else {
      fetchApplications(newPage);
    }
  };

  const openApplicationDialog = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/influencer-applications/${id}`);
      const data = await response.json();
      if (data.success) {
        setSelectedApplication(data.data);
        setIsAppDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: data.error || 'Failed to fetch application details',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching application details:', error);
      toast({
        title: "Error",
        description: 'Failed to fetch application details',
        variant: "destructive",
      });
    }
  };

  const handleApplicationAction = async (status: 'approved' | 'rejected') => {
    if (!selectedApplication) return;
    setAppActionLoading(true);
    try {
      const response = await fetch(`/api/admin/influencer-applications/${selectedApplication._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Success',
          description: `Application ${status}`,
        });
        setIsAppDialogOpen(false);
        setSelectedApplication(null);
        fetchApplications(pagination.page);
        fetchInfluencers(1);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update application',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: 'Error',
        description: 'Failed to update application',
        variant: 'destructive',
      });
    } finally {
      setAppActionLoading(false);
    }
  };


  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      active: "default",
      suspended: "destructive",
      inactive: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getApplicationStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      reviewing: "default",
      approved: "default", 
      rejected: "destructive",
      contacted: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className={status === 'approved' ? 'bg-green-600 text-white' : ''}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };


  const getPlatformIcon = (platform: string) => {
    const icons = {
      youtube: "🎥",
      instagram: "📸",
      facebook: "👍",
      twitter: "🐦",
      tiktok: "🎵",
      blog: "📝",
      other: "🌐"
    };
    return icons[platform as keyof typeof icons] || "🌐";
  };

  if (loading && activeTab === 'influencers') {
    return (
      <ModernDashboardLayout
        title="Influencer Management"
        subtitle="Loading dashboard..."
        user={{
          name: session?.user?.name || 'Admin',
          role: 'Administrator'
        }}
      >
        <div className="space-y-6">
          <CardSkeleton showHeader={true} contentRows={3} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <CardSkeleton key={i} showHeader={false} contentRows={2} />
            ))}
          </div>
        </div>
      </ModernDashboardLayout>
    );
  }

  return (
    <ModernDashboardLayout
      title="Influencer Management"
      subtitle="Manage influencer partnerships and track performance"
      user={{
        name: session?.user?.name || 'Admin',
        role: 'Administrator'
      }}
      quickActions={[
        {
          label: 'Add Influencer',
          icon: Plus,
          onClick: () => setIsCreateDialogOpen(true)
        },
        {
          label: 'View Applications',
          icon: Eye,
          onClick: () => setActiveTab('applications')
        }
      ]}
    >
      {/* Quick Actions Panel */}
      <QuickActionsPanel actions={quickActions} className="mb-8" />
      {/* Enhanced Analytics */}
      <div className="mb-8">
        <ChartsGrid>
          <CommissionBreakdownChart data={performanceData} />
          <RevenueTrendChart 
            data={earningsData}
            timeRange="6m"
            onTimeRangeChange={(range) => console.log('Time range changed:', range)}
          />
        </ChartsGrid>
      </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-darkGreen hover:bg-darkGreen/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Influencer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Influencer</DialogTitle>
              <DialogDescription>
                Create a new influencer partnership account
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <Label htmlFor="platform">Platform *</Label>
                <Select value={formData.platform} onValueChange={(value: any) => setFormData(prev => ({ ...prev, platform: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="handle">Handle/Username *</Label>
                <Input
                  id="handle"
                  value={formData.handle}
                  onChange={(e) => setFormData(prev => ({ ...prev, handle: e.target.value }))}
                  placeholder="@username"
                />
              </div>
              
              <div>
                <Label htmlFor="niche">Niche *</Label>
                <Input
                  id="niche"
                  value={formData.niche}
                  onChange={(e) => setFormData(prev => ({ ...prev, niche: e.target.value }))}
                  placeholder="Travel, Lifestyle, etc."
                />
              </div>
              
              <div>
                <Label htmlFor="followerCount">Followers</Label>
                <Input
                  id="followerCount"
                  type="number"
                  value={formData.followerCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, followerCount: parseInt(e.target.value) || 0 }))}
                  placeholder="Number of followers"
                />
              </div>
              
              <div>
                <Label htmlFor="commissionType">Commission Type *</Label>
                <Select value={formData.commissionType} onValueChange={(value: any) => setFormData(prev => ({ ...prev, commissionType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="commissionRate">
                  Commission Rate * {formData.commissionType === 'percentage' ? '(%)' : '(₹)'}
                </Label>
                <Input
                  id="commissionRate"
                  type="number"
                  step={formData.commissionType === 'percentage' ? "0.1" : "1"}
                  value={formData.commissionRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commissionRate: parseFloat(e.target.value) || 0 }))}
                  placeholder={formData.commissionType === 'percentage' ? "5" : "100"}
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="referralCode">Referral Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="referralCode"
                    value={formData.referralCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, referralCode: e.target.value.toUpperCase() }))}
                    placeholder="AUTO_GENERATED"
                  />
                  <Button type="button" variant="outline" onClick={generateReferralCode}>
                    Generate
                  </Button>
                </div>
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <LoadingButton
                loading={false}
                onClick={handleCreateInfluencer} 
                className="bg-darkGreen hover:bg-darkGreen/90"
              >
                Create Influencer
              </LoadingButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'influencers' | 'applications')} className="space-y-4">
        <TabsList>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>
        <TabsContent value="influencers">
          {/* Enhanced Stats Cards */}
          <StatsGrid className="mb-8">
            <AnalyticsCard
              title="Total Influencers"
              value={pagination.total}
              icon={Users}
              gradient="from-blue-500 to-indigo-600"
              subtitle="Active partnerships"
            />
            <AnalyticsCard
              title="Active Influencers"
              value={influencers.filter(i => i.status === 'active').length}
              icon={UserCheck}
              gradient="from-green-500 to-emerald-600"
              trend="up"
              trendValue={12}
            />
            <AnalyticsCard
              title="Total Bookings"
              value={influencers.reduce((sum, i) => sum + i.totalBookings, 0)}
              icon={TrendingUp}
              gradient="from-purple-500 to-pink-600"
              trend="up"
              trendValue={8}
            />
            <AnalyticsCard
              title="Total Earnings"
              value={influencers.reduce((sum, i) => sum + i.totalEarnings, 0)}
              format="currency"
              icon={IndianRupee}
              gradient="from-orange-500 to-red-600"
              trend="up"
              trendValue={15}
            />
          </StatsGrid>

          {/* Social Media Integration */}
          <div className="mb-8">
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Top Performing Influencers</CardTitle>
              </CardHeader>
              <CardContent>
                <SwipeableCards
                  cards={influencers.slice(0, 6).map((influencer) => ({
                    id: influencer._id,
                    title: influencer.name,
                    badge: influencer.status,
                    content: (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <span>{getPlatformIcon(influencer.platform)}</span>
                          <span className="capitalize text-sm text-gray-600">{influencer.platform}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Earnings:</span>
                          <span className="font-medium">₹{influencer.totalEarnings.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Bookings:</span>
                          <span className="font-medium">{influencer.totalBookings}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Commission:</span>
                          <span className="font-medium">
                            {influencer.commissionType === 'percentage' 
                              ? `${influencer.commissionRate}%` 
                              : `₹${influencer.commissionRate}`
                            }
                          </span>
                        </div>
                      </div>
                    ),
                  }))}
                  cardWidth="280px"
                  showNavigation={true}
                  showPagination={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search influencers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="twitter">Twitter</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="blog">Blog</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Influencers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Influencers</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {influencers.map((influencer) => (
                    <TableRow key={influencer._id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{influencer.name}</p>
                          <p className="text-sm text-gray-500">{influencer.email}</p>
                          <p className="text-sm text-gray-500">{influencer.handle}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPlatformIcon(influencer.platform)}
                          <span className="capitalize">{influencer.platform}</span>
                        </div>
                      </TableCell>
                      <TableCell>{influencer.referralCode}</TableCell>
                      <TableCell>
                        {influencer.commissionType === 'percentage' 
                          ? `${influencer.commissionRate}%` 
                          : `₹${influencer.commissionRate}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Clicks: {influencer.totalClicks}</div>
                          <div>Bookings: {influencer.totalBookings}</div>
                          <div>Earnings: ₹{influencer.totalEarnings.toLocaleString()}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(influencer.status)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => updateInfluencerStatus(
                            influencer._id, 
                            influencer.status === 'active' ? 'suspended' : 'active'
                          )}
                        >
                          {influencer.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="applications">
          {/* Applications Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search applications by name, email, niche..."
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>Influencer Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Followers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        <div className="flex justify-center items-center p-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkGreen"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : applications.length > 0 ? (
                    applications.map((app) => (
                      <TableRow key={app._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.fullName}</p>
                            <p className="text-sm text-gray-500">{app.email}</p>
                            {app.niche && <p className="text-xs text-gray-400">Niche: {app.niche}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPlatformIcon(app.primaryPlatform)}
                            <span className="capitalize">{app.primaryPlatform}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {app.followerCount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {getApplicationStatusBadge(app.status)}
                        </TableCell>
                        <TableCell>
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => openApplicationDialog(app._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No applications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <div className="p-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Social Media Dashboard for Selected Influencer */}
      {influencers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Social Media Analytics</h2>
          <InfluencerSocialDashboard
            accounts={mockSocialAccounts}
            stats={mockSocialStats}
            onAddAccount={(account) => console.log('Add account:', account)}
          />
        </div>
      )}

      {/* Commission History */}
      {influencers.length > 0 && (
        <div className="mt-8">
          <CommissionHistory history={mockCommissionHistory} />
        </div>
      )}
      {/* Application Details Dialog */}
      <Dialog open={isAppDialogOpen} onOpenChange={setIsAppDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
          </DialogHeader>
          {selectedApplication ? (
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Name</Label>
                  <p>{selectedApplication.fullName}</p>
                </div>
                <div>
                  <Label>Email</Label>
                  <p>{selectedApplication.email}</p>
                </div>
                {selectedApplication.phone && (
                  <div>
                    <Label>Phone</Label>
                    <p>{selectedApplication.phone}</p>
                  </div>
                )}
                <div>
                  <Label>Primary Platform</Label>
                  <p className="capitalize">{selectedApplication.primaryPlatform}</p>
                </div>
                <div>
                  <Label>Followers</Label>
                  <p>{selectedApplication.followerCount.toLocaleString()}</p>
                </div>
                {selectedApplication.averageEngagement !== undefined && (
                  <div>
                    <Label>Engagement (%)</Label>
                    <p>{selectedApplication.averageEngagement}</p>
                  </div>
                )}
                <div>
                  <Label>Collaboration Type</Label>
                  <p className="capitalize">{selectedApplication.collaborationType}</p>
                </div>
                {selectedApplication.niche && (
                  <div>
                    <Label>Niche</Label>
                    <p>{selectedApplication.niche}</p>
                  </div>
                )}
                {selectedApplication.location && (
                  <div>
                    <Label>Location</Label>
                    <p>{`${selectedApplication.location.city || ''}${selectedApplication.location.city ? ', ' : ''}${selectedApplication.location.state || ''}${selectedApplication.location.state ? ', ' : ''}${selectedApplication.location.country}`}</p>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {selectedApplication.socialLinks && (
                <div>
                  <Label>Social Links</Label>
                  <ul className="list-disc list-inside space-y-1 text-sm text-darkGreen">
                    {Object.entries(selectedApplication.socialLinks).filter(([, v]) => v).map(([key, val]) => (
                      <li key={key}><span className="capitalize">{key}</span>: <a href={val as string} target="_blank" rel="noreferrer" className="underline text-blue-600">{val as string}</a></li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Long Texts */}
              {selectedApplication.bio && (
                <div>
                  <Label>Bio</Label>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedApplication.bio}</p>
                </div>
              )}
              {selectedApplication.motivation && (
                <div>
                  <Label>Motivation</Label>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedApplication.motivation}</p>
                </div>
              )}
              {selectedApplication.previousBrandCollabs && (
                <div>
                  <Label>Previous Brand Collaborations</Label>
                  <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedApplication.previousBrandCollabs}</p>
                </div>
              )}

              {/* Meta */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <p className="capitalize">{selectedApplication.status}</p>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p>{new Date(selectedApplication.submittedAt).toLocaleString()}</p>
                </div>
                {selectedApplication.reviewedAt && (
                  <div>
                    <Label>Reviewed At</Label>
                    <p>{new Date(selectedApplication.reviewedAt).toLocaleString()}</p>
                  </div>
                )}
                {selectedApplication.utmSource && (
                  <div>
                    <Label>UTM Source / Medium / Campaign</Label>
                    <p>{`${selectedApplication.utmSource || ''}${selectedApplication.utmMedium ? ' / ' + selectedApplication.utmMedium : ''}${selectedApplication.utmCampaign ? ' / ' + selectedApplication.utmCampaign : ''}`}</p>
                  </div>
                )}
                {selectedApplication.reviewNotes && (
                  <div className="col-span-2">
                    <Label>Review Notes</Label>
                    <p className="whitespace-pre-wrap text-sm text-gray-700">{selectedApplication.reviewNotes}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkGreen"></div>
            </div>
          )}
          <DialogFooter className="justify-between mt-6">
            <Button variant="destructive" disabled={appActionLoading || selectedApplication?.status === 'rejected'} onClick={() => handleApplicationAction('rejected')}>
              Reject
            </Button>
            <Button className="bg-darkGreen hover:bg-darkGreen/90" disabled={appActionLoading || selectedApplication?.status === 'approved'} onClick={() => handleApplicationAction('approved')}>
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModernDashboardLayout>
  );
} 