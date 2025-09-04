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
import { Plus, Edit, Trash2, DollarSign, Clock, Users } from 'lucide-react';

interface EventService {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit: string;
  duration?: number;
  maxGuests?: number;
  available: boolean;
}

export default function EventServicesPage({ params }: { params: { propertyId: string } }) {
  const [services, setServices] = useState<EventService[]>([
    {
      id: '1',
      name: 'Photography Package',
      category: 'Photography',
      description: 'Professional event photography with edited photos',
      price: 1500,
      unit: 'per event',
      duration: 8,
      available: true
    },
    {
      id: '2',
      name: 'DJ Services',
      category: 'Entertainment',
      description: 'Professional DJ with sound system and lighting',
      price: 800,
      unit: 'per event',
      duration: 6,
      available: true
    },
    {
      id: '3',
      name: 'Floral Arrangements',
      category: 'Decoration',
      description: 'Custom floral decorations for events',
      price: 50,
      unit: 'per arrangement',
      available: true
    }
  ]);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<EventService | null>(null);
  const [formData, setFormData] = useState<Partial<EventService>>({});

  const categories = ['Photography', 'Entertainment', 'Decoration', 'Catering', 'Transportation', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      setServices(prev => prev.map(service => 
        service.id === editingService.id ? { ...service, ...formData } : service
      ));
    } else {
      const newService: EventService = {
        id: Date.now().toString(),
        name: formData.name || '',
        category: formData.category || '',
        description: formData.description || '',
        price: formData.price || 0,
        unit: formData.unit || 'per event',
        duration: formData.duration,
        maxGuests: formData.maxGuests,
        available: formData.available ?? true
      };
      setServices(prev => [...prev, newService]);
    }
    setIsAddDialogOpen(false);
    setEditingService(null);
    setFormData({});
  };

  const handleEdit = (service: EventService) => {
    setEditingService(service);
    setFormData(service);
    setIsAddDialogOpen(true);
  };

  const handleDelete = (serviceId: string) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
  };

  const ServiceDialog = () => (
    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => { setEditingService(null); setFormData({}); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingService ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Service Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.category || ''} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., per event, per hour, per item"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label htmlFor="maxGuests">Max Guests</Label>
              <Input
                id="maxGuests"
                type="number"
                value={formData.maxGuests || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: parseInt(e.target.value) }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingService ? 'Update Service' : 'Add Service'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Event Services</h1>
          <p className="text-muted-foreground">Manage additional services for events</p>
        </div>
        <ServiceDialog />
      </div>

      <div className="grid gap-4">
        {services.map(service => (
          <Card key={service.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{service.name}</h3>
                    <Badge variant={service.available ? 'default' : 'secondary'}>
                      {service.available ? 'Available' : 'Unavailable'}
                    </Badge>
                    <Badge variant="outline">{service.category}</Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-3">{service.description}</p>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">${service.price}</span>
                      <span className="text-muted-foreground">{service.unit}</span>
                    </div>
                    
                    {service.duration && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration} hours</span>
                      </div>
                    )}
                    
                    {service.maxGuests && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>Max {service.maxGuests} guests</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEdit(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <h3 className="text-lg font-medium mb-2">No services found</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first event service
            </p>
            <ServiceDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}