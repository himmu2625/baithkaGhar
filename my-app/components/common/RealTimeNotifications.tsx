"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { io, Socket } from "socket.io-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  BellRing,
  Calendar,
  IndianRupee,
  AlertTriangle,
  MessageCircle,
  Settings,
  Volume2,
  VolumeX,
  Check,
  X,
  Eye,
  Wifi,
  WifiOff,
  Users,
  Clock
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: any
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string
  timestamp: Date
  metadata?: any
  actions?: Array<{action: string, label: string}>
  read?: boolean
}

interface ConnectionStats {
  totalConnections: number
  uniqueUsers: number
  usersByRole: Record<string, number>
  averageSessionDuration: number
  notificationsInHistory: number
  lastNotificationTime: Date | null
}

export default function RealTimeNotifications() {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [connectionStats, setConnectionStats] = useState<ConnectionStats | null>(null)
  const audioRef = useRef<HTMLAudioElement>()

  useEffect(() => {
    if (session?.user) {
      initializeSocket()
    }

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [session])

  const initializeSocket = async () => {
    try {
      // Get JWT token for WebSocket authentication
      const response = await fetch('/api/auth/session')
      const sessionData = await response.json()
      
      if (!sessionData?.accessToken) {
        console.error('No access token available for WebSocket connection')
        return
      }

      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
        auth: {
          token: sessionData.accessToken
        },
        transports: ['websocket', 'polling']
      })

      socketInstance.on('connect', () => {
        console.log('🔗 Connected to real-time notifications')
        setConnected(true)
        setSocket(socketInstance)
      })

      socketInstance.on('disconnect', () => {
        console.log('❌ Disconnected from real-time notifications')
        setConnected(false)
      })

      socketInstance.on('connected', (data) => {
        console.log('✅ WebSocket connection established:', data)
        if (data.activeUsers !== undefined) {
          setConnectionStats(prev => prev ? { ...prev, uniqueUsers: data.activeUsers } : null)
        }
      })

      socketInstance.on('notification', (notification: Notification) => {
        handleNewNotification(notification)
      })

      socketInstance.on('recent_notifications', (recentNotifications: Notification[]) => {
        setNotifications(recentNotifications.map(n => ({ ...n, read: false })))
        setUnreadCount(recentNotifications.length)
      })

      socketInstance.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error)
        toast({
          title: "Connection Error",
          description: "Unable to connect to real-time notifications",
          variant: "destructive"
        })
      })

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error)
    }
  }

  const handleNewNotification = (notification: Notification) => {
    console.log('📢 New notification:', notification)
    
    // Add to notifications list
    setNotifications(prev => [{ ...notification, read: false }, ...prev.slice(0, 49)]) // Keep last 50
    setUnreadCount(prev => prev + 1)

    // Play sound if enabled and priority is medium or higher
    if (soundEnabled && ['medium', 'high', 'urgent'].includes(notification.priority)) {
      playNotificationSound()
    }

    // Show toast for high priority notifications
    if (['high', 'urgent'].includes(notification.priority)) {
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.priority === 'urgent' ? "destructive" : "default",
        duration: notification.priority === 'urgent' ? 10000 : 5000
      })
    }

    // Auto-open panel for urgent notifications
    if (notification.priority === 'urgent') {
      setShowNotificationPanel(true)
    }
  }

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log('Could not play notification sound:', e))
    }
  }

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    
    if (socket) {
      socket.emit('mark_notification_read', notificationId)
    }
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const handleNotificationAction = (notification: Notification, action: string) => {
    console.log(`🎬 Handling action ${action} for notification ${notification.id}`)
    
    switch (action) {
      case 'view_booking':
        if (notification.metadata?.bookingId) {
          window.location.href = `/admin/bookings/${notification.metadata.bookingId}`
        }
        break
      case 'confirm_booking':
        // Handle booking confirmation
        break
      case 'process_refund':
        // Handle refund processing
        break
      case 'view_conflicts':
        window.location.href = `/admin/dashboard?tab=conflicts`
        break
      case 'dismiss':
        markAsRead(notification.id)
        break
    }
  }

  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = {
      className: `h-4 w-4 ${
        priority === 'urgent' ? 'text-red-500' : 
        priority === 'high' ? 'text-orange-500' : 
        priority === 'medium' ? 'text-blue-500' : 'text-gray-500'
      }`
    }

    switch (type) {
      case 'booking_created':
      case 'booking_updated':
        return <Calendar {...iconProps} />
      case 'payment_received':
        return <IndianRupee {...iconProps} />
      case 'system_alert':
      case 'overbooking_alert':
        return <AlertTriangle {...iconProps} />
      case 'guest_message':
        return <MessageCircle {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50'
      case 'high': return 'border-l-orange-500 bg-orange-50'
      case 'medium': return 'border-l-blue-500 bg-blue-50'
      case 'low': return 'border-l-gray-500 bg-gray-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      {/* Notification Sound */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
        <source src="/sounds/notification.wav" type="audio/wav" />
      </audio>

      {/* Notification Bell Icon */}
      <Sheet open={showNotificationPanel} onOpenChange={setShowNotificationPanel}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            {connected ? (
              <BellRing className="h-5 w-5" />
            ) : (
              <Bell className="h-5 w-5 text-gray-400" />
            )}
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span>Live Notifications</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span>Notifications (Offline)</span>
                  </>
                )}
              </SheetTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <SheetDescription>
              {connected ? (
                <div className="flex items-center gap-4 text-sm">
                  <span>Connected • {notifications.length} notifications</span>
                  {connectionStats && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {connectionStats.uniqueUsers} users online
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-red-600">Reconnecting to notification service...</span>
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  You'll see real-time updates here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification.id} 
                      className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'shadow-md' : 'opacity-75'
                      } cursor-pointer transition-all hover:shadow-lg`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getNotificationIcon(notification.type, notification.priority)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-sm">{notification.title}</h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{formatDistanceToNow(new Date(notification.timestamp))} ago</span>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Notification Actions */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {notification.actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant={action.action === 'dismiss' ? 'outline' : 'default'}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleNotificationAction(notification, action.action)
                                }}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}