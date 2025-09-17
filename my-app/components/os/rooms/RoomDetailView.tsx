'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Bed, Calendar, Clock, DollarSign, Eye, Home, Settings, Shield, Thermometer, Users, Wrench } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order' | 'reserved';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_renovation';
  roomType: {
    name: string;
    basePrice: number;
    maxOccupancy: number;
  };
  currentBooking?: {
    guestName: string;
    checkIn: Date;
    checkOut: Date;
    guestCount: number;
  };
  housekeeping: {
    cleaningStatus: 'dirty' | 'cleaning_in_progress' | 'clean' | 'inspected' | 'maintenance_required';
    lastCleaned: Date;
    lastCleanedBy?: {
      name: string;
      email: string;
    };
  };
  maintenance: {
    currentIssues: Array<{
      issueType: string;
      description: string;
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      reportedAt: Date;
      status: 'reported' | 'assigned' | 'in_progress' | 'resolved';
    }>;
  };
  revenue: {
    monthlyRevenue: number;
    averageDailyRate: number;
  };
  performance: {
    occupancyRate: number;
    isBookable: boolean;
    lastOccupied?: Date;
  };
}

interface RoomDetailViewProps {
  roomId: string;
  onStatusUpdate: (status: string) => void;
  onInventoryUpdate: () => void;
}

export default function RoomDetailView({ roomId, onStatusUpdate, onInventoryUpdate }: RoomDetailViewProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoomDetails();
  }, [roomId]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/rooms/${roomId}?includeInventory=true&includeMaintenance=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch room details');
      }

      const data = await response.json();
      setRoom(data.data.room);
    } catch (error) {
      console.error('Error fetching room details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load room details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (newStatus: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/os/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update room status');
      }

      await fetchRoomDetails(); // Refresh data
      onStatusUpdate(newStatus);

      toast({
        title: 'Success',
        description: `Room status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update room status',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-blue-500',
      maintenance: 'bg-orange-500',
      cleaning: 'bg-yellow-500',
      out_of_order: 'bg-red-500',
      reserved: 'bg-purple-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      fair: 'bg-yellow-500',
      poor: 'bg-orange-500',
      needs_renovation: 'bg-red-500',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-500';
  };

  const getAvailableActions = () => {
    if (!room) return [];

    const actions = [];

    switch (room.status) {
      case 'available':
        actions.push(
          { label: 'Mark as Cleaning', value: 'cleaning' },
          { label: 'Mark for Maintenance', value: 'maintenance' },
          { label: 'Mark as Reserved', value: 'reserved' }
        );
        break;
      case 'occupied':
        actions.push(
          { label: 'Check Out Guest', value: 'available' },
          { label: 'Request Maintenance', value: 'maintenance' }
        );
        break;
      case 'cleaning':
        actions.push(
          { label: 'Mark as Available', value: 'available' },
          { label: 'Needs Maintenance', value: 'maintenance' }
        );
        break;
      case 'maintenance':
        actions.push(
          { label: 'Mark as Available', value: 'available' },
          { label: 'Mark Out of Order', value: 'out_of_order' }
        );
        break;
      case 'out_of_order':
        actions.push(
          { label: 'Mark for Maintenance', value: 'maintenance' },
          { label: 'Mark as Available', value: 'available' }
        );
        break;
      case 'reserved':
        actions.push(
          { label: 'Check In Guest', value: 'occupied' },
          { label: 'Cancel Reservation', value: 'available' }
        );
        break;
    }

    return actions;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Room not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Home className="h-6 w-6 text-gray-600" />
            <h1 className="text-2xl font-bold">Room {room.roomNumber}</h1>
          </div>
          <Badge className={`${getStatusColor(room.status)} text-white`}>
            {room.status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="outline" className={`${getConditionColor(room.condition)} text-white`}>
            {room.condition.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Select onValueChange={updateRoomStatus} disabled={updating}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              {getAvailableActions().map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={onInventoryUpdate}>
            <Settings className="h-4 w-4 mr-2" />
            Manage Inventory
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bed className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Room Type</p>
                <p className="font-semibold">{room.roomType?.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Max Occupancy</p>
                <p className="font-semibold">{room.roomType?.maxOccupancy} guests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Base Rate</p>
                <p className="font-semibold">₹{room.roomType?.basePrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Floor</p>
                <p className="font-semibold">Floor {room.floor}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Room Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Current Status</span>
                  <Badge className={`${getStatusColor(room.status)} text-white`}>
                    {room.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Condition</span>
                  <Badge variant="outline" className={`${getConditionColor(room.condition)} text-white`}>
                    {room.condition.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bookable</span>
                  <Badge variant={room.performance?.isBookable ? 'default' : 'secondary'}>
                    {room.performance?.isBookable ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Revenue</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Monthly Revenue</span>
                  <span className="font-semibold">₹{room.revenue?.monthlyRevenue?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average Daily Rate</span>
                  <span className="font-semibold">₹{room.revenue?.averageDailyRate?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Occupancy Rate</span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={room.performance?.occupancyRate || 0}
                      className="w-16"
                    />
                    <span className="text-sm">{room.performance?.occupancyRate || 0}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Booking Tab */}
        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Booking</CardTitle>
            </CardHeader>
            <CardContent>
              {room.currentBooking ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guest Name</label>
                      <p className="text-lg">{room.currentBooking.guestName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Guest Count</label>
                      <p className="text-lg">{room.currentBooking.guestCount} guests</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Check-in</label>
                      <p className="text-lg">{new Date(room.currentBooking.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Check-out</label>
                      <p className="text-lg">{new Date(room.currentBooking.checkOut).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No current booking</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Housekeeping Tab */}
        <TabsContent value="housekeeping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Housekeeping Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Cleaning Status</span>
                <Badge variant={room.housekeeping.cleaningStatus === 'clean' ? 'default' : 'secondary'}>
                  {room.housekeeping.cleaningStatus.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span>Last Cleaned</span>
                <span>{new Date(room.housekeeping.lastCleaned).toLocaleDateString()}</span>
              </div>

              {room.housekeeping.lastCleanedBy && (
                <div className="flex justify-between items-center">
                  <span>Cleaned By</span>
                  <span>{room.housekeeping.lastCleanedBy.name}</span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => updateRoomStatus('cleaning')}
                  disabled={updating}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Cleaning
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateRoomStatus('available')}
                  disabled={updating || room.housekeeping.cleaningStatus !== 'clean'}
                >
                  Mark Ready
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Maintenance Issues</span>
                <Button variant="outline" size="sm">
                  <Wrench className="h-4 w-4 mr-2" />
                  Report Issue
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {room.maintenance.currentIssues.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {room.maintenance.currentIssues.map((issue, index) => (
                      <div key={index} className="border rounded p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{issue.issueType}</h4>
                            <p className="text-sm text-gray-600">{issue.description}</p>
                          </div>
                          <Badge variant={
                            issue.severity === 'critical' ? 'destructive' :
                            issue.severity === 'major' ? 'default' : 'secondary'
                          }>
                            {issue.severity}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Reported: {new Date(issue.reportedAt).toLocaleDateString()}</span>
                          <Badge variant="outline">{issue.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-gray-500 text-center py-8">No maintenance issues reported</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Occupancy Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Occupancy Rate</span>
                    <span>{room.performance?.occupancyRate || 0}%</span>
                  </div>
                  <Progress value={room.performance?.occupancyRate || 0} />
                </div>

                {room.performance?.lastOccupied && (
                  <div className="flex justify-between">
                    <span>Last Occupied</span>
                    <span>{new Date(room.performance.lastOccupied).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Monthly Revenue</span>
                  <span className="font-semibold">₹{room.revenue?.monthlyRevenue?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Average Daily Rate</span>
                  <span className="font-semibold">₹{room.revenue?.averageDailyRate?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent changes and updates to this room
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">Activity history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}