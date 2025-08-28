"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Link,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Eye,
  Settings,
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"

interface OTAChannel {
  channelName: string
  displayName: string
  connected: boolean
  lastSync?: Date
  syncStatus: 'active' | 'pending' | 'error' | 'disabled'
  bookings24h?: number
  revenue24h?: number
}

interface OTAStatusProps {
  propertyId?: string
}

export function OTAStatusWidget({ propertyId }: OTAStatusProps) {
  const router = useRouter()
  const params = useParams()
  const currentPropertyId = propertyId || (params.id as string)
  
  const [otaChannels, setOtaChannels] = useState<OTAChannel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Mock data for demonstration - replace with real API calls
  useEffect(() => {
    const fetchOTAStatus = async () => {
      setIsLoading(true)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock OTA data
      const mockChannels: OTAChannel[] = [
        {
          channelName: 'booking.com',
          displayName: 'Booking.com',
          connected: true,
          lastSync: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          syncStatus: 'active',
          bookings24h: 12,
          revenue24h: 28500
        },
        {
          channelName: 'makemytrip',
          displayName: 'MakeMyTrip',
          connected: true,
          lastSync: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          syncStatus: 'active',
          bookings24h: 8,
          revenue24h: 15200
        },
        {
          channelName: 'oyo',
          displayName: 'OYO',
          connected: false,
          syncStatus: 'error',
          bookings24h: 0,
          revenue24h: 0
        },
        {
          channelName: 'agoda',
          displayName: 'Agoda',
          connected: true,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          syncStatus: 'pending',
          bookings24h: 5,
          revenue24h: 9800
        },
        {
          channelName: 'expedia',
          displayName: 'Expedia',
          connected: false,
          syncStatus: 'disabled',
          bookings24h: 0,
          revenue24h: 0
        }
      ]
      
      setOtaChannels(mockChannels)
      setLastUpdated(new Date())
      setIsLoading(false)
    }

    fetchOTAStatus()
  }, [currentPropertyId])

  const connectedChannels = otaChannels.filter(ch => ch.connected).length
  const totalChannels = otaChannels.length
  const totalBookings = otaChannels.reduce((sum, ch) => sum + (ch.bookings24h || 0), 0)
  const totalRevenue = otaChannels.reduce((sum, ch) => sum + (ch.revenue24h || 0), 0)
  const connectionRate = totalChannels > 0 ? (connectedChannels / totalChannels) * 100 : 0

  const handleViewDetails = () => {
    router.push(`/os/ota-config/${currentPropertyId}`)
  }

  const handleRefresh = () => {
    setIsLoading(true)
    // Trigger a refresh of OTA data
    setTimeout(() => setIsLoading(false), 1000)
  }

  const getStatusIcon = (status: string, connected: boolean) => {
    if (!connected && status === 'disabled') return <XCircle className="h-4 w-4 text-gray-400" />
    if (!connected || status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />
    if (status === 'active') return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === 'pending') return <Activity className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-gray-400" />
  }

  const getStatusBadge = (status: string, connected: boolean) => {
    if (!connected && status === 'disabled') return <Badge variant="secondary">Disabled</Badge>
    if (!connected || status === 'error') return <Badge variant="destructive">Error</Badge>
    if (status === 'active') return <Badge variant="default" className="bg-green-600">Active</Badge>
    if (status === 'pending') return <Badge variant="secondary" className="bg-yellow-600 text-white">Syncing</Badge>
    return <Badge variant="secondary">Unknown</Badge>
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Link className="mr-2 h-5 w-5 text-blue-600" />
          OTA Channel Manager
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleViewDetails}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-1" />
            Manage
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
            <span className="text-gray-500">Loading OTA status...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Connection Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{connectedChannels}</div>
                <div className="text-sm text-gray-600">Connected</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{totalBookings}</div>
                <div className="text-sm text-gray-600">Bookings (24h)</div>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">₹{totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Revenue (24h)</div>
              </div>
            </div>

            {/* Connection Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection Rate</span>
                <span className="text-sm text-gray-500">{connectedChannels}/{totalChannels} channels</span>
              </div>
              <Progress value={connectionRate} className="w-full" />
            </div>

            {/* Channel Status List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Channel Status</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {otaChannels.map((channel) => (
                  <div
                    key={channel.channelName}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(channel.syncStatus, channel.connected)}
                      <div>
                        <div className="text-sm font-medium">{channel.displayName}</div>
                        {channel.lastSync && (
                          <div className="text-xs text-gray-500">
                            Last sync: {channel.lastSync.toLocaleTimeString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {channel.bookings24h !== undefined && channel.bookings24h > 0 && (
                        <span className="text-xs text-green-600 font-medium">
                          {channel.bookings24h} bookings
                        </span>
                      )}
                      {getStatusBadge(channel.syncStatus, channel.connected)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={handleViewDetails}
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}