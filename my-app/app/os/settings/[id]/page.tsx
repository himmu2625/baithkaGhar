"use client"

import React, { useState, useEffect } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useParams, useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Settings as SettingsIcon,
  Keyboard as KeyboardIcon,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Database as DatabaseIcon,
  Users as UsersIcon,
  Save as SaveIcon,
  RefreshCw as RefreshIcon,
} from "lucide-react"

interface KeyboardShortcut {
  category: string
  shortcuts: {
    key: string
    action: string
    description: string
  }[]
}

export default function SettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const [activeTab, setActiveTab] = useState("general")
  const [propertyData, setPropertyData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const propertyId = (params as { id?: string } | null)?.id as string

  // Comprehensive keyboard shortcuts data
  const keyboardShortcuts: KeyboardShortcut[] = [
    {
      category: "Navigation",
      shortcuts: [
        {
          key: "Ctrl + 1",
          action: "Dashboard",
          description: "Go to main dashboard overview",
        },
        {
          key: "Ctrl + 2",
          action: "Bookings",
          description: "Access booking management",
        },
        {
          key: "Ctrl + 3",
          action: "Rooms & Inventory",
          description: "Manage rooms and inventory",
        },
        {
          key: "Ctrl + 4",
          action: "Financial Reports",
          description: "View revenue and payments",
        },
        {
          key: "Ctrl + 5",
          action: "Analytics",
          description: "Access performance metrics",
        },
        {
          key: "Ctrl + 6",
          action: "Guest Management",
          description: "Manage guest profiles",
        },
        {
          key: "Ctrl + 7",
          action: "Staff Management",
          description: "Team and permissions",
        },
        {
          key: "Ctrl + 8",
          action: "Tasks & Reports",
          description: "Daily operations management",
        },
        {
          key: "Ctrl + 9",
          action: "Settings",
          description: "Property configuration settings",
        },
      ],
    },
    {
      category: "System Controls",
      shortcuts: [
        {
          key: "Ctrl + M",
          action: "Toggle Menu",
          description: "Show/hide the sidebar navigation",
        },
        {
          key: "Ctrl + F",
          action: "Toggle Fullscreen",
          description: "Enter or exit fullscreen mode",
        },
        {
          key: "F11",
          action: "Fullscreen",
          description: "Standard fullscreen toggle",
        },
        {
          key: "Ctrl + Q",
          action: "Logout",
          description: "Sign out of the OS",
        },
        {
          key: "Escape",
          action: "Close Sidebar",
          description: "Close the navigation sidebar",
        },
      ],
    },
    {
      category: "Future Shortcuts",
      shortcuts: [
        {
          key: "Ctrl + N",
          action: "New Booking",
          description: "Create a new reservation (Coming soon)",
        },
        {
          key: "Ctrl + S",
          action: "Quick Save",
          description: "Save current form data (Coming soon)",
        },
        {
          key: "Ctrl + /",
          action: "Search",
          description: "Global search functionality (Coming soon)",
        },
        {
          key: "Ctrl + H",
          action: "Help",
          description: "Open help documentation (Coming soon)",
        },
      ],
    },
  ]

  // Fetch property data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.propertyId) return

      try {
        setIsLoadingData(true)
        const response = await fetch(`/api/properties/${user.propertyId}`)
        if (response.ok) {
          const data = await response.json()
          setPropertyData(data.property)
        } else {
          throw new Error("Failed to fetch property data")
        }
      } catch (error) {
        console.error("Error fetching property data:", error)
        setError("Failed to load property data")
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [user?.propertyId])

  // Authentication check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    } else if (
      isAuthenticated &&
      user?.propertyId &&
      propertyId !== user.propertyId
    ) {
      // Redirect to correct property
      router.push(`/os/settings/${user.propertyId}`)
    }
  }, [isAuthenticated, isLoading, user, propertyId, router])

  if (isLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your property configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            System Online
          </Badge>
        </div>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <Button
                variant={activeTab === "general" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("general")}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                General
              </Button>
              <Button
                variant={activeTab === "shortcuts" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("shortcuts")}
              >
                <KeyboardIcon className="h-4 w-4 mr-2" />
                Keyboard Shortcuts
              </Button>
              <Button
                variant={activeTab === "notifications" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("notifications")}
              >
                <BellIcon className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button
                variant={activeTab === "security" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("security")}
              >
                <ShieldIcon className="h-4 w-4 mr-2" />
                Security
              </Button>
              <Button
                variant={activeTab === "data" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("data")}
              >
                <DatabaseIcon className="h-4 w-4 mr-2" />
                Data & Privacy
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeTab === "general" && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic property configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property-name">Property Name</Label>
                    <Input
                      id="property-name"
                      defaultValue={
                        propertyData?.title || propertyData?.name || ""
                      }
                      placeholder="Enter property name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="property-type">Property Type</Label>
                    <Input
                      id="property-type"
                      defaultValue="Hotel"
                      placeholder="Enter property type"
                    />
                  </div>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    defaultValue="Asia/Kolkata (GMT+5:30)"
                    placeholder="Select timezone"
                  />
                </div>

                <div className="flex justify-end">
                  <Button>
                    <SaveIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "shortcuts" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <KeyboardIcon className="h-5 w-5 mr-2" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>
                  Complete list of keyboard shortcuts for efficient navigation
                  and control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <KeyboardIcon className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="font-medium text-blue-900">Pro Tip</span>
                    </div>
                    <p className="text-sm text-blue-800">
                      Hover over any sidebar item to see its keyboard shortcut.
                      These shortcuts work throughout the OS for quick
                      navigation.
                    </p>
                  </div>

                  <Accordion
                    type="multiple"
                    defaultValue={["navigation", "system"]}
                    className="w-full"
                  >
                    {keyboardShortcuts.map((category, index) => (
                      <AccordionItem
                        key={index}
                        value={category.category.toLowerCase()}
                      >
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center">
                            <span className="font-medium">
                              {category.category}
                            </span>
                            <Badge variant="secondary" className="ml-2">
                              {category.shortcuts.length} shortcuts
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                            {category.shortcuts.map(
                              (shortcut, shortcutIndex) => (
                                <div
                                  key={shortcutIndex}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <Badge
                                        variant="outline"
                                        className="font-mono text-xs px-2 py-1"
                                      >
                                        {shortcut.key}
                                      </Badge>
                                      <span className="font-medium">
                                        {shortcut.action}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">
                                      {shortcut.description}
                                    </p>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="font-medium text-yellow-900">
                        Future Updates
                      </span>
                    </div>
                    <p className="text-sm text-yellow-800">
                      More keyboard shortcuts will be added as new features are
                      introduced to the OS. This section will always contain the
                      most up-to-date list.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Notification settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage security preferences and access controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Security settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === "data" && (
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>
                  Control your data and privacy preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Data and privacy settings will be available in a future
                  update.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
