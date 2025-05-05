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
  Search
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

interface User {
  id: string
  name: string
  email: string
  image: string | null
  role: 'user' | 'host' | 'admin'
  status: 'active' | 'inactive' | 'suspended'
  verifiedEmail: boolean
  createdAt: string
  lastActive: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const { data: session } = useSession()

  useEffect(() => {
    const generateMockUsers = () => {
      const roles = ['user', 'host', 'admin'] as const
      const statuses = ['active', 'inactive', 'suspended'] as const

      const mockUsers: User[] = Array.from({ length: 100 }).map((_, i) => {
        const id = `usr_${(10000 + i).toString()}`
        const role = roles[Math.floor(Math.random() * (roles.length - (i > 95 ? 0 : 1)))]
        const status = statuses[Math.floor(Math.random() * (statuses.length - (role === 'admin' ? 2 : 0)))]
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 365))

        const lastActive = new Date(createdAt)
        lastActive.setDate(lastActive.getDate() + Math.floor(Math.random() * (new Date().getDate() - createdAt.getDate())))

        const firstName = ['Ajay', 'Vijay', 'Rahul', 'Priya', 'Neha', 'Anita', 'Raj', 'Sunita', 'Amit', 'Deepa'][Math.floor(Math.random() * 10)]
        const lastName = ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Shah', 'Verma', 'Reddy', 'Joshi', 'Das'][Math.floor(Math.random() * 10)]

        return {
          id,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
          image: null,
          role,
          status,
          verifiedEmail: Math.random() > 0.2,
          createdAt: createdAt.toISOString(),
          lastActive: lastActive.toISOString()
        }
      })

      return mockUsers
    }

    const mockUsers = generateMockUsers()
    setUsers(mockUsers)
    setFilteredUsers(mockUsers)
    setLoading(false)
  }, [])

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
          user.id.toLowerCase().includes(lowerSearch)
      )
    }
    setFilteredUsers(filtered)
  }, [activeTab, searchTerm, users])

  const RoleBadge = ({ role }: { role: User['role'] }) => {
    switch (role) {
      case 'admin': return <Badge className="bg-purple-600 hover:bg-purple-700">Admin</Badge>
      case 'host': return <Badge className="bg-blue-600 hover:bg-blue-700">Host</Badge>
      default: return <Badge className="bg-gray-600 hover:bg-gray-700">User</Badge>
    }
  }

  const StatusBadge = ({ status }: { status: User['status'] }) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-600 hover:bg-green-700">Active</Badge>
      case 'inactive': return <Badge className="bg-yellow-600 hover:bg-yellow-700">Inactive</Badge>
      case 'suspended': return <Badge className="bg-red-600 hover:bg-red-700">Suspended</Badge>
      default: return null
    }
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "verifiedEmail",
      header: "Verified",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.verifiedEmail ? (
            <CheckCircle className="h-5 w-5 text-green-500 inline" />
          ) : (
            <X className="h-5 w-5 text-red-500 inline" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => format(new Date(row.original.createdAt), 'PP'),
    },
    {
      accessorKey: "lastActive",
      header: "Last Active",
      cell: ({ row }) => format(new Date(row.original.lastActive), 'PP'),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        const currentUserRole = session?.user?.role ?? "user"
        const canEdit = user.role !== 'admin' || currentUserRole === 'admin'

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
              <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}`}>
                <User className="mr-2 h-4 w-4" />
                <span>View Details</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/admin/users/${user.id}/edit`} disabled={!canEdit}>
                <UserCog className="mr-2 h-4 w-4" />
                <span>Edit User</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  toast({
                    title: user.status === 'active' ? "User Suspended" : "User Activated",
                    description: `${user.name} has been ${user.status === 'active' ? 'suspended' : 'activated'}.`,
                  })
                }}
                disabled={!canEdit}
              >
                {user.status === 'active' ? (
                  <>
                    <X className="mr-2 h-4 w-4 text-red-500" />
                    <span className="text-red-500">Suspend User</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    <span className="text-green-500">Activate User</span>
                  </>
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
          <Users className="mr-2 h-6 w-6" />
          User Management
        </h1>
        <Button className="bg-darkGreen hover:bg-darkGreen/90">
          <Download className="mr-2 h-4 w-4" />
          Export Users
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter the user list</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  id="search"
                  placeholder="Name, email or ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>User Role</Label>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="user" className="text-xs">Users</TabsTrigger>
                  <TabsTrigger value="host" className="text-xs">Hosts</TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs">Admins</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setActiveTab("all")
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
                <span>User List</span>
                <Badge className="ml-2">{filteredUsers.length} users</Badge>
              </CardTitle>
              <CardDescription>
                Manage your registered users, hosts, and administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={filteredUsers} 
                pagination={true}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}