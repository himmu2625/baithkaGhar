"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Filter, 
  Search, 
  Download, 
  Upload,
  TrendingUp,
  Building,
  Calendar,
  BarChart3,
  Settings,
  RefreshCw,
  Users,
  MapPin,
  Star,
  Check,
  X
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { BulkPriceEditDialog } from '@/components/admin/pricing/BulkPriceEditDialog';

interface Property {
  id: string;
  title: string;
  price: number | { base: number };
  location: string;
  type: string;
  status: 'active' | 'pending' | 'inactive';
  rating: number;
  reviewCount: number;
  bookings: number;
  revenue: number;
  lastUpdated: string;
  hasDynamicPricing: boolean;
}

interface FilterOptions {
  search: string;
  type: string;
  status: string;
  location: string;
  priceRange: {
    min: string;
    max: string;
  };
  hasDynamicPricing: string;
}

export default function BulkPricingPage() {
  const { toast } = useToast();

  // State management
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    type: 'all',
    status: 'all',
    location: 'all',
    priceRange: { min: '', max: '' },
    hasDynamicPricing: 'all'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Fetch properties
  const fetchProperties = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/properties?includeStats=true&limit=1000');
      const data = await response.json();
      
      if (response.ok && data.properties) {
        const formattedProperties: Property[] = data.properties.map((prop: any) => ({
          id: prop.id || prop._id,
          title: prop.title,
          price: prop.price?.base || prop.price || 0,
          location: `${prop.address || prop.location?.city || 'Unknown'}, ${prop.location?.state || ''}`,
          type: prop.propertyType || prop.type || 'Unknown',
          status: prop.status === 'available' ? 'active' : (prop.verificationStatus === 'pending' ? 'pending' : 'inactive'),
          rating: prop.rating || 0,
          reviewCount: prop.reviewCount || 0,
          bookings: prop.bookings || 0,
          revenue: prop.revenue || 0,
          lastUpdated: prop.updatedAt || prop.createdAt || new Date().toISOString(),
          hasDynamicPricing: !!(prop.dynamicPricing?.enabled)
        }));
        
        setProperties(formattedProperties);
      } else {
        throw new Error(data.error || 'Failed to fetch properties');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load properties on mount
  useEffect(() => {
    fetchProperties();
  }, []);

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!property.title.toLowerCase().includes(searchLower) &&
            !property.location.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== 'all' && property.type.toLowerCase() !== filters.type.toLowerCase()) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && property.status !== filters.status) {
        return false;
      }

      // Location filter (basic city matching)
      if (filters.location !== 'all') {
        if (!property.location.toLowerCase().includes(filters.location.toLowerCase())) {
          return false;
        }
      }

      // Price range filter
      const propertyPrice = typeof property.price === 'object' ? property.price.base : property.price;
      if (filters.priceRange.min && propertyPrice < parseFloat(filters.priceRange.min)) {
        return false;
      }
      if (filters.priceRange.max && propertyPrice > parseFloat(filters.priceRange.max)) {
        return false;
      }

      // Dynamic pricing filter
      if (filters.hasDynamicPricing === 'true' && !property.hasDynamicPricing) {
        return false;
      }
      if (filters.hasDynamicPricing === 'false' && property.hasDynamicPricing) {
        return false;
      }

      return true;
    });
  }, [properties, filters]);

  // Paginated properties
  const paginatedProperties = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProperties.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProperties, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(properties.map(p => p.type))).filter(Boolean);
    return types.sort();
  }, [properties]);

  const uniqueLocations = useMemo(() => {
    const locations = Array.from(new Set(
      properties.map(p => p.location.split(',')[0].trim())
    )).filter(Boolean);
    return locations.sort();
  }, [properties]);

  // Statistics
  const stats = useMemo(() => {
    const totalProperties = filteredProperties.length;
    const activeProperties = filteredProperties.filter(p => p.status === 'active').length;
    const avgPrice = filteredProperties.length > 0 
      ? filteredProperties.reduce((sum, p) => {
          const price = typeof p.price === 'object' ? p.price.base : p.price;
          return sum + price;
        }, 0) / filteredProperties.length
      : 0;
    const dynamicPricingEnabled = filteredProperties.filter(p => p.hasDynamicPricing).length;
    const totalRevenue = filteredProperties.reduce((sum, p) => sum + p.revenue, 0);

    return {
      totalProperties,
      activeProperties,
      avgPrice,
      dynamicPricingEnabled,
      totalRevenue,
      selectedCount: selectedProperties.length
    };
  }, [filteredProperties, selectedProperties]);

  // Handle property selection
  const handlePropertyToggle = (propertyId: string) => {
    setSelectedProperties(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProperties.length === paginatedProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(paginatedProperties.map(p => p.id));
    }
  };

  const handleSelectAllFiltered = () => {
    if (selectedProperties.length === filteredProperties.length) {
      setSelectedProperties([]);
    } else {
      setSelectedProperties(filteredProperties.map(p => p.id));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      type: 'all',
      status: 'all',
      location: 'all',
      priceRange: { min: '', max: '' },
      hasDynamicPricing: 'all'
    });
    setCurrentPage(1);
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Property data has been updated.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 pt-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-7 w-7 text-green-600" />
            Bulk Pricing Management
          </h1>
          <p className="text-muted-foreground">
            Update prices for multiple properties and date ranges simultaneously
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setIsBulkEditOpen(true)}
            disabled={selectedProperties.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            <Settings className="h-4 w-4 mr-1" />
            Bulk Edit ({selectedProperties.length})
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalProperties}</p>
            <p className="text-xs text-muted-foreground">Total Properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.activeProperties}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">₹{stats.avgPrice.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Avg Price</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.dynamicPricingEnabled}</p>
            <p className="text-xs text-muted-foreground">Dynamic Pricing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-500" />
            <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card className={selectedProperties.length > 0 ? 'ring-2 ring-green-500' : ''}>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold">{stats.selectedCount}</p>
            <p className="text-xs text-muted-foreground">Selected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search properties..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniqueTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select
              value={filters.location}
              onValueChange={(value) => setFilters(prev => ({ ...prev, location: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Dynamic Pricing Filter */}
            <Select
              value={filters.hasDynamicPricing}
              onValueChange={(value) => setFilters(prev => ({ ...prev, hasDynamicPricing: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dynamic Pricing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="true">With Dynamic Pricing</SelectItem>
                <SelectItem value="false">Without Dynamic Pricing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Price Range:</span>
            <Input
              type="number"
              placeholder="Min ₹"
              value={filters.priceRange.min}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, min: e.target.value }
              }))}
              className="w-32"
            />
            <span>-</span>
            <Input
              type="number"
              placeholder="Max ₹"
              value={filters.priceRange.max}
              onChange={(e) => setFilters(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange, max: e.target.value }
              }))}
              className="w-32"
            />
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selection Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                <Checkbox 
                  checked={paginatedProperties.length > 0 && selectedProperties.length === paginatedProperties.length}
                />
                <span className="ml-2">
                  Select Page ({paginatedProperties.length})
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
              >
                Select All Filtered ({filteredProperties.length})
              </Button>
              {selectedProperties.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedProperties([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Selection
                </Button>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              Showing {paginatedProperties.length} of {filteredProperties.length} properties
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Properties</CardTitle>
          <CardDescription>
            Select properties to apply bulk pricing changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : paginatedProperties.length > 0 ? (
            <div className="space-y-2">
              {paginatedProperties.map((property) => {
                const price = typeof property.price === 'object' ? property.price.base : property.price;
                return (
                  <div
                    key={property.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProperties.includes(property.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handlePropertyToggle(property.id)}
                  >
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedProperties.includes(property.id)}
                        onChange={() => handlePropertyToggle(property.id)}
                      />
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="md:col-span-2">
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {property.location}
                          </p>
                        </div>
                        
                        <div>
                          <Badge variant="secondary">{property.type}</Badge>
                          <div className="flex items-center mt-1">
                            <Star className="h-3 w-3 text-yellow-500 mr-1" />
                            <span className="text-sm">{property.rating} ({property.reviewCount})</span>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="font-bold text-lg">₹{price.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">per night</p>
                          {property.hasDynamicPricing && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Dynamic
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <Badge
                            variant={
                              property.status === 'active' ? 'default' :
                              property.status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {property.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {property.bookings} bookings
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Price Edit Dialog */}
      <BulkPriceEditDialog
        isOpen={isBulkEditOpen}
        onClose={() => setIsBulkEditOpen(false)}
        properties={properties.filter(p => selectedProperties.includes(p.id))}
        onSuccess={() => {
          fetchProperties();
          setSelectedProperties([]);
        }}
      />
    </div>
  );
} 