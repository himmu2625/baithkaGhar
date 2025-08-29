'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  UserPlus,
  Search,
  Filter,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Star,
  Crown,
  Shield,
  Activity,
  Trash2,
  Edit,
  Send,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Award,
  Globe,
  Heart,
  Gift,
  Settings,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  preferences?: {
    communication: string;
    roomType: string;
    bedType: string;
    smokingPreference: string;
    dietaryRestrictions: string[];
    specialRequests: string[];
  };
  idType?: string;
  idNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  notes?: string;
  status: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  loyaltyPoints: number;
  vipStatus: boolean;
  blacklisted: boolean;
  createdAt: string;
}

interface GuestStats {
  totalGuests: number;
  activeGuests: number;
  vipGuests: number;
  blacklistedGuests: number;
  recentGuests: number;
  totalBookings: number;
  totalRevenue: number;
  averageSpent: number;
  averageBookingsPerGuest: number;
  statusDistribution: Array<{ _id: string; count: number }>;
  nationalityDistribution: Array<{ _id: string; count: number }>;
}

interface Communication {
  _id: string;
  guestId: string;
  type: string;
  subject: string;
  content: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  priority: string;
  status: string;
  createdAt: string;
  guest?: Guest;
}

export default function GuestManagement() {
  const params = useParams();
  const propertyId = params.id as string;

  const [guests, setGuests] = useState<Guest[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Search and filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog states
  const [showGuestDialog, setShowGuestDialog] = useState(false);
  const [showCommunicationDialog, setShowCommunicationDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedGuestForComm, setSelectedGuestForComm] = useState<Guest | null>(null);

  // Form states
  const [guestForm, setGuestForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    preferences: {
      communication: 'email',
      roomType: 'standard',
      bedType: 'double',
      smokingPreference: 'non-smoking',
      dietaryRestrictions: [],
      specialRequests: []
    },
    idType: '',
    idNumber: '',
    nationality: '',
    dateOfBirth: '',
    notes: ''
  });

  const [communicationForm, setCommunicationForm] = useState({
    type: 'email',
    subject: '',
    content: '',
    channel: 'email',
    priority: 'normal',
    scheduledFor: ''
  });

  useEffect(() => {
    fetchGuests();
    fetchCommunications();
  }, [propertyId, currentPage, searchTerm, statusFilter]);

  const fetchGuests = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search: searchTerm,
        status: statusFilter
      });

      const response = await fetch(`/api/os/guests/${propertyId}?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setGuests(data.guests);
        setGuestStats(data.stats);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch guests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunications = async () => {
    try {
      const response = await fetch(`/api/os/guests/${propertyId}/communications?limit=10`);
      const data = await response.json();

      if (data.success) {
        setCommunications(data.communications);
      }
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    }
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/os/guests/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guestForm)
      });

      if (response.ok) {
        setShowGuestDialog(false);
        resetGuestForm();
        fetchGuests();
      }
    } catch (error) {
      console.error('Failed to create guest:', error);
    }
  };

  const handleUpdateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest) return;

    try {
      const response = await fetch(`/api/os/guests/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: editingGuest._id,
          ...guestForm
        })
      });

      if (response.ok) {
        setShowGuestDialog(false);
        setEditingGuest(null);
        resetGuestForm();
        fetchGuests();
      }
    } catch (error) {
      console.error('Failed to update guest:', error);
    }
  };

  const handleSendCommunication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuestForComm) return;

    try {
      const response = await fetch(`/api/os/guests/${propertyId}/communications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: selectedGuestForComm._id,
          direction: 'outbound',
          ...communicationForm
        })
      });

      if (response.ok) {
        setShowCommunicationDialog(false);
        setSelectedGuestForComm(null);
        resetCommunicationForm();
        fetchCommunications();
      }
    } catch (error) {
      console.error('Failed to send communication:', error);
    }
  };

  const resetGuestForm = () => {
    setGuestForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      preferences: {
        communication: 'email',
        roomType: 'standard',
        bedType: 'double',
        smokingPreference: 'non-smoking',
        dietaryRestrictions: [],
        specialRequests: []
      },
      idType: '',
      idNumber: '',
      nationality: '',
      dateOfBirth: '',
      notes: ''
    });
  };

  const resetCommunicationForm = () => {
    setCommunicationForm({
      type: 'email',
      subject: '',
      content: '',
      channel: 'email',
      priority: 'normal',
      scheduledFor: ''
    });
  };

  const openEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setGuestForm({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address || {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      preferences: guest.preferences || {
        communication: 'email',
        roomType: 'standard',
        bedType: 'double',
        smokingPreference: 'non-smoking',
        dietaryRestrictions: [],
        specialRequests: []
      },
      idType: guest.idType || '',
      idNumber: guest.idNumber || '',
      nationality: guest.nationality || '',
      dateOfBirth: guest.dateOfBirth ? new Date(guest.dateOfBirth).toISOString().split('T')[0] : '',
      notes: guest.notes || ''
    });
    setShowGuestDialog(true);
  };

  const openCommunicationDialog = (guest: Guest) => {
    setSelectedGuestForComm(guest);
    setShowCommunicationDialog(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'vip': return 'destructive';
      case 'blacklisted': return 'destructive';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading && guests.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading guest data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Guest Management</h1>
          <p className="text-muted-foreground">
            Manage guest profiles, preferences, and communications
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowGuestDialog(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {guestStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestStats.totalGuests}</div>
              <p className="text-xs text-muted-foreground">
                {guestStats.recentGuests} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VIP Guests</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestStats.vipGuests}</div>
              <p className="text-xs text-muted-foreground">
                {guestStats.totalGuests > 0 ? ((guestStats.vipGuests / guestStats.totalGuests) * 100).toFixed(1) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(guestStats.averageSpent)}</div>
              <p className="text-xs text-muted-foreground">
                Per guest lifetime value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guestStats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">
                {guestStats.averageBookingsPerGuest.toFixed(1)} per guest average
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="guests">Guests</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Status Distribution</CardTitle>
                <CardDescription>Breakdown of guest statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {guestStats?.statusDistribution?.map((status, index) => (
                    <div key={status._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          status._id === 'active' ? 'bg-green-500' :
                          status._id === 'inactive' ? 'bg-gray-500' :
                          status._id === 'vip' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="capitalize font-medium">{status._id}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{status.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({guestStats.totalGuests > 0 ? ((status.count / guestStats.totalGuests) * 100).toFixed(1) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Nationalities */}
            <Card>
              <CardHeader>
                <CardTitle>Guest Nationalities</CardTitle>
                <CardDescription>Top countries by guest count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {guestStats?.nationalityDistribution?.slice(0, 5).map((country, index) => (
                    <div key={country._id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{country._id}</span>
                      </div>
                      <span className="font-bold">{country.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Guests Tab */}
        <TabsContent value="guests" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="blacklisted">Blacklisted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setSearchTerm(''); setStatusFilter(''); setCurrentPage(1); }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Guests List */}
          <div className="grid grid-cols-1 gap-4">
            {guests.map((guest) => (
              <Card key={guest._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${guest.firstName}${guest.lastName}`} />
                        <AvatarFallback>{getInitials(guest.firstName, guest.lastName)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{guest.firstName} {guest.lastName}</h3>
                          {guest.vipStatus && <Crown className="h-4 w-4 text-yellow-500" />}
                          {guest.blacklisted && <Shield className="h-4 w-4 text-red-500" />}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{guest.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{guest.phone}</span>
                          </div>
                          {guest.nationality && (
                            <div className="flex items-center space-x-1">
                              <Globe className="h-3 w-3" />
                              <span>{guest.nationality}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm">
                          <Badge variant={getStatusBadgeVariant(guest.status)}>
                            {guest.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {guest.totalBookings} bookings
                          </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(guest.totalSpent)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-muted-foreground">{guest.loyaltyPoints} points</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCommunicationDialog(guest)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(guest)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Communications</CardTitle>
              <CardDescription>Latest guest communications and messages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communications.map((comm) => (
                  <div key={comm._id} className="flex items-start space-x-4 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      comm.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {comm.channel === 'email' && <Mail className="h-4 w-4" />}
                      {comm.channel === 'sms' && <MessageSquare className="h-4 w-4" />}
                      {comm.channel === 'phone' && <Phone className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {comm.guest ? `${comm.guest.firstName} ${comm.guest.lastName}` : 'Unknown Guest'}
                          </span>
                          <Badge variant="outline" className={getPriorityColor(comm.priority)}>
                            {comm.priority}
                          </Badge>
                          <Badge variant={comm.direction === 'outbound' ? 'default' : 'secondary'}>
                            {comm.direction}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comm.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {comm.subject && (
                        <h4 className="font-medium">{comm.subject}</h4>
                      )}
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {comm.content}
                      </p>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {comm.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">
                          via {comm.channel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {communications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No communications found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Guest Engagement</CardTitle>
                <CardDescription>Communication and interaction metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Total Communications</span>
                    <span className="font-bold text-blue-600">{communications.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span>Active Guests</span>
                    <span className="font-bold text-green-600">{guestStats?.activeGuests || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span>VIP Members</span>
                    <span className="font-bold text-yellow-600">{guestStats?.vipGuests || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Guest spending and loyalty metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                    <span>Total Revenue</span>
                    <span className="font-bold text-emerald-600">
                      {formatCurrency(guestStats?.totalRevenue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span>Average Guest Value</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(guestStats?.averageSpent || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                    <span>Repeat Bookings Rate</span>
                    <span className="font-bold text-indigo-600">
                      {guestStats?.averageBookingsPerGuest ? (guestStats.averageBookingsPerGuest * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Guest Dialog */}
      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGuest ? 'Edit Guest' : 'Add New Guest'}
            </DialogTitle>
            <DialogDescription>
              {editingGuest ? 'Update guest information' : 'Create a new guest profile'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={editingGuest ? handleUpdateGuest : handleCreateGuest} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={guestForm.firstName}
                    onChange={(e) => setGuestForm({...guestForm, firstName: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={guestForm.lastName}
                    onChange={(e) => setGuestForm({...guestForm, lastName: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={guestForm.email}
                    onChange={(e) => setGuestForm({...guestForm, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={guestForm.phone}
                    onChange={(e) => setGuestForm({...guestForm, phone: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="space-y-4">
              <h3 className="font-semibold">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={guestForm.nationality}
                    onChange={(e) => setGuestForm({...guestForm, nationality: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={guestForm.dateOfBirth}
                    onChange={(e) => setGuestForm({...guestForm, dateOfBirth: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="idType">ID Type</Label>
                  <Select value={guestForm.idType} onValueChange={(value) => setGuestForm({...guestForm, idType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ID type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="passport">Passport</SelectItem>
                      <SelectItem value="driving_license">Driving License</SelectItem>
                      <SelectItem value="national_id">National ID</SelectItem>
                      <SelectItem value="voter_id">Voter ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={guestForm.idNumber}
                    onChange={(e) => setGuestForm({...guestForm, idNumber: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="font-semibold">Preferences</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="communication">Communication Preference</Label>
                  <Select 
                    value={guestForm.preferences.communication} 
                    onValueChange={(value) => setGuestForm({
                      ...guestForm, 
                      preferences: {...guestForm.preferences, communication: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roomType">Room Type Preference</Label>
                  <Select 
                    value={guestForm.preferences.roomType} 
                    onValueChange={(value) => setGuestForm({
                      ...guestForm, 
                      preferences: {...guestForm.preferences, roomType: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="deluxe">Deluxe</SelectItem>
                      <SelectItem value="suite">Suite</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={guestForm.notes}
                onChange={(e) => setGuestForm({...guestForm, notes: e.target.value})}
                placeholder="Additional notes about the guest..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowGuestDialog(false);
                setEditingGuest(null);
                resetGuestForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingGuest ? 'Update Guest' : 'Create Guest'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Communication Dialog */}
      <Dialog open={showCommunicationDialog} onOpenChange={setShowCommunicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Communication</DialogTitle>
            <DialogDescription>
              Send a message to {selectedGuestForComm?.firstName} {selectedGuestForComm?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSendCommunication} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="commType">Type</Label>
                <Select value={communicationForm.type} onValueChange={(value) => setCommunicationForm({...communicationForm, type: value, channel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={communicationForm.priority} onValueChange={(value) => setCommunicationForm({...communicationForm, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {communicationForm.type === 'email' && (
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={communicationForm.subject}
                  onChange={(e) => setCommunicationForm({...communicationForm, subject: e.target.value})}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="content">Message</Label>
              <Textarea
                id="content"
                value={communicationForm.content}
                onChange={(e) => setCommunicationForm({...communicationForm, content: e.target.value})}
                placeholder="Enter your message here..."
                required
              />
            </div>

            <div>
              <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={communicationForm.scheduledFor}
                onChange={(e) => setCommunicationForm({...communicationForm, scheduledFor: e.target.value})}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setShowCommunicationDialog(false);
                setSelectedGuestForComm(null);
                resetCommunicationForm();
              }}>
                Cancel
              </Button>
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                {communicationForm.scheduledFor ? 'Schedule' : 'Send'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}