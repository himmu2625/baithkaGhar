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
  MapPin as MapPinIcon,
  Link as LinkIcon,
  UtensilsCrossed as FBIcon,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CommandPalette, useCommandPalette } from "@/components/os/ui/command-palette"

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
  const commandPalette = useCommandPalette()

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
      name: "Food & Beverage",
      href: `/os/fb/dashboard/${user?.propertyId}`,
      icon: FBIcon,
      description: "Restaurant & kitchen management",
    },
    {
      name: "Tasks & Reports",
      href: `/os/tasks/${user?.propertyId}`,
      icon: ClipboardIcon,
      description: "Daily operations",
    },
    {
      name: "OTA Management",
      href: `/os/ota-config/${user?.propertyId}`,
      icon: LinkIcon,
      description: "Channel manager & OTAs",
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
    "Food & Beverage": "Ctrl+8",
    "Tasks & Reports": "Ctrl+9",
    "OTA Management": "Ctrl+0",
    Settings: "Ctrl+`",
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
            router.push(`/os/fb/dashboard/${user?.propertyId}`)
            break
          case "9":
            event.preventDefault()
            router.push(`/os/tasks/${user?.propertyId}`)
            break
          case "0":
            event.preventDefault()
            router.push(`/os/ota-config/${user?.propertyId}`)
            break
          case "`":
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
        // Check if fullscreen is supported and allowed
        if (!document.documentElement.requestFullscreen) {
          console.log("Fullscreen API not supported")
          return
        }

        if (document.fullscreenElement) {
          console.log("Already in fullscreen mode")
          return
        }

        // Check permissions before attempting fullscreen
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permission = await navigator.permissions.query({ name: 'fullscreen' as PermissionName })
            if (permission.state === 'denied') {
              console.log("Fullscreen permission denied")
              setShowFullscreenPrompt(true)
              setTimeout(() => setShowFullscreenPrompt(false), 8000)
              return
            }
          } catch (permissionError) {
            console.log("Permission query not supported, proceeding with fullscreen attempt")
          }
        }

        console.log("Attempting to enter fullscreen...")
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
        setShowWelcomePrompt(false)
        console.log("Fullscreen activated successfully")
      } catch (error) {
        console.log("Fullscreen failed:", error)
        // Don't show error for user-initiated actions, only show helpful prompt
        if (!showWelcomePrompt) {
          setShowFullscreenPrompt(true)
          setTimeout(() => setShowFullscreenPrompt(false), 8000)
        }
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
      {/* Enhanced Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 text-white transform transition-all duration-500 ease-in-out lg:translate-x-0 lg:static lg:inset-0 shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full relative">
          {/* Decorative background elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-xl"></div>

          {/* Enhanced Sidebar header */}
          <div className="relative p-6 border-b border-white/20 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-2">
              <div className="flex items-center">
                  <div className="relative w-8 h-8 mr-3 flex-shrink-0 flex items-center justify-center">
                  <Image
                      src="/android-chrome-512x512.png"
                    alt="Baithaka GHAR"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain filter contrast-125 saturate-150 brightness-110 drop-shadow-lg"
                    priority
                  />
                </div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-200 to-indigo-200 bg-clip-text text-transparent">
                    Baithaka GHAR OS
                  </h1>
                </div>
                <span className="text-sm text-blue-200/80 font-medium ml-11">
                  Hotel Management System
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white hover:bg-white/20 transition-all duration-200 rounded-lg p-2"
              >
                <CloseIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Enhanced Property Info */}
          {propertyData && (
            <div className="relative p-5 border-b border-white/20 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-2xl border border-white/20">
                    {(() => {
                      // Check for images in order of preference
                      let imageUrl = null

                      // First check categorizedImages
                      if (
                        propertyData.categorizedImages &&
                        propertyData.categorizedImages.length > 0
                      ) {
                        const firstCategory = propertyData.categorizedImages[0]
                        if (
                          firstCategory.files &&
                          firstCategory.files.length > 0
                        ) {
                          imageUrl = firstCategory.files[0].url
                        }
                      }

                      // Then check basic images array
                      if (
                        !imageUrl &&
                        propertyData.images &&
                        propertyData.images.length > 0
                      ) {
                        imageUrl = propertyData.images[0]
                      }

                      // Then check legacyGeneralImages
                      if (
                        !imageUrl &&
                        propertyData.legacyGeneralImages &&
                        propertyData.legacyGeneralImages.length > 0
                      ) {
                        imageUrl = propertyData.legacyGeneralImages[0].url
                      }

                      return imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={propertyData.title || "Property"}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image and show fallback
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 flex items-center justify-center">
                          <span className="text-white font-bold text-lg drop-shadow-lg">
                            {propertyData.title?.charAt(0)?.toUpperCase() ||
                              "P"}
                  </span>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-green-500/30 rounded-xl blur-md scale-110 -z-10"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {propertyData.title || propertyData.name}
                  </p>
                  <p className="text-xs text-blue-200/80 truncate flex items-center mt-1">
                    <MapPinIcon className="h-3 w-3 mr-1" />
                    {propertyData.address?.city}, {propertyData.address?.state}
                  </p>
                  <div className="flex items-center mt-2 space-x-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                      <span className="text-xs text-green-300 font-medium">
                        Live System
                      </span>
                    </div>
                    <div className="flex items-center">
                      <BedIcon className="h-3 w-3 mr-1 text-blue-300" />
                      <span className="text-xs text-blue-200/80">
                        {(() => {
                          // Calculate total rooms from different sources
                          let totalRooms = 0

                          // First try totalHotelRooms
                          if (propertyData.totalHotelRooms) {
                            totalRooms =
                              parseInt(propertyData.totalHotelRooms) || 0
                          }

                          // If no totalHotelRooms, calculate from propertyUnits
                          if (
                            totalRooms === 0 &&
                            propertyData.propertyUnits &&
                            propertyData.propertyUnits.length > 0
                          ) {
                            totalRooms = propertyData.propertyUnits.reduce(
                              (sum: number, unit: any) =>
                                sum + (unit.count || 0),
                              0
                            )
                          }

                          // If still no rooms, try from metrics
                          if (
                            totalRooms === 0 &&
                            propertyData.metrics &&
                            propertyData.metrics.totalRooms
                          ) {
                            totalRooms = propertyData.metrics.totalRooms
                          }

                          return totalRooms
                        })()}{" "}
                        Rooms
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Navigation */}
          <nav className="relative flex-1 overflow-y-auto p-4 space-y-2">
            <div className="space-y-1">
              {navigation.map((item, index) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href)
                return (
                  <div key={item.name} className="relative">
                  <Link
                    href={item.href}
                    title={`${item.description} (${
                      keyboardShortcuts[item.name] || ""
                    })`}
                    className={cn(
                        "group relative flex items-center py-3 px-4 rounded-xl transition-all duration-300 ease-in-out transform hover:scale-[1.02]",
                        isActive
                          ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white shadow-lg border border-blue-400/30"
                          : "text-blue-100/80 hover:text-white hover:bg-white/10 hover:shadow-md"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-400 rounded-r-full"></div>
                      )}

                      {/* Icon container */}
                      <div
                        className={cn(
                          "relative p-2 rounded-lg mr-3 transition-all duration-300",
                          isActive
                            ? "bg-gradient-to-br from-blue-400/20 to-indigo-500/20 shadow-lg"
                            : "group-hover:bg-white/10"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive
                              ? "text-blue-300"
                              : "text-blue-200/70 group-hover:text-white"
                          )}
                        />
                      </div>

                      {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={cn(
                              "font-medium transition-all duration-300",
                              isActive ? "text-white" : "group-hover:text-white"
                            )}
                          >
                            {item.name}
                          </span>
                    {item.badge && (
                            <Badge
                              variant={isActive ? "default" : "secondary"}
                              className={cn(
                                "ml-2 text-xs transition-all duration-300",
                                isActive
                                  ? "bg-blue-500/30 text-blue-100 border-blue-400/50"
                                  : "bg-white/10 text-blue-200 hover:bg-white/20"
                              )}
                            >
                        {item.badge}
                      </Badge>
                    )}
                        </div>
                        <p
                          className={cn(
                            "text-xs mt-1 transition-all duration-300",
                            isActive
                              ? "text-blue-200/80"
                              : "text-blue-200/60 group-hover:text-blue-200/80"
                          )}
                        >
                          {item.description}
                        </p>
                      </div>

                      {/* Hover effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </Link>
                  </div>
                )
              })}
            </div>
          </nav>

          {/* Enhanced User Section */}
          <div className="relative p-5 border-t border-white/20 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-sm">
            {/* Quick Actions */}
            <div className="mb-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center py-2 px-3 text-blue-200/80 hover:text-white hover:bg-white/10 text-xs rounded-lg transition-all duration-200 hover:scale-105"
                  title="Toggle Fullscreen (F11 or Ctrl+F)"
                >
                  <span className="mr-2">🔲</span>
                  {isFullscreen ? "Exit Full" : "Fullscreen"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="flex items-center justify-center py-2 px-3 text-blue-200/80 hover:text-white hover:bg-white/10 lg:hidden rounded-lg transition-all duration-200 hover:scale-105"
                  title="Toggle Menu (Ctrl+M)"
                >
                  <MenuIcon className="h-4 w-4 mr-1" />
                  Menu
                </Button>
              </div>
            </div>

            {/* Enhanced User Profile */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full overflow-hidden shadow-xl border border-white/30">
                    {(() => {
                      // Check for images in order of preference
                      let imageUrl = null

                      // First check categorizedImages
                      if (
                        propertyData?.categorizedImages &&
                        propertyData.categorizedImages.length > 0
                      ) {
                        const firstCategory = propertyData.categorizedImages[0]
                        if (
                          firstCategory.files &&
                          firstCategory.files.length > 0
                        ) {
                          imageUrl = firstCategory.files[0].url
                        }
                      }

                      // Then check basic images array
                      if (
                        !imageUrl &&
                        propertyData?.images &&
                        propertyData.images.length > 0
                      ) {
                        imageUrl = propertyData.images[0]
                      }

                      // Then check legacyGeneralImages
                      if (
                        !imageUrl &&
                        propertyData?.legacyGeneralImages &&
                        propertyData.legacyGeneralImages.length > 0
                      ) {
                        imageUrl = propertyData.legacyGeneralImages[0].url
                      }

                      return imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={propertyData?.title || "Property"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image and show fallback
                            e.currentTarget.style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm drop-shadow-md">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </span>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white shadow-md"></div>
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/40 to-purple-500/40 rounded-full blur-sm scale-125 -z-10"></div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {user?.username}
                  </p>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <p className="text-xs text-green-300 font-medium">Active</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-blue-200/80 hover:text-white hover:bg-red-500/20 hover:border-red-400/50 border border-transparent transition-all duration-200 rounded-lg p-2"
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
        {/* Enhanced Mobile menu toggle button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden absolute top-4 left-4 z-10 bg-gradient-to-r from-blue-500/90 to-indigo-500/90 hover:from-blue-600 hover:to-indigo-600 text-white shadow-xl backdrop-blur-sm border border-white/20 rounded-xl transition-all duration-300 hover:scale-105"
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
        
        {/* Command Palette */}
        <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
        
        {/* Command Palette Hint */}
        {!commandPalette.isOpen && (
          <div className="fixed bottom-6 right-6 z-30">
            <Button
              variant="outline"
              size="sm"
              onClick={commandPalette.open}
              className="bg-slate-900/90 backdrop-blur border-slate-700 text-white hover:bg-slate-800 shadow-xl"
            >
              <span className="mr-2">⌘K</span>
              Quick Actions
            </Button>
          </div>
        )}
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
