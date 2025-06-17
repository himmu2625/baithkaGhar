"use client"

export const dynamic = 'force-dynamic';

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Home, Calendar, Heart, Settings, LogOut, User, Star, MapPin, Clock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSession, signOut } from "next-auth/react" 
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { format } from "date-fns"

interface Booking {
  id: string
  propertyId: string
  propertyName: string
  propertyImage: string
  location: string
  checkIn: string
  checkOut: string
  guests: number
  totalAmount: number
  status: "upcoming" | "completed" | "cancelled"
}

interface Favorite {
  id: string
  name: string
  location: string
  price: number
  rating: number
  image: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState("overview")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Redirect if not logged in
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    const fetchUserData = async () => {
      setLoading(true)
      try {
        // Fetch real bookings from API
        const response = await fetch('/api/bookings')
        if (response.ok) {
          const data = await response.json()
          
          // Transform API bookings to dashboard format
          const transformedBookings: Booking[] = data.bookings.map((booking: any) => {
            const today = new Date()
            const checkInDate = new Date(booking.dateFrom)
            const checkOutDate = new Date(booking.dateTo)
            
            let status: "upcoming" | "completed" | "cancelled" = "completed"
            if (booking.status === "cancelled") {
              status = "cancelled"
            } else if (checkInDate > today) {
              status = "upcoming"
            } else if (checkOutDate <= today) {
              status = "completed"
            } else {
              status = "upcoming" // Currently ongoing
            }
            
            return {
              id: booking._id,
              propertyId: booking.propertyId._id || booking.propertyId,
              propertyName: booking.propertyId?.title || booking.propertyName || 'Property',
              propertyImage: booking.propertyId?.categorizedImages?.exterior?.[0] || 
                           booking.propertyId?.images?.[0] || 
                           '/placeholder-property.jpg',
              location: booking.propertyId?.location || 'Unknown Location',
              checkIn: booking.dateFrom,
              checkOut: booking.dateTo,
              guests: booking.guests,
              totalAmount: booking.totalPrice || 0,
              status
            }
          })
          
          setBookings(transformedBookings)
        } else {
          console.error('Failed to fetch bookings:', response.statusText)
          setBookings([])
        }

        // Get favorites from localStorage
        let favoritesData: Favorite[] = []
        if (typeof window !== "undefined") {
          const savedFavorites = localStorage.getItem("favorites")
          if (savedFavorites) {
            const favoriteIds = JSON.parse(savedFavorites)
            // Mock favorites data based on IDs
            favoritesData = favoriteIds.map((id: string) => ({
              id,
              name: id === "1" ? "Luxury Beachfront Villa" : id === "2" ? "Mountain Retreat" : "Heritage Haveli",
              location: id === "1" ? "Goa, India" : id === "2" ? "Shimla, India" : "Jaipur, India",
              price: id === "1" ? 25000 : id === "2" ? 15000 : 18000,
              rating: id === "1" ? 4.9 : id === "2" ? 4.7 : 4.8,
              image:
                id === "1"
                  ? "/serene-goan-escape.png"
                  : id === "2"
                    ? "/himalayan-hideaway.png"
                    : "/opulent-jaipur-courtyard.png",
            }))
          }
        }

        setFavorites(favoritesData)
      } catch (error) {
        console.error("Error fetching user data:", error)
        setBookings([])
        setFavorites([])
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchUserData()
    }
  }, [status, router])

  const handleLogout = async () => {
    await signOut({ redirect: false })
    // Force a hard page reload to ensure session is properly cleared
    window.location.href = "/"
  }

  const removeFavorite = (id: string) => {
    // Update state
    setFavorites(favorites.filter((fav) => fav.id !== id))

    // Update localStorage
    if (typeof window !== "undefined") {
      const savedFavorites = localStorage.getItem("favorites")
      if (savedFavorites) {
        const favoriteIds = JSON.parse(savedFavorites)
        const updatedFavorites = favoriteIds.filter((favId: string) => favId !== id)
        localStorage.setItem("favorites", JSON.stringify(updatedFavorites))
      }
    }
  }

  // Show loading state or redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mediumGreen"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex flex-col items-center">
                <Avatar className="h-20 w-20 mb-2">
                  <AvatarImage
                    src={session?.user?.image || "/placeholder.svg?height=80&width=80&query=Indian%20Person"}
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <CardTitle>{session?.user?.name || "User"}</CardTitle>
                <CardDescription>Member since 2023</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <Button
                  variant={activeTab === "overview" ? "default" : "ghost"}
                  className={`w-full justify-start ${activeTab === "overview" ? "bg-mediumGreen text-lightYellow hover:bg-mediumGreen/80" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Overview
                </Button>
                <Button
                  variant={activeTab === "bookings" ? "default" : "ghost"}
                  className={`w-full justify-start ${activeTab === "bookings" ? "bg-mediumGreen text-lightYellow hover:bg-mediumGreen/80" : ""}`}
                  onClick={() => setActiveTab("bookings")}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  My Bookings
                </Button>
                <Button
                  variant={activeTab === "favorites" ? "default" : "ghost"}
                  className={`w-full justify-start ${activeTab === "favorites" ? "bg-mediumGreen text-lightYellow hover:bg-mediumGreen/80" : ""}`}
                  onClick={() => setActiveTab("favorites")}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  Favorites
                </Button>
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  className={`w-full justify-start ${activeTab === "profile" ? "bg-mediumGreen text-lightYellow hover:bg-mediumGreen/80" : ""}`}
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Button>
                <Button
                  variant={activeTab === "settings" ? "default" : "ghost"}
                  className={`w-full justify-start ${activeTab === "settings" ? "bg-mediumGreen text-lightYellow hover:bg-mediumGreen/80" : ""}`}
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full text-red-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="flex justify-center items-center h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-mediumGreen"></div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === "overview"
                    ? "Dashboard Overview"
                    : activeTab === "bookings"
                    ? "My Bookings"
                    : activeTab === "favorites"
                    ? "Favorite Properties"
                    : activeTab === "profile"
                    ? "My Profile"
                    : "Account Settings"}
                </CardTitle>
                <CardDescription>
                  {activeTab === "overview"
                    ? "Welcome to your personal dashboard"
                    : activeTab === "bookings"
                    ? "Manage your upcoming and past stays"
                    : activeTab === "favorites"
                    ? "View and manage your favorite properties"
                    : activeTab === "profile"
                    ? "View and edit your profile information"
                    : "Customize your account preferences"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Welcome back, {session?.user?.name?.split(" ")[0] || "User"}!</CardTitle>
                        <CardDescription>Here's a summary of your activity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium">Upcoming Trips</h3>
                              <Calendar className="h-4 w-4 text-mediumGreen" />
                            </div>
                            <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "upcoming").length}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium">Completed Stays</h3>
                              <Home className="h-4 w-4 text-mediumGreen" />
                            </div>
                            <p className="text-2xl font-bold">{bookings.filter((b) => b.status === "completed").length}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium">Saved Properties</h3>
                              <Heart className="h-4 w-4 text-mediumGreen" />
                            </div>
                            <p className="text-2xl font-bold">{favorites.length}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Bookings */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="space-y-4">
                            {[1, 2].map((_, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-md animate-pulse" />
                                <div className="space-y-2 flex-1">
                                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : bookings.length > 0 ? (
                          <div className="space-y-4">
                            {bookings.slice(0, 2).map((booking) => (
                              <div key={booking.id} className="flex items-center gap-4">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={booking.propertyImage || "/placeholder.svg"}
                                    alt={booking.propertyName}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium line-clamp-1">{booking.propertyName}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {booking.location}
                                  </p>
                                  <p className="text-sm flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(booking.checkIn), "MMM d")} -{" "}
                                    {format(new Date(booking.checkOut), "MMM d, yyyy")}
                                  </p>
                                </div>
                                <div
                                  className={`px-2 py-1 rounded text-xs ${
                                    booking.status === "upcoming"
                                      ? "bg-blue-100 text-blue-800"
                                      : booking.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                </div>
                              </div>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => setActiveTab("bookings")}>
                              View All Bookings
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">No bookings yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">Start exploring and book your first stay!</p>
                            <Button onClick={() => router.push("/search")}>Explore Properties</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Favorite Properties */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Favorite Properties</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="space-y-4">
                            {[1, 2].map((_, index) => (
                              <div key={index} className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-muted rounded-md animate-pulse" />
                                <div className="space-y-2 flex-1">
                                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                                  <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : favorites.length > 0 ? (
                          <div className="space-y-4">
                            {favorites.slice(0, 2).map((favorite) => (
                              <div key={favorite.id} className="flex items-center gap-4">
                                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                  <Image
                                    src={favorite.image || "/placeholder.svg"}
                                    alt={favorite.name}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium line-clamp-1">{favorite.name}</h3>
                                  <p className="text-sm text-muted-foreground flex items-center">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {favorite.location}
                                  </p>
                                  <p className="text-sm flex items-center">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                    {favorite.rating}
                                    <span className="ml-2">₹{favorite.price.toLocaleString()}/night</span>
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => router.push(`/property/${favorite.id}`)}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button variant="outline" className="w-full" onClick={() => setActiveTab("favorites")}>
                              View All Favorites
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-6">
                            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">No favorites yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Save properties you like to find them easily later!
                            </p>
                            <Button onClick={() => router.push("/search")}>Explore Properties</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeTab === "bookings" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>My Bookings</CardTitle>
                      <CardDescription>View and manage your bookings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="upcoming">
                        <TabsList className="mb-4">
                          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                          <TabsTrigger value="completed">Completed</TabsTrigger>
                          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upcoming">
                          {loading ? (
                            <div className="space-y-4">
                              {[1, 2].map((_, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  <div className="w-20 h-20 bg-muted rounded-md animate-pulse" />
                                  <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : bookings.filter((b) => b.status === "upcoming").length > 0 ? (
                            <div className="space-y-6">
                              {bookings
                                .filter((b) => b.status === "upcoming")
                                .map((booking) => (
                                  <div key={booking.id} className="border rounded-lg p-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                      <div className="relative h-32 md:w-32 rounded-md overflow-hidden">
                                        <Image
                                          src={booking.propertyImage || "/placeholder.svg"}
                                          alt={booking.propertyName}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="font-medium text-lg">{booking.propertyName}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center mb-2">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {booking.location}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Check-in</p>
                                            <p className="font-medium">
                                              {format(new Date(booking.checkIn), "EEE, MMM d, yyyy")}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Check-out</p>
                                            <p className="font-medium">
                                              {format(new Date(booking.checkOut), "EEE, MMM d, yyyy")}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Guests</p>
                                            <p className="font-medium">
                                              {booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap justify-between items-center">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Booking ID</p>
                                            <p className="font-medium">{booking.id}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total Amount</p>
                                            <p className="font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        onClick={() => router.push(`/property/${booking.propertyId}`)}
                                      >
                                        View Property
                                      </Button>
                                      <Button className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow">
                                        Manage Booking
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <h3 className="font-medium">No upcoming bookings</h3>
                              <p className="text-sm text-muted-foreground mb-4">You don't have any upcoming trips planned.</p>
                              <Button onClick={() => router.push("/search")}>Plan a Trip</Button>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="completed">
                          {loading ? (
                            <div className="space-y-4">
                              {[1, 2].map((_, index) => (
                                <div key={index} className="flex items-center gap-4">
                                  <div className="w-20 h-20 bg-muted rounded-md animate-pulse" />
                                  <div className="space-y-2 flex-1">
                                    <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                                    <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : bookings.filter((b) => b.status === "completed").length > 0 ? (
                            <div className="space-y-6">
                              {bookings
                                .filter((b) => b.status === "completed")
                                .map((booking) => (
                                  <div key={booking.id} className="border rounded-lg p-4">
                                    <div className="flex flex-col md:flex-row gap-4">
                                      <div className="relative h-32 md:w-32 rounded-md overflow-hidden">
                                        <Image
                                          src={booking.propertyImage || "/placeholder.svg"}
                                          alt={booking.propertyName}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="flex-1">
                                        <h3 className="font-medium text-lg">{booking.propertyName}</h3>
                                        <p className="text-sm text-muted-foreground flex items-center mb-2">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          {booking.location}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-4">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Check-in</p>
                                            <p className="font-medium">
                                              {format(new Date(booking.checkIn), "EEE, MMM d, yyyy")}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Check-out</p>
                                            <p className="font-medium">
                                              {format(new Date(booking.checkOut), "EEE, MMM d, yyyy")}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-xs text-muted-foreground">Guests</p>
                                            <p className="font-medium">
                                              {booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap justify-between items-center">
                                          <div>
                                            <p className="text-xs text-muted-foreground">Booking ID</p>
                                            <p className="font-medium">{booking.id}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Total Amount</p>
                                            <p className="font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                      <Button
                                        variant="outline"
                                        onClick={() => router.push(`/property/${booking.propertyId}`)}
                                      >
                                        View Property
                                      </Button>
                                      <Button className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow">
                                        Write a Review
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                              <h3 className="font-medium">No completed bookings</h3>
                              <p className="text-sm text-muted-foreground mb-4">You haven't completed any stays yet.</p>
                              <Button onClick={() => router.push("/search")}>Explore Properties</Button>
                            </div>
                          )}
                        </TabsContent>
                        <TabsContent value="cancelled">
                          <div className="text-center py-12">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                            <h3 className="font-medium">No cancelled bookings</h3>
                            <p className="text-sm text-muted-foreground mb-4">You don't have any cancelled bookings.</p>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "favorites" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>My Favorites</CardTitle>
                      <CardDescription>Properties you've saved</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3, 4].map((_, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <div className="w-full h-40 bg-muted rounded-md animate-pulse mb-4" />
                              <div className="space-y-2">
                                <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
                                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                                <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : favorites.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {favorites.map((favorite) => (
                            <div key={favorite.id} className="border rounded-lg overflow-hidden group">
                              <div className="relative h-48 w-full">
                                <Image
                                  src={favorite.image || "/placeholder.svg"}
                                  alt={favorite.name}
                                  fill
                                  className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full"
                                  onClick={() => removeFavorite(favorite.id)}
                                >
                                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                                </Button>
                              </div>
                              <div className="p-4">
                                <h3 className="font-medium text-lg mb-1">{favorite.name}</h3>
                                <p className="text-sm text-muted-foreground flex items-center mb-2">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {favorite.location}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span>{favorite.rating}</span>
                                  </div>
                                  <div>
                                    <span className="font-bold">₹{favorite.price.toLocaleString()}</span>
                                    <span className="text-sm text-muted-foreground"> / night</span>
                                  </div>
                                </div>
                                <Button
                                  className="w-full mt-4 bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                                  onClick={() => router.push(`/property/${favorite.id}`)}
                                >
                                  View Property
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <h3 className="font-medium">No favorites yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            Save properties you like to find them easily later!
                          </p>
                          <Button onClick={() => router.push("/search")}>Explore Properties</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {activeTab === "profile" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>Manage your personal information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-6 items-center">
                          <Avatar className="h-24 w-24">
                            <AvatarImage
                              src={session?.user?.image || "/placeholder.svg?height=96&width=96&query=Indian%20Person"}
                              alt={session?.user?.name || "User"}
                            />
                            <AvatarFallback>{session?.user?.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1 text-center md:text-left">
                            <h3 className="font-medium text-lg">{session?.user?.name || "User"}</h3>
                            <p className="text-sm text-muted-foreground">Member since 2023</p>
                            <Button variant="outline" size="sm" className="mt-2">
                              Change Photo
                            </Button>
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" defaultValue={session?.user?.name || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue={session?.user?.email || ""} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" defaultValue="" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dob">Date of Birth</Label>
                            <Input id="dob" type="date" />
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="city">City</Label>
                            <Input id="city" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State</Label>
                            <Input id="state" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="pincode">Pincode</Label>
                            <Input id="pincode" />
                          </div>
                        </div>

                        <Button className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow">Save Changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === "settings" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Settings</CardTitle>
                      <CardDescription>Manage your account settings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium mb-2">Notifications</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="email-notifications" className="flex-1">
                                Email Notifications
                              </Label>
                              <input type="checkbox" id="email-notifications" className="toggle" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="booking-reminders" className="flex-1">
                                Booking Reminders
                              </Label>
                              <input type="checkbox" id="booking-reminders" className="toggle" defaultChecked />
                            </div>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="promotional-emails" className="flex-1">
                                Promotional Emails
                              </Label>
                              <input type="checkbox" id="promotional-emails" className="toggle" />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium mb-2">Privacy</h3>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="profile-visibility" className="flex-1">
                                Profile Visibility
                              </Label>
                              <select id="profile-visibility" className="select select-bordered">
                                <option>Public</option>
                                <option>Private</option>
                                <option>Friends Only</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium mb-2">Security</h3>
                          <div className="space-y-4">
                            <Button variant="outline">Change Password</Button>
                            <Button variant="outline">Enable Two-Factor Authentication</Button>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h3 className="font-medium text-red-500 mb-2">Danger Zone</h3>
                          <div className="space-y-2">
                            <Button variant="destructive">Delete Account</Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
