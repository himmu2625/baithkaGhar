"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  Download,
  Home,
  Image as LucideImage,
  Eye,
  Edit,
  X,
  Filter,
  Search,
  Pencil,
  Star,
  MapPin,
  CheckCircle2,
  Circle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign
} from "lucide-react"
import { format } from "date-fns"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PropertyEditModal } from "@/components/admin/property/PropertyEditModal"
import { PropertyStatusToggle } from "@/components/admin/property/PropertyStatusToggle"
import { Button as ShadcnButton } from "@/components/ui/button"
import AdminDynamicPricingIndicator from "@/components/admin/DynamicPricingIndicator"
import RoomManagementModal from "@/components/admin/room-management/RoomManagementModal"

// Property type definition
interface Property {
  id: string
  title: string
  type: string
  ownerId: string
  ownerName: string
  price: number
  location: {
    city: string
    state: string
  }
  rooms: {
    bedrooms: number
    bathrooms: number
  }
  status: 'active' | 'pending' | 'inactive'
  featured: boolean
  verified: boolean
  rating: number | null
  reviewCount: number
  createdAt: string
  thumbnail: string | null
}

export default function AdminPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [roomManagementProperty, setRoomManagementProperty] = useState<Property | null>(null)
  const [isRoomManagementOpen, setIsRoomManagementOpen] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProperties, setTotalProperties] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  
  // Fetch real property data from API with pagination
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: pageSize.toString(),
          timestamp: Date.now().toString()
        });
        
        // Add filters to query
        if (activeTab !== "all") {
          params.append('status', activeTab === 'active' ? 'available' : activeTab);
        }
        
        if (filterType !== "all") {
          params.append('propertyType', filterType);
        }
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        const response = await fetch(`/api/admin/properties?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.properties) {
          throw new Error('Invalid response format: missing properties array');
        }
        
        // Transform properties to match the expected format
        const formattedProperties = data.properties.map((prop: any) => ({
          id: prop.id || prop._id,
          title: prop.title,
          type: prop.propertyType || 'Unknown',
          ownerId: prop.host?.id || 'unknown',
          ownerName: prop.host?.name || 'Unknown Owner',
          price: prop.price?.base || 0,
          location: {
            city: prop.address || 'Unknown location',
            state: prop.location?.state || ''
          },
          rooms: {
            bedrooms: prop.bedrooms || 0,
            bathrooms: prop.bathrooms || 0
          },
          status: prop.status === 'available' ? 'active' : (prop.verificationStatus === 'pending' ? 'pending' : 'inactive'),
          featured: prop.featured || false,
          verified: prop.verificationStatus === 'approved',
          rating: prop.rating || null,
          reviewCount: prop.reviewCount || 0,
          createdAt: prop.createdAt,
          thumbnail: prop.images && prop.images.length > 0 ? prop.images[0].url : null
        }));
        
        console.log(`Fetched ${formattedProperties.length} properties (page ${currentPage})`);
        setProperties(formattedProperties);
        
        // Update pagination info
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalProperties(data.pagination.total);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to load properties');
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProperties();
  }, [currentPage, pageSize, activeTab, filterType, searchTerm]);
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterType, searchTerm]);
  
  // Reset to page 1 when page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }
  
  // Status badge component
  const StatusBadge = ({ status }: { status: Property['status'] }) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600 hover:bg-yellow-700">Pending</Badge>
      case 'inactive':
        return <Badge className="bg-red-600 hover:bg-red-700">Inactive</Badge>
      default:
        return null
    }
  }
  
  // Property type option
  const propertyTypes = [
    { value: "all", label: "All Types" },
    { value: "apartment", label: "Apartment" },
    { value: "house", label: "House" },
    { value: "hotel", label: "Hotel" },
    { value: "villa", label: "Villa" },
    { value: "resort", label: "Resort" },
  ];
  
  // Function to open edit modal with full property details
  const handleEditProperty = async (property: Property) => {
    try {
      setLoading(true);
      
      // Fetch full property details from the API
      console.log(`Fetching full details for property: ${property.id}`);
      
      const response = await fetch(`/api/properties/${property.id}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch property details: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success || !data.property) {
        throw new Error('Invalid response format');
      }
      
      console.log('Full property details fetched:', data.property);
      
      // Set the full property details for editing
      setEditingProperty(data.property);
      setIsEditModalOpen(true);
      
    } catch (error) {
      console.error('Error fetching property details:', error);
      toast({
        title: "Error",
        description: "Failed to load property details for editing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh properties after edit
  const handlePropertyUpdated = () => {
    // Reset to first page and refetch
    setCurrentPage(1);
  };
  
  // Handle status toggle
  const handleToggleStatus = async (propertyId: string, currentStatus: string) => {
    try {
      setLoading(true);
      
      // Determine the new status (toggle between active and inactive)
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      console.log(`Toggling property ${propertyId} status from ${currentStatus} to ${newStatus}`);
      
      const response = await fetch(`/api/properties/${propertyId}/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          status: newStatus,
          _method: "patch"
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update property status");
      }

      toast({
        title: "Success",
        description: `Property is now ${newStatus}`,
      });
      
      // Refresh the property list
      handlePropertyUpdated();
    } catch (error) {
      console.error("Error updating property status:", error);
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Add function to handle property deletion
  const handleDeleteProperty = async (propertyId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/properties/delete-property`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: propertyId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete property");
      }

      toast({
        title: "Success",
        description: "Property deleted successfully",
      });
      
      // Refresh the property list
      handlePropertyUpdated();
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Table columns definition
  const columns: ColumnDef<Property>[] = [
    {
      accessorKey: "title",
      header: "Property",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-600">
            {row.original.thumbnail ? (
              <Image
                src={row.original.thumbnail || "/placeholder.png"} 
                alt={row.original.title}
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
            ) : (
              <Home className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="font-medium line-clamp-1">{row.getValue("title")}</div>
            <div className="text-xs text-gray-500 flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              {row.original.location.city}, {row.original.location.state}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <span>{row.getValue("type")}</span>,
    },
    {
      accessorKey: "ownerName",
      header: "Owner",
      cell: ({ row }) => (
        <span className="line-clamp-1">{row.getValue("ownerName")}</span>
      ),
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => (
        <AdminDynamicPricingIndicator
          propertyId={row.original.id}
          basePrice={row.original.price}
          variant="compact"
          showControls={true}
        />
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            className={
              row.original.status === 'active' ? 'bg-green-500' :
              row.original.status === 'pending' ? 'bg-yellow-500' :
              'bg-gray-500'
            }
          >
            {row.original.status}
          </Badge>
          {row.original.status !== 'pending' && (
            <PropertyStatusToggle
              propertyId={row.original.id}
              initialStatus={row.original.status}
              variant="compact"
              onStatusChange={() => handlePropertyUpdated()}
            />
          )}
        </div>
      ),
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.rating ? (
            <>
              <Star className="h-4 w-4 text-yellow-500 mr-1" />
              <span>{row.original.rating}</span>
              <span className="text-xs text-gray-500 ml-1">({row.original.reviewCount})</span>
            </>
          ) : (
            <span className="text-xs text-gray-500">No ratings</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: "verified",
      header: "Verified",
      cell: ({ row }) => (
        <div className="flex justify-center">
          {row.original.verified ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-300" />
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const property = row.original;
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <span
                role="button"
                tabIndex={0}
                className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                aria-label="Open menu"
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => window.open(`/property/${property.id}`, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Property
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setRoomManagementProperty(property);
                setIsRoomManagementOpen(true);
              }}>
                <Pencil className="mr-2 h-4 w-4" />
                Room Management
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.open(`/admin/properties/${property.id}/pricing`, '_blank')}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Dynamic Pricing
              </DropdownMenuItem>
              {property.status !== 'pending' && (
                <DropdownMenuItem 
                  onClick={() => handleToggleStatus(property.id, property.status)}
                  className={property.status === 'active' ? "text-orange-600" : "text-green-600"}
                >
                  {property.status === 'active' ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Deactivate Property
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Activate Property
                    </>
                  )}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
                    handleDeleteProperty(property.id);
                  }
                }}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ]

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Home className="mr-2 h-6 w-6" />
          Property Management
        </h1>
        <div className="flex gap-3">
          <Button className="bg-darkGreen hover:bg-darkGreen/90">
            <Download className="mr-2 h-4 w-4" />
            Export Properties
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter property listings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Properties</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Title, location or owner"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Property Status</Label>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                  <TabsTrigger value="inactive" className="text-xs">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2">
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="propertyType">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("all")
                  setFilterType("all")
                  setCurrentPage(1)
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Property Listings</span>
                <Badge className="ml-2">{totalProperties} properties</Badge>
              </CardTitle>
              <CardDescription>
                Manage all property listings on your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkGreen"></div>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <X className="h-10 w-10 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Error Loading Properties</h3>
                  <p className="text-gray-500 max-w-md mb-4">{error}</p>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-darkGreen hover:bg-darkGreen/90"
                  >
                    Try Again
                  </Button>
                </div>
              ) : properties.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow key={property.id}>
                          <TableCell>
                            <div className="font-medium">{property.title}</div>
                            <div className="text-xs text-gray-500">{`${property.location.city}, ${property.location.state}`}</div>
                          </TableCell>
                          <TableCell>{property.type}</TableCell>
                          <TableCell>{property.ownerName}</TableCell>
                          <TableCell>
                            <AdminDynamicPricingIndicator
                              propertyId={property.id}
                              basePrice={property.price}
                              variant="compact"
                              showControls={true}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  property.status === 'active' ? 'bg-green-500' :
                                  property.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }
                              >
                                {property.status}
                              </Badge>
                              {property.status !== 'pending' && (
                                <PropertyStatusToggle
                                  propertyId={property.id}
                                  initialStatus={property.status}
                                  variant="compact"
                                  onStatusChange={() => handlePropertyUpdated()}
                                />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  className="inline-flex items-center justify-center h-8 w-8 p-0 rounded-md bg-transparent hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                                  aria-label="Open menu"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/property/${property.id}`, '_blank')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Property
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProperty(property)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Property
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/admin/properties/${property.id}/pricing`, '_blank')}
                                >
                                  <TrendingUp className="mr-2 h-4 w-4" />
                                  Dynamic Pricing
                                </DropdownMenuItem>
                                {property.status !== 'pending' && (
                                  <DropdownMenuItem 
                                    onClick={() => handleToggleStatus(property.id, property.status)}
                                    className={property.status === 'active' ? "text-orange-600" : "text-green-600"}
                                  >
                                    {property.status === 'active' ? (
                                      <>
                                        <X className="mr-2 h-4 w-4" />
                                        Deactivate Property
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Activate Property
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete "${property.title}"? This action cannot be undone.`)) {
                                      handleDeleteProperty(property.id);
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Property
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4 text-6xl">🏠</div>
                  <h2 className="text-2xl font-bold mb-2">No properties found</h2>
                  <p className="text-muted-foreground mb-8">
                    We couldn't find any properties. Try adjusting your filters.
                  </p>
                  <Button 
                    className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
                    onClick={() => window.location.reload()}
                  >
                    Reload
                  </Button>
                </div>
              )}
              
              {/* Pagination Controls */}
              {!loading && !error && properties.length > 0 && (
                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t">
                  {totalPages > 1 ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({totalProperties} total properties)
                        </span>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Showing all {totalProperties} properties
                    </span>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
                      <SelectTrigger className="h-8 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-500">per page</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Render the Edit Property Modal */}
      {isEditModalOpen && editingProperty && (
        <PropertyEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          property={editingProperty}
          onPropertyUpdated={handlePropertyUpdated}
        />
      )}
      
      {/* Render the Room Management Modal */}
      {isRoomManagementOpen && roomManagementProperty && (
        <RoomManagementModal
          isOpen={isRoomManagementOpen}
          onClose={() => setIsRoomManagementOpen(false)}
          propertyId={roomManagementProperty.id}
          propertyName={roomManagementProperty.title}
        />
      )}
    </div>
  );
}