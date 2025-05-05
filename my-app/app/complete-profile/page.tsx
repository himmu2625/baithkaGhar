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
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [dob, setDob] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (status === 'unauthenticated') {
      router.push('/login')
    }
    
    // If user is authenticated and profile is already complete, redirect to dashboard
    if (status === 'authenticated' && session?.user?.profileComplete) {
      router.push('/dashboard')
    }

    // Pre-fill form with existing user data if available
    if (status === 'authenticated' && session?.user) {
      setName(session.user.name || "")
    }
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
          "Content-Type": "application/json"
        },
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
      await update({
        user: {
          ...session?.user,
          profileComplete: true
        }
      })
      
      toast({
        title: "Profile Completed",
        description: "Your profile has been successfully updated."
      })
      
      // Redirect to dashboard after successful profile completion
      console.log("Redirecting to dashboard...")
      setTimeout(() => {
        router.push('/dashboard')
      }, 500) // Small delay to ensure session is updated
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
  
  // If still loading or redirecting, show simple loading state
  if (status === 'loading' || (status === 'authenticated' && session?.user?.profileComplete)) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-mediumGreen" />
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we prepare your profile.</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container max-w-3xl mx-auto pt-24 pb-16 px-4">
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
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow font-medium"
              disabled={isLoading}
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