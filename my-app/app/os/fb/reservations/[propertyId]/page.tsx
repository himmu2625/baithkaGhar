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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to F&B Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservation Management</h1>
            <p className="text-gray-600 mt-2">Manage dining reservations and table bookings</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowReservationForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Reservation
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Reservations</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationStats.todayReservations}</div>
            <p className="text-xs text-muted-foreground">
              {reservationStats.confirmedReservations} confirmed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationStats.upcomingReservations}</div>
            <p className="text-xs text-muted-foreground">
              {reservationStats.pendingReservations} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No-Show Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationStats.noShowRate}%</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Party Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservationStats.averagePartySize}</div>
            <p className="text-xs text-muted-foreground">
              Peak: {reservationStats.peakBookingHour}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{reservationStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From reservations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="list">Reservations List</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
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
        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search reservations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="seated">Seated</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="no_show">No Show</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-vip"
                      checked={showVipOnly}
                      onCheckedChange={setShowVipOnly}
                    />
                    <label htmlFor="show-vip" className="text-sm">VIP Only</label>
                  </div>
                </div>
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

        {/* Timeline View Tab */}
        <TabsContent value="timeline" className="space-y-6">
          {/* Time Slot Grid */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Daily Timeline</CardTitle>
                  <CardDescription>
                    Reservations for {selectedDate.toLocaleDateString()}
                  </CardDescription>
                </div>
                <Input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="w-48"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-medium">{slot.time}</div>
                      <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                        {slot.availableTables} / {Math.ceil(slot.totalCapacity / 4)} tables
                      </Badge>
                      <Badge variant="outline">
                        {slot.totalCapacity - (slot.reservations.reduce((sum, r) => sum + r.partySize, 0))} seats
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      {slot.reservations.map((reservation) => (
                        <div key={reservation.id} className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">{reservation.customerName}</span>
                          <Badge variant="outline">{reservation.partySize}p</Badge>
                          {reservation.isVip && <Star className="w-3 h-3 text-yellow-500" />}
                        </div>
                      ))}
                      {slot.reservations.length === 0 && (
                        <span className="text-gray-500 text-sm">No reservations</span>
                      )}
                    </div>
                  </div>
                ))}
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