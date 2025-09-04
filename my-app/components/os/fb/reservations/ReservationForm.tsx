'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin, 
  Star, 
  DollarSign,
  Save,
  X,
  AlertCircle,
  Gift,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface Table {
  id: string;
  name: string;
  capacity: number;
  section: string;
  isAvailable: boolean;
}

interface ReservationFormProps {
  propertyId: string;
  reservation?: Reservation | null;
  onClose: () => void;
  onSave: (reservation: Reservation) => void;
}

export function ReservationForm({ propertyId, reservation, onClose, onSave }: ReservationFormProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    partySize: 2,
    reservationDate: new Date().toISOString().split('T')[0],
    reservationTime: '19:00',
    duration: 120,
    tableId: '',
    section: '',
    specialRequests: '',
    occasion: '',
    isVip: false,
    source: 'phone' as 'phone' | 'online' | 'walk_in' | 'app',
    depositRequired: false,
    depositAmount: 0,
    notes: '',
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        customerEmail: reservation.customerEmail || '',
        partySize: reservation.partySize,
        reservationDate: reservation.reservationDate,
        reservationTime: reservation.reservationTime,
        duration: reservation.duration,
        tableId: reservation.tableId || '',
        section: reservation.section || '',
        specialRequests: reservation.specialRequests || '',
        occasion: reservation.occasion || '',
        isVip: reservation.isVip,
        source: reservation.source,
        depositRequired: reservation.depositRequired,
        depositAmount: reservation.depositAmount || 0,
        notes: reservation.notes || '',
      });
    }
  }, [reservation]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (formData.reservationDate && formData.reservationTime && formData.partySize) {
        try {
          const [tablesRes, slotsRes] = await Promise.all([
            fetch(`/api/fb/reservations/availability/tables?propertyId=${propertyId}&date=${formData.reservationDate}&time=${formData.reservationTime}&partySize=${formData.partySize}`, {
              headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
              },
            }),
            fetch(`/api/fb/reservations/availability/slots?propertyId=${propertyId}&date=${formData.reservationDate}&partySize=${formData.partySize}`, {
              headers: {
                'Authorization': `Bearer ${session?.accessToken}`,
              },
            })
          ]);

          if (tablesRes.ok && slotsRes.ok) {
            const [tablesData, slotsData] = await Promise.all([
              tablesRes.json(),
              slotsRes.json()
            ]);
            
            setAvailableTables(tablesData.tables || []);
            setAvailableSlots(slotsData.slots || []);
          }
        } catch (error) {
          console.error('Error fetching availability:', error);
          // Mock data for development
          setAvailableTables([
            { id: 'T01', name: 'Table 1', capacity: 4, section: 'Main Hall', isAvailable: true },
            { id: 'T02', name: 'Table 2', capacity: 6, section: 'Main Hall', isAvailable: true },
            { id: 'T03', name: 'Table 3', capacity: 2, section: 'Private Dining', isAvailable: true },
            { id: 'T04', name: 'Table 4', capacity: 8, section: 'Outdoor', isAvailable: true },
          ]);
          setAvailableSlots([
            '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
          ]);
        }
      }
    };

    fetchAvailability();
  }, [formData.reservationDate, formData.reservationTime, formData.partySize, propertyId, session]);

  const handleSave = async () => {
    if (!formData.customerName || !formData.customerPhone) {
      return;
    }

    try {
      setLoading(true);

      const reservationData: Reservation = {
        id: reservation?.id || Date.now().toString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        partySize: formData.partySize,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        duration: formData.duration,
        status: reservation?.status || 'pending',
        tableId: formData.tableId || undefined,
        tableName: formData.tableId ? availableTables.find(t => t.id === formData.tableId)?.name : undefined,
        section: formData.section || formData.tableId ? availableTables.find(t => t.id === formData.tableId)?.section : undefined,
        specialRequests: formData.specialRequests || undefined,
        occasion: formData.occasion || undefined,
        isVip: formData.isVip,
        source: formData.source,
        depositRequired: formData.depositRequired,
        depositAmount: formData.depositRequired ? formData.depositAmount : undefined,
        depositPaid: reservation?.depositPaid || false,
        remindersSent: reservation?.remindersSent || 0,
        lastReminderTime: reservation?.lastReminderTime,
        notes: formData.notes || undefined,
        createdAt: reservation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: reservation?.createdBy || session?.user?.id || 'staff',
        confirmedAt: reservation?.confirmedAt,
      };

      const url = reservation 
        ? `/api/fb/reservations/${reservation.id}`
        : '/api/fb/reservations';
      
      const method = reservation ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ ...reservationData, propertyId }),
      });

      if (response.ok) {
        const result = await response.json();
        onSave(result.reservation || reservationData);
      } else {
        // For development, still call onSave
        onSave(reservationData);
      }
    } catch (error) {
      console.error('Error saving reservation:', error);
      // For development, still call onSave
      const reservationData: Reservation = {
        id: reservation?.id || Date.now().toString(),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        partySize: formData.partySize,
        reservationDate: formData.reservationDate,
        reservationTime: formData.reservationTime,
        duration: formData.duration,
        status: reservation?.status || 'pending',
        tableId: formData.tableId || undefined,
        tableName: formData.tableId ? availableTables.find(t => t.id === formData.tableId)?.name : undefined,
        section: formData.section || formData.tableId ? availableTables.find(t => t.id === formData.tableId)?.section : undefined,
        specialRequests: formData.specialRequests || undefined,
        occasion: formData.occasion || undefined,
        isVip: formData.isVip,
        source: formData.source,
        depositRequired: formData.depositRequired,
        depositAmount: formData.depositRequired ? formData.depositAmount : undefined,
        depositPaid: reservation?.depositPaid || false,
        remindersSent: reservation?.remindersSent || 0,
        lastReminderTime: reservation?.lastReminderTime,
        notes: formData.notes || undefined,
        createdAt: reservation?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: reservation?.createdBy || session?.user?.id || 'staff',
        confirmedAt: reservation?.confirmedAt,
      };
      onSave(reservationData);
    } finally {
      setLoading(false);
    }
  };

  const getSuitableTables = () => {
    return availableTables
      .filter(table => table.capacity >= formData.partySize && table.capacity <= formData.partySize + 2)
      .sort((a, b) => a.capacity - b.capacity);
  };

  const occasions = [
    'Birthday', 'Anniversary', 'Date Night', 'Business Meeting', 
    'Family Gathering', 'Celebration', 'Romantic Dinner', 'Other'
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {reservation ? 'Edit Reservation' : 'New Reservation'}
          </DialogTitle>
          <DialogDescription>
            {reservation 
              ? `Update reservation details for ${reservation.customerName}`
              : 'Create a new dining reservation'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="timing">Date & Time</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="billing">Billing & Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Basic customer details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Customer Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerName"
                        placeholder="Enter customer name"
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerPhone"
                        placeholder="Enter phone number"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="customerEmail"
                        placeholder="Enter email address"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="partySize">Party Size *</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Select value={formData.partySize.toString()} onValueChange={(value) => setFormData({ ...formData, partySize: parseInt(value) })}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select party size" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(size => (
                            <SelectItem key={size} value={size.toString()}>
                              {size} {size === 1 ? 'person' : 'people'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="source">Booking Source</Label>
                    <Select value={formData.source} onValueChange={(value) => setFormData({ ...formData, source: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select booking source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phone">Phone Call</SelectItem>
                        <SelectItem value="online">Online Booking</SelectItem>
                        <SelectItem value="app">Mobile App</SelectItem>
                        <SelectItem value="walk_in">Walk-in</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-8">
                    <Switch
                      id="isVip"
                      checked={formData.isVip}
                      onCheckedChange={(checked) => setFormData({ ...formData, isVip: checked })}
                    />
                    <Label htmlFor="isVip" className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span>VIP Customer</span>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Reservation Timing</CardTitle>
                <CardDescription>Select date, time, and duration for the reservation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="reservationDate">Reservation Date *</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="reservationDate"
                        type="date"
                        value={formData.reservationDate}
                        onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                        className="pl-10"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="reservationTime">Reservation Time *</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Select value={formData.reservationTime} onValueChange={(value) => setFormData({ ...formData, reservationTime: value })}>
                        <SelectTrigger className="pl-10">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map(slot => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Select value={formData.duration.toString()} onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="150">2.5 hours</SelectItem>
                        <SelectItem value="180">3 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {availableSlots.length === 0 && formData.reservationDate && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-yellow-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Limited Availability</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      No time slots available for the selected date and party size. Please choose a different date or time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Assignment */}
            <Card>
              <CardHeader>
                <CardTitle>Table Assignment</CardTitle>
                <CardDescription>Assign a specific table (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tableId">Preferred Table</Label>
                  <Select value={formData.tableId} onValueChange={(value) => setFormData({ ...formData, tableId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select table (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No Preference</SelectItem>
                      {getSuitableTables().map(table => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.name} - {table.capacity} seats ({table.section})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {getSuitableTables().length === 0 && formData.partySize > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">No Suitable Tables</span>
                    </div>
                    <p className="text-xs text-red-700 mt-1">
                      No tables available for a party of {formData.partySize} at the selected time.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Special Preferences</CardTitle>
                <CardDescription>Special requests, occasions, and dietary requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Select value={formData.occasion} onValueChange={(value) => setFormData({ ...formData, occasion: value })}>
                      <SelectTrigger className="pl-10">
                        <SelectValue placeholder="Select occasion (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Special Occasion</SelectItem>
                        {occasions.map(occasion => (
                          <SelectItem key={occasion} value={occasion}>
                            {occasion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialRequests">Special Requests</Label>
                  <Textarea
                    id="specialRequests"
                    placeholder="Any special dietary requirements, seating preferences, or other requests..."
                    value={formData.specialRequests}
                    onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                    rows={3}
                  />
                </div>

                {formData.occasion && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Gift className="w-4 h-4" />
                      <span className="text-sm font-medium">Special Occasion Noted</span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      We'll make sure to prepare something special for this {formData.occasion.toLowerCase()}!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Deposit & Billing</CardTitle>
                <CardDescription>Deposit requirements and additional notes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="depositRequired"
                    checked={formData.depositRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, depositRequired: checked })}
                  />
                  <Label htmlFor="depositRequired" className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span>Deposit Required</span>
                  </Label>
                </div>

                {formData.depositRequired && (
                  <div>
                    <Label htmlFor="depositAmount">Deposit Amount (₹)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="depositAmount"
                        type="number"
                        placeholder="Enter deposit amount"
                        value={formData.depositAmount || ''}
                        onChange={(e) => setFormData({ ...formData, depositAmount: parseInt(e.target.value) || 0 })}
                        className="pl-10"
                        min="0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                    <Textarea
                      id="notes"
                      placeholder="Internal notes for staff (not visible to customer)..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="pl-10"
                      rows={3}
                    />
                  </div>
                </div>

                {reservation && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Reservation History</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(reservation.createdAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span>{new Date(reservation.updatedAt).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Reminders Sent:</span>
                        <span>{reservation.remindersSent}</span>
                      </div>
                      {reservation.confirmedAt && (
                        <div className="flex justify-between">
                          <span>Confirmed At:</span>
                          <span>{new Date(reservation.confirmedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <div className="flex space-x-2">
            {currentTab !== 'basic' && (
              <Button 
                variant="outline"
                onClick={() => {
                  const tabs = ['basic', 'timing', 'preferences', 'billing'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex > 0) {
                    setCurrentTab(tabs[currentIndex - 1]);
                  }
                }}
              >
                Previous
              </Button>
            )}
            {currentTab !== 'billing' ? (
              <Button 
                onClick={() => {
                  const tabs = ['basic', 'timing', 'preferences', 'billing'];
                  const currentIndex = tabs.indexOf(currentTab);
                  if (currentIndex < tabs.length - 1) {
                    setCurrentTab(tabs[currentIndex + 1]);
                  }
                }}
                disabled={currentTab === 'basic' && (!formData.customerName || !formData.customerPhone)}
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSave}
                disabled={loading || !formData.customerName || !formData.customerPhone}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : reservation ? 'Update Reservation' : 'Create Reservation'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}