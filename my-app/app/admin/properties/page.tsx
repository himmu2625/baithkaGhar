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
  Circle
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
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  
  // Generate mock property data
  useEffect(() => {
    const generateMockProperties = () => {
      const propertyTypes = ['House', 'Apartment', 'Villa', 'Cottage', 'Cabin', 'Farmhouse']
      const statuses = ['active', 'pending', 'inactive'] as const
      const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Jaipur', 'Goa']
      const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Rajasthan', 'Goa']
      
      const ownerFirstNames = ['Raj', 'Amit', 'Priya', 'Neha', 'Vijay', 'Sanjay', 'Meera', 'Rahul']
      const ownerLastNames = ['Sharma', 'Patel', 'Singh', 'Gupta', 'Kumar', 'Reddy', 'Shah', 'Joshi']
      
      const mockProperties: Property[] = Array.from({ length: 100 }).map((_, i) => {
        const id = `prop_${(20000 + i).toString()}`
        const ownerId = `usr_${(10000 + Math.floor(Math.random() * 100)).toString()}`
        const ownerIndex = Math.floor(Math.random() * ownerFirstNames.length)
        const ownerName = `${ownerFirstNames[ownerIndex]} ${ownerLastNames[ownerIndex]}`
        
        const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)]
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        
        const cityIndex = Math.floor(Math.random() * cities.length)
        
        const bedrooms = Math.floor(Math.random() * 5) + 1
        const bathrooms = Math.floor(Math.random() * 3) + 1
        
        const isRated = Math.random() > 0.3
        const rating = isRated ? Math.floor(Math.random() * 50) / 10 + 1 : null
        const reviewCount = isRated ? Math.floor(Math.random() * 100) : 0
        
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365))
        
        const price = Math.floor(Math.random() * 15000) + 1000
        
        return {
          id,
          title: `${propertyType} in ${cities[cityIndex]}`,
          type: propertyType,
          ownerId,
          ownerName,
          price,
          location: {
            city: cities[cityIndex],
            state: states[cityIndex]
          },
          rooms: {
            bedrooms,
            bathrooms
          },
          status,
          featured: Math.random() > 0.8,
          verified: Math.random() > 0.2,
          rating,
          reviewCount,
          createdAt: createdAt.toISOString(),
          thumbnail: null
        }
      })
      
      return mockProperties
    }
    
    const mockProperties = generateMockProperties()
    setProperties(mockProperties)
    setFilteredProperties(mockProperties)
    setLoading(false)
  }, [])
  
  // Filter properties based on active tab, search term, and property type
  useEffect(() => {
    let filtered = [...properties]
    
    // Apply status filter based on tab
    if (activeTab !== "all") {
      filtered = filtered.filter(property => property.status === activeTab)
    }
    
    // Apply property type filter
    if (filterType !== "all") {
      filtered = filtered.filter(property => property.type === filterType)
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        property => 
          property.title.toLowerCase().includes(lowerSearch) || 
          property.location.city.toLowerCase().includes(lowerSearch) ||
          property.location.state.toLowerCase().includes(lowerSearch) ||
          property.ownerName.toLowerCase().includes(lowerSearch) ||
          property.id.toLowerCase().includes(lowerSearch)
      )
    }
    
    setFilteredProperties(filtered)
  }, [activeTab, searchTerm, filterType, properties])
  
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
        <span className="font-medium">{formatCurrency(row.getValue("price"))}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
      cell: ({ row }) => {
        const property = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => window.open(`/property/${property.id}`, '_blank')}
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>View Property</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = `/admin/properties/${property.id}/edit`}
              >
                <Pencil className="mr-2 h-4 w-4" />
                <span>Edit Property</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (property.status === 'active') {
                    toast({
                      title: "Property Deactivated",
                      description: `"${property.title}" has been deactivated.`,
                    })
                  } else {
                    toast({
                      title: "Property Activated",
                      description: `"${property.title}" has been activated.`,
                    })
                  }
                }}
              >
                {property.status === 'active' ? (
                  <>
                    <X className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Deactivate Property</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-green-500">Activate Property</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: property.featured ? "Removed from Featured" : "Added to Featured",
                    description: `"${property.title}" has been ${property.featured ? "removed from" : "added to"} featured properties.`,
                  })
                }}
              >
                {property.featured ? (
                  <span className="text-gray-600">Remove from Featured</span>
                ) : (
                  <span className="text-purple-600">Add to Featured</span>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Home className="mr-2 h-6 w-6" />
          Property Management
        </h1>
        <Button className="bg-darkGreen hover:bg-darkGreen/90">
          <Download className="mr-2 h-4 w-4" />
          Export Properties
        </Button>
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
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="House">House</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Villa">Villa</SelectItem>
                  <SelectItem value="Cottage">Cottage</SelectItem>
                  <SelectItem value="Cabin">Cabin</SelectItem>
                  <SelectItem value="Farmhouse">Farmhouse</SelectItem>
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
                <Badge className="ml-2">{filteredProperties.length} properties</Badge>
              </CardTitle>
              <CardDescription>
                Manage all property listings on your platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={filteredProperties} 
                pagination={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 