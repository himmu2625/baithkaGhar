'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  Key,
  CreditCard,
  FileText,
  Camera,
  Upload,
  QrCode,
  Bell,
  Search,
  Filter,
  Printer,
  RefreshCw,
  UserPlus,
  ClipboardList,
  Settings,
  Users,
  Home,
  Car,
  Utensils,
  Wifi,
  Shield,
  Eye
} from 'lucide-react';

interface GuestRegistration {
  id: string;
  bookingId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    dateOfBirth: string;
    idType: 'passport' | 'driving_license' | 'aadhar' | 'voter_id';
    idNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
      zipCode: string;
    };
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  checkInDate: string;
  checkOutDate: string;
  roomNumber?: string;
  status: 'pending' | 'checked_in' | 'checked_out' | 'no_show';
  preferences: string[];
  specialRequests?: string;
  documents: string[];
  checkInTime?: string;
  checkOutTime?: string;
  createdAt: string;
}

interface DailyOperations {
  date: string;
  arrivals: number;
  departures: number;
  inHouse: number;
  noShows: number;
  earlyCheckouts: number;
  lateCheckouts: number;
  roomsClean: number;
  roomsMaintenance: number;
  roomsOccupied: number;
  revenue: number;
  occupancyRate: number;
}

interface HousekeepingTask {
  id: string;
  roomNumber: string;
  taskType: 'cleaning' | 'maintenance' | 'inspection' | 'deep_clean';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  estimatedTime: number; // minutes
  notes?: string;
  checkInReady: boolean;
  createdAt: string;
  completedAt?: string;
}

interface FrontDeskOperationsProps {
  propertyId: string;
}

const statusConfig = {
  pending: { color: 'bg-yellow-500', label: 'Pending Check-in', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  checked_in: { color: 'bg-green-500', label: 'Checked In', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  checked_out: { color: 'bg-blue-500', label: 'Checked Out', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  no_show: { color: 'bg-red-500', label: 'No Show', textColor: 'text-red-700', bgColor: 'bg-red-50' }
};

const taskTypeConfig = {
  cleaning: { label: 'Room Cleaning', icon: Home, color: 'text-blue-600' },
  maintenance: { label: 'Maintenance', icon: Settings, color: 'text-orange-600' },
  inspection: { label: 'Inspection', icon: Shield, color: 'text-purple-600' },
  deep_clean: { label: 'Deep Cleaning', icon: Home, color: 'text-green-600' }
};

const priorityConfig = {
  low: { color: 'bg-gray-500', label: 'Low' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  urgent: { color: 'bg-red-500', label: 'Urgent' }
};

export default function FrontDeskOperations({ propertyId }: FrontDeskOperationsProps) {
  const [activeTab, setActiveTab] = useState('checkin');
  const [registrations, setRegistrations] = useState<GuestRegistration[]>([]);
  const [dailyOps, setDailyOps] = useState<DailyOperations | null>(null);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuest, setSelectedGuest] = useState<GuestRegistration | null>(null);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchFrontDeskData();
  }, [propertyId]);

  const fetchFrontDeskData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockRegistrations: GuestRegistration[] = [
        {
          id: 'reg_1',
          bookingId: 'book_001',
          guestDetails: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+919999999999',
            nationality: 'Indian',
            dateOfBirth: '1985-05-15',
            idType: 'aadhar',
            idNumber: '1234-5678-9012',
            address: {
              street: '123 Main Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              zipCode: '400001'
            }
          },
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '+919888888888'
          },
          checkInDate: '2025-09-21',
          checkOutDate: '2025-09-24',
          roomNumber: '101',
          status: 'pending',
          preferences: ['Non-smoking', 'High floor', 'Away from elevator'],
          specialRequests: 'Early check-in if possible',
          documents: ['aadhar_front.jpg', 'aadhar_back.jpg'],
          createdAt: '2025-09-20T18:00:00Z'
        },
        {
          id: 'reg_2',
          bookingId: 'book_002',
          guestDetails: {
            firstName: 'Sarah',
            lastName: 'Johnson',
            email: 'sarah.j@example.com',
            phone: '+919777777777',
            nationality: 'American',
            dateOfBirth: '1990-12-08',
            idType: 'passport',
            idNumber: 'US123456789',
            address: {
              street: '456 Oak Avenue',
              city: 'New York',
              state: 'NY',
              country: 'USA',
              zipCode: '10001'
            }
          },
          emergencyContact: {
            name: 'Mike Johnson',
            relationship: 'Brother',
            phone: '+1234567890'
          },
          checkInDate: '2025-09-21',
          checkOutDate: '2025-09-22',
          roomNumber: '205',
          status: 'checked_in',
          preferences: ['Ocean view', 'Late checkout'],
          checkInTime: '2025-09-21T15:30:00Z',
          documents: ['passport.jpg'],
          createdAt: '2025-09-20T12:00:00Z'
        }
      ];

      const mockDailyOps: DailyOperations = {
        date: '2025-09-21',
        arrivals: 24,
        departures: 18,
        inHouse: 67,
        noShows: 2,
        earlyCheckouts: 3,
        lateCheckouts: 5,
        roomsClean: 45,
        roomsMaintenance: 3,
        roomsOccupied: 67,
        revenue: 285000,
        occupancyRate: 78.5
      };

      const mockHousekeepingTasks: HousekeepingTask[] = [
        {
          id: 'task_1',
          roomNumber: '101',
          taskType: 'cleaning',
          status: 'pending',
          priority: 'high',
          assignedTo: 'Priya Sharma',
          estimatedTime: 45,
          notes: 'Guest checking in at 3 PM',
          checkInReady: false,
          createdAt: '2025-09-21T08:00:00Z'
        },
        {
          id: 'task_2',
          roomNumber: '205',
          taskType: 'maintenance',
          status: 'in_progress',
          priority: 'medium',
          assignedTo: 'Raj Kumar',
          estimatedTime: 90,
          notes: 'AC repair required',
          checkInReady: false,
          createdAt: '2025-09-21T07:30:00Z'
        },
        {
          id: 'task_3',
          roomNumber: '302',
          taskType: 'cleaning',
          status: 'completed',
          priority: 'medium',
          assignedTo: 'Priya Sharma',
          estimatedTime: 40,
          checkInReady: true,
          createdAt: '2025-09-21T06:00:00Z',
          completedAt: '2025-09-21T09:15:00Z'
        }
      ];

      setRegistrations(mockRegistrations);
      setDailyOps(mockDailyOps);
      setHousekeepingTasks(mockHousekeepingTasks);
    } catch (error) {
      console.error('Error fetching front desk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrationId: string) => {
    try {
      // Mock API call - replace with actual implementation
      setRegistrations(prev => prev.map(reg =>
        reg.id === registrationId
          ? {
              ...reg,
              status: 'checked_in',
              checkInTime: new Date().toISOString()
            }
          : reg
      ));

      alert('Guest checked in successfully!');
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Failed to check in guest. Please try again.');
    }
  };

  const handleCheckOut = async (registrationId: string, checkoutData?: any) => {
    try {
      // Mock API call - replace with actual implementation
      setRegistrations(prev => prev.map(reg =>
        reg.id === registrationId
          ? {
              ...reg,
              status: 'checked_out',
              checkOutTime: new Date().toISOString()
            }
          : reg
      ));

      alert('Guest checked out successfully!');
      setShowCheckoutDialog(false);
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Failed to check out guest. Please try again.');
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      setHousekeepingTasks(prev => prev.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: status as HousekeepingTask['status'],
              completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              checkInReady: status === 'completed'
            }
          : task
      ));
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = reg.guestDetails.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.guestDetails.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.guestDetails.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.bookingId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading front desk operations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Daily Operations Summary */}
      {dailyOps && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Arrivals</p>
                  <p className="text-2xl font-bold text-blue-900">{dailyOps.arrivals}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Departures</p>
                  <p className="text-2xl font-bold text-purple-900">{dailyOps.departures}</p>
                </div>
                <UserX className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">In-House</p>
                  <p className="text-2xl font-bold text-green-900">{dailyOps.inHouse}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">No Shows</p>
                  <p className="text-2xl font-bold text-red-900">{dailyOps.noShows}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Occupancy</p>
                  <p className="text-2xl font-bold text-yellow-900">{dailyOps.occupancyRate}%</p>
                </div>
                <Building className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700">Revenue</p>
                  <p className="text-lg font-bold text-emerald-900">{formatCurrency(dailyOps.revenue)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger value="checkin" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Check-in
          </TabsTrigger>
          <TabsTrigger value="checkout" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Check-out
          </TabsTrigger>
          <TabsTrigger value="housekeeping" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Housekeeping
          </TabsTrigger>
          <TabsTrigger value="registration" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Registration
          </TabsTrigger>
        </TabsList>

        {/* Check-in Tab */}
        <TabsContent value="checkin" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search-guests">Search Guests</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search-guests"
                      placeholder="Search by name, email, room number, or booking ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.entries(statusConfig).map(([status, config]) => (
                        <SelectItem key={status} value={status}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest List */}
          <div className="grid gap-4">
            {filteredRegistrations.map((registration) => {
              const config = statusConfig[registration.status];

              return (
                <Card key={registration.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${config.bgColor}`}>
                          <User className={`h-6 w-6 ${config.textColor}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">
                            {registration.guestDetails.firstName} {registration.guestDetails.lastName}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {registration.guestDetails.email}
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {registration.guestDetails.phone}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                Room {registration.roomNumber}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(registration.checkInDate)} - {formatDate(registration.checkOutDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <Badge className={`${config.color} text-white`}>
                          {config.label}
                        </Badge>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedGuest(registration);
                              setShowRegistrationDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {registration.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleCheckIn(registration.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Check In
                            </Button>
                          )}
                          {registration.status === 'checked_in' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedGuest(registration);
                                setShowCheckoutDialog(true);
                              }}
                            >
                              <UserX className="h-4 w-4 mr-1" />
                              Check Out
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {registration.specialRequests && (
                      <Alert className="mt-4">
                        <Bell className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Special Requests:</strong> {registration.specialRequests}
                        </AlertDescription>
                      </Alert>
                    )}

                    {registration.preferences.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Guest Preferences:</p>
                        <div className="flex flex-wrap gap-2">
                          {registration.preferences.map((pref, index) => (
                            <Badge key={index} variant="secondary">{pref}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Check-out Tab */}
        <TabsContent value="checkout" className="space-y-6">
          <div className="grid gap-4">
            {registrations.filter(reg => reg.status === 'checked_in').map((registration) => (
              <Card key={registration.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-lg bg-green-50">
                        <User className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {registration.guestDetails.firstName} {registration.guestDetails.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Room {registration.roomNumber} | Check-out: {formatDate(registration.checkOutDate)}
                        </p>
                        {registration.checkInTime && (
                          <p className="text-xs text-gray-500">
                            Checked in: {formatDate(registration.checkInTime)} at {formatTime(registration.checkInTime)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedGuest(registration);
                          setShowRegistrationDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGuest(registration);
                          setShowCheckoutDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Check Out
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Housekeeping Tab */}
        <TabsContent value="housekeeping" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Housekeeping Tasks</h3>
              <p className="text-gray-600">Manage room cleaning and maintenance tasks</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <ClipboardList className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          <div className="grid gap-4">
            {housekeepingTasks.map((task) => {
              const typeConfig = taskTypeConfig[task.taskType];
              const priorityConf = priorityConfig[task.priority];
              const TypeIcon = typeConfig.icon;

              return (
                <Card key={task.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">Room {task.roomNumber}</h4>
                          <p className="text-sm text-gray-600">{typeConfig.label}</p>
                          {task.assignedTo && (
                            <p className="text-sm text-gray-600">Assigned to: {task.assignedTo}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${priorityConf.color} text-white text-xs`}>
                              {priorityConf.label} Priority
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {task.estimatedTime} min
                            </Badge>
                            {task.checkInReady && (
                              <Badge variant="default" className="bg-green-600 text-xs">
                                Check-in Ready
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div>
                          <Select
                            value={task.status}
                            onValueChange={(status) => updateTaskStatus(task.id, status)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="skipped">Skipped</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <p className="text-xs text-gray-500">
                          Created: {formatTime(task.createdAt)}
                        </p>
                        {task.completedAt && (
                          <p className="text-xs text-green-600">
                            Completed: {formatTime(task.completedAt)}
                          </p>
                        )}
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Notes:</strong> {task.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Guest Registration</h3>
              <p className="text-gray-600">Manage guest registrations and documentation</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="h-4 w-4 mr-2" />
              New Registration
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Digital Registration Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input id="first-name" placeholder="Enter first name" />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input id="last-name" placeholder="Enter last name" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter email address" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" placeholder="Enter phone number" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="id-type">ID Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="driving_license">Driving License</SelectItem>
                        <SelectItem value="aadhar">Aadhar Card</SelectItem>
                        <SelectItem value="voter_id">Voter ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="id-number">ID Number</Label>
                    <Input id="id-number" placeholder="Enter ID number" />
                  </div>
                  <div>
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input id="nationality" placeholder="Enter nationality" />
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input id="dob" type="date" />
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Label>Upload Documents</Label>
                <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop ID documents
                  </p>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Button className="bg-green-600 hover:bg-green-700">
                  Save Registration
                </Button>
                <Button variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
                <Button variant="outline">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Guest Details Dialog */}
      <Dialog open={showRegistrationDialog} onOpenChange={setShowRegistrationDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Guest Registration Details</DialogTitle>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Guest Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Name:</strong> {selectedGuest.guestDetails.firstName} {selectedGuest.guestDetails.lastName}</div>
                    <div><strong>Email:</strong> {selectedGuest.guestDetails.email}</div>
                    <div><strong>Phone:</strong> {selectedGuest.guestDetails.phone}</div>
                    <div><strong>Nationality:</strong> {selectedGuest.guestDetails.nationality}</div>
                    <div><strong>Date of Birth:</strong> {formatDate(selectedGuest.guestDetails.dateOfBirth)}</div>
                    <div><strong>ID Type:</strong> {selectedGuest.guestDetails.idType.replace('_', ' ')}</div>
                    <div><strong>ID Number:</strong> {selectedGuest.guestDetails.idNumber}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Booking Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><strong>Booking ID:</strong> {selectedGuest.bookingId}</div>
                    <div><strong>Room Number:</strong> {selectedGuest.roomNumber}</div>
                    <div><strong>Check-in:</strong> {formatDate(selectedGuest.checkInDate)}</div>
                    <div><strong>Check-out:</strong> {formatDate(selectedGuest.checkOutDate)}</div>
                    <div><strong>Status:</strong> {statusConfig[selectedGuest.status].label}</div>
                    {selectedGuest.checkInTime && (
                      <div><strong>Checked in at:</strong> {formatDate(selectedGuest.checkInTime)} {formatTime(selectedGuest.checkInTime)}</div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Address</h4>
                <div className="text-sm">
                  {selectedGuest.guestDetails.address.street}, {selectedGuest.guestDetails.address.city}, {selectedGuest.guestDetails.address.state}, {selectedGuest.guestDetails.address.country} - {selectedGuest.guestDetails.address.zipCode}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Emergency Contact</h4>
                <div className="text-sm">
                  <strong>{selectedGuest.emergencyContact.name}</strong> ({selectedGuest.emergencyContact.relationship})<br />
                  Phone: {selectedGuest.emergencyContact.phone}
                </div>
              </div>

              {selectedGuest.preferences.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGuest.preferences.map((pref, index) => (
                      <Badge key={index} variant="secondary">{pref}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedGuest.specialRequests && (
                <div>
                  <h4 className="font-semibold mb-3">Special Requests</h4>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedGuest.specialRequests}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-3">Documents</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGuest.documents.map((doc, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer">
                      <FileText className="h-3 w-3 mr-1" />
                      {doc}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Guest Check-out</DialogTitle>
          </DialogHeader>

          {selectedGuest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Guest Name</Label>
                  <div className="font-medium">
                    {selectedGuest.guestDetails.firstName} {selectedGuest.guestDetails.lastName}
                  </div>
                </div>
                <div>
                  <Label>Room Number</Label>
                  <div className="font-medium">{selectedGuest.roomNumber}</div>
                </div>
              </div>

              <div>
                <Label htmlFor="checkout-notes">Check-out Notes</Label>
                <Textarea
                  id="checkout-notes"
                  placeholder="Any notes about the check-out (room condition, lost items, etc.)"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch id="room-key" />
                  <Label htmlFor="room-key">Room key returned</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="minibar" />
                  <Label htmlFor="minibar">Minibar checked</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="damage" />
                  <Label htmlFor="damage">No room damage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="satisfaction" />
                  <Label htmlFor="satisfaction">Guest satisfaction survey completed</Label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => selectedGuest && handleCheckOut(selectedGuest.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Complete Check-out
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCheckoutDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}