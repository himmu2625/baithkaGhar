"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useWebSocket } from "@/hooks/use-websocket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  X,
  Zap,
  Clock,
  Users,
  TrendingUp,
  Wifi,
  WifiOff,
} from "lucide-react"

interface Notification {
  id: string
  type:
    | "info"
    | "success"
    | "warning"
    | "error"
    | "booking"
    | "property"
    | "alert"
    | "metric"
    | "user"
  title: string
  message: string
  timestamp: string
  data?: any
  read: boolean
  priority: "low" | "medium" | "high" | "critical"
}

interface NotificationGroup {
  type: string
  notifications: Notification[]
  count: number
}

export function RealTimeNotifications() {
  const { isConnected, isAuthenticated, onMessage, offMessage } = useWebSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Handle incoming notifications
  const handleDashboardUpdate = useCallback(
    (data: any) => {
      const notification: Notification = {
        id: `update-${Date.now()}-${Math.random()}`,
        type:
          data.type === "booking_update"
            ? "booking"
            : data.type === "property_update"
            ? "property"
            : data.type === "alert_update"
            ? "alert"
            : data.type === "metric_update"
            ? "metric"
            : "info",
        title: `${data.type.replace("_", " ").toUpperCase()} Update`,
        message: `New ${data.type.replace("_", " ")} received`,
        timestamp: new Date().toISOString(),
        data,
        read: false,
        priority: "medium",
      }

      addNotification(notification)
    },
    [addNotification]
  )

  const handleUserActivity = useCallback(
    (data: any) => {
      const notification: Notification = {
        id: `activity-${Date.now()}-${Math.random()}`,
        type: "user",
        title: "User Activity",
        message: `${data.userRole || "User"} performed ${
          data.activity?.action || "an action"
        }`,
        timestamp: new Date().toISOString(),
        data,
        read: false,
        priority: "low",
      }

      addNotification(notification)
    },
    [addNotification]
  )

  const handleUserOnline = useCallback(
    (data: any) => {
      const notification: Notification = {
        id: `online-${Date.now()}-${Math.random()}`,
        type: "success",
        title: "User Online",
        message: `${data.userRole || "User"} is now online`,
        timestamp: new Date().toISOString(),
        data,
        read: false,
        priority: "low",
      }

      addNotification(notification)
    },
    [addNotification]
  )

  const handleUserOffline = useCallback(
    (data: any) => {
      const notification: Notification = {
        id: `offline-${Date.now()}-${Math.random()}`,
        type: "warning",
        title: "User Offline",
        message: `${data.userRole || "User"} went offline`,
        timestamp: new Date().toISOString(),
        data,
        read: false,
        priority: "medium",
      }

      addNotification(notification)
    },
    [addNotification]
  )

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev.slice(0, 49)]) // Keep last 50 notifications
    setUnreadCount((prev) => prev + 1)

    // Auto-remove low priority notifications after 30 seconds
    if (notification.priority === "low") {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
      }, 30000)
    }
  }, [])

  // Subscribe to WebSocket events
  useEffect(() => {
    if (isAuthenticated) {
      onMessage("dashboard_update", handleDashboardUpdate)
      onMessage("user_activity", handleUserActivity)
      onMessage("user_online", handleUserOnline)
      onMessage("user_offline", handleUserOffline)

      return () => {
        offMessage("dashboard_update")
        offMessage("user_activity")
        offMessage("user_online")
        offMessage("user_offline")
      }
    }
  }, [
    isAuthenticated,
    onMessage,
    offMessage,
    handleDashboardUpdate,
    handleUserActivity,
    handleUserOnline,
    handleUserOffline,
  ])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }, [])

  const removeNotification = useCallback((notificationId: string) => {
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId)
      if (notification && !notification.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
      return prev.filter((n) => n.id !== notificationId)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
    setUnreadCount(0)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "booking":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "property":
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case "metric":
        return <Zap className="w-4 h-4 text-yellow-500" />
      case "user":
        return <Users className="w-4 h-4 text-purple-500" />
      default:
        return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "border-red-500 bg-red-50"
      case "high":
        return "border-orange-500 bg-orange-50"
      case "medium":
        return "border-yellow-500 bg-yellow-50"
      case "low":
        return "border-gray-500 bg-gray-50"
      default:
        return "border-gray-500 bg-gray-50"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor(
      (now.getTime() - notificationTime.getTime()) / (1000 * 60)
    )

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return notificationTime.toLocaleDateString()
  }

  const groupedNotifications = notifications.reduce((groups, notification) => {
    const type = notification.type
    if (!groups[type]) {
      groups[type] = { type, notifications: [], count: 0 }
    }
    groups[type].notifications.push(notification)
    groups[type].count++
    return groups
  }, {} as Record<string, NotificationGroup>)

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {showNotifications && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 overflow-hidden z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearAll}
                  disabled={notifications.length === 0}
                >
                  Clear all
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{notifications.length} total</span>
              <span>{unreadCount} unread</span>
              <div className="flex items-center space-x-1">
                {isConnected ? (
                  <Wifi className="w-3 h-3 text-green-500" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-500" />
                )}
                <span className="text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2" />
                <p>No notifications</p>
                <p className="text-sm">New notifications will appear here</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {Object.values(groupedNotifications).map((group) => (
                  <div
                    key={group.type}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <div className="px-4 py-2 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {group.type.replace("_", " ")}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.count}
                        </Badge>
                      </div>
                    </div>
                    {group.notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 border-l-4 ${getPriorityColor(
                          notification.priority
                        )} ${!notification.read ? "bg-blue-50" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              {notification.data && (
                                <details className="mt-2">
                                  <summary className="text-xs text-gray-500 cursor-pointer">
                                    View details
                                  </summary>
                                  <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(notification.data, null, 2)}
                                  </pre>
                                </details>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            {!notification.read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="h-6 w-6 p-0"
                              >
                                <CheckCircle className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeNotification(notification.id)
                              }
                              className="h-6 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
