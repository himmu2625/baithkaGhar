"use client"

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { 
  MoreHorizontal, 
  Download, 
  Users, 
  User, 
  Shield, 
  UserCog, 
  CheckCircle, 
  X,
  Filter,
  Search,
  RefreshCw
} from "lucide-react"
import { useSession } from "next-auth/react"
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
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface User {
  _id: string
  name: string
  email: string
  image?: string | null
  role: 'user' | 'host' | 'admin' | 'super_admin'
  isAdmin: boolean
  profileComplete?: boolean
  phone?: string
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    roles: { user: 0, host: 0, admin: 0 }
  })
  const { data: session } = useSession()

  // Fetch users from the API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching users from API...");
      const response = await fetch('/api/admin/users');
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch users");
      }
      
      const data = await response.json();
      console.log(`Fetched users data:`, data);
      
      if (!data.success) {
        throw new Error(data.message || "Failed to fetch users");
      }
      
      const usersList = data.users || [];
      console.log(`Processed ${usersList.length} users`);
      setUsers(usersList);
      
      // Calculate statistics
      const stats = {
        total: usersList.length,
        active: usersList.filter((user: User) => user.profileComplete).length,
        roles: {
          user: usersList.filter((user: User) => user.role === 'user').length,
          host: usersList.filter((user: User) => user.role === 'host').length,
          admin: usersList.filter((user: User) => 
            user.role === 'admin' || user.role === 'super_admin'
          ).length
        }
      };
      setStats(stats);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      setError(error.message || "Failed to fetch users");
      toast({
        title: "Error",
        description: error.message || "Failed to fetch users",
        variant: "destructive"
      });
      // Use an empty array if fetch fails
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = [...users]
    if (activeTab !== "all") {
      filtered = filtered.filter(user => user.role === activeTab)
    }
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        user => 
          user.name.toLowerCase().includes(lowerSearch) || 
          user.email.toLowerCase().includes(lowerSearch) ||
          (user._id && user._id.toLowerCase().includes(lowerSearch))
      )
    }
    setFilteredUsers(filtered)
  }, [activeTab, searchTerm, users])

  const RoleBadge = ({ role }: { role: User['role'] }) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-red-600 hover:bg-red-700">Super Admin</Badge>
      case 'admin': return <Badge className="bg-purple-600 hover:bg-purple-700">Admin</Badge>
      case 'host': return <Badge className="bg-blue-600 hover:bg-blue-700">Host</Badge>
      default: return <Badge className="bg-gray-600 hover:bg-gray-700">User</Badge>
    }
  }

  const StatusBadge = ({ profileComplete }: { profileComplete?: boolean }) => {
    if (profileComplete === undefined) return null;
    return profileComplete ? 
      <Badge className="bg-green-600 hover:bg-green-700">Active</Badge> : 
      <Badge className="bg-yellow-600 hover:bg-yellow-700">Incomplete</Badge>
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
            {row.original.image ? (
              <Image src={row.original.image} alt={row.original.name} width={32} height={32} className="rounded-full" />
            ) : (
              <User className="w-4 h-4" />
            )}
          </div>
          <div>
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-xs text-gray-500">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: "profileComplete",
      header: "Status",
      cell: ({ row }) => <StatusBadge profileComplete={row.original.profileComplete} />,
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—",
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => {
        const date = row.original.createdAt ? new Date(row.original.createdAt) : null;
        return date ? format(date, 'PP') : "—";
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const currentUserRole = session?.user?.role ?? "user"
        const canEdit = currentUserRole === 'super_admin' || 
                      (currentUserRole === 'admin' && user.role !== 'super_admin')

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
              <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user._id}`}>
                <User className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => window.location.href = `/admin/users/${user._id}/edit`} 
                disabled={!canEdit}
              >
                <UserCog className="mr-2 h-4 w-4" />
                <span>Edit User</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user._id}/permissions`}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Manage Permissions</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Users className="mr-2 h-6 w-6" />
          User Management
        </h1>
        <div className="space-x-2">
          <Button 
            className="bg-darkGreen hover:bg-darkGreen/90"
            onClick={() => fetchUsers()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            className="bg-darkGreen hover:bg-darkGreen/90"
            onClick={() => window.location.href = '/admin/users/migration'}
          >
            <Download className="mr-2 h-4 w-4" />
            Export/Import
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  View and manage all user accounts
                </CardDescription>
              </div>
              
              <div className="flex gap-2 sm:justify-end">
                <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-fit">
                  <TabsList className="grid grid-cols-4 h-8 w-fit">
                    <TabsTrigger value="all" className="text-xs px-2">All</TabsTrigger>
                    <TabsTrigger value="user" className="text-xs px-2">Users</TabsTrigger>
                    <TabsTrigger value="host" className="text-xs px-2">Hosts</TabsTrigger>
                    <TabsTrigger value="admin" className="text-xs px-2">Admins</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-darkGreen"></div>
              </div>
            ) : filteredUsers.length > 0 ? (
              <DataTable columns={columns} data={filteredUsers} />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Users className="h-10 w-10 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Users Found</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  {searchTerm 
                    ? "No users match your search criteria. Try a different search term."
                    : "There are no users in the system yet. Users will appear here once they register."
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => window.location.href = '/admin/users/migration'}
                  >
                    Import Users
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
            <CardDescription>
              Overview of user data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-700">Total Users</h3>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-green-700">Active Users</h3>
                  <p className="text-2xl font-bold text-green-900">{stats.active}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">User Roles</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Guests:</span>
                    <Badge variant="outline">{stats.roles.user}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Hosts:</span>
                    <Badge variant="outline">{stats.roles.host}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Admins:</span>
                    <Badge variant="outline">{stats.roles.admin}</Badge>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = '/admin/users/migration'}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export/Import Users
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}