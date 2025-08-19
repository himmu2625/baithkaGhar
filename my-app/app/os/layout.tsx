"use client"

import React from "react"
import { OSPropertyProvider } from "@/provider/OSProperty-provider"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Building2,
  LayoutDashboard as DashboardIcon,
  Calendar as CalendarIcon,
  Bed as BedIcon,
  IndianRupee as IndianRupeeIcon,
  Users as UsersIcon,
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  Menu as MenuIcon,
  X as CloseIcon,
  BarChart3 as BarChart3Icon,
  Clipboard as ClipboardIcon,
  Shield as ShieldIcon,
  Bell as BellIcon,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface OSLayoutProps {
  children: React.ReactNode
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: number
  description?: string
}

function OSLayoutContent({ children }: OSLayoutProps) {
  const { isAuthenticated, isLoading, user, logout } = useOSAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [propertyData, setPropertyData] = useState<any>(null)
  const [isLoadingProperty, setIsLoadingProperty] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false)
  const [showWelcomePrompt, setShowWelcomePrompt] = useState(false)

  // Don't redirect if we're already on the login page
  const isLoginPage = pathname === "/os/login"

  // Navigation items for the property OS
  const navigation: NavItem[] = [
    {
      name: "Dashboard",
      href: `/os/dashboard/${user?.propertyId}`,
      icon: DashboardIcon,
      description: "Overview and analytics",
    },
    {
      name: "Bookings",
      href: `/os/bookings/${user?.propertyId}`,
      icon: CalendarIcon,
      description: "Manage reservations",
    },
    {
      name: "Rooms & Inventory",
      href: `/os/inventory/${user?.propertyId}`,
      icon: BedIcon,
      description: "Room management",
    },
    {
      name: "Financial Reports",
      href: `/os/financial/${user?.propertyId}`,
      icon: IndianRupeeIcon,
      description: "Revenue and payments",
    },
    {
      name: "Analytics",
      href: `/os/analytics/${user?.propertyId}`,
      icon: BarChart3Icon,
      description: "Performance metrics",
    },
    {
      name: "Guest Management",
      href: `/os/guests/${user?.propertyId}`,
      icon: UsersIcon,
      description: "Guest profiles and history",
    },
    {
      name: "Staff Management",
      href: `/os/staff/${user?.propertyId}`,
      icon: ShieldIcon,
      description: "Team and permissions",
    },
    {
      name: "Tasks & Reports",
      href: `/os/tasks/${user?.propertyId}`,
      icon: ClipboardIcon,
      description: "Daily operations",
    },
    {
      name: "Settings",
      href: `/os/settings/${user?.propertyId}`,
      icon: SettingsIcon,
      description: "Property configuration",
    },
  ]

  // Keyboard shortcuts mapping for hover tooltips
  const keyboardShortcuts: { [key: string]: string } = {
    Dashboard: "Ctrl+1",
    Bookings: "Ctrl+2",
    "Rooms & Inventory": "Ctrl+3",
    "Financial Reports": "Ctrl+4",
    Analytics: "Ctrl+5",
    "Guest Management": "Ctrl+6",
    "Staff Management": "Ctrl+7",
    "Tasks & Reports": "Ctrl+8",
    Settings: "Ctrl+9",
  }

  // Fetch property data when user is authenticated
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (user?.propertyId && !propertyData) {
        setIsLoadingProperty(true)
        try {
          const response = await fetch(`/api/os/property/${user.propertyId}`)
          if (response.ok) {
            const data = await response.json()
            setPropertyData(data.property)
          }
        } catch (error) {
          console.error("Error fetching property data:", error)
        } finally {
          setIsLoadingProperty(false)
        }
      }
    }

    fetchPropertyData()
  }, [user?.propertyId, propertyData])

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      console.log("Not authenticated, redirecting to login page")
      router.push("/os/login")
    }
  }, [isAuthenticated, isLoading, router, isLoginPage])

  // Keyboard shortcuts for navigation and actions
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as Element)?.getAttribute("contenteditable") === "true"
      ) {
        return
      }

      // Ctrl/Cmd + key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case "1":
            event.preventDefault()
            router.push(`/os/dashboard/${user?.propertyId}`)
            break
          case "2":
            event.preventDefault()
            router.push(`/os/bookings/${user?.propertyId}`)
            break
          case "3":
            event.preventDefault()
            router.push(`/os/inventory/${user?.propertyId}`)
            break
          case "4":
            event.preventDefault()
            router.push(`/os/financial/${user?.propertyId}`)
            break
          case "5":
            event.preventDefault()
            router.push(`/os/analytics/${user?.propertyId}`)
            break
          case "6":
            event.preventDefault()
            router.push(`/os/guests/${user?.propertyId}`)
            break
          case "7":
            event.preventDefault()
            router.push(`/os/staff/${user?.propertyId}`)
            break
          case "8":
            event.preventDefault()
            router.push(`/os/tasks/${user?.propertyId}`)
            break
          case "9":
            event.preventDefault()
            router.push(`/os/settings/${user?.propertyId}`)
            break
          case "m":
            event.preventDefault()
            setSidebarOpen(!sidebarOpen)
            break
          case "f":
            event.preventDefault()
            toggleFullscreen()
            break
          case "q":
            event.preventDefault()
            logout()
            break
        }
      }

      // F11 for fullscreen toggle
      if (event.key === "F11") {
        event.preventDefault()
        toggleFullscreen()
      }

      // Escape key to close sidebar
      if (event.key === "Escape") {
        setSidebarOpen(false)
      }
    }

    if (isAuthenticated && !isLoginPage) {
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [
    router,
    user?.propertyId,
    sidebarOpen,
    isAuthenticated,
    isLoginPage,
    logout,
  ])

  // Fullscreen toggle functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true)
        })
        .catch((err) => {
          console.log("Error attempting to enable fullscreen:", err)
        })
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false)
        })
        .catch((err) => {
          console.log("Error attempting to exit fullscreen:", err)
        })
    }
  }

  // Auto-enter fullscreen when OS loads (after successful login)
  useEffect(() => {
    const enterFullscreen = async () => {
      try {
        if (
          document.documentElement.requestFullscreen &&
          !document.fullscreenElement
        ) {
          console.log("Attempting to enter fullscreen...")
          await document.documentElement.requestFullscreen()
          setIsFullscreen(true)
          setShowWelcomePrompt(false) // Hide welcome prompt if auto-fullscreen succeeds
          console.log("Fullscreen activated successfully")
        }
      } catch (error) {
        console.log("Fullscreen not supported or blocked:", error)
        // Show a subtle notification that user can manually enter fullscreen
        setShowFullscreenPrompt(true)
        // Auto-hide the prompt after 8 seconds
        setTimeout(() => setShowFullscreenPrompt(false), 8000)
      }
    }

    // Only auto-fullscreen if user is authenticated and not on login page
    if (isAuthenticated && !isLoginPage && !isLoading) {
      console.log("OS loaded, attempting auto-fullscreen...")

      // Show welcome prompt initially
      setShowWelcomePrompt(true)

      // Try auto-fullscreen with multiple attempts
      const timer1 = setTimeout(enterFullscreen, 500)
      const timer2 = setTimeout(enterFullscreen, 1500)
      const timer3 = setTimeout(enterFullscreen, 3000)

      // Hide welcome prompt after some time if user doesn't interact
      const hideWelcomeTimer = setTimeout(() => {
        setShowWelcomePrompt(false)
      }, 10000)

      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(hideWelcomeTimer)
      }
    }
  }, [isAuthenticated, isLoginPage, isLoading])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // If we're on the login page, render it directly
  if (isLoginPage) {
    return <>{children}</>
  }

  // For other pages, require authentication
  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="h-full w-full bg-gray-50 flex overflow-hidden">
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-darkGreen text-lightYellow transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-14 h-14 mr-3 flex-shrink-0">
                  <Image
                    src="/Logo.png"
                    alt="Baithaka GHAR"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                    priority
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-lightGreen">
                    Baithaka GHAR OS
                  </h1>
                  <span className="text-xs text-emerald-400">
                    Hotel Management Software
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/10"
              >
                <CloseIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Property Info */}
          {propertyData && (
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-lightGreen rounded-lg flex items-center justify-center">
                  <span className="text-darkGreen font-bold text-lg">
                    {propertyData.title?.charAt(0)?.toUpperCase() || "P"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {propertyData.title || propertyData.name}
                  </p>
                  <p className="text-xs text-lightYellow/70 truncate">
                    {propertyData.address?.city}, {propertyData.address?.state}
                  </p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    <span className="text-xs text-lightYellow/70">Online</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    title={`${item.description} (${
                      keyboardShortcuts[item.name] || ""
                    })`}
                    className={cn(
                      "flex items-center py-3 px-3 rounded-lg transition-all duration-200 group",
                      pathname === item.href || pathname?.startsWith(item.href)
                        ? "bg-lightGreen/20 text-white border-l-4 border-lightGreen"
                        : "text-lightYellow/80 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t border-white/10">
            {/* Quick Actions */}
            <div className="mb-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="flex-1 text-lightYellow/80 hover:text-white hover:bg-white/10 text-xs"
                  title="Toggle Fullscreen (F11 or Ctrl+F)"
                >
                  <span className="mr-1">🔲</span>
                  {isFullscreen ? "Exit Full" : "Fullscreen"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-lightYellow/80 hover:text-white hover:bg-white/10 lg:hidden"
                  title="Toggle Menu (Ctrl+M)"
                >
                  <MenuIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-lightGreen rounded-full flex items-center justify-center">
                  <span className="text-darkGreen font-semibold text-sm">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {user?.username}
                  </p>
                  <p className="text-xs text-lightYellow/70">Logged In</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-lightYellow/80 hover:text-white hover:bg-white/10"
                title="Logout (Ctrl+Q)"
              >
                <LogOutIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content - Completely full screen */}
      <div className="flex-1 min-w-0 relative">
        {/* Mobile menu toggle button - floating */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-10 bg-white/90 hover:bg-white shadow-lg"
          title="Open Menu (Ctrl+M)"
        >
          <MenuIcon className="h-5 w-5" />
        </Button>

        {/* Welcome Fullscreen Prompt - user-initiated fullscreen */}
        {showWelcomePrompt && !isFullscreen && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 bg-white rounded-lg shadow-2xl p-6 border border-gray-200 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🖥️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Welcome to Baithaka GHAR OS
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                For the best experience, we recommend using fullscreen mode.
                This gives you the complete desktop software experience.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    toggleFullscreen()
                    setShowWelcomePrompt(false)
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <span className="mr-2">🔲</span>
                  Enable Fullscreen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWelcomePrompt(false)}
                  className="flex-1"
                >
                  Continue
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                You can press F11 anytime to toggle fullscreen
              </p>
            </div>
          </div>
        )}

        {/* Fullscreen Prompt - appears when auto-fullscreen fails */}
        {showFullscreenPrompt && (
          <div className="absolute top-4 right-4 z-20 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <span>🔲</span>
            <div className="text-sm">
              <p className="font-medium">Press F11 for fullscreen mode</p>
              <p className="text-xs opacity-90">Get the full OS experience</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullscreenPrompt(false)}
              className="text-white hover:bg-white/20 p-1 ml-2"
            >
              ✕
            </Button>
          </div>
        )}

        {/* Page content - Completely full screen */}
        <main className="flex-1 h-full overflow-y-auto p-4 lg:p-6 bg-gray-50">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function OSLayout({ children }: OSLayoutProps) {
  return (
    <OSPropertyProvider>
      <OSLayoutContent>{children}</OSLayoutContent>
    </OSPropertyProvider>
  )
}
