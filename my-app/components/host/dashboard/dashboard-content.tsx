"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { 
  BarChart3, 
  Home, 
  Calendar, 
  Settings, 
  Users, 
  IndianRupee,

  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DashboardOverview from "./overview"
import PriceRecommendations from "./price-recommendations"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import { fetchDashboardStats } from "@/lib/api/host"

const navItems = [
  { 
    label: "Dashboard", 
    icon: LayoutDashboard, 
    href: "#dashboard",
    active: true,
    tab: "overview"
  },
  { 
    label: "Properties", 
    icon: Home, 
    href: "#properties",
    count: 3,
    tab: "properties"
  },
  { 
    label: "Bookings", 
    icon: Calendar, 
    href: "#bookings",
    count: 8,
    tab: "bookings"
  },
  { 
    label: "Revenue", 
    icon: IndianRupee, 
    href: "#revenue",
    tab: "revenue"
  },
  { 
    label: "Pricing", 
    icon: BarChart3, 
    href: "#pricing",
    tab: "pricing"
  },
  { 
    label: "Guests", 
    icon: Users, 
    href: "#guests",
    tab: "guests"
  },

  { 
    label: "Settings", 
    icon: Settings, 
    href: "#settings",
    tab: "settings"
  },
]

export default function HostDashboardContent() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeNav, setActiveNav] = useState("Dashboard")
  const [activeTab, setActiveTab] = useState("overview")
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Mock user data (replace with actual data from your session/API)
  const user = {
    name: session?.user?.name || "Host User",
    email: session?.user?.email || "host@example.com",
    image: session?.user?.image || "https://ui-avatars.com/api/?name=Host+User&background=0D9488&color=fff",
  }
  
  // Fetch analytics data
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setIsLoading(true)
        const data = await fetchDashboardStats("30days")
        setAnalyticsData(data)
      } catch (error: any) {
        console.error("Error loading dashboard data:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to load dashboard data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadAnalytics()
  }, [])
  
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  
  const handleNavClick = (item: any) => {
    setActiveNav(item.label)
    if (item.tab) {
      setActiveTab(item.tab)
    }
  }
  
  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleSidebar}
          className="bg-white"
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-darkGreen text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/10">
            <Link href="/" className="flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-lightGreen" />
              <h1 className="text-xl font-bold text-lightGreen">Baithaka Host</h1>
            </Link>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className={cn(
                      "flex items-center py-2 px-3 rounded-md hover:bg-white/10 transition-colors",
                      activeNav === item.label && "bg-white/10 text-lightGreen"
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item);
                    }}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                    {item.count && (
                      <Badge 
                        className="ml-auto bg-lightGreen text-darkGreen hover:bg-lightGreen/90"
                      >
                        {item.count}
                      </Badge>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User section */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center">
              <div className="relative w-8 h-8 mr-3">
                <Image 
                  src={user.image} 
                  alt={user.name}
                  className="rounded-full"
                  fill
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-white/70 truncate">{user.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => signOut()}
                className="text-white hover:bg-white/10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
        {/* Top bar */}
        <header className="bg-white border-b h-16 flex items-center px-4 lg:px-6">
          <div className="flex items-center w-full">
            <div className="flex md:w-[300px] max-w-sm items-center relative mr-4">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search"
                placeholder="Search..." 
                className="pl-8 bg-gray-50 border-gray-200"
              />
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[300px]">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    <DropdownMenuItem className="py-3 cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">New Booking</p>
                        <p className="text-xs text-gray-500">Raj Sharma booked Mountain View for 3 nights</p>
                        <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3 cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">Payment Received</p>
                        <p className="text-xs text-gray-500">₹12,500 payment received for Garden Cottage</p>
                        <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="py-3 cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">New Review</p>
                        <p className="text-xs text-gray-500">Anita Desai left a 5-star review</p>
                        <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                      </div>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="justify-center cursor-pointer">
                    <Link href="#notifications" className="text-darkGreen text-sm">
                      View all notifications
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <div className="hidden md:flex items-center">
                <div className="relative w-8 h-8 mr-2">
                  <Image 
                    src={user.image} 
                    alt={user.name}
                    className="rounded-full"
                    fill
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{user.name}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard content */}
        <main className="p-4 md:p-6 lg:p-8 overflow-y-auto" style={{ height: "calc(100vh - 4rem)" }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Host Dashboard</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-darkGreen">Home</Link>
              <ChevronRight className="h-4 w-4 mx-1" />
              <span>{activeNav}</span>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="properties">Properties</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="revenue">Revenue</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <DashboardOverview />
            </TabsContent>
            
            <TabsContent value="properties">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium">Your Properties</h3>
                {isLoading ? (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">Loading your properties...</p>
                  </div>
                ) : analyticsData?.properties && analyticsData.properties.length > 0 ? (
                  <div className="mt-4 divide-y">
                    {analyticsData.properties.map((property: any) => (
                      <div key={property.id} className="py-4 flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{property.title}</h4>
                          <p className="text-sm text-gray-500">
                            {property.location.city}, {property.location.state}
                          </p>
                          <p className="text-sm text-gray-500">
                            {property.type} • {property.bedrooms} bedrooms
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-darkGreen">₹{property.price}/night</p>
                          <div className="flex items-center justify-end text-sm mt-1">
                            <span className="text-gray-500 mr-4">{property.bookings} bookings</span>
                            <span className="font-medium">₹{property.revenue} revenue</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500">You haven't listed any properties yet.</p>
                    <Button className="mt-4 bg-darkGreen hover:bg-darkGreen/90">
                      Add Your First Property
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="bookings">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium">Your Bookings</h3>
                <p className="text-gray-500 mt-2">
                  {isLoading ? "Loading your bookings..." : 
                    analyticsData?.totalBookings ? 
                    `You have ${analyticsData.totalBookings} bookings.` : 
                    "You don't have any bookings yet."}
                </p>
                
                {!isLoading && analyticsData?.totalBookings === 0 && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md text-center">
                    <p className="text-gray-600">
                      When guests book your properties, they will appear here.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="revenue">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Revenue Management</h3>
                  <span className="text-xl font-bold text-darkGreen">
                    {isLoading ? "..." : `₹${analyticsData?.totalRevenue || 0}`}
                  </span>
                </div>
                <p className="text-gray-500 mt-2">
                  {isLoading ? "Loading revenue data..." : 
                    analyticsData?.totalRevenue ? 
                    `Your revenue for the past 30 days.` : 
                    "You haven't earned any revenue yet."}
                </p>
                
                {!isLoading && analyticsData?.revenueTimeline && (
                  <div className="mt-6 p-4 border rounded-md">
                    <h4 className="font-medium mb-2">Revenue Timeline</h4>
                    <div className="h-[200px] bg-gray-50 flex items-center justify-center rounded-md">
                      <p className="text-gray-500">
                        Revenue chart will be displayed here with {analyticsData.revenueTimeline.length} data points.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="pricing">
              {isLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">Loading pricing recommendations...</p>
                </div>
              ) : analyticsData?.properties && analyticsData.properties.length > 0 ? (
                <PriceRecommendations properties={analyticsData.properties} />
              ) : (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">List properties to get pricing recommendations.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="guests">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium">Guest Management</h3>
                <p className="text-gray-500 mt-2">Manage your guest interactions and reviews.</p>
              </div>
            </TabsContent>
            

            
            <TabsContent value="settings">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-medium">Account Settings</h3>
                <p className="text-gray-500 mt-2">Manage your host account settings and preferences.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 