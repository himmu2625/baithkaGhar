"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BackButton } from "@/components/ui/back-button"

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+91 9876543210",
    address: "123 Main Street, Mumbai, India",
    dob: "1990-01-01",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setUserData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    // In a real app, you would send the updated data to your API
    console.log("Saving profile data:", userData)
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
                    <CreditCard className="mr-2 h-4 w-4" />
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
                  <hr className="my-2 border-brownTan/20" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 mb-6">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="bookings">Bookings</TabsTrigger>
                <TabsTrigger value="favorites">Favorites</TabsTrigger>
                <TabsTrigger value="refunds">Refunds</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="border-brownTan">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-darkGreen">Personal Information</CardTitle>
                      <CardDescription>Manage your personal details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      className="border-brownTan text-brownTan hover:bg-brownTan/10"
                      onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
                    >
                      {isEditing ? (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save
                        </>
                      ) : (
                        <>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </>
                      )}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-darkGreen">
                          Full Name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                          <Input
                            id="name"
                            name="name"
                            value={userData.name}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="pl-10 border-brownTan focus:border-brownTan"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-darkGreen">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={userData.email}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="pl-10 border-brownTan focus:border-brownTan"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-darkGreen">
                          Phone Number
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                          <Input
                            id="phone"
                            name="phone"
                            value={userData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="pl-10 border-brownTan focus:border-brownTan"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dob" className="text-darkGreen">
                          Date of Birth
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                          <Input
                            id="dob"
                            name="dob"
                            type="date"
                            value={userData.dob}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="pl-10 border-brownTan focus:border-brownTan"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-darkGreen">
                        Address
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                        <Input
                          id="address"
                          name="address"
                          value={userData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="pl-10 border-brownTan focus:border-brownTan"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings">
                <Card className="border-brownTan">
                  <CardHeader>
                    <CardTitle className="text-darkGreen">My Bookings</CardTitle>
                    <CardDescription>View and manage your bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-brownTan/50 mb-4" />
                      <h3 className="text-lg font-medium text-darkGreen mb-2">No bookings yet</h3>
                      <p className="text-mediumGreen">
                        You haven't made any bookings yet. Start exploring and book your perfect stay!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="favorites">
                <Card className="border-brownTan">
                  <CardHeader>
                    <CardTitle className="text-darkGreen">Favorite Locations</CardTitle>
                    <CardDescription>Properties and destinations you've saved</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Heart className="h-12 w-12 mx-auto text-brownTan/50 mb-4" />
                      <h3 className="text-lg font-medium text-darkGreen mb-2">No favorites yet</h3>
                      <p className="text-mediumGreen">
                        You haven't saved any properties as favorites yet. Click the heart icon on any property to save
                        it here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="refunds">
                <Card className="border-brownTan">
                  <CardHeader>
                    <CardTitle className="text-darkGreen">Refund Status</CardTitle>
                    <CardDescription>Track the status of your refund requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 mx-auto text-brownTan/50 mb-4" />
                      <h3 className="text-lg font-medium text-darkGreen mb-2">No refunds in progress</h3>
                      <p className="text-mediumGreen">
                        You don't have any pending refund requests. Refund history will appear here.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card className="border-brownTan">
                  <CardHeader>
                    <CardTitle className="text-darkGreen">My Reviews</CardTitle>
                    <CardDescription>Reviews you've left for properties</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 mx-auto text-brownTan/50 mb-4" />
                      <h3 className="text-lg font-medium text-darkGreen mb-2">No reviews yet</h3>
                      <p className="text-mediumGreen">
                        You haven't written any reviews yet. After your stay, you'll be able to share your experience.
                      </p>
                    </div>
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
