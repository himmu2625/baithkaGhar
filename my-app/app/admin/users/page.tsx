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
  RefreshCw,
  Trash2,
  Flag
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
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface User {
  _id: string
  name: string
  email: string
  image?: string | null
  role: 'user' | 'host' | 'admin' | 'super_admin'
  isAdmin: boolean
  profileComplete?: boolean
  phone?: string
  isSpam?: boolean
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
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToToggleSpam, setUserToToggleSpam] = useState<User | null>(null)

  // Fetch users from the API
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching users from API...");
      const response = await fetch('/api/admin/users', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
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
      
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  // Mark user as spam or remove spam status
  const handleToggleSpam = async () => {
    if (!userToToggleSpam) return;
    
    try {
      const userId = userToToggleSpam._id;
      const markAsSpam = !userToToggleSpam.isSpam;
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isSpam: markAsSpam
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }
      
      // Update local state
      setUsers(users.map(user => 
        user._id === userId 
          ? { ...user, isSpam: markAsSpam } 
          : user
      ));
      
      toast({
        title: markAsSpam ? "User marked as spam" : "User unmarked as spam",
        description: `${userToToggleSpam.name} has been ${markAsSpam ? "marked as spam" : "removed from spam list"}.`,
        variant: markAsSpam ? "destructive" : "default",
      });
      
    } catch (error) {
      console.error("Error updating user spam status:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUserToToggleSpam(null);
    }
  };

  // Delete user permanently
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const userId = userToDelete._id;
      console.log(`Attempting to delete user ID: ${userId}`);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      console.log(`Delete response status: ${response.status}`);
      const responseData = await response.json().catch(err => {
        console.error("Failed to parse JSON response:", err);
        return { success: false, message: "Invalid server response" };
      });
      
      if (!response.ok) {
        console.error("Delete response not OK:", responseData);
        throw new Error(responseData.message || "Failed to delete user");
      }
      
      // Update local state
      setUsers(users.filter(user => user._id !== userId));
      
      toast({
        title: "User deleted",
        description: `${userToDelete.name} has been permanently deleted.`,
        variant: "destructive",
      });
      
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setUserToDelete(null);
    }
  };

  // Filter users when tab or search changes
  useEffect(() => {
    let filtered = [...users];
    
    // Filter by role (tab)
    if (activeTab !== "all") {
      if (activeTab === "admin") {
        filtered = filtered.filter(user => 
          user.role === "admin" || user.role === "super_admin"
        );
      } else {
        filtered = filtered.filter(user => user.role === activeTab);
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.includes(searchTerm))
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, activeTab, searchTerm]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.image ? (
            <Image 
              src={row.original.image} 
              alt={row.original.name} 
              width={24} 
              height={24} 
              className="rounded-full"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <span>{row.original.name}</span>
          {row.original.isSpam && (
            <Badge variant="destructive" className="ml-1">SPAM</Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "email",
      header: "Email"
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => row.original.phone || "—"
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant={
            role === "super_admin" ? "default" : 
            role === "admin" ? "secondary" : 
            role === "host" ? "outline" : "default" 
          } className={
            role === "super_admin" ? "bg-purple-500 hover:bg-purple-600" : 
            role === "admin" ? "bg-blue-500 hover:bg-blue-600" : 
            role === "host" ? "bg-green-500 text-white hover:bg-green-600 hover:text-white" :
            "bg-gray-500 hover:bg-gray-600"
          }>
            {role === "super_admin" ? "Super Admin" : 
             role === "admin" ? "Admin" : 
             role === "host" ? "Host" : "User"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "profileComplete",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.profileComplete ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>Active</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4 text-red-500 mr-1" />
              <span>Incomplete</span>
            </>
          )}
        </div>
      )
    },
    {
      accessorKey: "isSpam",
      header: "Spam Status",
      cell: ({ row }) => (
        <div className="flex items-center">
          {row.original.isSpam ? (
            <>
              <Flag className="h-4 w-4 text-red-500 mr-1" />
              <span>Marked as spam</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span>Not spam</span>
            </>
          )}
        </div>
      )
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return format(date, "MMM d, yyyy");
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const currentUserRole = session?.user?.role ?? "user"
        const canEdit = currentUserRole === 'super_admin' || 
                      (currentUserRole === 'admin' && user.role !== 'super_admin')
        const canDelete = currentUserRole === 'super_admin' || 
                       (currentUserRole === 'admin' && user.role !== 'super_admin' && user.role !== 'admin')

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
              {canEdit && (
                <DropdownMenuItem onClick={() => setUserToToggleSpam(user)}>
                  <Flag className="mr-2 h-4 w-4" />
                  <span>{user.isSpam ? "Remove Spam Flag" : "Mark as Spam"}</span>
                </DropdownMenuItem>
              )}
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setUserToDelete(user)}
                    className="text-red-600 focus:text-red-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Permanently</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  return (
    <div className="space-y-6 mt-12">
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
            <div className="mb-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search" className="sr-only">
                    Search users
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search users by name, email or phone..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center"
                  onClick={() => {
                    // Add filter logic here
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="p-2 border rounded-md">
                <div className="font-medium text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="p-2 border rounded-md">
                <div className="font-medium text-sm text-muted-foreground">Users</div>
                <div className="text-2xl font-bold">{stats.roles.user}</div>
              </div>
              <div className="p-2 border rounded-md">
                <div className="font-medium text-sm text-muted-foreground">Hosts</div>
                <div className="text-2xl font-bold">{stats.roles.host}</div>
              </div>
              <div className="p-2 border rounded-md">
                <div className="font-medium text-sm text-muted-foreground">Admins</div>
                <div className="text-2xl font-bold">{stats.roles.admin}</div>
              </div>
            </div>
            
            <DataTable 
              columns={columns} 
              data={filteredUsers}
              isLoading={loading}
              pagination
            />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open: boolean) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <strong>{userToDelete?.name}</strong>'s account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Spam Toggle Confirmation Dialog */}
      <AlertDialog open={!!userToToggleSpam} onOpenChange={(open: boolean) => !open && setUserToToggleSpam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {userToToggleSpam?.isSpam 
                ? `Are you sure you want to remove the spam flag from ${userToToggleSpam?.name}'s account?` 
                : `Are you sure you want to mark ${userToToggleSpam?.name}'s account as spam?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleSpam}>
              {userToToggleSpam?.isSpam ? "Remove Spam Flag" : "Mark as Spam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}