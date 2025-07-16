"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import Image from "next/image"
import { User, Mail, Phone, Calendar, Award, CheckCircle, XCircle, Shield, Edit, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"

interface UserDetails {
  _id: string
  name: string
  email: string
  image?: string | null
  role: 'user' | 'host' | 'admin' | 'super_admin'
  isAdmin: boolean
  profileComplete?: boolean
  phone?: string
  address?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export default function UserDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter()
  const { data: session } = useSession()
  const [user, setUser] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching user details for ID: ${id}`)
        
        // Check for session
        if (!session) {
          console.log('Session not loaded yet, waiting...');
          return;
        }
        
        // Make request with authorization header if available
        const response = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
          }
        })
        console.log(`User details response status: ${response.status}`)
        
        // Try to parse response even if it's an error
        let responseData
        try {
          responseData = await response.json()
          console.log(`User details response data:`, responseData)
        } catch (parseError) {
          console.error(`Error parsing response:`, parseError)
          throw new Error('Failed to parse server response')
        }
        
        // Check for API errors
        if (!response.ok) {
          console.error(`Error fetching user details:`, responseData)
          throw new Error(responseData.message || "Failed to fetch user details")
        }
        
        // Ensure we have success and user data
        if (!responseData.success) {
          console.error('API returned success: false', responseData)
          throw new Error(responseData.message || "API returned an unsuccessful response")
        }
        
        if (!responseData.user) {
          console.error('API returned no user data', responseData)
          throw new Error("No user data returned from API")
        }
        
        console.log(`User details fetched successfully:`, responseData.user)
        setUser(responseData.user)
      } catch (error: any) {
        console.error(`Error in fetchUser:`, error)
        setError(error.message || "Failed to fetch user details")
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchUser()
    }
  }, [id, session]);

  // Check if current user has permission to edit this user
  const canEdit = () => {
    if (!session?.user || !user) return false
    
    // Super admins can edit anyone
    if (session.user.role === 'super_admin') return true
    
    // Admins can't edit super admins
    if (user.role === 'super_admin' && session.user.role !== 'super_admin') return false
    
    // Admins can edit regular users and hosts
    return session.user.role === 'admin'
  }

  const getRoleBadge = (role: UserDetails['role']) => {
    switch (role) {
      case 'super_admin': return <Badge className="bg-red-600 hover:bg-red-700">Super Admin</Badge>
      case 'admin': return <Badge className="bg-purple-600 hover:bg-purple-700">Admin</Badge>
      case 'host': return <Badge className="bg-blue-600 hover:bg-blue-700">Host</Badge>
      default: return <Badge className="bg-gray-600 hover:bg-gray-700">User</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
            <Button 
              className="mt-4"
              onClick={() => router.back()}
            >
              Return to Users List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>User Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The requested user could not be found.</p>
            <Button 
              className="mt-4"
              onClick={() => router.back()}
            >
              Return to Users List
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP')
    } catch (error) {
      return 'Unknown'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
        <div className="space-x-2">
          {canEdit() && (
            <Button 
              onClick={() => router.push(`/admin/users/${id}/edit`)}
              className="bg-darkGreen hover:bg-darkGreen/90"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit User
            </Button>
          )}
          {(session?.user?.role === 'super_admin' || 
           (session?.user?.role === 'admin' && user.role !== 'super_admin')) && (
            <Button 
              onClick={() => router.push(`/admin/users/${id}/permissions`)}
              className="bg-darkGreen hover:bg-darkGreen/90"
            >
              <Shield className="mr-2 h-4 w-4" />
              Manage Permissions
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">User Details</CardTitle>
            <div className="flex items-center gap-2">
              {getRoleBadge(user.role)}
              {user.profileComplete ? (
                <Badge variant="outline" className="border-green-500 text-green-600">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Profile Complete
                </Badge>
              ) : (
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                  <XCircle className="mr-1 h-3 w-3" />
                  Incomplete Profile
                </Badge>
              )}
            </div>
          </div>
          <CardDescription>
            View detailed information about this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
              {user.image ? (
                <Image 
                  src={user.image} 
                  alt={user.name} 
                  width={64} 
                  height={64} 
                  className="rounded-full object-cover" 
                />
              ) : (
                <User className="h-8 w-8" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Contact Information</h4>
              
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Email</p>
                  <p>{user.email}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p>{user.phone || "Not provided"}</p>
                </div>
              </div>
              
              {user.address && (
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 text-gray-500">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <div>
                    <p className="font-medium">Address</p>
                    <p>{user.address}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium">Account Information</h4>
              
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Role</p>
                  <p>{user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Registered On</p>
                  <p>{formatDate(user.createdAt)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-1 text-gray-500" />
                <div>
                  <p className="font-medium">Last Updated</p>
                  <p>{formatDate(user.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {user.permissions && user.permissions.length > 0 && (
            <>
              <Separator />
              
              <div>
                <h4 className="font-medium mb-3">Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map(permission => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 