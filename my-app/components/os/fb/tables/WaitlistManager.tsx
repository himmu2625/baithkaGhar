'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Clock, 
  Phone, 
  Mail, 
  MessageCircle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Table {
  id: string;
  name: string;
  capacity: number;
  status: string;
  section: string;
}

interface WaitlistEntry {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  partySize: number;
  arrivalTime: string;
  estimatedWaitTime: number;
  actualWaitTime?: number;
  priority: 'normal' | 'high' | 'urgent';
  status: 'waiting' | 'notified' | 'seated' | 'cancelled' | 'no_show';
  specialRequests?: string;
  preferredSection?: string;
  notificationsSent: number;
  lastNotificationTime?: string;
}

interface WaitlistStats {
  totalWaiting: number;
  averageWaitTime: number;
  longestWait: number;
  peakHourWaiting: number;
  noShowRate: number;
  satisfactionRate: number;
}

interface WaitlistManagerProps {
  propertyId: string;
  availableTables: Table[];
  onTableAssign: (tableId: string, status: string) => void;
}

export function WaitlistManager({ propertyId, availableTables, onTableAssign }: WaitlistManagerProps) {
  const { data: session } = useSession();
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [waitlistStats, setWaitlistStats] = useState<WaitlistStats>({
    totalWaiting: 0,
    averageWaitTime: 0,
    longestWait: 0,
    peakHourWaiting: 0,
    noShowRate: 0,
    satisfactionRate: 0,
  });
  const [selectedEntry, setSelectedEntry] = useState<WaitlistEntry | null>(null);
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('waiting');
  const [sortBy, setSortBy] = useState<string>('waitTime');

  useEffect(() => {
    const fetchWaitlistData = async () => {
      try {
        const [waitlistRes, statsRes] = await Promise.all([
          fetch(`/api/fb/waitlist?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/waitlist/stats?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (waitlistRes.ok && statsRes.ok) {
          const [waitlistData, statsData] = await Promise.all([
            waitlistRes.json(),
            statsRes.json()
          ]);
          
          setWaitlist(waitlistData.waitlist || []);
          setWaitlistStats(statsData.stats || waitlistStats);
        }
      } catch (error) {
        console.error('Error fetching waitlist data:', error);
        
        // Mock data for development
        const mockWaitlist: WaitlistEntry[] = [
          {
            id: '1',
            customerName: 'John Smith',
            phone: '+91 9876543210',
            email: 'john@example.com',
            partySize: 4,
            arrivalTime: new Date(Date.now() - 1200000).toISOString(), // 20 minutes ago
            estimatedWaitTime: 25,
            priority: 'normal',
            status: 'waiting',
            specialRequests: 'High chair needed',
            notificationsSent: 1,
            lastNotificationTime: new Date(Date.now() - 300000).toISOString()
          },
          {
            id: '2',
            customerName: 'Alice Johnson',
            phone: '+91 9876543211',
            partySize: 2,
            arrivalTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            estimatedWaitTime: 15,
            priority: 'normal',
            status: 'waiting',
            notificationsSent: 0
          },
          {
            id: '3',
            customerName: 'Bob Wilson',
            phone: '+91 9876543212',
            email: 'bob@example.com',
            partySize: 6,
            arrivalTime: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
            estimatedWaitTime: 35,
            priority: 'high',
            status: 'notified',
            specialRequests: 'Vegetarian menu preferences',
            notificationsSent: 2,
            lastNotificationTime: new Date(Date.now() - 180000).toISOString()
          },
          {
            id: '4',
            customerName: 'Sarah Davis',
            phone: '+91 9876543213',
            partySize: 3,
            arrivalTime: new Date(Date.now() - 2400000).toISOString(), // 40 minutes ago
            estimatedWaitTime: 20,
            priority: 'urgent',
            status: 'waiting',
            notificationsSent: 3,
            lastNotificationTime: new Date(Date.now() - 120000).toISOString()
          }
        ];
        
        setWaitlist(mockWaitlist);
        setWaitlistStats({
          totalWaiting: 12,
          averageWaitTime: 18,
          longestWait: 45,
          peakHourWaiting: 8,
          noShowRate: 8.5,
          satisfactionRate: 4.2,
        });
      }
    };

    if (propertyId && session) {
      fetchWaitlistData();
    }
  }, [propertyId, session]);

  const getActualWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    return Math.floor((now.getTime() - arrival.getTime()) / 60000);
  };

  const getWaitTimeStatus = (entry: WaitlistEntry) => {
    const actualWaitTime = getActualWaitTime(entry.arrivalTime);
    const estimatedTime = entry.estimatedWaitTime;
    
    if (actualWaitTime > estimatedTime + 10) return 'overdue';
    if (actualWaitTime > estimatedTime) return 'approaching';
    return 'onTime';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'notified': return 'bg-blue-100 text-blue-800';
      case 'seated': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWaitlist = waitlist
    .filter(entry => filterStatus === 'all' || entry.status === filterStatus)
    .sort((a, b) => {
      switch (sortBy) {
        case 'waitTime':
          return getActualWaitTime(b.arrivalTime) - getActualWaitTime(a.arrivalTime);
        case 'priority':
          const priorityOrder = { urgent: 0, high: 1, normal: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        case 'partySize':
          return b.partySize - a.partySize;
        case 'arrivalTime':
        default:
          return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime();
      }
    });

  const getSuitableTables = (partySize: number) => {
    return availableTables
      .filter(table => table.capacity >= partySize && table.capacity <= partySize + 2)
      .sort((a, b) => a.capacity - b.capacity);
  };

  const handleNotifyCustomer = async (entry: WaitlistEntry, method: 'sms' | 'call' | 'email') => {
    try {
      const response = await fetch(`/api/fb/waitlist/${entry.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ method, propertyId }),
      });

      if (response.ok) {
        setWaitlist(waitlist =>
          waitlist.map(w =>
            w.id === entry.id
              ? {
                  ...w,
                  notificationsSent: w.notificationsSent + 1,
                  lastNotificationTime: new Date().toISOString(),
                  status: 'notified' as const
                }
              : w
          )
        );
      }
    } catch (error) {
      console.error('Error notifying customer:', error);
    }
  };

  const handleAssignTable = async () => {
    if (!selectedEntry || !selectedTable) return;

    try {
      const response = await fetch(`/api/fb/waitlist/${selectedEntry.id}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          tableId: selectedTable,
          propertyId,
        }),
      });

      if (response.ok) {
        // Update waitlist entry status
        setWaitlist(waitlist =>
          waitlist.map(w =>
            w.id === selectedEntry.id
              ? { ...w, status: 'seated' as const, actualWaitTime: getActualWaitTime(w.arrivalTime) }
              : w
          )
        );

        // Update table status
        onTableAssign(selectedTable, 'occupied');

        setShowAssignDialog(false);
        setSelectedEntry(null);
        setSelectedTable('');
      }
    } catch (error) {
      console.error('Error assigning table:', error);
    }
  };

  const handleUpdateStatus = async (entryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/waitlist/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setWaitlist(waitlist =>
          waitlist.map(w =>
            w.id === entryId ? { ...w, status: newStatus as any } : w
          )
        );
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{waitlistStats.totalWaiting}</div>
              <div className="text-sm text-gray-500">Total Waiting</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{waitlistStats.averageWaitTime}m</div>
              <div className="text-sm text-gray-500">Avg Wait Time</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{waitlistStats.longestWait}m</div>
              <div className="text-sm text-gray-500">Longest Wait</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{waitlistStats.peakHourWaiting}</div>
              <div className="text-sm text-gray-500">Peak Hour</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{waitlistStats.noShowRate}%</div>
              <div className="text-sm text-gray-500">No-Show Rate</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{waitlistStats.satisfactionRate}</div>
              <div className="text-sm text-gray-500">Satisfaction</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="waiting">Waiting</SelectItem>
                  <SelectItem value="notified">Notified</SelectItem>
                  <SelectItem value="seated">Seated</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waitTime">Wait Time</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="partySize">Party Size</SelectItem>
                  <SelectItem value="arrivalTime">Arrival Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filteredWaitlist.length} entries
              </Badge>
              <Badge className="bg-yellow-100 text-yellow-800">
                {filteredWaitlist.filter(e => e.status === 'waiting').length} waiting
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredWaitlist.map((entry) => {
          const actualWaitTime = getActualWaitTime(entry.arrivalTime);
          const waitTimeStatus = getWaitTimeStatus(entry);
          const isOverdue = waitTimeStatus === 'overdue';
          const isApproaching = waitTimeStatus === 'approaching';
          
          return (
            <Card key={entry.id} className={`relative ${isOverdue ? 'border-red-300 bg-red-50' : isApproaching ? 'border-orange-300 bg-orange-50' : ''}`}>
              {entry.priority === 'urgent' && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Bell className="w-3 h-3 mr-1" />
                    URGENT
                  </Badge>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{entry.customerName}</span>
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center space-x-4 text-sm">
                        <span>{entry.phone}</span>
                        {entry.email && <span>{entry.email}</span>}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(entry.priority)}>
                      {entry.priority}
                    </Badge>
                    <Badge className={getStatusColor(entry.status)}>
                      {entry.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Wait Time Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : isApproaching ? 'text-orange-600' : 'text-gray-600'}`} />
                      <span>
                        {actualWaitTime}m waited / {entry.estimatedWaitTime}m est.
                      </span>
                    </div>
                    <span className="font-medium">
                      {entry.partySize} {entry.partySize === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min((actualWaitTime / entry.estimatedWaitTime) * 100, 100)} 
                    className={`h-2 ${isOverdue ? 'bg-red-200' : isApproaching ? 'bg-orange-200' : ''}`}
                  />
                  {isOverdue && (
                    <div className="flex items-center space-x-1 text-red-600 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      <span>OVERDUE by {actualWaitTime - entry.estimatedWaitTime} minutes</span>
                    </div>
                  )}
                </div>

                {/* Party and Special Requests */}
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">Arrived:</span> {new Date(entry.arrivalTime).toLocaleTimeString()}
                  </div>
                  {entry.specialRequests && (
                    <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <span className="font-medium">Special Requests:</span> {entry.specialRequests}
                    </div>
                  )}
                </div>

                {/* Notifications */}
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">Notifications:</span> {entry.notificationsSent}
                    {entry.lastNotificationTime && (
                      <span className="text-gray-500 ml-2">
                        (Last: {new Date(entry.lastNotificationTime).toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {entry.status === 'waiting' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowNotifyDialog(true);
                        }}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        Notify
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowAssignDialog(true);
                        }}
                        disabled={getSuitableTables(entry.partySize).length === 0}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Assign Table
                      </Button>
                    </>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleNotifyCustomer(entry, 'call')}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                  
                  {entry.status === 'waiting' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleUpdateStatus(entry.id, 'cancelled')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredWaitlist.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No entries in waitlist</p>
            <p className="text-sm text-gray-400 mt-2">
              {filterStatus !== 'all' ? 'Try changing the filter to see more entries' : 'Customers will appear here when added to the waitlist'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notify Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify Customer</DialogTitle>
            <DialogDescription>
              Choose how to notify {selectedEntry?.customerName} about their table
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div><strong>Customer:</strong> {selectedEntry.customerName}</div>
                  <div><strong>Phone:</strong> {selectedEntry.phone}</div>
                  {selectedEntry.email && <div><strong>Email:</strong> {selectedEntry.email}</div>}
                  <div><strong>Party Size:</strong> {selectedEntry.partySize} people</div>
                  <div><strong>Wait Time:</strong> {getActualWaitTime(selectedEntry.arrivalTime)} minutes</div>
                  <div><strong>Notifications Sent:</strong> {selectedEntry.notificationsSent}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <Button
                  className="justify-start"
                  onClick={() => {
                    handleNotifyCustomer(selectedEntry, 'sms');
                    setShowNotifyDialog(false);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send SMS
                </Button>
                <Button
                  className="justify-start"
                  onClick={() => {
                    handleNotifyCustomer(selectedEntry, 'call');
                    setShowNotifyDialog(false);
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Make Phone Call
                </Button>
                {selectedEntry.email && (
                  <Button
                    className="justify-start"
                    onClick={() => {
                      handleNotifyCustomer(selectedEntry, 'email');
                      setShowNotifyDialog(false);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Email
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotifyDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Table Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Table</DialogTitle>
            <DialogDescription>
              Assign {selectedEntry?.customerName} to an available table
            </DialogDescription>
          </DialogHeader>
          
          {selectedEntry && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="space-y-1 text-sm">
                  <div><strong>Customer:</strong> {selectedEntry.customerName}</div>
                  <div><strong>Party Size:</strong> {selectedEntry.partySize} people</div>
                  <div><strong>Wait Time:</strong> {getActualWaitTime(selectedEntry.arrivalTime)} minutes</div>
                  {selectedEntry.specialRequests && (
                    <div><strong>Special Requests:</strong> {selectedEntry.specialRequests}</div>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="tableSelect">Select Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an available table" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSuitableTables(selectedEntry.partySize).map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name} - {table.capacity} seats ({table.section})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {getSuitableTables(selectedEntry.partySize).length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">No suitable tables available</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    No tables with capacity for {selectedEntry.partySize} people are currently available.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTable}
              disabled={!selectedTable}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Assign Table
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}