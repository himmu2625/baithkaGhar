'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Key,
  User,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  MapPin,
  Star
} from 'lucide-react';

interface PropertyCredential {
  id: string;
  propertyId: string;
  propertyName: string;
  username: string;
  password: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions: string[];
}

interface Property {
  _id: string;
  name: string;
  title: string;
  address: {
    city: string;
    state: string;
    country: string;
  };
  location: string;
  verificationStatus: string;
  createdAt: string;
}

export default function PropertyCredentialsPage() {
  const [credentials, setCredentials] = useState<PropertyCredential[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<PropertyCredential | null>(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    propertyName: '',
    selectedProperty: null as Property | null,
    username: '',
    password: '',
    isActive: true,
    permissions: [] as string[]
  });

  // Fetch credentials on component mount
  useEffect(() => {
    fetchCredentials();
  }, []);

  // Fetch available properties when add dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      fetchAvailableProperties();
    }
  }, [isAddDialogOpen]);

  const fetchCredentials = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/property-credentials');
      const data = await response.json();
      
      if (data.success) {
        setCredentials(data.data);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableProperties = async () => {
    try {
      setIsLoadingProperties(true);
      const response = await fetch('/api/admin/property-credentials/available-properties');
      const data = await response.json();
      
      if (data.success) {
        setAvailableProperties(data.data);
      }
    } catch (error) {
      console.error('Error fetching available properties:', error);
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const availablePermissions = [
    'dashboard',
    'inventory', 
    'bookings',
    'financial',
    'staff',
    'reports',
    'settings'
  ];

  const togglePasswordVisibility = (id: string) => {
    setShowPassword(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddCredential = async () => {
    if (!formData.selectedProperty) {
      alert('Please select a property first');
      return;
    }

    try {
      const response = await fetch('/api/admin/property-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: formData.selectedProperty._id,
          propertyName: formData.selectedProperty.name || formData.selectedProperty.title,
          username: formData.username,
          password: formData.password,
          isActive: formData.isActive,
          permissions: formData.permissions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh credentials list
        await fetchCredentials();
        setIsAddDialogOpen(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to create credential');
      }
    } catch (error) {
      console.error('Error creating credential:', error);
      alert('Failed to create credential');
    }
  };

  const handlePropertySelect = (property: Property) => {
    setFormData(prev => ({
      ...prev,
      selectedProperty: property,
      propertyId: property._id,
      propertyName: property.name || property.title
    }));
  };

  const handleEditCredential = async () => {
    if (!editingCredential) return;

    try {
      const response = await fetch('/api/admin/property-credentials', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingCredential.id,
          username: formData.username,
          password: formData.password,
          isActive: formData.isActive,
          permissions: formData.permissions
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh credentials list
        await fetchCredentials();
        setIsEditDialogOpen(false);
        setEditingCredential(null);
        resetForm();
      } else {
        alert(data.error || 'Failed to update credential');
      }
    } catch (error) {
      console.error('Error updating credential:', error);
      alert('Failed to update credential');
    }
  };

  const handleDeleteCredential = async (id: string) => {
    if (!confirm('Are you sure you want to delete this credential?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/property-credentials?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh credentials list
        await fetchCredentials();
      } else {
        alert(data.error || 'Failed to delete credential');
      }
    } catch (error) {
      console.error('Error deleting credential:', error);
      alert('Failed to delete credential');
    }
  };

  const handleEdit = (credential: PropertyCredential) => {
    setEditingCredential(credential);
    setFormData({
      propertyId: credential.propertyId,
      propertyName: credential.propertyName,
      selectedProperty: null,
      username: credential.username,
      password: credential.password,
      isActive: credential.isActive,
      permissions: credential.permissions
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      propertyId: '',
      propertyName: '',
      selectedProperty: null,
      username: '',
      password: '',
      isActive: true,
      permissions: []
    });
  };

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const filteredProperties = availableProperties.filter(property =>
    property.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.state?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading property credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Property Credentials</h1>
          <p className="text-gray-600 mt-2">Manage Baithaka GHAR OS access for each property</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              <span>Add Property Credential</span>
            </Button>
          </DialogTrigger>
                     <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
             <DialogHeader className="flex-shrink-0">
               <DialogTitle className="text-xl">Add Property Credential</DialogTitle>
               <DialogDescription>
                 Create new login credentials for a property to access Baithaka GHAR OS.
               </DialogDescription>
             </DialogHeader>
             
                                       <div className="space-y-6 flex-1 overflow-y-auto px-1 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
               {/* Property Selection */}
               <div className="space-y-3">
                 <Label className="text-sm font-medium">Select Property</Label>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                                 {/* Property List */}
                 <div className="border rounded-lg max-h-48 overflow-y-auto">
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-sm text-gray-600">Loading properties...</span>
                    </div>
                  ) : filteredProperties.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">No available properties found</p>
                      <p className="text-sm">All properties already have credentials assigned.</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredProperties.map((property) => (
                        <div
                          key={property._id}
                          className={`p-4 cursor-pointer transition-colors ${
                            formData.selectedProperty?._id === property._id 
                              ? 'bg-blue-50 border-l-4 border-blue-500' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handlePropertySelect(property)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <Building2 className="w-5 h-5 text-gray-400" />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {property.name || property.title}
                                  </p>
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                    <div className="flex items-center space-x-1">
                                      <MapPin className="w-3 h-3" />
                                      <span>{property.address?.city}, {property.address?.state}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(property.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {formData.selectedProperty?._id === property._id && (
                              <CheckCircle className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Credential Details */}
              {formData.selectedProperty && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Selected Property</span>
                    </div>
                    <p className="text-blue-800 font-medium">{formData.selectedProperty.name || formData.selectedProperty.title}</p>
                    <p className="text-blue-600 text-sm">{formData.selectedProperty.address?.city}, {formData.selectedProperty.address?.state}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        placeholder="e.g., delhi_manager"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={generatePassword}
                          className="flex-shrink-0"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Permissions</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {availablePermissions.map(permission => (
                        <div key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={permission}
                            checked={formData.permissions.includes(permission)}
                            onChange={() => togglePermission(permission)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor={permission} className="text-sm capitalize cursor-pointer">
                            {permission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
                         </div>

             <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddCredential}
                disabled={!formData.selectedProperty || !formData.username || !formData.password}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Credential
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Properties</p>
                <p className="text-2xl font-bold text-blue-900">{credentials.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Active Credentials</p>
                <p className="text-2xl font-bold text-green-900">
                  {credentials.filter(c => c.isActive).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Inactive Credentials</p>
                <p className="text-2xl font-bold text-red-900">
                  {credentials.filter(c => !c.isActive).length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Recent Logins</p>
                <p className="text-2xl font-bold text-purple-900">
                  {credentials.filter(c => c.lastLogin).length}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credentials Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Property Credentials</CardTitle>
          <CardDescription>
            Manage login credentials for each property's Baithaka GHAR OS access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials yet</h3>
              <p className="text-gray-500 mb-6">Get started by adding credentials for your properties.</p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Credential
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credentials.map((credential) => (
                  <TableRow key={credential.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{credential.propertyName}</p>
                        <p className="text-sm text-gray-500">{credential.propertyId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">{credential.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">
                          {showPassword[credential.id] 
                            ? credential.password 
                            : '••••••••'
                          }
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(credential.id)}
                          className="h-6 w-6 p-0"
                        >
                          {showPassword[credential.id] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={credential.isActive ? "default" : "secondary"}
                        className={credential.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {credential.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {credential.lastLogin ? (
                        <span className="text-sm text-gray-600">
                          {new Date(credential.lastLogin).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {credential.permissions.slice(0, 3).map(permission => (
                          <Badge key={permission} variant="outline" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {credential.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{credential.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(credential)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCredential(credential.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property Credential</DialogTitle>
            <DialogDescription>
              Update login credentials for the property.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Password</Label>
              <div className="flex space-x-2">
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="flex-shrink-0"
                >
                  <Key className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map(permission => (
                  <div key={permission} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`edit-${permission}`}
                      checked={formData.permissions.includes(permission)}
                      onChange={() => togglePermission(permission)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`edit-${permission}`} className="text-sm capitalize cursor-pointer">
                      {permission}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCredential} className="bg-blue-600 hover:bg-blue-700">
              Update Credential
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 