'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarDays, Plus, Search, Filter, Eye, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import Link from 'next/link';

interface EventBooking {
  id: string;
  eventName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventType: string;
  venue: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
  services: string[];
  specialRequests?: string;
}

export default function EventBookings() {
  const { propertyId } = useParams();
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<EventBooking | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`/api/events/bookings?propertyId=${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchBookings();
    }
  }, [propertyId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteBooking = async (bookingId: string) => {
    if (confirm('Are you sure you want to delete this booking?')) {
      try {
        const response = await fetch(`/api/events/bookings/${bookingId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setBookings(bookings.filter(b => b.id !== bookingId));
        }
      } catch (error) {
        console.error('Failed to delete booking:', error);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
          <p className="text-gray-600">Manage all your event bookings</p>
        </div>
        <Button asChild>
          <Link href={`/os/events/bookings/${propertyId}/new`}>
            <Plus className="mr-2 h-4 w-4" />
            New Booking
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Bookings ({filteredBookings.length})</CardTitle>
          <CardDescription>All your event bookings in one place</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Details</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date & Venue</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.eventName}</p>
                        <p className="text-sm text-gray-600">{booking.eventType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.clientName}</p>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          <span>{booking.clientEmail}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          <span>{booking.clientPhone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.eventDate}</p>
                        <p className="text-sm text-gray-600">{booking.eventTime}</p>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{booking.venue}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{booking.guestCount} guests</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₹{booking.totalAmount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">
                          Paid: ₹{booking.paidAmount.toLocaleString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Event Booking Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this event booking
                              </DialogDescription>
                            </DialogHeader>
                            {selectedBooking && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold">Event Information</h4>
                                    <p><strong>Name:</strong> {selectedBooking.eventName}</p>
                                    <p><strong>Type:</strong> {selectedBooking.eventType}</p>
                                    <p><strong>Date:</strong> {selectedBooking.eventDate}</p>
                                    <p><strong>Time:</strong> {selectedBooking.eventTime}</p>
                                    <p><strong>Venue:</strong> {selectedBooking.venue}</p>
                                    <p><strong>Guests:</strong> {selectedBooking.guestCount}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">Client Information</h4>
                                    <p><strong>Name:</strong> {selectedBooking.clientName}</p>
                                    <p><strong>Email:</strong> {selectedBooking.clientEmail}</p>
                                    <p><strong>Phone:</strong> {selectedBooking.clientPhone}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold">Financial Details</h4>
                                  <p><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount.toLocaleString()}</p>
                                  <p><strong>Paid Amount:</strong> ₹{selectedBooking.paidAmount.toLocaleString()}</p>
                                  <p><strong>Balance:</strong> ₹{(selectedBooking.totalAmount - selectedBooking.paidAmount).toLocaleString()}</p>
                                </div>
                                {selectedBooking.services.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold">Services</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedBooking.services.map((service, index) => (
                                        <Badge key={index} variant="secondary">{service}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {selectedBooking.specialRequests && (
                                  <div>
                                    <h4 className="font-semibold">Special Requests</h4>
                                    <p>{selectedBooking.specialRequests}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/os/events/bookings/${propertyId}/edit/${booking.id}`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBooking(booking.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <CalendarDays className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found</p>
              <Button asChild className="mt-4">
                <Link href={`/os/events/bookings/${propertyId}/new`}>
                  Create First Booking
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}