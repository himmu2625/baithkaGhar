"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Lock, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function AdminLoginContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  // Only redirect if authenticated as admin
  // This prevents redirect loops for non-admin users
  if (status === "authenticated" && session?.user?.role === "admin") {
    router.push("/admin/dashboard")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        role: "admin", // Add role to signIn params
        redirect: false,
        callbackUrl: "/admin/dashboard" // Add explicit callback URL
      })

      if (result?.error) {
        toast({
          title: "Authentication Error",
          description: "Invalid email or password or insufficient permissions.",
          variant: "destructive",
        })
        setIsLoading(false)
      } else if (result?.ok) {
        // Check session after sign in to confirm admin role
        window.location.href = "/admin/dashboard"
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Access the company administration dashboard
          </CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link 
                      href="/admin/forgot-password" 
                      className="text-xs text-darkGreen hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-darkGreen hover:bg-darkGreen/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Lock className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Admin Panel"
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>
          
          <TabsContent value="register">
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                New admin accounts require approval from a Super Admin.
                Register below to request access.
              </p>
              <Button
                className="w-full bg-darkGreen hover:bg-darkGreen/90"
                onClick={() => router.push('/admin/register')}
              >
                Continue to Registration
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>
        
        <CardFooter className="flex justify-center">
          <Link 
            href="/" 
            className="text-sm text-darkGreen hover:underline flex items-center"
          >
            Return to homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

// Remove the nested SessionProvider since it's already provided by the layout
export default AdminLoginContent;
