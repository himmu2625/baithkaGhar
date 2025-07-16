"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, User, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"

// Form schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["user", "host", "admin", "super_admin"]),
  isAdmin: z.boolean().default(false),
  profileComplete: z.boolean().default(false)
})

type FormValues = z.infer<typeof formSchema>

export default function EditUserPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter()
  const { data: session } = useSession()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      role: "user",
      isAdmin: false,
      profileComplete: false
    }
  })

  // Check user permissions
  useEffect(() => {
    if (session && session.user) {
      const userRole = session.user.role as string
      
      if (userRole !== "admin" && userRole !== "super_admin") {
        toast({
          title: "Access denied",
          description: "You don't have permission to edit users",
          variant: "destructive"
        })
        router.push("/admin/users")
      }
    }
  }, [session, router])

  // Fetch the user data
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true)
        setError(null)
        
        console.log(`Fetching user details for editing, ID: ${id}`)
        if (!session) {
          console.log('Session not loaded yet, waiting...');
          return;
        }
        
        const response = await fetch(`/api/admin/users/${id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
          }
        })
        console.log(`Response status: ${response.status}`)
        
        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Error fetching user for editing:`, errorData)
          throw new Error(errorData.message || "Failed to fetch user details")
        }
        
        const data = await response.json()
        console.log(`User details for editing fetched successfully:`, data)
        setUser(data.user)
        
        // Populate form with user data
        form.reset({
          name: data.user.name,
          phone: data.user.phone || "",
          address: data.user.address || "",
          role: data.user.role,
          isAdmin: data.user.isAdmin,
          profileComplete: data.user.profileComplete || false
        })
      } catch (error: any) {
        console.error(`Error in fetchUser for editing:`, error)
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
    
    if (id && session) {
      fetchUser()
    }
  }, [id, form, session])

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true)
      setError(null)
      
      console.log(`Submitting user edit for ID: ${id}`, values)
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.user && { 'Authorization': `Bearer ${(session as any)?.accessToken || ''}` })
        },
        body: JSON.stringify(values)
      })
      console.log(`Edit response status: ${response.status}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Error updating user:`, errorData)
        throw new Error(errorData.message || "Failed to update user")
      }
      
      const data = await response.json()
      console.log(`User updated successfully:`, data)
      
      toast({
        title: "Success",
        description: "User updated successfully"
      })
      
      router.push(`/admin/users/${id}`)
    } catch (error: any) {
      console.error(`Error in onSubmit:`, error)
      setError(error.message || "Failed to update user")
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Check if the current user has permission to edit this specific user
  const canEditRoleAndAdmin = () => {
    if (!session?.user) return false
    return session.user.role === "super_admin"
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
            <CardTitle>Edit User</CardTitle>
            <CardDescription>Loading user information...</CardDescription>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Edit User</CardTitle>
          </div>
          <CardDescription>
            Update the user's information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="profileComplete"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Profile Status</FormLabel>
                        <FormDescription>
                          Set whether the profile is complete
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="User's address" 
                        {...field} 
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {canEditRoleAndAdmin() && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="host">Host</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Determines the user's permissions in the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Admin Status</FormLabel>
                          <FormDescription>
                            Grant admin dashboard access
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-darkGreen hover:bg-darkGreen/90"
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
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 