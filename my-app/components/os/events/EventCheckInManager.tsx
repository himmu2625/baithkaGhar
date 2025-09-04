'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  UserCheck, 
  Clock,
  QrCode,
  Search,
  Filter,
  UserX,
  AlertTriangle,
  CheckCircle,
  Star,
  Smartphone,
  Camera,
  RefreshCw,
  Download,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

interface Guest {
  _id: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestType: 'primary' | 'plus-one' | 'vip' | 'staff' | 'vendor' | 'media';
  tableNumber?: string;
  seatNumber?: string;
  checkinStatus: 'pending' | 'checked-in' | 'no-show' | 'cancelled';
  checkinTime?: string;
  checkinMethod?: string;
  checkedInBy?: { name: string };
  additionalGuests?: { name: string; relation: string; checkinTime: string }[];
  checkinNotes?: string;
  mealPreference?: string;
  specialRequirements?: string[];
}

interface CheckinSession {
  _id: string;
  checkinNumber: string;
  eventDetails: {
    eventName: string;
    eventDate: string;
    venueName: string;
    expectedGuests: number;
  };
  status: 'setup' | 'active' | 'paused' | 'completed' | 'cancelled';
  checkinStats: {
    totalExpected: number;
    totalCheckedIn: number;
    totalNoShows: number;
    checkinRate: number;
    vipCheckedIn: number;
    regularCheckedIn: number;
    staffCheckedIn: number;
  };
  guestList: Guest[];
  checkinConfig: {
    checkinStartTime: string;
    checkinEndTime: string;
    allowEarlyCheckin: boolean;
    qrCodeEnabled: boolean;
    manualCheckinEnabled: boolean;
  };
  timelineUpdates: Array<{
    timestamp: string;
    event: string;
    description: string;
    category: string;
  }>;
}

interface EventCheckInManagerProps {
  propertyId: string;
  eventBookingId?: string;
}

export default function EventCheckInManager({ propertyId, eventBookingId }: EventCheckInManagerProps) {
  const [sessions, setSessions] = useState<CheckinSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CheckinSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [guestFilter, setGuestFilter] = useState('all');
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [checkinNotes, setCheckinNotes] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState<Array<{ name: string; relation: string }>>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchSessions();
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchSessions, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [propertyId, eventBookingId, autoRefresh]);

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({ propertyId });
      if (eventBookingId) params.append('eventBookingId', eventBookingId);

      const response = await fetch(`/api/events/checkin?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.checkins);
        if (!selectedSession && data.checkins.length > 0) {
          setSelectedSession(data.checkins[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch check-in sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCheckinSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/events/checkin/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });

      if (response.ok) {
        await fetchSessions();
      }
    } catch (error) {
      console.error('Failed to start check-in session:', error);
    }
  };

  const checkInGuest = async (guest: Guest) => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/events/checkin/${selectedSession._id}/guest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest._id,
          method: 'manual',
          location: 'Main Entrance',
          notes: checkinNotes,
          additionalGuests
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.checkin);
        setShowCheckinDialog(false);
        setSelectedGuest(null);
        setCheckinNotes('');
        setAdditionalGuests([]);
      }
    } catch (error) {
      console.error('Failed to check in guest:', error);
    }
  };

  const markAsNoShow = async (guest: Guest) => {
    if (!selectedSession) return;

    try {
      const response = await fetch(`/api/events/checkin/${selectedSession._id}/guest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guestId: guest._id,
          status: 'no-show',
          notes: 'Marked as no-show'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedSession(data.checkin);
      }
    } catch (error) {
      console.error('Failed to mark guest as no-show:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'checked-in': 'bg-green-100 text-green-800',
      'no-show': 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getGuestTypeColor = (type: string) => {
    const colors = {
      primary: 'bg-blue-100 text-blue-800',
      'plus-one': 'bg-purple-100 text-purple-800',
      vip: 'bg-amber-100 text-amber-800',
      staff: 'bg-gray-100 text-gray-800',
      vendor: 'bg-orange-100 text-orange-800',
      media: 'bg-cyan-100 text-cyan-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const filteredGuests = selectedSession?.guestList?.filter(guest => {
    const matchesSearch = guest.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.guestEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         guest.guestPhone?.includes(searchTerm);
    
    const matchesFilter = guestFilter === 'all' || guest.checkinStatus === guestFilter || guest.guestType === guestFilter;
    
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Check-in Sessions</h3>
          <p className="text-gray-600">Create an event booking to set up check-in management.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Event Check-in Manager</h2>
          <p className="text-gray-600">Manage guest arrivals in real-time</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" onClick={fetchSessions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Session Selector */}
      {sessions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session) => (
                <div
                  key={session._id}
                  onClick={() => setSelectedSession(session)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSession?._id === session._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{session.eventDetails.eventName}</h4>
                    <Badge 
                      className={
                        session.status === 'active' ? 'bg-green-100 text-green-800' :
                        session.status === 'setup' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {format(new Date(session.eventDetails.eventDate), 'MMM dd, yyyy')}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span>{session.checkinStats.totalCheckedIn}/{session.checkinStats.totalExpected} checked in</span>
                    <span>{session.checkinStats.checkinRate}%</span>
                  </div>
                  <Progress value={session.checkinStats.checkinRate} className="mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedSession && (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected</p>
                    <p className="text-2xl font-bold">{selectedSession.checkinStats.totalExpected}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Checked In</p>
                    <p className="text-2xl font-bold">{selectedSession.checkinStats.totalCheckedIn}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Check-in Rate</p>
                    <p className="text-2xl font-bold">{selectedSession.checkinStats.checkinRate}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">VIP Guests</p>
                    <p className="text-2xl font-bold">{selectedSession.checkinStats.vipCheckedIn}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">No Shows</p>
                    <p className="text-2xl font-bold">{selectedSession.checkinStats.totalNoShows}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{selectedSession.eventDetails.eventName}</CardTitle>
                  <CardDescription>
                    {format(new Date(selectedSession.eventDetails.eventDate), 'EEEE, MMMM dd, yyyy')}
                    {selectedSession.eventDetails.venueName && ` • ${selectedSession.eventDetails.venueName}`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedSession.status === 'setup' && (
                    <Button 
                      onClick={() => startCheckinSession(selectedSession._id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Start Check-in
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => setShowQRScanner(true)}>
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Tabs defaultValue="guests" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="guests">Guest List</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="guests" className="space-y-4">
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search guests by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant={guestFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setGuestFilter('all')}
                      >
                        All ({selectedSession.guestList?.length || 0})
                      </Button>
                      <Button
                        variant={guestFilter === 'pending' ? 'default' : 'outline'}
                        onClick={() => setGuestFilter('pending')}
                      >
                        Pending ({selectedSession.guestList?.filter(g => g.checkinStatus === 'pending').length || 0})
                      </Button>
                      <Button
                        variant={guestFilter === 'checked-in' ? 'default' : 'outline'}
                        onClick={() => setGuestFilter('checked-in')}
                      >
                        Checked In ({selectedSession.checkinStats.totalCheckedIn})
                      </Button>
                      <Button
                        variant={guestFilter === 'vip' ? 'default' : 'outline'}
                        onClick={() => setGuestFilter('vip')}
                      >
                        VIP ({selectedSession.guestList?.filter(g => g.guestType === 'vip').length || 0})
                      </Button>
                    </div>
                  </div>

                  {/* Guest List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredGuests.map((guest) => (
                      <div key={guest._id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div>
                              <h4 className="font-semibold">{guest.guestName}</h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                {guest.guestEmail && <span>{guest.guestEmail}</span>}
                                {guest.guestPhone && <span>{guest.guestPhone}</span>}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Badge className={getGuestTypeColor(guest.guestType)}>
                              {guest.guestType === 'plus-one' ? '+1' : guest.guestType.toUpperCase()}
                            </Badge>
                            <Badge className={getStatusColor(guest.checkinStatus)}>
                              {guest.checkinStatus}
                            </Badge>
                            {guest.guestType === 'vip' && <Star className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {guest.tableNumber && <span>Table {guest.tableNumber}</span>}
                            {guest.seatNumber && <span> • Seat {guest.seatNumber}</span>}
                            {guest.checkinTime && (
                              <span> • Checked in at {format(new Date(guest.checkinTime), 'HH:mm')}</span>
                            )}
                            {guest.checkedInBy && <span> by {guest.checkedInBy.name}</span>}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {guest.checkinStatus === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedGuest(guest);
                                    setShowCheckinDialog(true);
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Check In
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAsNoShow(guest)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <UserX className="h-3 w-3 mr-1" />
                                  No Show
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {guest.additionalGuests && guest.additionalGuests.length > 0 && (
                          <div className="mt-2 pt-2 border-t text-sm text-gray-600">
                            <span className="font-medium">Additional guests: </span>
                            {guest.additionalGuests.map((addGuest, index) => (
                              <span key={index}>
                                {addGuest.name} ({addGuest.relation})
                                {index < guest.additionalGuests!.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="timeline" className="space-y-4">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedSession.timelineUpdates
                      ?.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                      .map((update, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${
                          update.category === 'vip' ? 'bg-yellow-100' :
                          update.category === 'checkin' ? 'bg-green-100' :
                          update.category === 'issue' ? 'bg-red-100' :
                          'bg-blue-100'
                        }`}>
                          {update.category === 'vip' ? <Star className="h-4 w-4 text-yellow-600" /> :
                           update.category === 'checkin' ? <UserCheck className="h-4 w-4 text-green-600" /> :
                           update.category === 'issue' ? <AlertTriangle className="h-4 w-4 text-red-600" /> :
                           <Clock className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{update.event}</h4>
                            <span className="text-sm text-gray-500">
                              {format(new Date(update.timestamp), 'HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{update.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Check-in Settings</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>QR Code Check-in</span>
                          <Badge variant={selectedSession.checkinConfig.qrCodeEnabled ? 'default' : 'secondary'}>
                            {selectedSession.checkinConfig.qrCodeEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Manual Check-in</span>
                          <Badge variant={selectedSession.checkinConfig.manualCheckinEnabled ? 'default' : 'secondary'}>
                            {selectedSession.checkinConfig.manualCheckinEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Early Check-in</span>
                          <Badge variant={selectedSession.checkinConfig.allowEarlyCheckin ? 'default' : 'secondary'}>
                            {selectedSession.checkinConfig.allowEarlyCheckin ? 'Allowed' : 'Not Allowed'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Event Timeline</h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span>Check-in Start:</span>
                          <span>{format(new Date(selectedSession.checkinConfig.checkinStartTime), 'HH:mm')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Check-in End:</span>
                          <span>{format(new Date(selectedSession.checkinConfig.checkinEndTime), 'HH:mm')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Event Date:</span>
                          <span>{format(new Date(selectedSession.eventDetails.eventDate), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}

      {/* Check-in Dialog */}
      <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check in {selectedGuest?.guestName}</DialogTitle>
            <DialogDescription>
              Confirm guest arrival and add any additional information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedGuest && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{selectedGuest.guestName}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge className={getGuestTypeColor(selectedGuest.guestType)}>
                      {selectedGuest.guestType}
                    </Badge>
                    {selectedGuest.guestType === 'vip' && <Star className="h-4 w-4 text-yellow-500" />}
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {selectedGuest.guestEmail && <p>Email: {selectedGuest.guestEmail}</p>}
                  {selectedGuest.guestPhone && <p>Phone: {selectedGuest.guestPhone}</p>}
                  {selectedGuest.tableNumber && <p>Table: {selectedGuest.tableNumber}</p>}
                  {selectedGuest.mealPreference && <p>Meal: {selectedGuest.mealPreference}</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Check-in Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any special notes or observations..."
                value={checkinNotes}
                onChange={(e) => setCheckinNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Additional Guests</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAdditionalGuests([...additionalGuests, { name: '', relation: '' }])}
                >
                  <Users className="h-3 w-3 mr-1" />
                  Add Guest
                </Button>
              </div>

              {additionalGuests.map((guest, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Guest name"
                    value={guest.name}
                    onChange={(e) => {
                      const updated = [...additionalGuests];
                      updated[index].name = e.target.value;
                      setAdditionalGuests(updated);
                    }}
                  />
                  <Input
                    placeholder="Relation"
                    value={guest.relation}
                    onChange={(e) => {
                      const updated = [...additionalGuests];
                      updated[index].relation = e.target.value;
                      setAdditionalGuests(updated);
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCheckinDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedGuest && checkInGuest(selectedGuest)}>
                <UserCheck className="h-4 w-4 mr-2" />
                Check In
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Dialog */}
      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code Scanner</DialogTitle>
            <DialogDescription>
              Scan guest QR codes for quick check-in
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Camera className="h-16 w-16 text-gray-400 mx-auto" />
              <p className="text-gray-600">Camera access required for QR scanning</p>
              <Button onClick={() => setShowQRScanner(false)}>
                Enable Camera
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}