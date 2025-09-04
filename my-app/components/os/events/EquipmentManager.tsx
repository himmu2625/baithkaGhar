'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Package, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  Search
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  available: number;
  condition: 'excellent' | 'good' | 'fair' | 'needs-repair';
  location: string;
  cost: number;
  image?: string;
}

interface EquipmentRequest {
  id: string;
  equipmentId: string;
  eventId: string;
  eventTitle: string;
  quantityRequested: number;
  startDate: Date;
  endDate: Date;
  status: 'requested' | 'approved' | 'allocated' | 'in-use' | 'returned';
  notes?: string;
}

interface EquipmentManagerProps {
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  equipment: Equipment[];
  requests: EquipmentRequest[];
  onRequestEquipment?: (request: Omit<EquipmentRequest, 'id'>) => void;
  onUpdateRequest?: (requestId: string, updates: Partial<EquipmentRequest>) => void;
  onCancelRequest?: (requestId: string) => void;
}

export default function EquipmentManager({
  eventId,
  eventTitle,
  eventDate,
  equipment,
  requests,
  onRequestEquipment,
  onUpdateRequest,
  onCancelRequest
}: EquipmentManagerProps) {
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [quantityRequested, setQuantityRequested] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const categories = [...new Set(equipment.map(eq => eq.category))];

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || eq.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getConditionColor = (condition: Equipment['condition']) => {
    switch (condition) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'needs-repair': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: EquipmentRequest['status']) => {
    switch (status) {
      case 'approved': return 'bg-green-500';
      case 'requested': return 'bg-blue-500';
      case 'allocated': return 'bg-purple-500';
      case 'in-use': return 'bg-orange-500';
      case 'returned': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: EquipmentRequest['status']) => {
    switch (status) {
      case 'approved':
      case 'returned':
        return <CheckCircle className="h-4 w-4" />;
      case 'in-use':
        return <Clock className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const handleRequestEquipment = () => {
    if (!selectedEquipment || !startDate || !endDate) return;

    const request: Omit<EquipmentRequest, 'id'> = {
      equipmentId: selectedEquipment,
      eventId,
      eventTitle,
      quantityRequested,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: 'requested',
      notes
    };

    onRequestEquipment?.(request);
    
    setSelectedEquipment('');
    setQuantityRequested(1);
    setStartDate('');
    setEndDate('');
    setNotes('');
    setIsRequestDialogOpen(false);
  };

  const calculateTotalCost = () => {
    return requests.reduce((total, request) => {
      const eq = equipment.find(e => e.id === request.equipmentId);
      if (!eq || request.status === 'returned') return total;
      
      const days = Math.ceil(
        (request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return total + (eq.cost * request.quantityRequested * days);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Equipment Management - {eventTitle}
            </CardTitle>
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Request Equipment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Equipment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Equipment</Label>
                    <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipment.filter(eq => eq.available > 0).map(eq => (
                          <SelectItem key={eq.id} value={eq.id}>
                            {eq.name} - {eq.available} available (${eq.cost}/day)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      value={quantityRequested}
                      onChange={(e) => setQuantityRequested(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endDate">End Date</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special requirements or notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleRequestEquipment}>
                      Request Equipment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Equipment</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search equipment..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEquipment.map(eq => (
                <div key={eq.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{eq.name}</h4>
                      <p className="text-sm text-muted-foreground">{eq.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">${eq.cost}/day</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{eq.category}</Badge>
                      <Badge className={getConditionColor(eq.condition)}>
                        {eq.condition}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className={eq.available > 0 ? 'text-green-600' : 'text-red-600'}>
                        {eq.available}/{eq.quantity} available
                      </span>
                    </div>
                  </div>
                  
                  {eq.available === 0 && (
                    <div className="flex items-center gap-1 mt-2 text-red-600 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Currently unavailable
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Requests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.map(request => {
                const eq = equipment.find(e => e.id === request.equipmentId);
                if (!eq) return null;

                const days = Math.ceil(
                  (request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)
                );
                const cost = eq.cost * request.quantityRequested * days;

                return (
                  <div key={request.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{eq.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {request.quantityRequested}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            {request.status.replace('-', ' ')}
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        {request.startDate.toLocaleDateString()} - {request.endDate.toLocaleDateString()} ({days} days)
                      </div>
                      <div className="font-medium">Cost: ${cost.toFixed(2)}</div>
                      {request.notes && (
                        <div>Notes: {request.notes}</div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-3">
                      {request.status === 'requested' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => onUpdateRequest?.(request.id, { status: 'approved' })}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onCancelRequest?.(request.id)}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <Button 
                          size="sm"
                          onClick={() => onUpdateRequest?.(request.id, { status: 'allocated' })}
                        >
                          Allocate
                        </Button>
                      )}
                      {request.status === 'allocated' && (
                        <Button 
                          size="sm"
                          onClick={() => onUpdateRequest?.(request.id, { status: 'in-use' })}
                        >
                          Mark In Use
                        </Button>
                      )}
                      {request.status === 'in-use' && (
                        <Button 
                          size="sm"
                          onClick={() => onUpdateRequest?.(request.id, { status: 'returned' })}
                        >
                          Mark Returned
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}

              {requests.length === 0 && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Equipment Requested</h3>
                  <p className="text-muted-foreground">
                    Request equipment needed for your event
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Request Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-2xl">{requests.length}</div>
                    <div className="text-muted-foreground">Total Requests</div>
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
      </div>
    </div>
  );
}