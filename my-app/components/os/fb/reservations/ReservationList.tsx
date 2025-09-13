'use client';

import { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit, 
  Trash2,
  Bell,
  Gift,
  DollarSign,
  MapPin,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface ReservationListProps {
  reservations: Reservation[];
  onReservationSelect: (reservation: Reservation) => void;
  onStatusUpdate: (reservationId: string, status: string) => void;
  onSendReminder: (reservationId: string) => void;
}

export function ReservationList({
  reservations,
  onReservationSelect,
  onStatusUpdate,
  onSendReminder,
}: ReservationListProps) {
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  const getTimeUntilReservation = (reservationDate: string, reservationTime: string) => {
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
    const now = new Date();
    const diffMs = reservationDateTime.getTime() - now.getTime();
    
    if (diffMs < 0) {
      return 'Past due';
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    
    return `${diffMinutes}m`;
  };

  const isUpcoming = (reservationDate: string, reservationTime: string) => {
    const reservationDateTime = new Date(`${reservationDate}T${reservationTime}`);
    const now = new Date();
    const diffMs = reservationDateTime.getTime() - now.getTime();
    
    return diffMs > 0 && diffMs <= 2 * 60 * 60 * 1000; // Within 2 hours
  };

  const handleDeleteReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (selectedReservation) {
      onStatusUpdate(selectedReservation.id, 'cancelled');
      setShowDeleteDialog(false);
      setSelectedReservation(null);
    }
  };

  return (
    <div className="space-y-6">
      {reservations.map((reservation) => {
        const timeUntil = getTimeUntilReservation(reservation.reservationDate, reservation.reservationTime);
        const isReservationUpcoming = isUpcoming(reservation.reservationDate, reservation.reservationTime);

        return (
          <Card 
            key={reservation.id} 
            className={`group relative cursor-pointer border-0 shadow-2xl overflow-hidden transition-all duration-500 transform hover:scale-[1.02] hover:shadow-3xl ${
              isReservationUpcoming 
                ? 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 shadow-blue-200/50' 
                : reservation.isVip 
                ? 'bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/50 shadow-yellow-200/50'
                : 'bg-gradient-to-br from-white via-gray-50/20 to-slate-50/30'
            }`}
            onClick={() => {
              setSelectedReservation(reservation);
              setShowDetailsDialog(true);
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            {reservation.isVip && (
              <div className="absolute -top-3 -right-3 z-10">
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-2xl animate-pulse font-bold px-3 py-2">
                  <Star className="w-4 h-4 mr-2 fill-current" />
                  VIP GUEST
                </Badge>
              </div>
            )}

            {isReservationUpcoming && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0 shadow-xl animate-pulse font-bold px-3 py-2">
                  <Bell className="w-4 h-4 mr-2" />
                  ARRIVING SOON
                </Badge>
              </div>
            )}

            <CardHeader className={`relative pb-4 ${
              isReservationUpcoming 
                ? 'bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-purple-100/80 border-b border-blue-200/50' 
                : reservation.isVip 
                ? 'bg-gradient-to-r from-yellow-100/80 via-orange-100/80 to-red-100/80 border-b border-yellow-200/50'
                : 'bg-gradient-to-r from-gray-100/80 via-slate-100/80 to-zinc-100/80 border-b border-gray-200/50'
            } backdrop-blur-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1 relative">
                  <CardTitle className="text-xl flex items-center space-x-4 text-gray-900">
                    <div className={`p-3 rounded-xl shadow-lg ${
                      isReservationUpcoming 
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20' 
                        : reservation.isVip 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20'
                        : 'bg-gradient-to-r from-gray-500/20 to-slate-500/20'
                    }`}>
                      <User className={`w-6 h-6 ${
                        isReservationUpcoming ? 'text-blue-600' : reservation.isVip ? 'text-yellow-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <span className="font-bold">{reservation.customerName}</span>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={`border-0 shadow-sm font-bold text-sm ${
                          reservation.status === 'confirmed' 
                            ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' 
                            : reservation.status === 'pending' 
                            ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800'
                            : reservation.status === 'seated' 
                            ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800'
                            : reservation.status === 'completed' 
                            ? 'bg-gradient-to-r from-purple-200 to-pink-200 text-purple-800'
                            : 'bg-gradient-to-r from-gray-200 to-slate-200 text-gray-800'
                        }`}>
                          {getStatusIcon(reservation.status)}
                          <span className="ml-2 uppercase font-bold">{reservation.status}</span>
                        </Badge>
                        <Badge className="bg-gradient-to-r from-indigo-200 to-purple-200 text-indigo-800 border-0 shadow-sm">
                          {timeUntil}
                        </Badge>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-xl shadow-sm backdrop-blur-sm">
                        <div className="p-2 bg-gradient-to-r from-green-100/80 to-emerald-100/80 rounded-lg">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{reservation.customerPhone}</div>
                          <div className="text-xs text-green-600">Phone</div>
                        </div>
                      </div>
                      {reservation.customerEmail && (
                        <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-xl shadow-sm backdrop-blur-sm">
                          <div className="p-2 bg-gradient-to-r from-blue-100/80 to-indigo-100/80 rounded-lg">
                            <Mail className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900 truncate">{reservation.customerEmail}</div>
                            <div className="text-xs text-blue-600">Email</div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3 bg-white/70 p-3 rounded-xl shadow-sm backdrop-blur-sm">
                        <div className="p-2 bg-gradient-to-r from-purple-100/80 to-pink-100/80 rounded-lg">
                          {getSourceIcon(reservation.source)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 capitalize">{reservation.source.replace('_', ' ')}</div>
                          <div className="text-xs text-purple-600">Booking Source</div>
                        </div>
                      </div>
                    </div>
                  </CardDescription>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="bg-white/70 hover:bg-white border-gray-200/70 shadow-md backdrop-blur-sm"
                    >
                      <Edit className="w-4 h-4 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReservationSelect(reservation)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Reservation
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onSendReminder(reservation.id)}
                      disabled={reservation.status === 'completed' || reservation.status === 'cancelled'}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Send Reminder
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {reservation.status === 'pending' && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(reservation.id, 'confirmed')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm
                      </DropdownMenuItem>
                    )}
                    {reservation.status === 'confirmed' && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(reservation.id, 'seated')}>
                        <Users className="w-4 h-4 mr-2" />
                        Mark Seated
                      </DropdownMenuItem>
                    )}
                    {reservation.status === 'seated' && (
                      <DropdownMenuItem onClick={() => onStatusUpdate(reservation.id, 'completed')}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Completed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDeleteReservation(reservation)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancel Reservation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Reservation Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {new Date(reservation.reservationDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">Date</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{reservation.reservationTime}</div>
                      <div className="text-xs text-gray-500">{timeUntil}</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">{reservation.partySize} people</div>
                      <div className="text-xs text-gray-500">{reservation.duration}min duration</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {reservation.tableName || 'No table assigned'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {reservation.section || 'Any section'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Special Information */}
                <div className="flex flex-wrap gap-2">
                  {reservation.occasion && (
                    <Badge variant="outline" className="text-purple-600 border-purple-300">
                      <Gift className="w-3 h-3 mr-1" />
                      {reservation.occasion}
                    </Badge>
                  )}
                  
                  {reservation.depositRequired && (
                    <Badge variant="outline" className={`${
                      reservation.depositPaid 
                        ? 'text-green-600 border-green-300' 
                        : 'text-orange-600 border-orange-300'
                    }`}>
                      <DollarSign className="w-3 h-3 mr-1" />
                      Deposit: ₹{reservation.depositAmount} {reservation.depositPaid ? '(Paid)' : '(Pending)'}
                    </Badge>
                  )}
                  
                  {reservation.remindersSent > 0 && (
                    <Badge variant="outline" className="text-blue-600 border-blue-300">
                      <Bell className="w-3 h-3 mr-1" />
                      {reservation.remindersSent} reminder{reservation.remindersSent > 1 ? 's' : ''} sent
                    </Badge>
                  )}
                </div>

                {/* Special Requests */}
                {reservation.specialRequests && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800 mb-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Special Requests</span>
                    </div>
                    <p className="text-sm text-yellow-700">{reservation.specialRequests}</p>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {reservation.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(reservation.id, 'confirmed');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Confirm
                    </Button>
                  )}
                  
                  {reservation.status === 'confirmed' && isReservationUpcoming && (
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(reservation.id, 'seated');
                      }}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Seat Now
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      // In a real app, this would open phone/SMS app
                      window.open(`tel:${reservation.customerPhone}`, '_self');
                    }}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  
                  {reservation.remindersSent < 3 && ['pending', 'confirmed'].includes(reservation.status) && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSendReminder(reservation.id);
                      }}
                    >
                      <Bell className="w-4 h-4 mr-1" />
                      Remind
                    </Button>
                  )}
                </div>

                {/* Timestamps */}
                <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
                  <span>
                    Created: {new Date(reservation.createdAt).toLocaleDateString()} {new Date(reservation.createdAt).toLocaleTimeString()}
                  </span>
                  {reservation.confirmedAt && (
                    <span>
                      Confirmed: {new Date(reservation.confirmedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {reservations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reservations found</p>
            <p className="text-sm text-gray-400 mt-2">
              Reservations matching your filters will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Reservation Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>{selectedReservation?.customerName}</span>
              {selectedReservation?.isVip && <Star className="w-4 h-4 text-yellow-500" />}
            </DialogTitle>
            <DialogDescription>
              Reservation details and history
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-medium mb-3">Customer Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedReservation.customerName}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedReservation.customerPhone}
                  </div>
                  {selectedReservation.customerEmail && (
                    <div>
                      <span className="font-medium">Email:</span> {selectedReservation.customerEmail}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Source:</span> {selectedReservation.source.replace('_', ' ')}
                  </div>
                </div>
              </div>

              {/* Reservation Details */}
              <div>
                <h4 className="font-medium mb-3">Reservation Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {new Date(selectedReservation.reservationDate).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {selectedReservation.reservationTime}
                  </div>
                  <div>
                    <span className="font-medium">Party Size:</span> {selectedReservation.partySize} people
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {selectedReservation.duration} minutes
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge className={`ml-2 ${getStatusColor(selectedReservation.status)}`}>
                      {selectedReservation.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Table:</span> {selectedReservation.tableName || 'Not assigned'}
                  </div>
                </div>
              </div>

              {/* Special Information */}
              {(selectedReservation.occasion || selectedReservation.specialRequests) && (
                <div>
                  <h4 className="font-medium mb-3">Special Information</h4>
                  <div className="space-y-2 text-sm">
                    {selectedReservation.occasion && (
                      <div>
                        <span className="font-medium">Occasion:</span> {selectedReservation.occasion}
                      </div>
                    )}
                    {selectedReservation.specialRequests && (
                      <div>
                        <span className="font-medium">Special Requests:</span>
                        <p className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded">
                          {selectedReservation.specialRequests}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Billing Information */}
              {selectedReservation.depositRequired && (
                <div>
                  <h4 className="font-medium mb-3">Billing Information</h4>
                  <div className="text-sm">
                    <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded">
                      <span>Deposit Required:</span>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">₹{selectedReservation.depositAmount}</span>
                        <Badge className={
                          selectedReservation.depositPaid 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }>
                          {selectedReservation.depositPaid ? 'Paid' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Communication History */}
              <div>
                <h4 className="font-medium mb-3">Communication History</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Reminders Sent:</span>
                    <span>{selectedReservation.remindersSent}</span>
                  </div>
                  {selectedReservation.lastReminderTime && (
                    <div className="flex justify-between">
                      <span>Last Reminder:</span>
                      <span>{new Date(selectedReservation.lastReminderTime).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{new Date(selectedReservation.createdAt).toLocaleString()}</span>
                  </div>
                  {selectedReservation.confirmedAt && (
                    <div className="flex justify-between">
                      <span>Confirmed:</span>
                      <span>{new Date(selectedReservation.confirmedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Staff Notes */}
              {selectedReservation.notes && (
                <div>
                  <h4 className="font-medium mb-3">Staff Notes</h4>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm">
                    {selectedReservation.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              if (selectedReservation) {
                onReservationSelect(selectedReservation);
                setShowDetailsDialog(false);
              }
            }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Reservation</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the reservation for {selectedReservation?.customerName}?
            </DialogDescription>
          </DialogHeader>
          
          {selectedReservation && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="space-y-1 text-sm">
                <div><strong>Customer:</strong> {selectedReservation.customerName}</div>
                <div><strong>Date:</strong> {new Date(selectedReservation.reservationDate).toLocaleDateString()}</div>
                <div><strong>Time:</strong> {selectedReservation.reservationTime}</div>
                <div><strong>Party Size:</strong> {selectedReservation.partySize} people</div>
                {selectedReservation.depositPaid && (
                  <div className="text-red-600 font-medium">
                    Note: Customer has paid a deposit of ₹{selectedReservation.depositAmount}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Keep Reservation
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Reservation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}