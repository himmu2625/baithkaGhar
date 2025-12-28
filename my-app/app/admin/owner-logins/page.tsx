"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Key,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PropertyOwner {
  _id: string
  name: string
  email: string
  phone?: string
  role: string
  ownerProfile?: {
    businessName?: string
    businessType?: string
    kycStatus?: 'pending' | 'verified' | 'rejected'
    propertyIds?: string[]
    gstNumber?: string
    panNumber?: string
    registeredAt?: string
  }
  propertyCount?: number
  createdAt: string
}

interface Property {
  _id: string
  name?: string
  title?: string
  location?: string | { address?: string; city?: string; state?: string; country?: string }
  status?: string
}

export default function OwnerLoginsPage() {
  const { data: session } = useSession()
  const [owners, setOwners] = useState<PropertyOwner[]>([])
  const [filteredOwners, setFilteredOwners] = useState<PropertyOwner[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [kycFilter, setKycFilter] = useState("all")

  // Helper function to safely render location
  const getLocationString = (location?: string | { address?: string; city?: string; state?: string; country?: string }): string => {
    if (!location) return ''
    if (typeof location === 'string') return location
    // If it's an object, format it nicely
    if (location.city && location.state) {
      return `${location.city}, ${location.state}`
    }
    if (location.city) return location.city
    if (location.address) return location.address
    return ''
  }

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<PropertyOwner | null>(null)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    businessType: "individual",
    gstNumber: "",
    panNumber: "",
    kycStatus: "pending",
    propertyIds: [] as string[]
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    generateRandom: false,
    temporaryPassword: ""
  })

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0
  })

  // Fetch all owners
  const fetchOwners = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/owners')
      const data = await response.json()

      if (data.success) {
        setOwners(data.owners)
        calculateStats(data.owners)
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to fetch owners",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch owners",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch all properties for selection
  const fetchProperties = async () => {
    try {
      console.log('Fetching properties from /api/admin/properties/available...')
      const response = await fetch('/api/admin/properties/available')
      const data = await response.json()

      console.log('Properties API response:', data)
      console.log('Properties count:', data.properties?.length || 0)

      if (data.success) {
        setProperties(data.properties || [])
        console.log('Properties set in state:', data.properties?.length || 0)
      } else {
        console.error('Failed to fetch properties:', data.message)
        toast({
          title: "Warning",
          description: "Failed to load properties list",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      toast({
        title: "Error",
        description: "Failed to load properties list",
        variant: "destructive"
      })
    }
  }

  // Calculate statistics
  const calculateStats = (ownersList: PropertyOwner[]) => {
    setStats({
      total: ownersList.length,
      verified: ownersList.filter(o => o.ownerProfile?.kycStatus === 'verified').length,
      pending: ownersList.filter(o => o.ownerProfile?.kycStatus === 'pending').length,
      rejected: ownersList.filter(o => o.ownerProfile?.kycStatus === 'rejected').length
    })
  }

  // Filter owners
  useEffect(() => {
    let filtered = [...owners]

    // KYC status filter
    if (kycFilter !== "all") {
      filtered = filtered.filter(owner => owner.ownerProfile?.kycStatus === kycFilter)
    }

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(owner =>
        owner.name.toLowerCase().includes(searchLower) ||
        owner.email.toLowerCase().includes(searchLower) ||
        owner.ownerProfile?.businessName?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredOwners(filtered)
  }, [owners, searchTerm, kycFilter])

  // Create owner
  const handleCreateOwner = async () => {
    try {
      const response = await fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Property owner created successfully"
        })
        setShowCreateModal(false)
        resetForm()
        fetchOwners()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create owner",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create owner",
        variant: "destructive"
      })
    }
  }

  // Update owner
  const handleUpdateOwner = async () => {
    if (!selectedOwner) return

    try {
      const response = await fetch(`/api/admin/owners/${selectedOwner._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Owner updated successfully"
        })
        setShowEditModal(false)
        setSelectedOwner(null)
        resetForm()
        fetchOwners()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update owner",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update owner",
        variant: "destructive"
      })
    }
  }

  // Reset password
  const handleResetPassword = async () => {
    if (!selectedOwner) return

    try {
      const response = await fetch(`/api/admin/owners/${selectedOwner._id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: passwordData.newPassword || undefined,
          generateRandom: passwordData.generateRandom
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.temporaryPassword) {
          setPasswordData(prev => ({
            ...prev,
            temporaryPassword: data.temporaryPassword
          }))
          toast({
            title: "Password Reset",
            description: "Temporary password generated. Please copy it now."
          })
        } else {
          toast({
            title: "Success",
            description: "Password reset successfully"
          })
          setShowPasswordModal(false)
          setSelectedOwner(null)
          setPasswordData({ newPassword: "", generateRandom: false, temporaryPassword: "" })
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reset password",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive"
      })
    }
  }

  // Delete owner
  const handleDeleteOwner = async (ownerId: string) => {
    if (!confirm('Are you sure you want to delete this owner? All associated properties will be unlinked.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/owners/${ownerId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Owner deleted successfully"
        })
        fetchOwners()
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete owner",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete owner",
        variant: "destructive"
      })
    }
  }

  // Open edit modal with owner data
  const openEditModal = (owner: PropertyOwner) => {
    setSelectedOwner(owner)
    setFormData({
      name: owner.name,
      email: owner.email,
      phone: owner.phone || "",
      password: "",
      businessName: owner.ownerProfile?.businessName || "",
      businessType: owner.ownerProfile?.businessType || "individual",
      gstNumber: owner.ownerProfile?.gstNumber || "",
      panNumber: owner.ownerProfile?.panNumber || "",
      kycStatus: owner.ownerProfile?.kycStatus || "pending",
      propertyIds: owner.ownerProfile?.propertyIds || []
    })
    setShowEditModal(true)
  }

  // Open password reset modal
  const openPasswordModal = (owner: PropertyOwner) => {
    setSelectedOwner(owner)
    setPasswordData({ newPassword: "", generateRandom: false, temporaryPassword: "" })
    setShowPasswordModal(true)
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      businessName: "",
      businessType: "individual",
      gstNumber: "",
      panNumber: "",
      kycStatus: "pending",
      propertyIds: []
    })
  }

  // Initial load
  useEffect(() => {
    fetchOwners()
    fetchProperties()
  }, [])

  // Get KYC badge
  const getKYCBadge = (status?: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      default:
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Pending</Badge>
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Property Owner Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage property owner accounts and credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchOwners}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Owner
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Owners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Property Owners</CardTitle>
              <CardDescription>All registered property owner accounts</CardDescription>
            </div>
            <div className="flex gap-2">
              <Tabs value={kycFilter} onValueChange={setKycFilter}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="verified">Verified</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or business name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Owner Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredOwners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No owners found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOwners.map((owner) => (
                    <TableRow key={owner._id}>
                      <TableCell className="font-medium">{owner.name}</TableCell>
                      <TableCell>{owner.ownerProfile?.businessName || '—'}</TableCell>
                      <TableCell>{owner.email}</TableCell>
                      <TableCell>{owner.phone || '—'}</TableCell>
                      <TableCell>{getKYCBadge(owner.ownerProfile?.kycStatus)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{owner.propertyCount || 0} properties</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(owner.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditModal(owner)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Owner
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openPasswordModal(owner)}>
                              <Key className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {session?.user?.role === 'super_admin' && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteOwner(owner._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Owner
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Owner Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Property Owner</DialogTitle>
            <DialogDescription>
              Create a new property owner account with login credentials
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="owner@hotel.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="font-semibold">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="Grand Hotel Pvt Ltd"
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                    placeholder="AAAAA0000A"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="kycStatus">KYC Status</Label>
                <Select
                  value={formData.kycStatus}
                  onValueChange={(value) => setFormData({ ...formData, kycStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Assignment */}
            <div className="space-y-4">
              <h3 className="font-semibold">Property Assignment</h3>
              <div>
                <Label htmlFor="propertyIds">Assign Properties</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No properties available</p>
                  ) : (
                    <div className="space-y-2">
                      {properties.map((property) => (
                        <div key={property._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`property-${property._id}`}
                            checked={formData.propertyIds.includes(property._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  propertyIds: [...formData.propertyIds, property._id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  propertyIds: formData.propertyIds.filter(id => id !== property._id)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <Label
                            htmlFor={`property-${property._id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {property.name || property.title}
                            {getLocationString(property.location) && (
                              <span className="text-muted-foreground ml-2">
                                ({getLocationString(property.location)})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {formData.propertyIds.length} {formData.propertyIds.length === 1 ? 'property' : 'properties'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOwner}>
              Create Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Owner Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Property Owner</DialogTitle>
            <DialogDescription>
              Update property owner information
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Same form fields as create, but without password */}
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Business Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-businessName">Business Name</Label>
                  <Input
                    id="edit-businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-businessType">Business Type</Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-gstNumber">GST Number</Label>
                  <Input
                    id="edit-gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-panNumber">PAN Number</Label>
                  <Input
                    id="edit-panNumber"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-kycStatus">KYC Status</Label>
                <Select
                  value={formData.kycStatus}
                  onValueChange={(value) => setFormData({ ...formData, kycStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property Assignment in Edit */}
            <div className="space-y-4">
              <h3 className="font-semibold">Property Assignment</h3>
              <div>
                <Label htmlFor="edit-propertyIds">Assigned Properties</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                  {properties.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No properties available</p>
                  ) : (
                    <div className="space-y-2">
                      {properties.map((property) => (
                        <div key={property._id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-property-${property._id}`}
                            checked={formData.propertyIds.includes(property._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  propertyIds: [...formData.propertyIds, property._id]
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  propertyIds: formData.propertyIds.filter(id => id !== property._id)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <Label
                            htmlFor={`edit-property-${property._id}`}
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            {property.name || property.title}
                            {getLocationString(property.location) && (
                              <span className="text-muted-foreground ml-2">
                                ({getLocationString(property.location)})
                              </span>
                            )}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {formData.propertyIds.length} {formData.propertyIds.length === 1 ? 'property' : 'properties'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOwner}>
              Update Owner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {selectedOwner?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {passwordData.temporaryPassword ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">Temporary Password Generated:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-lg">
                      {passwordData.temporaryPassword}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please copy this password now and share it with the owner securely.
                      This password will not be shown again.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                    disabled={passwordData.generateRandom}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generateRandom"
                    checked={passwordData.generateRandom}
                    onChange={(e) => setPasswordData({ ...passwordData, generateRandom: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="generateRandom">Generate random secure password</Label>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            {passwordData.temporaryPassword ? (
              <Button
                onClick={() => {
                  setShowPasswordModal(false)
                  setSelectedOwner(null)
                  setPasswordData({ newPassword: "", generateRandom: false, temporaryPassword: "" })
                }}
              >
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleResetPassword}>
                  Reset Password
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
