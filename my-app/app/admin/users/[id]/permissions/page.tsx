"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Save, Loader2, Shield, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { PERMISSIONS as RAW_PERMISSIONS } from "@/config/permissions"

const PERMISSIONS: Record<string, string> = RAW_PERMISSIONS as Record<string, string>;

// Map of permission codes to human-readable descriptions
const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'view:users': 'View the list of users and their basic details',
  'create:user': 'Create new user accounts',
  'edit:user': 'Edit existing user profiles',
  'delete:user': 'Delete user accounts',
  'view:admins': 'View the list of administrators',
  'create:admin': 'Create new administrator accounts',
  'edit:admin': 'Edit existing administrator profiles',
  'delete:admin': 'Delete administrator accounts',
  'approve:admin': 'Approve or reject admin access requests',
  'view:content': 'View content throughout the site',
  'create:content': 'Create new content items',
  'edit:content': 'Edit existing content',
  'delete:content': 'Delete content items',
  'publish:content': 'Publish or unpublish content items',
  'view:settings': 'View system and site settings',
  'edit:settings': 'Edit system and site settings',
  'view:properties': 'View all property listings',
  'create:property': 'Create new property listings',
  'edit:property': 'Edit existing property listings',
  'delete:property': 'Delete property listings',
  'publish:property': 'Publish or unpublish property listings',
  'view:bookings': 'View all booking information',
  'create:booking': 'Create new bookings',
  'edit:booking': 'Edit existing bookings',
  'delete:booking': 'Delete bookings',
  'confirm:booking': 'Confirm or reject booking requests',
  'view:analytics': 'View analytics and reports',
  'export:analytics': 'Export analytics data',
  'manage:system': 'Full system management privileges',
};

const PERMISSIONS_LIST: string[] = Object.keys(PERMISSION_DESCRIPTIONS);

interface UserDetails {
  _id: string
  name: string
  email: string
  role: 'user' | 'host' | 'admin' | 'super_admin'
  permissions?: string[]
}

// Group permissions for better organization
const permissionGroups = {
  "User Management": [
    'view:users',
    'create:user',
    'edit:user',
    'delete:user',
  ],
  "Admin Management": [
    'view:admins',
    'create:admin',
    'edit:admin',
    'delete:admin',
    'approve:admin',
  ],
  "Content Management": [
    'view:content',
    'create:content',
    'edit:content',
    'delete:content',
    'publish:content',
  ],
  "Settings": [
    'view:settings',
    'edit:settings',
  ],
  "Properties": [
    'view:properties',
    'create:property',
    'edit:property',
    'delete:property',
    'publish:property',
  ],
  "Bookings": [
    'view:bookings',
    'create:booking',
    'edit:booking',
    'delete:booking',
    'confirm:booking',
  ],
  "Analytics": [
    'view:analytics',
    'export:analytics',
  ],
  "System": [
    'manage:system',
  ],
};

// Permission templates
const permissionTemplates = {
  "No Access": [],
  "Basic User Manager": [
    'view:users',
    'edit:user',
  ],
  "Property Manager": [
    'view:properties',
    'create:property',
    'edit:property',
    'delete:property',
    'publish:property',
  ],
  "Booking Manager": [
    'view:bookings',
    'create:booking',
    'edit:booking',
    'confirm:booking',
  ],
  "Content Editor": [
    'view:content',
    'create:content',
    'edit:content',
    'delete:content',
    'publish:content',
  ],
  "Full Admin": Object.values(PERMISSIONS),
};

export default function UserPermissionsPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter()
  const { data: session } = useSession()
  const [user, setUser] = useState<{
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'host' | 'admin' | 'super_admin';
    permissions?: string[];
  } | null>(null)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")

  // Check if current user has permission to manage permissions
  useEffect(() => {
    if (session && session.user) {
      const userRole = session.user.role as string
      
      if (userRole !== "admin" && userRole !== "super_admin") {
        toast({
          title: "Access denied",
          description: "You don't have permission to manage user permissions",
          variant: "destructive"
        })
        router.push("/admin/users")
      }
    }
  }, [session, router])

  // Fetch user data and permissions
  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true)
        setError(null)
        
        // Check for session
        if (!session) {
          console.log('Session not loaded yet, waiting...');
          return;
        }
        
        // Fetch basic user details
        console.log(`Fetching user details for permissions, ID: ${id}`)
        const userResponse = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            // Include authorization header if session exists
            ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
          }
        })
        console.log(`User details response status: ${userResponse.status}`)
        
        if (!userResponse.ok) {
          const errorData = await userResponse.json()
          console.error(`Error fetching user for permissions:`, errorData)
          throw new Error(errorData.message || "Failed to fetch user details")
        }
        
        const userData = await userResponse.json()
        console.log(`User details for permissions fetched successfully:`, userData)
        setUser(userData.user)
        
        // Fetch user permissions
        console.log(`Fetching permissions for user ID: ${id}`)
        const permissionsResponse = await fetch(`/api/admin/users/${id}/permissions`, {
          headers: {
            'Content-Type': 'application/json',
            // Include authorization header if session exists
            ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
          }
        })
        console.log(`Permissions response status: ${permissionsResponse.status}`)
        
        if (!permissionsResponse.ok) {
          const errorData = await permissionsResponse.json()
          console.error(`Error fetching user permissions:`, errorData)
          throw new Error(errorData.message || "Failed to fetch user permissions")
        }
        
        const permissionsData = await permissionsResponse.json()
        console.log(`User permissions fetched successfully:`, permissionsData)
        
        // Convert permissions array to a record for easier management
        const permissionsMap: Record<string, boolean> = {}
        PERMISSIONS_LIST.forEach((permission: string) => {
          permissionsMap[permission] = permissionsData.permissions.includes(permission)
        })
        
        setPermissions(permissionsMap)
        
        // Detect if permissions match a template
        detectTemplate(permissionsData.permissions)
        
      } catch (error: any) {
        console.error(`Error in fetchUserData:`, error)
        setError(error.message || "Failed to fetch user data")
        toast({
          title: "Error",
          description: error.message || "Failed to fetch user data",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    if (id && session) {
      fetchUserData()
    }
  }, [id, session])

  // Check if the current permissions match a template
  const detectTemplate = (currentPermissions: string[]) => {
    for (const [templateName, templatePermissions] of Object.entries(permissionTemplates)) {
      const templatePerms = templatePermissions as string[];
      if (
        templatePerms.length === currentPermissions.length &&
        templatePerms.every(p => currentPermissions.includes(p)) &&
        currentPermissions.every(p => templatePerms.includes(p))
      ) {
        setSelectedTemplate(templateName)
        return
      }
    }
    
    setSelectedTemplate(null)
  }

  // Apply a permission template
  const applyTemplate = (templateName: string) => {
    const templatePermissions = permissionTemplates[templateName as keyof typeof permissionTemplates] as string[];
    
    const newPermissions: Record<string, boolean> = {}
    PERMISSIONS_LIST.forEach((permission: string) => {
      newPermissions[permission] = templatePermissions.includes(permission)
    })
    
    setPermissions(newPermissions)
    setSelectedTemplate(templateName)
  }

  // Toggle a permission
  const togglePermission = (permission: string) => {
    setPermissions(prev => {
      const newPermissions = { ...prev, [permission]: !prev[permission] }
      
      // Check if the new permissions match a template
      const enabledPermissions = Object.entries(newPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([permission]) => permission)
      
      detectTemplate(enabledPermissions)
      
      return newPermissions
    })
  }

  // Toggle all permissions in a group
  const toggleGroup = (groupPermissions: string[], value: boolean) => {
    setPermissions(prev => {
      const newPermissions = { ...prev }
      groupPermissions.forEach(permission => {
        newPermissions[permission] = value
      })
      
      // Check if the new permissions match a template
      const enabledPermissions = Object.entries(newPermissions)
        .filter(([_, enabled]) => enabled)
        .map(([permission]) => permission)
      
      detectTemplate(enabledPermissions)
      
      return newPermissions
    })
  }

  // Save permissions
  const savePermissions = async () => {
    try {
      setSubmitting(true)
      setError(null)
      
      // Get the enabled permissions
      const enabledPermissions = Object.entries(permissions)
        .filter(([_, enabled]) => enabled)
        .map(([permission]) => permission)
      
      console.log(`Saving permissions for user ID: ${id}`, enabledPermissions)
      console.log(`Session state:`, session ? 'Available' : 'Not available')
      
      // Check if session is available
      if (!session) {
        console.warn('Attempting to save permissions without a session. Will proceed anyway for debugging.')
      }
      
      const requestBody = {
        permissions: enabledPermissions
      }
      console.log('Request body for permissions update:', JSON.stringify(requestBody, null, 2))
      
      const response = await fetch(`/api/admin/users/${id}/permissions`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          // Include authorization header if session exists
          ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
        },
        body: JSON.stringify(requestBody)
      })
      console.log(`Save permissions response status: ${response.status}`)
      
      // Try to parse response data even if it's an error
      let responseData
      try {
        responseData = await response.json()
        console.log(`Save permissions response data:`, responseData)
      } catch (parseError) {
        console.error(`Error parsing response:`, parseError)
        responseData = { message: 'Failed to parse response' }
      }
      
      if (!response.ok) {
        console.error(`Error updating permissions:`, responseData)
        throw new Error(responseData.message || `Error updating permissions: ${JSON.stringify(responseData)}`)
      }
      
      toast({
        title: "Success",
        description: "User permissions updated successfully"
      })
      
      // Refresh permissions data
      console.log(`Refreshing permissions after update for user ID: ${id}`)
      const refreshResponse = await fetch(`/api/admin/users/${id}/permissions`, {
        headers: {
          'Content-Type': 'application/json',
          // Include authorization header if session exists
          ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
        }
      })
      
      if (!refreshResponse.ok) {
        console.warn('Failed to refresh permissions after update, but update was successful')
        return
      }
      
      const refreshData = await refreshResponse.json()
      console.log(`Refreshed permissions data:`, refreshData)
      
      // Convert permissions array to a record for easier management
      const permissionsMap: Record<string, boolean> = {}
      PERMISSIONS_LIST.forEach((permission: string) => {
        permissionsMap[permission] = refreshData.permissions.includes(permission)
      })
      
      setPermissions(permissionsMap)
      
      // Detect template again after saving
      detectTemplate(refreshData.permissions)
      
    } catch (error: any) {
      console.error(`Error in savePermissions:`, error)
      setError(error.message || "Failed to update permissions")
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Filter permission groups based on active tab
  const filteredGroups = () => {
    if (activeTab === "all") {
      return permissionGroups
    }
    
    return Object.fromEntries(
      Object.entries(permissionGroups)
        .filter(([groupName]) => groupName === activeTab)
    )
  }

  // Check if all permissions in a group are selected
  const isGroupSelected = (groupPermissions: string[]) => {
    return groupPermissions.every(permission => permissions[permission])
  }

  // Check if some (but not all) permissions in a group are selected
  const isGroupIndeterminate = (groupPermissions: string[]) => {
    const selected = groupPermissions.filter(permission => permissions[permission])
    return selected.length > 0 && selected.length < groupPermissions.length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>User Permissions</CardTitle>
            <CardDescription>Loading permissions data...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
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
          Back
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
              Return to Previous Page
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
          Back
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
              Return to Previous Page
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If the user is a super_admin, they should have all permissions
  if (user.role === "super_admin") {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span>User Permissions: {user.name}</span>
                </CardTitle>
                <CardDescription>
                  Managing permissions for {user.email}
                </CardDescription>
              </div>
              <Badge className="bg-red-600 hover:bg-red-700 w-fit">Super Admin</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-muted/50 rounded-lg flex flex-col items-center justify-center gap-4 text-center">
              <Shield className="h-16 w-16 text-primary/70" />
              <h3 className="text-xl font-semibold">Super Admin Role</h3>
              <p>
                Super Administrators automatically have all permissions in the system.
                Individual permissions cannot be modified for users with this role.
              </p>
              <Button
                onClick={() => router.back()}
                className="mt-2"
              >
                Return to User Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>User Permissions: {user.name}</span>
              </CardTitle>
              <CardDescription>
                Managing permissions for {user.email}
              </CardDescription>
            </div>
            <Badge className={user.role === "admin" ? "bg-purple-600 hover:bg-purple-700 w-fit" : "w-fit"}>
              {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {user.role !== "admin" && (
            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">User is not an admin</h4>
                <p className="text-sm text-yellow-700">
                  This user does not have the admin role. Permissions may not have any effect 
                  until the user's role is changed to admin. Consider editing the user to change their role.
                </p>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mb-3">Permission Templates</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(permissionTemplates).map(templateName => (
                <Button
                  key={templateName}
                  variant={selectedTemplate === templateName ? "default" : "outline"}
                  className={selectedTemplate === templateName ? "bg-darkGreen hover:bg-darkGreen/90" : ""}
                  onClick={() => applyTemplate(templateName)}
                >
                  {selectedTemplate === templateName && (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  {templateName}
                </Button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-between items-center">
                <h3 className="font-medium mb-3">Manage Individual Permissions</h3>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {Object.keys(permissionGroups).map(group => (
                    <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <div className="pt-4 space-y-6">
                {Object.entries(filteredGroups()).map(([groupName, groupPermissions]) => (
                  <div key={groupName} className="rounded-md border p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox 
                        id={`group-${groupName}`}
                        checked={isGroupSelected(groupPermissions)}
                        className={isGroupIndeterminate(groupPermissions) ? "opacity-70" : ""}
                        onCheckedChange={(checked) => toggleGroup(groupPermissions, !!checked)}
                      />
                      <label
                        htmlFor={`group-${groupName}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {groupName}
                      </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                      {groupPermissions.map(permission => (
                        <div key={permission} className="flex items-start space-x-2">
                          <Checkbox 
                            id={permission}
                            checked={permissions[permission] || false}
                            onCheckedChange={() => togglePermission(permission)}
                          />
                          <div className="grid gap-1.5">
                            <label
                              htmlFor={permission}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission}
                            </label>
                            {PERMISSION_DESCRIPTIONS[permission] && (
                              <p className="text-xs text-muted-foreground">
                                {PERMISSION_DESCRIPTIONS[permission]}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Tabs>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end space-x-4 border-t px-6 py-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button 
            className="bg-darkGreen hover:bg-darkGreen/90"
            onClick={savePermissions}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Permissions
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 