"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  address: string
  dob: string
  profileComplete: boolean
  role: string
  createdAt: string
  updatedAt: string
}

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [dob, setDob] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [sessionDebug, setSessionDebug] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  
  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!session?.user?.email) return
    
    setFetchingProfile(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.user) {
        console.log('Fetched user profile:', data.user)
        setUserProfile(data.user)
        
        // Pre-populate form fields with existing data
        setName(data.user.name || "")
        setPhone(data.user.phone || "")
        setAddress(data.user.address || "")
        setDob(data.user.dob || "")
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setFetchingProfile(false)
    }
  }
  
  // Add debugging logs
  useEffect(() => {
    console.log("Session status:", status)
    console.log("Session data:", session)
    setSessionDebug(`Status: ${status}, User: ${session?.user?.name || 'none'}, ProfileComplete: ${session?.user?.profileComplete}`)
    
    // Force show form after 5 seconds regardless of session state
    const forceShowTimer = setTimeout(() => {
      console.log("Force showing form after timeout")
      setShowForm(true)
      setInitializing(false)
    }, 5000)
    
    return () => clearTimeout(forceShowTimer)
  }, [session, status])
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      console.log("User not authenticated, redirecting to login")
      router.push('/login')
      return
    }
    
    // If user is authenticated and profile is already complete, redirect to dashboard
    if (status === 'authenticated' && session?.user?.profileComplete) {
      console.log("Profile already complete, redirecting to dashboard")
      router.push('/dashboard')
      return
    }

    // If user is authenticated, fetch their profile data
    if (status === 'authenticated' && session?.user) {
      console.log("Authenticated user found, fetching profile data")
      fetchUserProfile()
      setInitializing(false) 
      setShowForm(true)
    }

    // Set initializing to false after a timeout to prevent eternal loading
    const timer = setTimeout(() => {
      console.log("Initialization timeout reached")
      setInitializing(false)
      setShowForm(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [session, status, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !address) {
      toast({
        title: "Error",
        description: "Name and address are required fields",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    
    try {
      console.log("Submitting profile data...")
      
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          name,
          phone,
          address,
          dob: dob || undefined
        })
      })
      
      console.log("Response status:", response.status)
      console.log("Content-Type:", response.headers.get("content-type"))
      
      // Get the raw text first for debugging
      const rawResponse = await response.text()
      console.log("Raw response:", rawResponse)
      
      // Try to parse as JSON
      let data
      try {
        data = JSON.parse(rawResponse)
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError)
        console.error("Raw response content:", rawResponse)
        throw new Error("Server returned an invalid response format")
      }
      
      if (!response.ok) {
        const errorMessage = data.message || "Failed to update profile"
        console.error("Profile update failed:", errorMessage, data)
        throw new Error(errorMessage)
      }
      
      console.log("Profile update successful:", data)
      
      // Update session with completed profile status
      try {
        await update({
          user: {
            ...session?.user,
            profileComplete: true
          }
        })
        console.log("Session updated with profileComplete=true")
      } catch (updateError) {
        console.error("Error updating session:", updateError)
        // Continue even if session update fails - we'll rely on the redirect
      }
      
      toast({
        title: "Profile Completed",
        description: "Your profile has been successfully updated."
      })
      
      // Redirect to dashboard after successful profile completion
      console.log("Redirecting to dashboard...")
      
      // Use direct navigation to prevent session caching issues
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Show debugging information in development
  const showDebugInfo = process.env.NODE_ENV === 'development'
  
  if (status === 'loading' && !showForm) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-mediumGreen" />
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we prepare your profile.</p>
          {showDebugInfo && (
            <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left">
              <p>Debug: {sessionDebug}</p>
              <Button 
                onClick={() => {
                  setShowForm(true)
                  setInitializing(false)
                }}
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Force Show Form
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show the form regardless of initialization state if showForm is true
  return (
    <div className="container max-w-3xl mx-auto pt-24 pb-16 px-4">
      {showDebugInfo && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <p>Debug: {sessionDebug}</p>
          <p>State: {initializing ? 'Initializing' : 'Ready'}</p>
          <p>Profile: {userProfile ? 'Loaded' : 'Not loaded'}</p>
        </div>
      )}
      
      <Card className="border-lightGreen shadow-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-darkGreen">Complete Your Profile</CardTitle>
          <CardDescription>
            Please provide additional information to complete your profile and personalize your experience
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-darkGreen">
                  Full Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="border-lightGreen focus:border-lightGreen"
                  required
                  disabled={fetchingProfile}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-darkGreen">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="border-lightGreen focus:border-lightGreen"
                  disabled={fetchingProfile}
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-darkGreen">
                  Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your full address"
                  className="border-lightGreen focus:border-lightGreen"
                  required
                  disabled={fetchingProfile}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-darkGreen">
                  Date of Birth (Optional)
                </Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="border-lightGreen focus:border-lightGreen"
                  disabled={fetchingProfile}
                />
              </div>
              
              {fetchingProfile && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-gray-500">Loading your profile data...</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow font-medium"
              disabled={isLoading || fetchingProfile}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Profile...
                </>
              ) : (
                "Complete Profile"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 