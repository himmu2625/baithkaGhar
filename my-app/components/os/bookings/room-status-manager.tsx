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
import {
  Bed,
  Wrench,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RotateCcw,
  UserCheck,
  MapPin,
  Calendar,
  Timer,
  Users
} from 'lucide-react';

interface Room {
  id: string;
  number: string;
  floor: string;
  type: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out-of-order';
  lastCleaned: string;
  maintenanceScheduled?: string;
  currentGuest?: string;
  checkOut?: string;
  checkIn?: string;
  notes?: string;
  priority: 'low' | 'medium' | 'high';
}

interface RoomStatusManagerProps {
  propertyId: string;
}

const statusConfig = {
  available: {
    icon: CheckCircle2,
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    label: 'Available'
  },
  occupied: {
    icon: Users,
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    label: 'Occupied'
  },
  cleaning: {
    icon: Sparkles,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    label: 'Cleaning'
  },
  maintenance: {
    icon: Wrench,
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    bgColor: 'bg-orange-50',
    label: 'Maintenance'
  },
  'out-of-order': {
    icon: AlertCircle,
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    label: 'Out of Order'
  }
};

export default function RoomStatusManager({ propertyId }: RoomStatusManagerProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    fetchRooms();
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockRooms: Room[] = [
        {
          id: '1',
          number: '101',
          floor: '1',
          type: 'Standard',
          status: 'available',
          lastCleaned: '2025-09-21T08:00:00Z',
          priority: 'low'
        },
        {
          id: '2',
          number: '102',
          floor: '1',
          type: 'Deluxe',
          status: 'occupied',
          lastCleaned: '2025-09-20T16:00:00Z',
          currentGuest: 'John Doe',
          checkOut: '2025-09-22T11:00:00Z',
          priority: 'medium'
        },
        {
          id: '3',
          number: '201',
          floor: '2',
          type: 'Suite',
          status: 'cleaning',
          lastCleaned: '2025-09-21T09:30:00Z',
          priority: 'high'
        },
        {
          id: '4',
          number: '202',
          floor: '2',
          type: 'Standard',
          status: 'maintenance',
          lastCleaned: '2025-09-20T14:00:00Z',
          maintenanceScheduled: '2025-09-21T14:00:00Z',
          notes: 'AC repair required',
          priority: 'high'
        },
        {
          id: '5',
          number: '301',
          floor: '3',
          type: 'Presidential',
          status: 'out-of-order',
          lastCleaned: '2025-09-19T10:00:00Z',
          notes: 'Water damage - major repairs needed',
          priority: 'high'
        }
      ];

      setRooms(mockRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId: string, status: string, notes: string) => {
    try {
      // Mock API call - replace with actual implementation
      setRooms(prev => prev.map(room =>
        room.id === roomId
          ? {
              ...room,
              status: status as Room['status'],
              notes,
              lastCleaned: status === 'available' ? new Date().toISOString() : room.lastCleaned
            }
          : room
      ));
      setShowStatusDialog(false);
      setSelectedRoom(null);
      setStatusNotes('');
    } catch (error) {
      console.error('Error updating room status:', error);
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || room.floor === floorFilter;

    return matchesSearch && matchesStatus && matchesFloor;
  });

  const statusCounts = rooms.reduce((acc, room) => {
    acc[room.status] = (acc[room.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const floors = [...new Set(rooms.map(room => room.floor))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading room status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = statusCounts[status] || 0;

          return (
            <Card key={status} className={`${config.bgColor} border-l-4 border-l-${config.color.split('-')[1]}-500`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${config.textColor}`}>
                      {config.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${config.textColor}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Room Status Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search">Search Rooms</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by room number or type..."
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

            <div>
              <Label htmlFor="floor-filter">Floor</Label>
              <Select value={floorFilter} onValueChange={setFloorFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Floors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Floors</SelectItem>
                  {floors.map(floor => (
                    <SelectItem key={floor} value={floor}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={fetchRooms}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Room Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRooms.map(room => {
              const config = statusConfig[room.status];
              const Icon = config.icon;

              return (
                <Card
                  key={room.id}
                  className={`${config.bgColor} border-l-4 border-l-${config.color.split('-')[1]}-500 hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => {
                    setSelectedRoom(room);
                    setNewStatus(room.status);
                    setStatusNotes(room.notes || '');
                    setShowStatusDialog(true);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">Room {room.number}</h3>
                        <p className="text-sm text-gray-600">{room.type}</p>
                      </div>
                      <Badge variant="secondary" className={`${config.color} text-white`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {config.label}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>Floor {room.floor}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>Cleaned: {new Date(room.lastCleaned).toLocaleDateString()}</span>
                      </div>

                      {room.currentGuest && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-gray-400" />
                          <span>{room.currentGuest}</span>
                        </div>
                      )}

                      {room.checkOut && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Check-out: {new Date(room.checkOut).toLocaleDateString()}</span>
                        </div>
                      )}

                      {room.maintenanceScheduled && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-gray-400" />
                          <span>Maintenance: {new Date(room.maintenanceScheduled).toLocaleString()}</span>
                        </div>
                      )}

                      {room.notes && (
                        <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                          <strong>Notes:</strong> {room.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRooms.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Bed className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No rooms found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Room Status</DialogTitle>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Room {selectedRoom.number}</h3>
                <p className="text-sm text-gray-600">{selectedRoom.type} - Floor {selectedRoom.floor}</p>
              </div>

              <div>
                <Label htmlFor="new-status">New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>
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
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add any notes about this status change..."
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => updateRoomStatus(selectedRoom.id, newStatus, statusNotes)}
                  className="flex-1"
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowStatusDialog(false)}
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