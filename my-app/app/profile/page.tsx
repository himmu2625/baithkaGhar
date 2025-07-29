"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from 'next-auth/react'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Save,
  CreditCard,
  Building,
  Heart,
  Star,
  FileText,
  LogOut,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"
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

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [originalUserData, setOriginalUserData] = useState<UserProfile | null>(null)

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!session?.user?.email) return
    
    setIsLoading(true)
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
        setUserData(data.user)
        setOriginalUserData(data.user)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast({
        title: "Error",
        description: "Failed to load your profile data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetchUserProfile()
    } else if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [session, status, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => prev ? ({ ...prev, [name]: value }) : null)
  }

  const handleSaveProfile = async () => {
    if (!userData) return
    
    setIsLoading(true)
    try {
      const response = await fetch("/api/user/complete-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          dob: userData.dob || undefined
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to update profile")
      }
      
      const data = await response.json()
      console.log("Profile update successful:", data)
      
      // Update the original data to reflect the saved state
      setOriginalUserData(userData)
      setIsEditing(false)
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      })
    } catch (error: any) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      })
      
      // Revert to original data on error
      if (originalUserData) {
        setUserData(originalUserData)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelEdit = () => {
    if (originalUserData) {
      setUserData(originalUserData)
    }
    setIsEditing(false)
  }

  const handleLogout = async () => {
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-mediumGreen" />
          <h2 className="text-2xl font-semibold mb-2">Loading Profile...</h2>
          <p className="text-gray-500">Please wait while we load your profile data.</p>
        </div>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-500 mb-4">Unable to load your profile data.</p>
          <Button onClick={fetchUserProfile} className="bg-mediumGreen hover:bg-darkGreen">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <BackButton 
            className="text-darkGreen hover:text-mediumGreen" 
            variant="ghost"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card className="border-brownTan sticky top-24">
              <CardHeader className="text-center">
                <Avatar className="w-24 h-24 mx-auto">
                  <AvatarImage src="" alt={userData.name} />
                  <AvatarFallback className="bg-brownTan text-lightBeige text-2xl">
                    {userData.name ? getInitials(userData.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-2 text-darkGreen">{userData.name}</CardTitle>
                <CardDescription className="text-mediumGreen">{userData.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <nav className="space-y-1">
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "profile" ? "bg-brownTan/10 text-brownTan" : "text-darkGreen hover:bg-brownTan/5"}`}
                    onClick={() => setActiveTab("profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "bookings" ? "bg-brownTan/10 text-brownTan" : "text-darkGreen hover:bg-brownTan/5"}`}
                    onClick={() => setActiveTab("bookings")}
                  >
                    <Building className="mr-2 h-4 w-4" />
                    My Bookings
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "favorites" ? "bg-brownTan/10 text-brownTan" : "text-darkGreen hover:bg-brownTan/5"}`}
                    onClick={() => setActiveTab("favorites")}
                  >
                    <Heart className="mr-2 h-4 w-4" />
                    Favorites
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "refunds" ? "bg-brownTan/10 text-brownTan" : "text-darkGreen hover:bg-brownTan/5"}`}
                    onClick={() => setActiveTab("refunds")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Refund Status
                  </Button>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${activeTab === "reviews" ? "bg-brownTan/10 text-brownTan" : "text-darkGreen hover:bg-brownTan/5"}`}
                    onClick={() => setActiveTab("reviews")}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    My Reviews
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl">Personal Information</CardTitle>
                        <CardDescription>Manage your personal details</CardDescription>
                      </div>
                      {!isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(true)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancelEdit}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveProfile}
                            disabled={isLoading}
                            className="bg-mediumGreen hover:bg-darkGreen"
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="mr-2 h-4 w-4" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={userData.name}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="border-lightGreen focus:border-lightGreen"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </Label>
                        <Input
                          id="email"
                          value={userData.email}
                          disabled
                          className="border-lightGreen bg-gray-50"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={userData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="border-lightGreen focus:border-lightGreen"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="dob" className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth
                        </Label>
                        <Input
                          id="dob"
                          name="dob"
                          type="date"
                          value={userData.dob}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="border-lightGreen focus:border-lightGreen"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address
                      </Label>
                      <Input
                        id="address"
                        name="address"
                        value={userData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="border-lightGreen focus:border-lightGreen"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bookings">
                <Card>
                  <CardHeader>
                    <CardTitle>My Bookings</CardTitle>
                    <CardDescription>View and manage your property bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No bookings found.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="favorites">
                <Card>
                  <CardHeader>
                    <CardTitle>Favorites</CardTitle>
                    <CardDescription>Your saved properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No favorites found.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="refunds">
                <Card>
                  <CardHeader>
                    <CardTitle>Refund Status</CardTitle>
                    <CardDescription>Track your refund requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No refund requests found.</p>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>My Reviews</CardTitle>
                    <CardDescription>Reviews you've written</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500">No reviews found.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  )
}
