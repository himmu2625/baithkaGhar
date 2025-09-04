'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail,
  MapPin,
  Edit,
  Trash2
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourlyRate: number;
  available: boolean;
}

interface StaffSchedule {
  id: string;
  staffId: string;
  eventId: string;
  eventTitle: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export default function EventStaffPage({ params }: { params: { propertyId: string } }) {
  const [activeTab, setActiveTab] = useState<'staff' | 'schedule'>('staff');
  const [isAddStaffDialogOpen, setIsAddStaffDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();

  const [staff, setStaff] = useState<StaffMember[]>([
    {
      id: '1',
      name: 'John Smith',
      role: 'Event Manager',
      phone: '+1234567890',
      email: 'john@example.com',
      hourlyRate: 25,
      available: true
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Waitstaff',
      phone: '+1234567891',
      email: 'sarah@example.com',
      hourlyRate: 15,
      available: true
    },
    {
      id: '3',
      name: 'Mike Davis',
      role: 'Security',
      phone: '+1234567892',
      email: 'mike@example.com',
      hourlyRate: 20,
      available: false
    }
  ]);

  const [schedules, setSchedules] = useState<StaffSchedule[]>([
    {
      id: '1',
      staffId: '1',
      eventId: 'evt1',
      eventTitle: 'Wedding Reception',
      date: new Date(2024, 2, 15),
      startTime: '16:00',
      endTime: '23:00',
      venue: 'Grand Ballroom',
      status: 'confirmed'
    },
    {
      id: '2',
      staffId: '2',
      eventId: 'evt1',
      eventTitle: 'Wedding Reception',
      date: new Date(2024, 2, 15),
      startTime: '17:00',
      endTime: '23:00',
      venue: 'Grand Ballroom',
      status: 'scheduled'
    }
  ]);

  const roles = ['Event Manager', 'Waitstaff', 'Security', 'Bartender', 'Chef', 'Cleaner', 'Photographer', 'DJ'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const StaffDialog = () => (
    <Dialog open={isAddStaffDialogOpen} onOpenChange={setIsAddStaffDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Staff Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Staff Member</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" required />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" />
            </div>
          </div>
          <div>
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input id="hourlyRate" type="number" step="0.01" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsAddStaffDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Staff Member</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const ScheduleDialog = () => (
    <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Staff
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Staff</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <div>
            <Label>Staff Member</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staff.filter(s => s.available).map(member => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Event</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evt1">Wedding Reception - Grand Ballroom</SelectItem>
                <SelectItem value="evt2">Corporate Meeting - Conference Room A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? selectedDate.toDateString() : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Start Time</Label>
              <Input id="startTime" type="time" />
            </div>
            <div>
              <Label htmlFor="endTime">End Time</Label>
              <Input id="endTime" type="time" />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Schedule Staff</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members and their schedules</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'staff' ? <StaffDialog /> : <ScheduleDialog />}
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <Button
          variant={activeTab === 'staff' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('staff')}
          className="rounded-b-none"
        >
          Staff Members
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('schedule')}
          className="rounded-b-none"
        >
          Schedules
        </Button>
      </div>

      {activeTab === 'staff' && (
        <div className="grid gap-4">
          {staff.map(member => (
            <Card key={member.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{member.name}</h3>
                        <Badge variant="outline">{member.role}</Badge>
                        <Badge variant={member.available ? 'default' : 'secondary'}>
                          {member.available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {member.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${member.hourlyRate}/hour</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid gap-4">
          {schedules.map(schedule => {
            const staffMember = staff.find(s => s.id === schedule.staffId);
            return (
              <Card key={schedule.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{schedule.eventTitle}</h3>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span className="font-medium">{staffMember?.name}</span>
                          <span className="text-muted-foreground">({staffMember?.role})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="h-4 w-4" />
                          {schedule.date.toDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {schedule.startTime} - {schedule.endTime}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {schedule.venue}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}