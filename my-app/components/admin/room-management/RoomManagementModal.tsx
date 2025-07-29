"use client";

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
}

interface RoomStatus {
  unitTypeCode: string;
  unitTypeName: string;
  roomNumber: string;
  status: 'available' | 'booked' | 'maintenance';
}

interface Booking {
  _id: string;
  dateFrom: string;
  dateTo: string;
  guests: number;
  status: string;
  allocatedRoom?: {
    unitTypeCode: string;
    unitTypeName: string;
    roomNumber: string;
  };
}

export default function RoomManagementModal({
  isOpen,
  onClose,
  propertyId,
  propertyName
}: RoomManagementModalProps) {
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<string>('');
  const [unitTypes, setUnitTypes] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadRoomData();
    }
  }, [isOpen, propertyId]);

  const loadRoomData = async () => {
    setLoading(true);
    try {
      // Load property details to get room information
      const propertyResponse = await fetch(`/api/properties/${propertyId}`);
      const propertyData = await propertyResponse.json();

      if (propertyData.property) {
        const rooms: RoomStatus[] = [];
        const units: string[] = [];

        propertyData.property.propertyUnits?.forEach((unit: any) => {
          units.push(unit.unitTypeCode);
          unit.roomNumbers?.forEach((room: any) => {
            rooms.push({
              unitTypeCode: unit.unitTypeCode,
              unitTypeName: unit.unitTypeName,
              roomNumber: room.number,
              status: room.status
            });
          });
        });

        setRoomStatuses(rooms);
        setUnitTypes(units);
        if (units.length > 0) {
          setSelectedUnitType(units[0]);
        }
      }

      // Load bookings for this property
      const bookingsResponse = await fetch(`/api/bookings?propertyId=${propertyId}`);
      const bookingsData = await bookingsResponse.json();
      setBookings(bookingsData.bookings || []);
    } catch (error) {
      console.error('Error loading room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomNumber: string, unitTypeCode: string, newStatus: string) => {
    setUpdatingRoom(roomNumber);
    try {
      const response = await fetch('/api/admin/room-management', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          unitTypeCode,
          roomNumber,
          status: newStatus,
          action: 'updateStatus'
        }),
      });

      if (response.ok) {
        // Update local state
        setRoomStatuses(prev => 
          prev.map(room => 
            room.roomNumber === roomNumber && room.unitTypeCode === unitTypeCode
              ? { ...room, status: newStatus as 'available' | 'booked' | 'maintenance' }
              : room
          )
        );
      } else {
        const error = await response.json();
        alert(`Failed to update room status: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating room status:', error);
      alert('Failed to update room status');
    } finally {
      setUpdatingRoom(null);
    }
  };

  const manuallyAllocateRoom = async (bookingId: string, unitTypeCode: string, roomNumber: string) => {
    try {
      const response = await fetch('/api/admin/room-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          unitTypeCode,
          roomNumber
        }),
      });

      if (response.ok) {
        alert('Room allocated successfully');
        loadRoomData(); // Reload data
      } else {
        const error = await response.json();
        alert(`Failed to allocate room: ${error.error}`);
      }
    } catch (error) {
      console.error('Error allocating room:', error);
      alert('Failed to allocate room');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'booked':
        return <XCircle className="w-4 h-4" />;
      case 'maintenance':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredRooms = roomStatuses.filter(room => 
    !selectedUnitType || room.unitTypeCode === selectedUnitType
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Room Management - {propertyName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading room data...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Unit Type Filter */}
            <div className="flex items-center space-x-4">
              <Label htmlFor="unitType">Filter by Unit Type:</Label>
              <Select value={selectedUnitType} onValueChange={setSelectedUnitType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Unit Types</SelectItem>
                  {unitTypes.map(unitType => (
                    <SelectItem key={unitType} value={unitType}>
                      {unitType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Room Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRooms.map((room) => (
                    <div key={`${room.unitTypeCode}-${room.roomNumber}`} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{room.unitTypeName}</h4>
                          <p className="text-sm text-gray-600">Room {room.roomNumber}</p>
                        </div>
                        <Badge className={getStatusColor(room.status)}>
                          {getStatusIcon(room.status)}
                          <span className="ml-1 capitalize">{room.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`status-${room.roomNumber}`}>Update Status:</Label>
                        <Select
                          value={room.status}
                          onValueChange={(value) => updateRoomStatus(room.roomNumber, room.unitTypeCode, value)}
                          disabled={updatingRoom === room.roomNumber}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="available">Available</SelectItem>
                            <SelectItem value="booked">Booked</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                        {updatingRoom === room.roomNumber && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            Updating...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bookings with Room Allocation */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings & Room Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-gray-500">No bookings found for this property.</p>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">Booking #{booking._id.slice(-6)}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(booking.dateFrom).toLocaleDateString()} - {new Date(booking.dateTo).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">{booking.guests} guests</p>
                          </div>
                          <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                            {booking.status}
                          </Badge>
                        </div>
                        
                        {booking.allocatedRoom ? (
                          <Alert>
                            <AlertDescription>
                              <strong>Allocated Room:</strong> {booking.allocatedRoom.unitTypeName} - Room {booking.allocatedRoom.roomNumber}
                            </AlertDescription>
                          </Alert>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">No room allocated</p>
                            <div className="flex space-x-2">
                              <Select>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Room Type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {unitTypes.map(unitType => (
                                    <SelectItem key={unitType} value={unitType}>
                                      {unitType}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button size="sm" variant="outline">
                                Allocate Room
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 