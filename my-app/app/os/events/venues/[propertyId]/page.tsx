'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Plus, Edit, Trash2, Users, DollarSign, Image, Settings, Eye } from 'lucide-react';
import Link from 'next/link';

interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerHour: number;
  location: string;
  size: string;
  venueType: string;
  amenities: string[];
  isActive: boolean;
  images: string[];
  features: string[];
  bookingCount: number;
  revenue: number;
  avgRating: number;
  createdAt: string;
}

const amenityOptions = [
  'Air Conditioning', 'WiFi', 'Parking', 'Audio System', 'Stage', 
  'Kitchen Access', 'Bar Setup', 'Dance Floor', 'Projector', 
  'Microphones', 'Lighting', 'Security', 'Restrooms', 'Green Space'
];

const venueTypes = [
  'Banquet Hall', 'Conference Room', 'Outdoor Garden', 'Rooftop',
  'Ballroom', 'Terrace', 'Lawn', 'Auditorium', 'Restaurant'
];

export default function VenueManagement() {
  const { propertyId } = useParams();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: '',
    pricePerHour: '',
    location: '',
    size: '',
    venueType: '',
    amenities: [] as string[],
    features: '',
    isActive: true
  });

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await fetch(`/api/events/venues?propertyId=${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setVenues(data);
        }
      } catch (error) {
        console.error('Failed to fetch venues:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchVenues();
    }
  }, [propertyId]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      capacity: '',
      pricePerHour: '',
      location: '',
      size: '',
      venueType: '',
      amenities: [],
      features: '',
      isActive: true
    });
    setEditingVenue(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingVenue 
        ? `/api/events/venues/${editingVenue.id}` 
        : '/api/events/venues';
      
      const method = editingVenue ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId,
          capacity: parseInt(formData.capacity),
          pricePerHour: parseFloat(formData.pricePerHour),
          features: formData.features.split(',').map(f => f.trim()).filter(Boolean)
        }),
      });

      if (response.ok) {
        const venue = await response.json();
        
        if (editingVenue) {
          setVenues(venues.map(v => v.id === venue.id ? venue : v));
        } else {
          setVenues([...venues, venue]);
        }
        
        resetForm();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save venue:', error);
    }
  };

  const handleEdit = (venue: Venue) => {
    setFormData({
      name: venue.name,
      description: venue.description,
      capacity: venue.capacity.toString(),
      pricePerHour: venue.pricePerHour.toString(),
      location: venue.location,
      size: venue.size,
      venueType: venue.venueType,
      amenities: venue.amenities,
      features: venue.features.join(', '),
      isActive: venue.isActive
    });
    setEditingVenue(venue);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (venueId: string) => {
    if (confirm('Are you sure you want to delete this venue?')) {
      try {
        const response = await fetch(`/api/events/venues/${venueId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setVenues(venues.filter(v => v.id !== venueId));
        }
      } catch (error) {
        console.error('Failed to delete venue:', error);
      }
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Venue Management</h1>
          <p className="text-gray-600">Manage your event venues and spaces</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Venue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVenue ? 'Edit Venue' : 'Add New Venue'}
              </DialogTitle>
              <DialogDescription>
                {editingVenue 
                  ? 'Update venue information and settings'
                  : 'Create a new venue for your events'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venueType">Venue Type *</Label>
                  <Select value={formData.venueType} onValueChange={(value) => setFormData({ ...formData, venueType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue type" />
                    </SelectTrigger>
                    <SelectContent>
                      {venueTypes.map(type => (
                        <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerHour">Price per Hour *</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sq ft)</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Building, Floor, or Area"
                />
              </div>

              <div className="space-y-2">
                <Label>Amenities</Label>
                <div className="grid grid-cols-3 gap-2">
                  {amenityOptions.map(amenity => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={formData.amenities.includes(amenity)}
                        onCheckedChange={() => toggleAmenity(amenity)}
                      />
                      <Label htmlFor={`amenity-${amenity}`} className="text-sm">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Special Features</Label>
                <Input
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="Separate features with commas"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                />
                <Label htmlFor="isActive">Venue is active</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingVenue ? 'Update' : 'Create'} Venue
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Venues</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venues.length}</div>
            <p className="text-xs text-muted-foreground">
              {venues.filter(v => v.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {venues.reduce((sum, venue) => sum + venue.capacity, 0)}
            </div>
            <p className="text-xs text-muted-foreground">guests across all venues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {venues.reduce((sum, venue) => sum + (venue.bookingCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{venues.reduce((sum, venue) => sum + (venue.revenue || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">from venue bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Venues Table */}
      <Card>
        <CardHeader>
          <CardTitle>Venues ({venues.length})</CardTitle>
          <CardDescription>Manage your event venues and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venue Details</TableHead>
                  <TableHead>Type & Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {venues.map((venue) => (
                  <TableRow key={venue.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {venue.description}
                        </p>
                        {venue.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {venue.amenities.slice(0, 3).map((amenity) => (
                              <Badge key={amenity} variant="outline" className="text-xs">
                                {amenity}
                              </Badge>
                            ))}
                            {venue.amenities.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{venue.amenities.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{venue.venueType.replace('_', ' ')}</p>
                        {venue.location && (
                          <p className="text-sm text-gray-600 flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{venue.location}</span>
                          </p>
                        )}
                        {venue.size && (
                          <p className="text-sm text-gray-600">{venue.size} sq ft</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{venue.capacity} guests</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">₹{venue.pricePerHour.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">per hour</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {venue.bookingCount || 0} bookings
                        </p>
                        <p className="text-sm">
                          ₹{(venue.revenue || 0).toLocaleString()} revenue
                        </p>
                        {venue.avgRating && (
                          <p className="text-sm">⭐ {venue.avgRating}/5</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={venue.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                        }
                      >
                        {venue.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(venue)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(venue.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {venues.length === 0 && (
            <div className="text-center py-8">
              <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No venues created yet</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Create First Venue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}