'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  MapPin,
  Bell,
  Star,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ReservationCalendar } from '@/components/os/fb/reservations/ReservationCalendar';
import { ReservationForm } from '@/components/os/fb/reservations/ReservationForm';
import { ReservationList } from '@/components/os/fb/reservations/ReservationList';

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  tableId?: string;
  tableName?: string;
  section?: string;
  specialRequests?: string;
  occasion?: string;
  isVip: boolean;
  source: 'phone' | 'online' | 'walk_in' | 'app';
  depositRequired: boolean;
  depositAmount?: number;
  depositPaid?: boolean;
  remindersSent: number;
  lastReminderTime?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  confirmedAt?: string;
}

interface ReservationStats {
  totalReservations: number;
  todayReservations: number;
  upcomingReservations: number;
  confirmedReservations: number;
  pendingReservations: number;
  cancelledReservations: number;
  noShowRate: number;
  averagePartySize: number;
  peakBookingHour: string;
  totalRevenue: number;
}

interface TimeSlot {
  time: string;
  availableTables: number;
  totalCapacity: number;
  reservations: Reservation[];
  isAvailable: boolean;
}

export default function ReservationManagement() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reservationStats, setReservationStats] = useState<ReservationStats>({
    totalReservations: 0,
    todayReservations: 0,
    upcomingReservations: 0,
    confirmedReservations: 0,
    pendingReservations: 0,
    cancelledReservations: 0,
    noShowRate: 0,
    averagePartySize: 0,
    peakBookingHour: '',
    totalRevenue: 0,
  });
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showVipOnly, setShowVipOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  useEffect(() => {
    const fetchReservationData = async () => {
      try {
        setLoading(true);
        
        const [reservationsRes, statsRes, slotsRes] = await Promise.all([
          fetch(`/api/fb/reservations?propertyId=${propertyId}&date=${selectedDate.toISOString().split('T')[0]}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/reservations/stats?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/reservations/slots?propertyId=${propertyId}&date=${selectedDate.toISOString().split('T')[0]}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (!reservationsRes.ok || !statsRes.ok || !slotsRes.ok) {
          throw new Error('Failed to fetch reservation data');
        }

        const [reservationsData, statsData, slotsData] = await Promise.all([
          reservationsRes.json(),
          statsRes.json(),
          slotsRes.json()
        ]);
        
        setReservations(reservationsData.reservations || []);
        setReservationStats(statsData.stats || reservationStats);
        setTimeSlots(slotsData.slots || []);
      } catch (err) {
        console.error('Error fetching reservation data:', err);
        setError('Failed to load reservation data');
        
        // Mock data for development
        const mockReservations: Reservation[] = [
          {
            id: '1',
            customerName: 'John Smith',
            customerPhone: '+91 9876543210',
            customerEmail: 'john@example.com',
            partySize: 4,
            reservationDate: new Date().toISOString().split('T')[0],
            reservationTime: '19:00',
            duration: 120,
            status: 'confirmed',
            tableId: 'T01',
            tableName: 'Table 1',
            section: 'Main Hall',
            specialRequests: 'Window seat preferred',
            occasion: 'Anniversary',
            isVip: true,
            source: 'phone',
            depositRequired: true,
            depositAmount: 500,
            depositPaid: true,
            remindersSent: 1,
            lastReminderTime: new Date(Date.now() - 3600000).toISOString(),
            notes: 'Preferred customer, always on time',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updatedAt: new Date(Date.now() - 3600000).toISOString(),
            createdBy: 'staff_001',
            confirmedAt: new Date(Date.now() - 7200000).toISOString()
          },
          {
            id: '2',
            customerName: 'Alice Johnson',
            customerPhone: '+91 9876543211',
            customerEmail: 'alice@example.com',
            partySize: 6,
            reservationDate: new Date().toISOString().split('T')[0],
            reservationTime: '20:30',
            duration: 90,
            status: 'pending',
            specialRequests: 'High chairs needed for 2 children',
            isVip: false,
            source: 'online',
            depositRequired: false,
            remindersSent: 0,
            notes: 'First time customer',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            updatedAt: new Date(Date.now() - 7200000).toISOString(),
            createdBy: 'system'
          },
          {
            id: '3',
            customerName: 'Bob Wilson',
            customerPhone: '+91 9876543212',
            partySize: 2,
            reservationDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            reservationTime: '18:30',
            duration: 120,
            status: 'confirmed',
            tableId: 'T03',
            tableName: 'Table 3',
            section: 'Private Dining',
            occasion: 'Birthday',
            isVip: false,
            source: 'app',
            depositRequired: true,
            depositAmount: 300,
            depositPaid: false,
            remindersSent: 0,
            notes: 'Requested quiet table',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            updatedAt: new Date(Date.now() - 1800000).toISOString(),
            createdBy: 'staff_002',
            confirmedAt: new Date(Date.now() - 1800000).toISOString()
          }
        ];
        
        setReservations(mockReservations);
        setReservationStats({
          totalReservations: 245,
          todayReservations: 18,
          upcomingReservations: 32,
          confirmedReservations: 28,
          pendingReservations: 6,
          cancelledReservations: 8,
          noShowRate: 4.2,
          averagePartySize: 3.8,
          peakBookingHour: '19:30',
          totalRevenue: 125600,
        });

        // Mock time slots
        const mockTimeSlots: TimeSlot[] = [
          {
            time: '17:00',
            availableTables: 8,
            totalCapacity: 32,
            reservations: [],
            isAvailable: true
          },
          {
            time: '17:30',
            availableTables: 6,
            totalCapacity: 32,
            reservations: [],
            isAvailable: true
          },
          {
            time: '18:00',
            availableTables: 4,
            totalCapacity: 32,
            reservations: [],
            isAvailable: true
          },
          {
            time: '18:30',
            availableTables: 3,
            totalCapacity: 32,
            reservations: [mockReservations[2]],
            isAvailable: true
          },
          {
            time: '19:00',
            availableTables: 2,
            totalCapacity: 32,
            reservations: [mockReservations[0]],
            isAvailable: true
          },
          {
            time: '19:30',
            availableTables: 1,
            totalCapacity: 32,
            reservations: [],
            isAvailable: true
          },
          {
            time: '20:00',
            availableTables: 0,
            totalCapacity: 32,
            reservations: [],
            isAvailable: false
          },
          {
            time: '20:30',
            availableTables: 1,
            totalCapacity: 32,
            reservations: [mockReservations[1]],
            isAvailable: true
          }
        ];
        
        setTimeSlots(mockTimeSlots);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchReservationData();
    }
  }, [propertyId, session, selectedDate]);

  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = reservation.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.customerPhone.includes(searchQuery) ||
                         reservation.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || reservation.status === selectedStatus;
    const matchesVip = !showVipOnly || reservation.isVip;
    
    return matchesSearch && matchesStatus && matchesVip;
  });

  const handleUpdateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReservations(reservations =>
          reservations.map(reservation =>
            reservation.id === reservationId 
              ? { 
                  ...reservation, 
                  status: newStatus as any, 
                  updatedAt: new Date().toISOString(),
                  confirmedAt: newStatus === 'confirmed' ? new Date().toISOString() : reservation.confirmedAt
                } 
              : reservation
          )
        );
      }
    } catch (err) {
      console.error('Error updating reservation status:', err);
    }
  };

  const handleSendReminder = async (reservationId: string) => {
    try {
      const response = await fetch(`/api/fb/reservations/${reservationId}/reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ propertyId }),
      });

      if (response.ok) {
        setReservations(reservations =>
          reservations.map(reservation =>
            reservation.id === reservationId
              ? { 
                  ...reservation, 
                  remindersSent: reservation.remindersSent + 1,
                  lastReminderTime: new Date().toISOString()
                }
              : reservation
          )
        );
      }
    } catch (err) {
      console.error('Error sending reminder:', err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'seated': return <Users className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'no_show': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'seated': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-200 text-green-900';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'online': return <CalendarIcon className="w-4 h-4" />;
      case 'app': return <Phone className="w-4 h-4" />; // Could use app icon
      case 'walk_in': return <Users className="w-4 h-4" />;
      default: return <CalendarIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Reservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to F&B Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Reservations Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-rose-100">Table Reservations & Bookings</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Bookings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{reservationStats.todayReservations}</div>
              <div className="text-rose-200 text-sm">Today's Bookings</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{reservationStats.confirmedReservations}</div>
              <div className="text-rose-200 text-sm">Confirmed</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <Button 
              onClick={() => setShowReservationForm(true)}
              className="bg-white text-rose-600 hover:bg-white/90 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Reservation
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-rose-50 to-pink-100 hover:from-rose-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-rose-700">Today's Reservations</CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
              <CalendarIcon className="h-5 w-5 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-rose-900 mb-1">{reservationStats.todayReservations}</div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4 text-rose-600" />
              <span className="text-xs text-rose-600">{reservationStats.confirmedReservations} confirmed</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Upcoming</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{reservationStats.upcomingReservations}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">{reservationStats.pendingReservations} pending</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-red-100 hover:from-orange-100 hover:to-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">No-Show Rate</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">{reservationStats.noShowRate}%</div>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-orange-600">This month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Avg Party Size</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">{reservationStats.averagePartySize}</div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">Peak: {reservationStats.peakBookingHour}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-violet-100 hover:from-purple-100 hover:to-violet-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <Star className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">₹{reservationStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">From reservations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="calendar" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-50 data-[state=active]:to-pink-100 data-[state=active]:text-rose-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-rose-100 hover:to-pink-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-pink-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-rose-500/20 group-hover:bg-rose-500/30 transition-colors">
                <CalendarIcon className="h-4 w-4 text-rose-600" />
              </div>
              <span>Calendar View</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="list" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <span>Reservations List</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <span>Timeline View</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Calendar View Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <ReservationCalendar
            propertyId={propertyId}
            reservations={reservations}
            timeSlots={timeSlots}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onReservationSelect={setSelectedReservation}
            onReservationStatusUpdate={handleUpdateReservationStatus}
          />
        </TabsContent>

        {/* List View Tab */}
        <TabsContent value="list" className="space-y-8">
          {/* Enhanced Filters - OS Style */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-sm hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5"></div>
            <CardHeader className="relative bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg">
                    <Filter className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-blue-900">Search & Filter</CardTitle>
                    <CardDescription className="text-blue-700 font-medium">Find and filter reservations by various criteria</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-blue-600 font-medium">Live Search</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative p-8">
              <div className="space-y-6">
                {/* Search and Status Filter Row */}
                <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                  <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/90 rounded-2xl shadow-lg backdrop-blur-sm border border-blue-200/50 group-hover:border-blue-300/70 transition-all duration-300">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      <Input
                        placeholder="Search by name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-12 pr-4 py-4 text-lg font-medium border-0 bg-transparent focus:ring-2 focus:ring-blue-500/20 focus:outline-none placeholder:text-blue-400"
                      />
                      {searchQuery && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery('')}
                            className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full"
                          >
                            <XCircle className="h-4 w-4 text-blue-500" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative">
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="w-52 h-14 border-0 bg-white/90 shadow-lg backdrop-blur-sm rounded-2xl border border-indigo-200/50 group-hover:border-indigo-300/70 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/20">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gradient-to-r from-indigo-100/80 to-purple-100/80 rounded-lg">
                              <Filter className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-indigo-600 font-medium">Status Filter</div>
                              <SelectValue placeholder="All Status" className="font-bold text-indigo-900" />
                            </div>
                          </div>
                        </SelectTrigger>
                        <SelectContent className="border-0 shadow-2xl bg-white/95 backdrop-blur-lg rounded-2xl">
                          <SelectItem value="all" className="py-3 px-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-gray-400 to-slate-400 rounded-full"></div>
                              <span className="font-semibold">All Status</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pending" className="py-3 px-4 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                              <span className="font-semibold">Pending</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="confirmed" className="py-3 px-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                              <span className="font-semibold">Confirmed</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="seated" className="py-3 px-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                              <span className="font-semibold">Seated</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="completed" className="py-3 px-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                              <span className="font-semibold">Completed</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled" className="py-3 px-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-red-400 to-pink-400 rounded-full"></div>
                              <span className="font-semibold">Cancelled</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="no_show" className="py-3 px-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
                              <span className="font-semibold">No Show</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Results and VIP Filter Row */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    {/* Results Counter */}
                    <div className="group relative overflow-hidden bg-gradient-to-r from-white to-blue-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-lg shadow-sm">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm text-blue-600 font-medium">Showing Results</div>
                            <div className="text-lg font-bold text-blue-900">
                              <span className="text-2xl text-rose-600">{filteredReservations.length}</span>
                              <span className="text-gray-500 mx-2">of</span>
                              <span className="text-blue-800">{reservations.length}</span>
                              <span className="text-blue-600 text-sm ml-1">reservations</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Filter Badges */}
                    <div className="flex items-center space-x-2">
                      {searchQuery && (
                        <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm px-3 py-1">
                          <Search className="w-3 h-3 mr-1" />
                          Search: "{searchQuery}"
                        </Badge>
                      )}
                      {selectedStatus !== 'all' && (
                        <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm px-3 py-1">
                          <Filter className="w-3 h-3 mr-1" />
                          Status: {selectedStatus}
                        </Badge>
                      )}
                      {showVipOnly && (
                        <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 shadow-sm px-3 py-1">
                          <Star className="w-3 h-3 mr-1 fill-current" />
                          VIP Only
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* VIP Toggle */}
                  <div className="group relative overflow-hidden bg-gradient-to-r from-white to-yellow-50/50 border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-r from-yellow-100/80 to-orange-100/80 rounded-lg shadow-sm">
                            <Star className="w-5 h-5 text-yellow-600 fill-current" />
                          </div>
                          <div>
                            <label htmlFor="show-vip" className="text-sm font-bold text-yellow-900 cursor-pointer">VIP Guests Only</label>
                            <div className="text-xs text-yellow-600">Show only premium customers</div>
                          </div>
                        </div>
                        <Switch 
                          id="show-vip"
                          checked={showVipOnly}
                          onCheckedChange={setShowVipOnly}
                          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-yellow-500 data-[state=checked]:to-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear Filters Button */}
                {(searchQuery || selectedStatus !== 'all' || showVipOnly) && (
                  <div className="flex justify-center pt-4 border-t border-blue-200/50">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedStatus('all');
                        setShowVipOnly(false);
                      }}
                      className="border-blue-200/70 bg-white/70 hover:bg-blue-50 hover:border-blue-300 backdrop-blur-sm text-blue-700 font-semibold px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <ReservationList
            reservations={filteredReservations}
            onReservationSelect={setSelectedReservation}
            onStatusUpdate={handleUpdateReservationStatus}
            onSendReminder={handleSendReminder}
          />
        </TabsContent>

        {/* Enhanced Timeline View Tab */}
        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 overflow-hidden hover:shadow-3xl transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-green-100/80 via-emerald-100/80 to-teal-100/80 border-b border-green-200/50 backdrop-blur-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div>
                  <CardTitle className="text-xl flex items-center space-x-3 text-green-900">
                    <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <span className="font-bold">Daily Timeline</span>
                      <div className="text-sm font-normal text-green-700 mt-1">Hour-by-hour reservation schedule</div>
                    </div>
                    <div className="flex items-center space-x-2 ml-auto">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Live Schedule</span>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-green-600 mt-2 text-base">
                    Reservations for <span className="font-semibold text-green-800">{selectedDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="bg-white/80 p-3 rounded-xl shadow-md backdrop-blur-sm">
                    <Input
                      type="date"
                      value={selectedDate.toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(new Date(e.target.value))}
                      className="w-48 border-green-200/70 bg-white/90 backdrop-blur-sm focus:border-green-500 focus:ring-green-500/20"
                    />
                  </div>
                  <Badge className="bg-gradient-to-r from-green-200 to-emerald-200 text-green-800 border-0 shadow-sm font-bold px-4 py-2">
                    {timeSlots.reduce((sum, slot) => sum + slot.reservations.length, 0)} bookings
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                {timeSlots.map((slot, index) => (
                  <div key={slot.time} className="group relative overflow-hidden bg-gradient-to-r from-white to-green-50/50 border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.01]">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Time indicator */}
                    <div className="absolute top-4 left-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                        slot.isAvailable ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'
                      }`}>
                        {slot.time.split(':')[0]}
                      </div>
                    </div>
                    
                    <div className="relative p-6 pl-20">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-bold text-green-900">{slot.time}</h3>
                              <div className="flex items-center space-x-3 mt-2">
                                <Badge className={`border-0 shadow-sm font-bold ${
                                  slot.isAvailable ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' : 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800'
                                }`}>
                                  {slot.isAvailable ? 'Available' : 'Fully Booked'}
                                </Badge>
                                <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm">
                                  {slot.availableTables} / {Math.ceil(slot.totalCapacity / 4)} tables
                                </Badge>
                                <Badge className="bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800 border-0 shadow-sm">
                                  {slot.totalCapacity - (slot.reservations.reduce((sum, r) => sum + r.partySize, 0))} seats free
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          {/* Reservations display */}
                          <div className="space-y-3">
                            {slot.reservations.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {slot.reservations.map((reservation) => (
                                  <div key={reservation.id} className="group/reservation relative overflow-hidden bg-gradient-to-r from-white/80 to-blue-50/80 border-0 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover/reservation:opacity-100 transition-opacity duration-300"></div>
                                    
                                    <div className="relative p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                          <div className="p-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-full shadow-sm">
                                            <User className="w-5 h-5 text-blue-600" />
                                          </div>
                                          <div>
                                            <div className="font-bold text-blue-900 flex items-center space-x-2">
                                              <span>{reservation.customerName}</span>
                                              {reservation.isVip && (
                                                <div className="p-1 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                                                  <Star className="w-3 h-3 text-yellow-600 fill-current" />
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-blue-600 text-sm flex items-center space-x-2">
                                              <Users className="w-3 h-3" />
                                              <span>{reservation.partySize} guests</span>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <Badge className={`border-0 shadow-sm text-xs font-bold ${
                                            reservation.status === 'confirmed' ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' :
                                            reservation.status === 'pending' ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800' :
                                            reservation.status === 'seated' ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800' :
                                            reservation.status === 'completed' ? 'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800' :
                                            'bg-gradient-to-r from-gray-200 to-slate-200 text-gray-800'
                                          }`}>
                                            {reservation.status.toUpperCase()}
                                          </Badge>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                          {reservation.tableName && (
                                            <Badge className="bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-800 border-0 shadow-sm text-xs">
                                              {reservation.tableName}
                                            </Badge>
                                          )}
                                          {reservation.section && (
                                            <Badge className="bg-gradient-to-r from-teal-200 to-cyan-200 text-teal-800 border-0 shadow-sm text-xs">
                                              {reservation.section}
                                            </Badge>
                                          )}
                                        </div>
                                        <div className="text-xs text-blue-600">
                                          {reservation.duration} min
                                        </div>
                                      </div>
                                      
                                      {reservation.specialRequests && (
                                        <div className="mt-3 pt-3 border-t border-blue-200/50">
                                          <div className="text-xs text-blue-700 bg-blue-50/80 rounded-lg p-2">
                                            <span className="font-medium">Special Request:</span> {reservation.specialRequests}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl border-2 border-dashed border-green-300">
                                <div className="p-4 bg-green-100 rounded-full w-fit mx-auto mb-4">
                                  <Clock className="w-8 h-8 text-green-600" />
                                </div>
                                <h4 className="text-lg font-bold text-green-900 mb-2">No Reservations</h4>
                                <p className="text-green-600 text-sm">This time slot is available for booking</p>
                                <Button 
                                  onClick={() => setShowReservationForm(true)}
                                  className="mt-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 shadow-lg"
                                >
                                  <Plus className="w-4 h-4 mr-2" />
                                  Add Reservation
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Capacity indicator */}
                      <div className="mt-6 pt-4 border-t border-green-200/50">
                        <div className="flex items-center justify-between text-sm text-green-700 mb-2">
                          <span className="font-medium">Table Utilization</span>
                          <span>{Math.round(((slot.reservations.reduce((sum, r) => sum + r.partySize, 0)) / slot.totalCapacity) * 100)}% capacity</span>
                        </div>
                        <div className="w-full bg-green-200/50 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-md ${
                              slot.isAvailable ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${Math.min(((slot.reservations.reduce((sum, r) => sum + r.partySize, 0)) / slot.totalCapacity) * 100, 100)}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-xs text-green-600">
                            <span className="font-bold">{slot.reservations.reduce((sum, r) => sum + r.partySize, 0)}</span> / <span className="font-bold">{slot.totalCapacity}</span> seats booked
                          </div>
                          <div className="text-xs text-green-600">
                            <span className="font-bold">{slot.reservations.length}</span> reservations
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {timeSlots.length === 0 && (
                  <div className="text-center py-12 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl border-2 border-dashed border-green-300">
                    <div className="p-6 bg-green-100 rounded-full w-fit mx-auto mb-6">
                      <Clock className="w-16 h-16 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-green-900 mb-2">No Time Slots Available</h3>
                    <p className="text-green-600 mb-4">Time slots will appear here for the selected date.</p>
                    <p className="text-sm text-green-500">Please select a different date or check back later.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reservation Form Modal */}
      {showReservationForm && (
        <ReservationForm
          propertyId={propertyId}
          reservation={selectedReservation}
          onClose={() => {
            setShowReservationForm(false);
            setSelectedReservation(null);
          }}
          onSave={(savedReservation) => {
            if (selectedReservation) {
              setReservations(reservations =>
                reservations.map(r =>
                  r.id === savedReservation.id ? savedReservation : r
                )
              );
            } else {
              setReservations(reservations => [...reservations, savedReservation]);
            }
            setShowReservationForm(false);
            setSelectedReservation(null);
          }}
        />
      )}
    </div>
  );
}