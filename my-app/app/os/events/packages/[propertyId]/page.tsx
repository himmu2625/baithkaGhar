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
import { Package, Plus, Edit, Trash2, Star, Users, DollarSign, TrendingUp, Eye } from 'lucide-react';

interface EventPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  duration: string;
  guestRange: {
    min: number;
    max: number;
  };
  inclusions: string[];
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  bookingCount: number;
  revenue: number;
  createdAt: string;
}

const packageCategories = [
  'Wedding', 'Birthday', 'Anniversary', 'Corporate', 'Conference',
  'Reception', 'Engagement', 'Cultural', 'Festival', 'Other'
];

const commonInclusions = [
  'Venue Decoration', 'Basic Catering', 'Audio System', 'Lighting',
  'Photography', 'Videography', 'DJ Services', 'Security',
  'Parking', 'Welcome Drinks', 'Cake Cutting', 'Floral Arrangements',
  'Table Setup', 'Stage Setup', 'Backdrop', 'Transportation'
];

const packageFeatures = [
  'Customizable Menu', 'Multiple Venues', 'Extended Hours',
  'Premium Decoration', 'Live Entertainment', 'Professional Photography',
  '360° Videography', 'Drone Coverage', 'Live Streaming',
  'Social Media Coverage', 'Guest Coordination', 'Bridal Room'
];

export default function PackageManagement() {
  const { propertyId } = useParams();
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<EventPackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    duration: '',
    guestMin: '',
    guestMax: '',
    inclusions: [] as string[],
    features: [] as string[],
    isPopular: false,
    isActive: true
  });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch(`/api/events/packages?propertyId=${propertyId}`);
        if (response.ok) {
          const data = await response.json();
          setPackages(data);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchPackages();
    }
  }, [propertyId]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      originalPrice: '',
      category: '',
      duration: '',
      guestMin: '',
      guestMax: '',
      inclusions: [],
      features: [],
      isPopular: false,
      isActive: true
    });
    setEditingPackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingPackage 
        ? `/api/events/packages/${editingPackage.id}` 
        : '/api/events/packages';
      
      const method = editingPackage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          propertyId,
          price: parseFloat(formData.price),
          originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
          guestRange: {
            min: parseInt(formData.guestMin),
            max: parseInt(formData.guestMax)
          }
        }),
      });

      if (response.ok) {
        const packageData = await response.json();
        
        if (editingPackage) {
          setPackages(packages.map(p => p.id === packageData.id ? packageData : p));
        } else {
          setPackages([...packages, packageData]);
        }
        
        resetForm();
        setIsAddDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to save package:', error);
    }
  };

  const handleEdit = (pkg: EventPackage) => {
    setFormData({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price.toString(),
      originalPrice: pkg.originalPrice?.toString() || '',
      category: pkg.category,
      duration: pkg.duration,
      guestMin: pkg.guestRange.min.toString(),
      guestMax: pkg.guestRange.max.toString(),
      inclusions: pkg.inclusions,
      features: pkg.features,
      isPopular: pkg.isPopular,
      isActive: pkg.isActive
    });
    setEditingPackage(pkg);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (packageId: string) => {
    if (confirm('Are you sure you want to delete this package?')) {
      try {
        const response = await fetch(`/api/events/packages/${packageId}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setPackages(packages.filter(p => p.id !== packageId));
        }
      } catch (error) {
        console.error('Failed to delete package:', error);
      }
    }
  };

  const toggleInclusion = (inclusion: string) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.includes(inclusion)
        ? prev.inclusions.filter(i => i !== inclusion)
        : [...prev.inclusions, inclusion]
    }));
  };

  const toggleFeature = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
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
          <h1 className="text-3xl font-bold text-gray-900">Package Management</h1>
          <p className="text-gray-600">Create and manage event packages for your property</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPackage ? 'Edit Package' : 'Create New Package'}
              </DialogTitle>
              <DialogDescription>
                {editingPackage 
                  ? 'Update package details and offerings'
                  : 'Create a comprehensive event package for your clients'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Basic Information</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Package Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {packageCategories.map(category => (
                          <SelectItem key={category} value={category.toLowerCase()}>
                            {category}
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
                    placeholder="Describe what makes this package special..."
                  />
                </div>
              </div>

              {/* Pricing & Capacity */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Pricing & Capacity</h4>
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Package Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price</Label>
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      min="0"
                      step="0.01"
                      placeholder="For discount display"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestMin">Min Guests *</Label>
                    <Input
                      id="guestMin"
                      type="number"
                      value={formData.guestMin}
                      onChange={(e) => setFormData({ ...formData, guestMin: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guestMax">Max Guests *</Label>
                    <Input
                      id="guestMax"
                      type="number"
                      value={formData.guestMax}
                      onChange={(e) => setFormData({ ...formData, guestMax: e.target.value })}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 6 hours, Full day, 2 days"
                  />
                </div>
              </div>

              {/* Inclusions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Package Inclusions</h4>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {commonInclusions.map(inclusion => (
                    <div key={inclusion} className="flex items-center space-x-2">
                      <Checkbox
                        id={`inclusion-${inclusion}`}
                        checked={formData.inclusions.includes(inclusion)}
                        onCheckedChange={() => toggleInclusion(inclusion)}
                      />
                      <Label htmlFor={`inclusion-${inclusion}`} className="text-sm">
                        {inclusion}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Premium Features</h4>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {packageFeatures.map(feature => (
                    <div key={feature} className="flex items-center space-x-2">
                      <Checkbox
                        id={`feature-${feature}`}
                        checked={formData.features.includes(feature)}
                        onCheckedChange={() => toggleFeature(feature)}
                      />
                      <Label htmlFor={`feature-${feature}`} className="text-sm">
                        {feature}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Package Settings</h4>
                
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPopular: !!checked })}
                    />
                    <Label htmlFor="isPopular">Mark as Popular</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                    />
                    <Label htmlFor="isActive">Package is Active</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Update' : 'Create'} Package
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
            <CardTitle className="text-sm font-medium">Total Packages</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packages.length}</div>
            <p className="text-xs text-muted-foreground">
              {packages.filter(p => p.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Packages</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.filter(p => p.isPopular).length}
            </div>
            <p className="text-xs text-muted-foreground">featured packages</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {packages.reduce((sum, pkg) => sum + (pkg.bookingCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">package bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{packages.reduce((sum, pkg) => sum + (pkg.revenue || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">from packages</p>
          </CardContent>
        </Card>
      </div>

      {/* Packages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Event Packages ({packages.length})</CardTitle>
          <CardDescription>Manage your event packages and their details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package Details</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg) => {
                  const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
                  const discountPercentage = hasDiscount 
                    ? Math.round(((pkg.originalPrice! - pkg.price) / pkg.originalPrice!) * 100)
                    : 0;

                  return (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{pkg.name}</p>
                            {pkg.isPopular && (
                              <Badge className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {pkg.description}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {pkg.inclusions.length} inclusions
                            </Badge>
                            {pkg.features.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {pkg.features.length} features
                              </Badge>
                            )}
                            {pkg.duration && (
                              <Badge variant="outline" className="text-xs">
                                {pkg.duration}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {pkg.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">₹{pkg.price.toLocaleString()}</span>
                            {hasDiscount && (
                              <>
                                <span className="text-sm text-gray-500 line-through">
                                  ₹{pkg.originalPrice!.toLocaleString()}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  {discountPercentage}% OFF
                                </Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {pkg.guestRange.min}-{pkg.guestRange.max} guests
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{pkg.bookingCount || 0} bookings</p>
                          <p>₹{(pkg.revenue || 0).toLocaleString()} revenue</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={pkg.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {pkg.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(pkg.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {packages.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No packages created yet</p>
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                Create First Package
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}