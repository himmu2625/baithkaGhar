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
import { 
  Plus, 
  User, 
  Clock, 
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  hourlyRate: number;
  available: boolean;
  skills: string[];
}

interface StaffAssignment {
  id: string;
  staffId: string;
  eventId: string;
  eventTitle: string;
  date: Date;
  startTime: string;
  endTime: string;
  venue: string;
  role: string;
  status: 'assigned' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

interface StaffSchedulerProps {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  venue: string;
  staffMembers: StaffMember[];
  assignments: StaffAssignment[];
  onAssignStaff?: (assignment: Omit<StaffAssignment, 'id'>) => void;
  onUpdateAssignment?: (assignmentId: string, updates: Partial<StaffAssignment>) => void;
  onRemoveAssignment?: (assignmentId: string) => void;
}

export default function StaffScheduler({
  eventId,
  eventTitle,
  eventDate,
  venue,
  staffMembers,
  assignments,
  onAssignStaff,
  onUpdateAssignment,
  onRemoveAssignment
}: StaffSchedulerProps) {
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const availableStaff = staffMembers.filter(staff => 
    staff.available && !assignments.some(assignment => assignment.staffId === staff.id)
  );

  const roles = ['Event Manager', 'Waitstaff', 'Security', 'Bartender', 'Chef', 'Cleaner', 'Setup Crew'];

  const getStatusColor = (status: StaffAssignment['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500';
      case 'assigned': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleAssignStaff = () => {
    if (!selectedStaff || !selectedRole || !startTime || !endTime) return;

    const assignment: Omit<StaffAssignment, 'id'> = {
      staffId: selectedStaff,
      eventId,
      eventTitle,
      date: eventDate,
      startTime,
      endTime,
      venue,
      role: selectedRole,
      status: 'assigned',
      notes
    };

    onAssignStaff?.(assignment);
    
    setSelectedStaff('');
    setSelectedRole('');
    setStartTime('');
    setEndTime('');
    setNotes('');
    setIsAssignDialogOpen(false);
  };

  const calculateHours = (start: string, end: string) => {
    const startTime = new Date(`2000-01-01 ${start}`);
    const endTime = new Date(`2000-01-01 ${end}`);
    const diff = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return diff > 0 ? diff : 0;
  };

  const calculateTotalCost = () => {
    return assignments.reduce((total, assignment) => {
      const staff = staffMembers.find(s => s.id === assignment.staffId);
      if (!staff) return total;
      
      const hours = calculateHours(assignment.startTime, assignment.endTime);
      return total + (hours * staff.hourlyRate);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Schedule - {eventTitle}
            </CardTitle>
            <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Staff Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Staff Member</Label>
                    <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStaff.map(staff => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name} - {staff.role} (${staff.hourlyRate}/hr)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Role for Event</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="Special instructions or notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAssignStaff}>
                      Assign Staff
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {eventDate.toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {venue}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {assignments.map(assignment => {
          const staff = staffMembers.find(s => s.id === assignment.staffId);
          if (!staff) return null;

          const hours = calculateHours(assignment.startTime, assignment.endTime);
          const cost = hours * staff.hourlyRate;

          return (
            <Card key={assignment.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{staff.name}</h4>
                      <Badge variant="outline">{assignment.role}</Badge>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {assignment.startTime} - {assignment.endTime} ({hours}h)
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {staff.phone}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {staff.email}
                        </div>
                        <div className="font-medium">
                          Cost: ${cost.toFixed(2)} (${staff.hourlyRate}/hr)
                        </div>
                      </div>
                    </div>

                    {assignment.notes && (
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Notes: </span>
                        {assignment.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (assignment.status === 'assigned') {
                          onUpdateAssignment?.(assignment.id, { status: 'confirmed' });
                        }
                      }}
                      disabled={assignment.status !== 'assigned'}
                    >
                      Confirm
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onRemoveAssignment?.(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {assignments.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Staff Assigned</h3>
            <p className="text-muted-foreground mb-4">
              Start by assigning staff members to this event
            </p>
            <Button onClick={() => setIsAssignDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Assign First Staff Member
            </Button>
          </CardContent>
        </Card>
      )}

      {assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-2xl">{assignments.length}</div>
                <div className="text-muted-foreground">Staff Assigned</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-blue-600">
                  {assignments.filter(a => a.status === 'confirmed').length}
                </div>
                <div className="text-muted-foreground">Confirmed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl">
                  {assignments.reduce((total, assignment) => {
                    return total + calculateHours(assignment.startTime, assignment.endTime);
                  }, 0)}h
                </div>
                <div className="text-muted-foreground">Total Hours</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-2xl text-green-600">
                  ${calculateTotalCost().toFixed(2)}
                </div>
                <div className="text-muted-foreground">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}