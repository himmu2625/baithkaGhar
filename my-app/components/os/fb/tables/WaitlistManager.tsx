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
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-br from-orange-50 to-red-100 border-0 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-500/20 rounded-xl backdrop-blur-sm">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-orange-900 tracking-tight">Waitlist Management</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4 text-orange-600" />
                    <span className="text-orange-700">Real-time Queue Management</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <span className="text-red-600 font-medium">Live Tracking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-800">{waitlistStats.totalWaiting}</div>
              <div className="text-orange-600 text-sm">Waiting</div>
            </div>
            <div className="w-px h-12 bg-orange-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-800">{waitlistStats.averageWaitTime}m</div>
              <div className="text-red-600 text-sm">Avg Wait</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-1">{waitlistStats.totalWaiting}</div>
              <div className="text-sm font-medium text-blue-600">Total Waiting</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-900 mb-1">{waitlistStats.averageWaitTime}m</div>
              <div className="text-sm font-medium text-orange-600">Avg Wait Time</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-red-900 mb-1">{waitlistStats.longestWait}m</div>
              <div className="text-sm font-medium text-red-600">Longest Wait</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-violet-100 hover:from-purple-100 hover:to-violet-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-violet-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-900 mb-1">{waitlistStats.peakHourWaiting}</div>
              <div className="text-sm font-medium text-purple-600">Peak Hour</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                  <XCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-yellow-900 mb-1">{waitlistStats.noShowRate}%</div>
              <div className="text-sm font-medium text-yellow-600">No-Show Rate</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="pt-6 relative">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-900 mb-1">{waitlistStats.satisfactionRate}</div>
              <div className="text-sm font-medium text-green-600">Satisfaction</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Controls */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-orange-50 to-red-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-100 hover:to-red-100 group backdrop-blur-sm">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                      <Users className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue placeholder="Status" className="text-orange-800 font-medium" />
                    </div>
                  </div>
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
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 group backdrop-blur-sm">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue placeholder="Sort by" className="text-blue-800 font-medium" />
                    </div>
                  </div>
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
              <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-0 shadow-sm">
                {filteredWaitlist.length} entries
              </Badge>
              <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-0 shadow-sm">
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
            <Card key={entry.id} className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
              isOverdue 
                ? 'bg-gradient-to-br from-red-50 to-pink-100 shadow-red-100' 
                : isApproaching 
                  ? 'bg-gradient-to-br from-orange-50 to-amber-100 shadow-orange-100' 
                  : 'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-indigo-100'
            }`}>
              {entry.priority === 'urgent' && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse shadow-lg border-0">
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
                    <Badge className={`${getPriorityColor(entry.priority)} border-0 shadow-sm`}>
                      {entry.priority}
                    </Badge>
                    <Badge className={`${getStatusColor(entry.status)} border-0 shadow-sm`}>
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
                    <div className="p-3 bg-gradient-to-r from-amber-50 to-yellow-100 border-0 rounded-lg text-sm shadow-sm">
                      <div className="flex items-center space-x-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-amber-800">Special Requests:</span>
                      </div>
                      <span className="text-amber-700">{entry.specialRequests}</span>
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
                        className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors shadow-sm"
                      >
                        <Bell className="w-4 h-4 mr-1 text-blue-600" />
                        Notify
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEntry(entry);
                          setShowAssignDialog(true);
                        }}
                        disabled={getSuitableTables(entry.partySize).length === 0}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:from-gray-300 disabled:to-gray-400"
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
                    className="bg-white/60 hover:bg-green-50 border-green-200 hover:border-green-300 transition-colors shadow-sm"
                  >
                    <Phone className="w-4 h-4 mr-1 text-green-600" />
                    Call
                  </Button>
                  
                  {entry.status === 'waiting' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors shadow-sm"
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
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
          <CardContent className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-6">
              <Users className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-700 mb-2">No entries in waitlist</p>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
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