"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Search,
  Calendar,
  Bed,
  IndianRupee,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  Shield,
  Building2,
  Zap,
  ArrowRight,
  Clock,
  Phone,
  Mail,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Bell,
  Home,
  MapPin,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords: string[]
  shortcut?: string
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()
  const { user } = useOSAuth()

  const commands: CommandItem[] = useMemo(() => [
    // Navigation Commands
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      subtitle: "Main overview and analytics",
      icon: <Building2 className="h-4 w-4" />,
      action: () => router.push(`/os/dashboard/${user?.propertyId}`),
      category: "Navigation",
      keywords: ["dashboard", "home", "overview"],
      shortcut: "Ctrl+1"
    },
    {
      id: "nav-bookings",
      title: "View Bookings",
      subtitle: "Manage reservations and check-ins",
      icon: <Calendar className="h-4 w-4" />,
      action: () => router.push(`/os/bookings/${user?.propertyId}`),
      category: "Navigation",
      keywords: ["bookings", "reservations", "calendar"],
      shortcut: "Ctrl+2"
    },
    {
      id: "nav-inventory",
      title: "Room Inventory",
      subtitle: "Manage rooms and availability",
      icon: <Bed className="h-4 w-4" />,
      action: () => router.push(`/os/inventory/${user?.propertyId}`),
      category: "Navigation",
      keywords: ["rooms", "inventory", "availability"],
      shortcut: "Ctrl+3"
    },
    {
      id: "nav-financial",
      title: "Financial Reports",
      subtitle: "Revenue, payments, and analytics",
      icon: <IndianRupee className="h-4 w-4" />,
      action: () => router.push(`/os/financial/${user?.propertyId}`),
      category: "Navigation",
      keywords: ["financial", "revenue", "payments"],
      shortcut: "Ctrl+4"
    },
    {
      id: "nav-settings",
      title: "Property Settings",
      subtitle: "Configure property and preferences",
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push(`/os/settings/${user?.propertyId}`),
      category: "Navigation",
      keywords: ["settings", "config", "preferences"],
      shortcut: "Ctrl+9"
    },

    // Quick Actions
    {
      id: "action-new-booking",
      title: "Create New Booking",
      subtitle: "Quick booking entry",
      icon: <Plus className="h-4 w-4" />,
      action: () => {
        // Implementation for new booking modal
        console.log("Create new booking")
      },
      category: "Quick Actions",
      keywords: ["new", "booking", "create", "add"],
      shortcut: "Ctrl+N"
    },
    {
      id: "action-check-in",
      title: "Guest Check-in",
      subtitle: "Process guest arrival",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        // Implementation for check-in process
        console.log("Guest check-in")
      },
      category: "Quick Actions",
      keywords: ["check-in", "arrival", "guest"],
    },
    {
      id: "action-check-out",
      title: "Guest Check-out",
      subtitle: "Process guest departure",
      icon: <ArrowRight className="h-4 w-4" />,
      action: () => {
        // Implementation for check-out process
        console.log("Guest check-out")
      },
      category: "Quick Actions",
      keywords: ["check-out", "departure", "guest"],
    },
    {
      id: "action-housekeeping",
      title: "Update Room Status",
      subtitle: "Mark rooms as clean/dirty",
      icon: <Shield className="h-4 w-4" />,
      action: () => {
        // Implementation for room status update
        console.log("Update room status")
      },
      category: "Quick Actions",
      keywords: ["housekeeping", "room", "status", "clean"],
    },

    // Reports & Analytics
    {
      id: "report-occupancy",
      title: "Occupancy Report",
      subtitle: "Current room occupancy status",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        // Implementation for occupancy report
        console.log("Generate occupancy report")
      },
      category: "Reports",
      keywords: ["report", "occupancy", "analytics"],
    },
    {
      id: "report-revenue",
      title: "Revenue Report",
      subtitle: "Financial performance overview",
      icon: <IndianRupee className="h-4 w-4" />,
      action: () => {
        // Implementation for revenue report
        console.log("Generate revenue report")
      },
      category: "Reports",
      keywords: ["report", "revenue", "financial"],
    },
    {
      id: "report-export",
      title: "Export Data",
      subtitle: "Download reports in various formats",
      icon: <Download className="h-4 w-4" />,
      action: () => {
        // Implementation for data export
        console.log("Export data")
      },
      category: "Reports",
      keywords: ["export", "download", "data"],
    },

    // System Actions
    {
      id: "system-refresh",
      title: "Refresh Dashboard",
      subtitle: "Reload all dashboard data",
      icon: <RefreshCw className="h-4 w-4" />,
      action: () => {
        window.location.reload()
      },
      category: "System",
      keywords: ["refresh", "reload", "update"],
      shortcut: "Ctrl+R"
    },
    {
      id: "system-notifications",
      title: "View Notifications",
      subtitle: "Check recent alerts and updates",
      icon: <Bell className="h-4 w-4" />,
      action: () => {
        // Implementation for notifications panel
        console.log("View notifications")
      },
      category: "System",
      keywords: ["notifications", "alerts", "updates"],
    },

    // Help & Support
    {
      id: "help-support",
      title: "Contact Support",
      subtitle: "Get help with the system",
      icon: <Phone className="h-4 w-4" />,
      action: () => {
        // Implementation for support contact
        console.log("Contact support")
      },
      category: "Help",
      keywords: ["help", "support", "contact"],
    },
    {
      id: "help-docs",
      title: "Documentation",
      subtitle: "View user guide and tutorials",
      icon: <ClipboardList className="h-4 w-4" />,
      action: () => {
        // Implementation for documentation
        console.log("View documentation")
      },
      category: "Help",
      keywords: ["docs", "documentation", "help", "guide"],
    },
  ], [router, user?.propertyId])

  const filteredCommands = useMemo(() => {
    if (!query) return commands

    return commands.filter((command) => {
      const searchString = `${command.title} ${command.subtitle} ${command.keywords.join(" ")}`.toLowerCase()
      return searchString.includes(query.toLowerCase())
    })
  }, [commands, query])

  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: CommandItem[] } = {}
    
    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })

    return groups
  }, [filteredCommands])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setSelectedIndex((prev) => 
            prev < filteredCommands.length - 1 ? prev + 1 : prev
          )
          break
        case "ArrowUp":
          e.preventDefault()
          setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev)
          break
        case "Enter":
          e.preventDefault()
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action()
            onClose()
          }
          break
        case "Escape":
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, filteredCommands, selectedIndex, onClose])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleCommandClick = (command: CommandItem) => {
    command.action()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <div className="border-b border-slate-700 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-transparent border-0 text-white placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.entries(groupedCommands).map(([category, commands]) => (
            <div key={category} className="mb-4">
              <div className="px-2 py-1 text-xs font-medium text-slate-400 uppercase tracking-wider">
                {category}
              </div>
              <div className="space-y-1">
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command)
                  return (
                    <button
                      key={command.id}
                      onClick={() => handleCommandClick(command)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between group",
                        globalIndex === selectedIndex 
                          ? "bg-blue-600/20 text-white border border-blue-500/50" 
                          : "text-slate-300 hover:bg-slate-800/50"
                      )}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className={cn(
                          "flex-shrink-0 p-1.5 rounded-md",
                          globalIndex === selectedIndex 
                            ? "text-blue-400" 
                            : "text-slate-400 group-hover:text-white"
                        )}>
                          {command.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">{command.title}</div>
                          {command.subtitle && (
                            <div className="text-xs text-slate-400">{command.subtitle}</div>
                          )}
                        </div>
                      </div>
                      {command.shortcut && (
                        <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                          {command.shortcut}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No commands found</p>
              <p className="text-xs mt-1">Try searching with different keywords</p>
            </div>
          )}
        </div>

        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">↑↓</kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Enter</kbd>
                <span>Select</span>
              </span>
              <span className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs">Esc</kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="text-xs">
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for command palette
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return {
    isOpen,
    setIsOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }
}