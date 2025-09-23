"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Calendar,
  Users,
  Bed,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Activity,
  BarChart3,
  Zap,
  Bell,
  Settings,
  Eye,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { format, addDays, startOfDay, endOfDay } from "date-fns"

interface OverbookingAlert {
  id: string
  date: string
  roomTypeId: string
  roomTypeName: string
  totalRooms: number
  confirmedBookings: number
  pendingBookings: number
  overbookingCount: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
}

interface CapacityAnalysis {
  date: string
  roomTypeId: string
  roomTypeName: string
  totalCapacity: number
  utilization: number
  availableRooms: number
  maintenanceRooms: number
  overbookingRisk: number
  projectedOccupancy: number
}

interface OverbookingSettings {
  allowOverbooking: boolean
  maxOverbookingPercentage: number
  alertThresholds: {
    low: number
    medium: number
    high: number
    critical: number
  }
  autoPreventOverbooking: boolean
  bufferRooms: number
}

export function OverbookingPrevention({ propertyId }: { propertyId: string }) {
  const [alerts, setAlerts] = useState<OverbookingAlert[]>([])
  const [capacityAnalysis, setCapacityAnalysis] = useState<CapacityAnalysis[]>([])
  const [settings, setSettings] = useState<OverbookingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("alerts")
  const [analysisDateRange, setAnalysisDateRange] = useState(30) // days

  // Fetch overbooking data
  useEffect(() => {
    const fetchOverbookingData = async () => {
      setLoading(true)
      try {
        const endDate = addDays(new Date(), analysisDateRange)

        // Fetch overbooking alerts
        const alertsResponse = await fetch(
          `/api/os/bookings/${propertyId}/overbooking-alerts?endDate=${endDate.toISOString()}`
        )
        if (alertsResponse.ok) {
          const alertsData = await alertsResponse.json()
          if (alertsData.success) {
            setAlerts(alertsData.alerts || [])
          }
        }

        // Fetch capacity analysis
        const capacityResponse = await fetch(
          `/api/os/bookings/${propertyId}/capacity-analysis?days=${analysisDateRange}`
        )
        if (capacityResponse.ok) {
          const capacityData = await capacityResponse.json()
          if (capacityData.success) {
            setCapacityAnalysis(capacityData.analysis || [])
          }
        }

        // Fetch overbooking settings
        const settingsResponse = await fetch(`/api/os/settings/${propertyId}/overbooking`)
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          if (settingsData.success) {
            setSettings(settingsData.settings)
          }
        } else {
          // Default settings if none exist
          setSettings({
            allowOverbooking: false,
            maxOverbookingPercentage: 10,
            alertThresholds: {
              low: 85,
              medium: 95,
              high: 105,
              critical: 115
            },
            autoPreventOverbooking: true,
            bufferRooms: 2
          })
        }
      } catch (error) {
        console.error("Error fetching overbooking data:", error)
        toast({
          title: "Data Loading Failed",
          description: "Failed to load overbooking analysis",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (propertyId) {
      fetchOverbookingData()
    }
  }, [propertyId, analysisDateRange])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'critical': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Clock className="h-4 w-4" />
      case 'medium': return <AlertTriangle className="h-4 w-4" />
      case 'high': return <XCircle className="h-4 w-4" />
      case 'critical': return <Zap className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getRiskLevel = (utilizationPercent: number) => {
    if (utilizationPercent >= 110) return 'critical'
    if (utilizationPercent >= 100) return 'high'
    if (utilizationPercent >= 90) return 'medium'
    return 'low'
  }

  const updateOverbookingSettings = async (newSettings: Partial<OverbookingSettings>) => {
    try {
      const response = await fetch(`/api/os/settings/${propertyId}/overbooking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSettings(prev => ({ ...prev!, ...newSettings }))
          toast({
            title: "Settings Updated",
            description: "Overbooking prevention settings have been updated",
          })
        }
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update overbooking settings",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Overbooking Analysis...</p>
        </div>
      </div>
    )
  }

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical')
  const highAlerts = alerts.filter(alert => alert.severity === 'high')
  const totalOverbooked = alerts.reduce((sum, alert) => sum + alert.overbookingCount, 0)

  return (
    <div className="space-y-6">
      {/* Header with Critical Alerts */}
      <Card className={cn(
        "border-0 shadow-lg",
        criticalAlerts.length > 0
          ? "bg-gradient-to-r from-red-50 to-orange-50"
          : "bg-gradient-to-r from-green-50 to-emerald-50"
      )}>
        <CardHeader>
          <CardTitle className={cn(
            "text-2xl font-bold flex items-center space-x-2",
            criticalAlerts.length > 0 ? "text-red-900" : "text-green-900"
          )}>
            <Shield className="h-6 w-6" />
            <span>Overbooking Prevention System</span>
            {criticalAlerts.length > 0 && (
              <Badge className="bg-red-500 text-white animate-pulse">
                {criticalAlerts.length} Critical Alert{criticalAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription className={cn(
            criticalAlerts.length > 0 ? "text-red-700" : "text-green-700"
          )}>
            {criticalAlerts.length > 0
              ? "⚠️ Critical overbooking detected - immediate action required"
              : "✅ All room types within safe capacity limits"
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Critical Overbooking Detected!</div>
            <div className="space-y-1">
              {criticalAlerts.map(alert => (
                <div key={alert.id}>
                  • {alert.roomTypeName} on {format(new Date(alert.date), 'MMM d, yyyy')}:
                  {alert.overbookingCount} rooms overbooked ({alert.confirmedBookings}/{alert.totalRooms} rooms)
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-900">{alerts.length}</div>
            <div className="text-sm text-red-700">Active Alerts</div>
            <div className="flex justify-center mt-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-900">{totalOverbooked}</div>
            <div className="text-sm text-orange-700">Overbooked Rooms</div>
            <div className="flex justify-center mt-2">
              <Bed className="h-4 w-4 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(capacityAnalysis.reduce((sum, item) => sum + item.utilization, 0) / Math.max(capacityAnalysis.length, 1))}%
            </div>
            <div className="text-sm text-blue-700">Avg Utilization</div>
            <div className="flex justify-center mt-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-900">
              {settings?.autoPreventOverbooking ? 'ON' : 'OFF'}
            </div>
            <div className="text-sm text-green-700">Auto Prevention</div>
            <div className="flex justify-center mt-2">
              <Shield className="h-4 w-4 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="alerts">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Alerts</span>
              {alerts.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {alerts.length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Analysis</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="prevention">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Prevention</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="settings">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Overbooking Alerts</h3>
                <p className="text-gray-600">All room types are within safe capacity limits</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map(alert => (
                <Card key={alert.id} className="border-l-4 border-l-red-500">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {getSeverityIcon(alert.severity)}
                            <span className="ml-1">{alert.severity.toUpperCase()}</span>
                          </Badge>
                          <div>
                            <div className="font-semibold text-lg">{alert.roomTypeName}</div>
                            <div className="text-sm text-gray-600">
                              {format(new Date(alert.date), 'EEEE, MMMM d, yyyy')}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Total Rooms:</span>
                            <div className="font-semibold">{alert.totalRooms}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Confirmed:</span>
                            <div className="font-semibold text-blue-600">{alert.confirmedBookings}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Pending:</span>
                            <div className="font-semibold text-yellow-600">{alert.pendingBookings}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Overbooked:</span>
                            <div className="font-semibold text-red-600">+{alert.overbookingCount}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Recommended Actions:</div>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {alert.recommendations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-3xl font-bold text-red-600">
                          {Math.round((alert.confirmedBookings / alert.totalRooms) * 100)}%
                        </div>
                        <div className="text-sm text-gray-500">Occupancy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Capacity Analysis - Next {analysisDateRange} Days</h3>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisDateRange(7)}
                className={analysisDateRange === 7 ? "bg-blue-100" : ""}
              >
                7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisDateRange(30)}
                className={analysisDateRange === 30 ? "bg-blue-100" : ""}
              >
                30 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisDateRange(90)}
                className={analysisDateRange === 90 ? "bg-blue-100" : ""}
              >
                90 Days
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacityAnalysis.map((analysis, index) => {
              const riskLevel = getRiskLevel(analysis.utilization)

              return (
                <Card key={`${analysis.roomTypeId}-${analysis.date}`} className="border-0 shadow-lg">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{analysis.roomTypeName}</div>
                        <Badge className={getSeverityColor(riskLevel)}>
                          {analysis.utilization}%
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600">
                        {format(new Date(analysis.date), 'MMM d, yyyy')}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Utilization</span>
                          <span className="font-medium">{analysis.utilization}%</span>
                        </div>
                        <Progress
                          value={Math.min(analysis.utilization, 100)}
                          className="h-2"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Available:</span>
                          <div className="font-medium text-green-600">{analysis.availableRooms}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Maintenance:</span>
                          <div className="font-medium text-orange-600">{analysis.maintenanceRooms}</div>
                        </div>
                      </div>

                      {analysis.overbookingRisk > 0 && (
                        <div className="p-2 bg-red-50 rounded border border-red-200">
                          <div className="text-xs text-red-800">
                            <span className="font-medium">Risk:</span> {analysis.overbookingRisk}% overbooking probability
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Prevention Tab */}
        <TabsContent value="prevention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Prevention Strategies</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Immediate Actions</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Upgrade guests to available room types
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Contact guests for date changes
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Bed className="h-4 w-4 mr-2" />
                      Release maintenance rooms early
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Long-term Strategies</h4>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Adjust pricing for peak dates
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Set booking limits per room type
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      Implement waitlist system
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overbooking Prevention Settings</CardTitle>
              <CardDescription>
                Configure automatic prevention rules and alert thresholds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings && (
                <>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Allow Overbooking</h4>
                      <p className="text-sm text-gray-600">Permit bookings beyond room capacity</p>
                    </div>
                    <Button
                      variant={settings.allowOverbooking ? "default" : "outline"}
                      onClick={() => updateOverbookingSettings({ allowOverbooking: !settings.allowOverbooking })}
                    >
                      {settings.allowOverbooking ? "Enabled" : "Disabled"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Auto Prevention</h4>
                      <p className="text-sm text-gray-600">Automatically prevent overbooking</p>
                    </div>
                    <Button
                      variant={settings.autoPreventOverbooking ? "default" : "outline"}
                      onClick={() => updateOverbookingSettings({ autoPreventOverbooking: !settings.autoPreventOverbooking })}
                    >
                      {settings.autoPreventOverbooking ? "ON" : "OFF"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Alert Thresholds</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(settings.alertThresholds).map(([level, value]) => (
                        <div key={level} className="space-y-2">
                          <label className="text-sm font-medium capitalize">{level}</label>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{value}%</span>
                            <Badge className={getSeverityColor(level as any)}>
                              {level}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}