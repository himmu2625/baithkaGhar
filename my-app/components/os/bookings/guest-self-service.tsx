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
import { Progress } from '@/components/ui/progress';
import {
  Smartphone,
  QrCode,
  Clock,
  Calendar,
  MapPin,
  Wifi,
  Car,
  Utensils,
  Coffee,
  Dumbbell,
  Swimming,
  Concierge,
  Phone,
  MessageSquare,
  Star,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Key,
  Camera,
  FileText,
  CreditCard,
  Bell,
  Settings,
  Home,
  UserCheck,
  Edit,
  Save,
  RefreshCw,
  Send,
  ThumbsUp,
  ThumbsDown,
  Heart,
  Share2
} from 'lucide-react';

interface GuestBooking {
  id: string;
  confirmationNumber: string;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  guestName: string;
  email: string;
  phone: string;
  roomType: string;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'pending' | 'partial';
  specialRequests?: string;
  preferences: string[];
  checkInTime?: string;
  checkOutTime?: string;
  canModify: boolean;
  canCancel: boolean;
}

interface ServiceRequest {
  id: string;
  type: 'housekeeping' | 'maintenance' | 'concierge' | 'food_service' | 'transport' | 'other';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  requestedAt: string;
  completedAt?: string;
  assignedTo?: string;
  notes?: string;
}

interface HotelService {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'amenities' | 'dining' | 'wellness' | 'business' | 'transport';
  available: boolean;
  hours?: string;
  contact?: string;
  location?: string;
  price?: number;
}

interface GuestSelfServiceProps {
  bookingId?: string;
  guestEmail?: string;
}

const serviceTypes = {
  housekeeping: { label: 'Housekeeping', icon: Home, color: 'text-blue-600' },
  maintenance: { label: 'Maintenance', icon: Settings, color: 'text-orange-600' },
  concierge: { label: 'Concierge', icon: Concierge, color: 'text-purple-600' },
  food_service: { label: 'Food Service', icon: Utensils, color: 'text-green-600' },
  transport: { label: 'Transport', icon: Car, color: 'text-indigo-600' },
  other: { label: 'Other', icon: MessageSquare, color: 'text-gray-600' }
};

const priorityConfig = {
  low: { color: 'bg-gray-500', label: 'Low' },
  medium: { color: 'bg-yellow-500', label: 'Medium' },
  high: { color: 'bg-orange-500', label: 'High' },
  urgent: { color: 'bg-red-500', label: 'Urgent' }
};

const statusConfig = {
  pending: { color: 'bg-yellow-500', label: 'Pending', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  in_progress: { color: 'bg-blue-500', label: 'In Progress', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  completed: { color: 'bg-green-500', label: 'Completed', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  cancelled: { color: 'bg-red-500', label: 'Cancelled', textColor: 'text-red-700', bgColor: 'bg-red-50' }
};

export default function GuestSelfService({ bookingId, guestEmail }: GuestSelfServiceProps) {
  const [activeTab, setActiveTab] = useState('booking');
  const [booking, setBooking] = useState<GuestBooking | null>(null);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [hotelServices, setHotelServices] = useState<HotelService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [checkInProgress, setCheckInProgress] = useState(false);
  const [checkOutProgress, setCheckOutProgress] = useState(false);
  const [newServiceRequest, setNewServiceRequest] = useState({
    type: 'housekeeping',
    title: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchGuestData();
  }, [bookingId, guestEmail]);

  const fetchGuestData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockBooking: GuestBooking = {
        id: 'book_001',
        confirmationNumber: 'BG2025001',
        status: 'confirmed',
        guestName: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+919999999999',
        roomType: 'Deluxe Suite',
        roomNumber: '205',
        checkInDate: '2025-09-21',
        checkOutDate: '2025-09-24',
        adults: 2,
        children: 1,
        totalAmount: 18500,
        paymentStatus: 'paid',
        specialRequests: 'Late check-out if possible',
        preferences: ['Non-smoking', 'High floor', 'Ocean view'],
        canModify: true,
        canCancel: true
      };

      const mockServiceRequests: ServiceRequest[] = [
        {
          id: 'req_1',
          type: 'housekeeping',
          title: 'Extra Towels',
          description: 'Need 2 extra towels for the bathroom',
          priority: 'low',
          status: 'completed',
          requestedAt: '2025-09-21T14:30:00Z',
          completedAt: '2025-09-21T15:15:00Z',
          assignedTo: 'Priya Sharma'
        },
        {
          id: 'req_2',
          type: 'concierge',
          title: 'Restaurant Reservation',
          description: 'Book table for 3 at seaside restaurant for tomorrow 7 PM',
          priority: 'medium',
          status: 'in_progress',
          requestedAt: '2025-09-21T16:00:00Z',
          assignedTo: 'Raj Kumar'
        }
      ];

      const mockHotelServices: HotelService[] = [
        {
          id: 'svc_1',
          name: 'Swimming Pool',
          description: 'Outdoor infinity pool with ocean view',
          icon: Swimming,
          category: 'wellness',
          available: true,
          hours: '6:00 AM - 10:00 PM',
          location: 'Terrace Level'
        },
        {
          id: 'svc_2',
          name: 'Fitness Center',
          description: '24/7 modern fitness facility',
          icon: Dumbbell,
          category: 'wellness',
          available: true,
          hours: '24 Hours',
          location: 'Ground Floor'
        },
        {
          id: 'svc_3',
          name: 'Ocean View Restaurant',
          description: 'Fine dining with panoramic ocean views',
          icon: Utensils,
          category: 'dining',
          available: true,
          hours: '7:00 AM - 11:00 PM',
          contact: 'Ext. 2201',
          location: 'Lobby Level'
        },
        {
          id: 'svc_4',
          name: 'Business Center',
          description: 'Printing, copying, and meeting facilities',
          icon: FileText,
          category: 'business',
          available: true,
          hours: '24 Hours',
          location: 'Mezzanine Floor'
        },
        {
          id: 'svc_5',
          name: 'Airport Shuttle',
          description: 'Complimentary shuttle service to airport',
          icon: Car,
          category: 'transport',
          available: true,
          hours: '5:00 AM - 11:00 PM',
          contact: 'Ext. 2400',
          price: 0
        },
        {
          id: 'svc_6',
          name: 'Room Service',
          description: '24/7 in-room dining service',
          icon: Coffee,
          category: 'dining',
          available: true,
          hours: '24 Hours',
          contact: 'Ext. 2300'
        }
      ];

      setBooking(mockBooking);
      setServiceRequests(mockServiceRequests);
      setHotelServices(mockHotelServices);
    } catch (error) {
      console.error('Error fetching guest data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfCheckIn = async () => {
    try {
      setCheckInProgress(true);

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (booking) {
        setBooking({
          ...booking,
          status: 'checked_in',
          checkInTime: new Date().toISOString()
        });
      }

      alert('Check-in completed successfully! Welcome to Baithaka GHAR!');
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Check-in failed. Please contact front desk for assistance.');
    } finally {
      setCheckInProgress(false);
    }
  };

  const handleSelfCheckOut = async () => {
    try {
      setCheckOutProgress(true);

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (booking) {
        setBooking({
          ...booking,
          status: 'checked_out',
          checkOutTime: new Date().toISOString()
        });
      }

      alert('Check-out completed successfully! Thank you for staying with us!');
    } catch (error) {
      console.error('Check-out error:', error);
      alert('Check-out failed. Please contact front desk for assistance.');
    } finally {
      setCheckOutProgress(false);
    }
  };

  const handleServiceRequest = async () => {
    try {
      const request: ServiceRequest = {
        id: `req_${Date.now()}`,
        type: newServiceRequest.type as ServiceRequest['type'],
        title: newServiceRequest.title,
        description: newServiceRequest.description,
        priority: newServiceRequest.priority as ServiceRequest['priority'],
        status: 'pending',
        requestedAt: new Date().toISOString()
      };

      setServiceRequests(prev => [request, ...prev]);
      setShowServiceDialog(false);
      setNewServiceRequest({
        type: 'housekeeping',
        title: '',
        description: '',
        priority: 'medium'
      });

      alert('Service request submitted successfully!');
    } catch (error) {
      console.error('Service request error:', error);
      alert('Failed to submit service request. Please try again.');
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading your booking details...</span>
      </div>
    );
  }

  if (!booking) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Booking not found. Please check your confirmation number and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                Welcome, {booking.guestName}!
              </h1>
              <p className="text-green-100 text-lg">
                Confirmation: {booking.confirmationNumber}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {booking.roomType}
                </Badge>
                {booking.roomNumber && (
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Room {booking.roomNumber}
                  </Badge>
                )}
                <Badge
                  variant="secondary"
                  className={`${
                    booking.status === 'confirmed' ? 'bg-yellow-500' :
                    booking.status === 'checked_in' ? 'bg-green-500' :
                    booking.status === 'checked_out' ? 'bg-blue-500' : 'bg-red-500'
                  } text-white border-none`}
                >
                  {booking.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="mt-6 lg:mt-0">
              <div className="text-right">
                <div className="text-3xl font-bold mb-2">
                  {formatCurrency(booking.totalAmount)}
                </div>
                <div className="text-green-100">
                  {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
            <TabsTrigger value="booking" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              My Booking
            </TabsTrigger>
            <TabsTrigger value="checkin" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Check-in/Out
            </TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Services
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              My Requests
            </TabsTrigger>
            <TabsTrigger value="feedback" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Feedback
            </TabsTrigger>
          </TabsList>

          {/* Booking Details Tab */}
          <TabsContent value="booking" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Booking Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Check-in</Label>
                      <div className="font-medium">{formatDate(booking.checkInDate)}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Check-out</Label>
                      <div className="font-medium">{formatDate(booking.checkOutDate)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Guests</Label>
                      <div className="font-medium">{booking.adults} Adults, {booking.children} Children</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Room Type</Label>
                      <div className="font-medium">{booking.roomType}</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Total Amount</Label>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(booking.totalAmount)}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      Payment {booking.paymentStatus}
                    </Badge>
                  </div>

                  {booking.specialRequests && (
                    <div>
                      <Label className="text-sm text-gray-600">Special Requests</Label>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {booking.specialRequests}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {booking.canModify && (
                      <Button
                        variant="outline"
                        onClick={() => setShowModifyDialog(true)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Modify Booking
                      </Button>
                    )}
                    {booking.canCancel && (
                      <Button variant="outline" className="flex-1">
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Guest Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm text-gray-600">Name</Label>
                    <div className="font-medium">{booking.guestName}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Email</Label>
                    <div className="font-medium">{booking.email}</div>
                  </div>

                  <div>
                    <Label className="text-sm text-gray-600">Phone</Label>
                    <div className="font-medium">{booking.phone}</div>
                  </div>

                  {booking.preferences.length > 0 && (
                    <div>
                      <Label className="text-sm text-gray-600">Preferences</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {booking.preferences.map((pref, index) => (
                          <Badge key={index} variant="secondary">{pref}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <QrCode className="h-4 w-4 mr-2" />
                      Show QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Check-in/Check-out Tab */}
          <TabsContent value="checkin" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Self Check-in
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.status === 'confirmed' ? (
                    <>
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Your room is ready for check-in! Complete the process below.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div>
                          <Label>Upload ID Document</Label>
                          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                            <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-600 mb-2">
                              Take a photo of your ID or upload document
                            </p>
                            <Button variant="outline" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Document
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="terms" />
                            <Label htmlFor="terms" className="text-sm">
                              I agree to the hotel terms and conditions
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="damage" />
                            <Label htmlFor="damage" className="text-sm">
                              I acknowledge responsibility for room damages
                            </Label>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={handleSelfCheckIn}
                          disabled={checkInProgress}
                        >
                          {checkInProgress ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing Check-in...
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Complete Check-in
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : booking.status === 'checked_in' ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        You are already checked in to room {booking.roomNumber}.
                        Check-in time: {booking.checkInTime && formatTime(booking.checkInTime)}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Check-in is not available for this booking status.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Self Check-out
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.status === 'checked_in' ? (
                    <>
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Complete your check-out process below.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div>
                          <Label>Room Condition</Label>
                          <Textarea
                            placeholder="Any feedback about room condition or missing items..."
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="checkout-key" />
                            <Label htmlFor="checkout-key" className="text-sm">
                              Room key left in room
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="checkout-minibar" />
                            <Label htmlFor="checkout-minibar" className="text-sm">
                              Minibar items consumed reported
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="checkout-belongings" />
                            <Label htmlFor="checkout-belongings" className="text-sm">
                              All personal belongings collected
                            </Label>
                          </div>
                        </div>

                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={handleSelfCheckOut}
                          disabled={checkOutProgress}
                        >
                          {checkOutProgress ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Processing Check-out...
                            </>
                          ) : (
                            <>
                              <Key className="h-4 w-4 mr-2" />
                              Complete Check-out
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : booking.status === 'checked_out' ? (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        You have successfully checked out.
                        Check-out time: {booking.checkOutTime && formatTime(booking.checkOutTime)}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Check-out is only available after check-in.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Hotel Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Hotel Services & Amenities</h3>
                <p className="text-gray-600">Explore our facilities and services</p>
              </div>
              <Button
                onClick={() => setShowServiceDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Request Service
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelServices.map((service) => {
                const Icon = service.icon;

                return (
                  <Card key={service.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Icon className="h-6 w-6 text-green-600" />
                        </div>
                        <Badge variant={service.available ? "default" : "secondary"}>
                          {service.available ? "Available" : "Closed"}
                        </Badge>
                      </div>

                      <h4 className="font-semibold text-lg mb-2">{service.name}</h4>
                      <p className="text-sm text-gray-600 mb-4">{service.description}</p>

                      <div className="space-y-2 text-sm">
                        {service.hours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span>{service.hours}</span>
                          </div>
                        )}
                        {service.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{service.location}</span>
                          </div>
                        )}
                        {service.contact && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{service.contact}</span>
                          </div>
                        )}
                        {service.price !== undefined && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-3 w-3 text-gray-400" />
                            <span>{service.price === 0 ? 'Complimentary' : formatCurrency(service.price)}</span>
                          </div>
                        )}
                      </div>

                      {service.available && (
                        <Button variant="outline" className="w-full mt-4">
                          {service.contact ? 'Contact' : 'Learn More'}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Service Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">My Service Requests</h3>
                <p className="text-gray-600">Track your service requests and their status</p>
              </div>
              <Button
                onClick={() => setShowServiceDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>

            <div className="space-y-4">
              {serviceRequests.map((request) => {
                const typeConfig = serviceTypes[request.type];
                const statusConf = statusConfig[request.status];
                const priorityConf = priorityConfig[request.priority];
                const TypeIcon = typeConfig.icon;

                return (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-lg ${statusConf.bgColor}`}>
                            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-lg">{request.title}</h4>
                            <p className="text-sm text-gray-600">{request.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{typeConfig.label}</Badge>
                              <Badge className={`${priorityConf.color} text-white`}>
                                {priorityConf.label} Priority
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <Badge className={`${statusConf.color} text-white mb-2`}>
                            {statusConf.label}
                          </Badge>
                          <p className="text-xs text-gray-500">
                            Requested: {formatTime(request.requestedAt)}
                          </p>
                          {request.completedAt && (
                            <p className="text-xs text-green-600">
                              Completed: {formatTime(request.completedAt)}
                            </p>
                          )}
                          {request.assignedTo && (
                            <p className="text-xs text-gray-500">
                              Assigned to: {request.assignedTo}
                            </p>
                          )}
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-700">
                            <strong>Staff Notes:</strong> {request.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {serviceRequests.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <MessageSquare className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Service Requests</h3>
                    <p className="text-gray-500 mb-4">You haven't made any service requests yet.</p>
                    <Button
                      onClick={() => setShowServiceDialog(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Make a Request
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Share Your Experience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-lg font-medium">Overall Rating</Label>
                  <div className="flex items-center gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-8 w-8 cursor-pointer text-gray-300 hover:text-yellow-500 transition-colors"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Room Quality</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 cursor-pointer text-gray-300 hover:text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Service Quality</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 cursor-pointer text-gray-300 hover:text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Cleanliness</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 cursor-pointer text-gray-300 hover:text-yellow-500" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Value for Money</Label>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-5 w-5 cursor-pointer text-gray-300 hover:text-yellow-500" />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="feedback-comments">Comments</Label>
                  <Textarea
                    id="feedback-comments"
                    placeholder="Share your experience, suggestions, or any comments..."
                    rows={5}
                    className="mt-1"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch id="recommend" />
                    <Label htmlFor="recommend">I would recommend this hotel to others</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="return" />
                    <Label htmlFor="return">I would stay here again</Label>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share on Social Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Service Request Dialog */}
        <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Hotel Service</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service-type">Service Type</Label>
                  <Select
                    value={newServiceRequest.type}
                    onValueChange={(value) => setNewServiceRequest(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(serviceTypes).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          <div className="flex items-center gap-2">
                            <config.icon className="h-4 w-4" />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="service-priority">Priority</Label>
                  <Select
                    value={newServiceRequest.priority}
                    onValueChange={(value) => setNewServiceRequest(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([priority, config]) => (
                        <SelectItem key={priority} value={priority}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="service-title">Request Title</Label>
                <Input
                  id="service-title"
                  placeholder="Brief description of your request"
                  value={newServiceRequest.title}
                  onChange={(e) => setNewServiceRequest(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="service-description">Detailed Description</Label>
                <Textarea
                  id="service-description"
                  placeholder="Provide detailed information about what you need..."
                  rows={4}
                  value={newServiceRequest.description}
                  onChange={(e) => setNewServiceRequest(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleServiceRequest}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!newServiceRequest.title || !newServiceRequest.description}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Request
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowServiceDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}