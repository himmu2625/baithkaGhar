"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import {
  ShieldIcon,
  StarIcon,
  CalendarIcon,
  CheckIcon,
  BuildingIcon,
  DashboardIcon,
  UsersIcon,
  AnalyticsIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
  CloseIcon,
  IndianRupeeIcon,
  FlagIcon,
  UserIcon,
  TrendingUpIcon,
} from "@/components/ui/enhanced-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signOut } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { SessionProvider } from "@/components/common/session-provider"
import { toast } from "react-hot-toast"
import Footer from "@/components/layout/footer"

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  adminOnly?: boolean
  badge?: number
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [pendingRequests, setPendingRequests] = useState(0)

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: AnalyticsIcon },
    { name: "Users", href: "/admin/users", icon: UsersIcon },
    { name: "Properties", href: "/admin/properties", icon: BuildingIcon },
    {
      name: "Property Requests",
      href: "/admin/property-requests",
      icon: CheckIcon,
      badge: pendingRequests,
    },
    {
      name: "Property Credentials",
      href: "/admin/property-credentials",
      icon: ShieldIcon,
    },
    { name: "Travel Picks", href: "/admin/travel-picks", icon: TrendingUpIcon },
    { name: "Travel Agents", href: "/admin/travel-agents", icon: UsersIcon },
    { name: "Team", href: "/admin/team", icon: UsersIcon },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarIcon },
    { name: "Payments", href: "/admin/payments", icon: IndianRupeeIcon },
    { name: "Influencers", href: "/admin/influencers", icon: UsersIcon },
    { name: "Payouts", href: "/admin/payouts", icon: IndianRupeeIcon },
    { name: "Reviews", href: "/admin/reviews", icon: StarIcon },
    {
      name: "Analytics Dashboard",
      href: "/admin/analytics/dashboard",
      icon: AnalyticsIcon,
    },
    {
      name: "Analytics Heatmaps",
      href: "/admin/analytics/heatmaps",
      icon: AnalyticsIcon,
    },
    { name: "Promotions", href: "/admin/promotions", icon: StarIcon },
    { name: "Reports", href: "/admin/reports", icon: FlagIcon },
    {
      name: "Access Requests",
      href: "/admin/requests",
      icon: UserIcon,
      adminOnly: true,
    },
    
    { name: "Settings", href: "/admin/settings", icon: SettingsIcon },
  ]

  // Check if current path is login page or setup page to prevent redirect loops
  const isLoginPage = pathname === "/admin/login"
  const isSetupPage = pathname === "/admin/setup"

  // Use ref to track navigation to prevent loops
  const hasRedirected = useRef(false)

  const safeDirect = (url: string) => {
    if (!hasRedirected.current) {
      hasRedirected.current = true
      console.log(`AdminLayout: Redirecting to ${url}`)
      router.push(url)
    }
  }

  useEffect(() => {
    if (isLoginPage || isSetupPage) {
      return
    }

    // Simple authentication check without complex redirect logic
    if (status === "unauthenticated") {
      console.log("AdminLayout: Unauthenticated, redirecting to login.")
      router.push("/admin/login")
      return
    }

    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role
      const isAdmin = userRole === "admin" || userRole === "super_admin"

      if (!isAdmin) {
        console.log("AdminLayout: User is not admin, redirecting to login.")
        sessionStorage.setItem("adminLoginInfo", "unauthorized")
        router.push("/admin/login")
        return
      }

      // User is authenticated and has admin role - all good
      console.log("AdminLayout: User is authenticated admin, allowing access.")
    }
  }, [status, session, isLoginPage, isSetupPage, router])

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await fetch(
        "/api/admin/property-requests?status=pending&limit=1"
      )
      const data = await response.json()
      if (data.success) {
        setPendingRequests(data.pagination.total)
      }
    } catch (error) {
      console.error("Error fetching pending requests count:", error)
    }
  }

  // Fetch pending requests when user is authenticated
  useEffect(() => {
    if (session?.user) {
      fetchPendingRequestsCount()
    }
  }, [session?.user])

  // Special case for login page or setup page - don't apply admin layout
  if (isLoginPage || isSetupPage) {
    return children
  }

  // Show loading state while checking auth
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    )
  }

  // Handle authenticated users who are not admin
  if (
    status === "authenticated" &&
    session?.user?.role !== "admin" &&
    session?.user?.role !== "super_admin"
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You don't have admin privileges to access this area.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Current role: {session?.user?.role || "None"}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/admin/login")}
              className="w-full bg-darkGreen text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              Try Admin Login
            </button>
            <button
              onClick={() => window.open("/api/admin/debug-auth", "_blank")}
              className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-opacity-90 text-sm"
            >
              Debug Authentication
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If user is not authenticated, don't render admin layout
  if (status === "unauthenticated") {
    return null
  }

  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === "super_admin"

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/login")
      toast.success("Signed out successfully")
    } catch (error) {
      toast.error("Error signing out")
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <CloseIcon size="sm" /> : <MenuIcon size="sm" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 mt-12 bg-darkGreen text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center">
              <ShieldIcon className="h-6 w-6 text-lightGreen mr-2" size="md" />
              <div>
                <h1 className="text-xl font-bold text-lightGreen">
                  Admin Panel
                </h1>
                {isSuperAdmin && (
                  <span className="text-xs text-emerald-400">Super Admin</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                // Skip admin-only items for regular admins
                if (item.adminOnly && !isSuperAdmin) {
                  return null
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/10">
            <div className="text-sm text-white/70 mb-3">
              <p className="truncate">
                {session?.user?.name || "Administrator"}
              </p>
              <p className="truncate text-xs">{session?.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center py-2 px-3 rounded-md text-white/70 hover:text-white hover:bg-white/10 w-full"
            >
              <LogOutIcon className="h-5 w-5 mr-3" size="sm" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 flex flex-col min-h-screen",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
        <main className="p-4 md:p-6 lg:p-8 flex-grow pb-16">{children}</main>
        <Footer />
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

// Wrapper component that provides the session
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  )
}
