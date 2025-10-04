'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  BedDouble,
  Activity,
  RefreshCw,
  Download,
  Filter,
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Star,
  Eye,
  Settings
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PropertyDashboard {
  property: {
    id: string
    date: string
    lastUpdated: string
  }
  occupancy: {
    rate: number
    roomsOccupied: number
    totalRooms: number
    availableRooms: number
  }
  roomStatus: {
    total: number
    available: number
    occupied: number
    dirty: number
    clean: number
    maintenance: number
    outOfOrder: number
    blocked: number
  }
  arrivals: {
    today: number
    tomorrow: number
    details: Array<{
      id: string
      bookingCode: string
      guestName: string
      email: string
      phone: string
      checkIn: string
      checkOut: string
      roomType: string
      adults: number
      children: number
      status: string
    }>
  }
  departures: {
    today: number
    details: Array<{
      id: string
      bookingCode: string
      guestName: string
      checkOut: string
      roomType: string
    }>
  }
  housekeeping: {
    pending: number
    inProgress: number
    completed: number
    priority: number
  }
  maintenance: {
    open: number
    inProgress: number
    urgent: number
  }
  revenue: {
    monthlyRevenue: number
    averageRate: number
    revPAR: number
    totalBookings: number
    currency: string
  }
  alerts: Array<{
    type: string
    level: 'info' | 'warning' | 'critical'
    message: string
    action: string
  }>
  upcomingBookings: any[]
  forecasting?: {
    period: string
    forecast: Array<{
      date: string
      occupancyRate: number
      occupiedRooms: number
      availableRooms: number
    }>
    averageOccupancy: number
    peakOccupancy: number
    lowOccupancy: number
  }
  rooms: Array<{
    id: string
    number: string
    type: string
    status: string
    housekeepingStatus: string
    housekeepingPriority: string
    currentGuest: string | null
    maintenanceIssues: number
    rate: number
    availability: any
  }>
}

interface Property {
  _id: string
  name: string
  title: string
  address: {
    street: string
    city: string
    state: string
    country: string
  }
  propertyType: string
  status: 'available' | 'unavailable' | 'maintenance' | 'deleted'
  totalHotelRooms: string
  rating: number
  reviewCount: number
  pricing: {
    perNight: string
    perWeek: string
    perMonth: string
  }
  occupancyRate?: number
  revenue?: number
  isPublished: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export default function PropertyOperationsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [dashboard, setDashboard] = useState<PropertyDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProperty, setSelectedProperty] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [includeForecasting, setIncludeForecasting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [view, setView] = useState<'dashboard' | 'properties'>('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    fetchProperties()
    if (selectedProperty && view === 'dashboard') {
      fetchDashboard()
    }
  }, [])

  useEffect(() => {
    if (selectedProperty && view === 'dashboard') {
      fetchDashboard()
    }
  }, [selectedProperty, selectedDate, includeForecasting])

  const fetchProperties = async () => {
    try {
      const mockProperties: Property[] = [
        {
          _id: 'prop1',
          name: 'Baithaka Grand Hotel',
          title: 'Luxury Hotel in Downtown',
          address: {
            street: '123 Main Street',
            city: 'New Delhi',
            state: 'Delhi',
            country: 'India'
          },
          propertyType: 'hotel',
          status: 'available',
          totalHotelRooms: '50',
          rating: 4.5,
          reviewCount: 247,
          pricing: {
            perNight: '5000',
            perWeek: '30000',
            perMonth: '120000'
          },
          occupancyRate: 85,
          revenue: 450000,
          isPublished: true,
          verificationStatus: 'approved',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-08-25T00:00:00.000Z'
        },
        {
          _id: 'prop2',
          name: 'Baithaka Comfort Suites',
          title: 'Business Hotel Near Airport',
          address: {
            street: '456 Airport Road',
            city: 'Mumbai',
            state: 'Maharashtra',
            country: 'India'
          },
          propertyType: 'hotel',
          status: 'available',
          totalHotelRooms: '30',
          rating: 4.2,
          reviewCount: 156,
          pricing: {
            perNight: '3500',
            perWeek: '20000',
            perMonth: '80000'
          },
          occupancyRate: 72,
          revenue: 280000,
          isPublished: true,
          verificationStatus: 'approved',
          createdAt: '2024-02-20T00:00:00.000Z',
          updatedAt: '2024-08-20T00:00:00.000Z'
        }
      ]
      
      setProperties(mockProperties)
      if (!selectedProperty && mockProperties.length > 0) {
        setSelectedProperty(mockProperties[0]._id)
      }
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch properties:', error)
      setLoading(false)
    }
  }

  const fetchDashboard = async () => {
    if (!selectedProperty) return
    
    setLoading(true)
    setError('')
    
    try {
      const params = new URLSearchParams({
        propertyId: selectedProperty,
        date: selectedDate,
        ...(includeForecasting && { forecasting: 'true' })
      })

      const response = await fetch(`/api/os/properties?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch dashboard')
      }

      setDashboard(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    if (view === 'dashboard') {
      await fetchDashboard()
    } else {
      await fetchProperties()
    }
  }

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.city.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || property.status === statusFilter
    const matchesType = typeFilter === 'all' || property.propertyType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-blue-500',
      dirty: 'bg-yellow-500',
      clean: 'bg-emerald-500',
      maintenance: 'bg-orange-500',
      out_of_order: 'bg-red-500',
      blocked: 'bg-gray-500',
      unavailable: 'bg-red-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const getAlertColor = (level: string) => {
    const colors = {
      info: 'border-blue-200 bg-blue-50 text-blue-800',
      warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      critical: 'border-red-200 bg-red-50 text-red-800'
    }
    return colors[level as keyof typeof colors] || colors.info
  }

  const handlePropertyAction = (property: Property, action: string) => {
    switch (action) {
      case 'view':
        window.location.href = `/os/properties/${property._id}`
        break
      case 'rooms':
        window.location.href = `/os/properties/${property._id}/rooms`
        break
      case 'settings':
        window.location.href = `/os/properties/${property._id}/settings`
        break
      case 'dashboard':
        setSelectedProperty(property._id)
        setView('dashboard')
        break
      default:
        break
    }
  }

  if (loading && !dashboard && view === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Operations Center</h1>
            <p className="text-gray-600">Real-time property management and operations dashboard</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-white rounded-lg p-1 shadow-sm border">
              <Button
                onClick={() => setView('dashboard')}
                variant={view === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => setView('properties')}
                variant={view === 'properties' ? 'default' : 'ghost'}
                size="sm"
              >
                Properties
              </Button>
            </div>

            <Button 
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {view === 'dashboard' && (
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
            
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property._id} value={property._id}>
                    {property.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setIncludeForecasting(!includeForecasting)}
              variant={includeForecasting ? "default" : "outline"}
              size="sm"
            >
              <Activity className="h-4 w-4 mr-2" />
              Forecasting
            </Button>
          </div>
        )}

        {view === 'dashboard' && dashboard && (
          <>
            {/* Alerts Section */}
            {dashboard.alerts.length > 0 && (
              <div className="grid gap-4">
                {dashboard.alerts.map((alert, index) => (
                  <Alert key={index} className={getAlertColor(alert.level)}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{alert.message}</strong>
                      <br />
                      <span className="text-sm">{alert.action}</span>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.occupancy.rate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {dashboard.occupancy.roomsOccupied} of {dashboard.occupancy.totalRooms} rooms
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.arrivals.today}</div>
                  <p className="text-xs text-muted-foreground">
                    Tomorrow: {dashboard.arrivals.tomorrow}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboard.revenue.monthlyRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    RevPAR: ${dashboard.revenue.revPAR}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Housekeeping</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboard.housekeeping.pending}</div>
                  <p className="text-xs text-muted-foreground">
                    Rooms pending cleanup
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rooms">Rooms</TabsTrigger>
                <TabsTrigger value="arrivals">Arrivals</TabsTrigger>
                <TabsTrigger value="housekeeping">Housekeeping</TabsTrigger>
                <TabsTrigger value="forecast">Forecast</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Room Status Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Room Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Bar
                        data={{
                          labels: ['Available', 'Occupied', 'Dirty', 'Clean', 'Maintenance', 'Out of Order'],
                          datasets: [{
                            label: 'Rooms',
                            data: [
                              dashboard.roomStatus.available,
                              dashboard.roomStatus.occupied,
                              dashboard.roomStatus.dirty,
                              dashboard.roomStatus.clean,
                              dashboard.roomStatus.maintenance,
                              dashboard.roomStatus.outOfOrder
                            ],
                            backgroundColor: [
                              '#10b981',
                              '#3b82f6',
                              '#f59e0b',
                              '#059669',
                              '#f97316',
                              '#ef4444'
                            ]
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false },
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    </CardContent>
                  </Card>

                  {/* Revenue Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Insights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Average Rate:</span>
                        <span className="font-semibold">${dashboard.revenue.averageRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>RevPAR:</span>
                        <span className="font-semibold">${dashboard.revenue.revPAR}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bookings:</span>
                        <span className="font-semibold">{dashboard.revenue.totalBookings}</span>
                      </div>
                      <div className="flex justify-between border-t pt-4">
                        <span>Monthly Revenue:</span>
                        <span className="font-bold text-lg">
                          ${dashboard.revenue.monthlyRevenue.toLocaleString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="rooms">
                <Card>
                  <CardHeader>
                    <CardTitle>Room Status Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {dashboard.rooms.map((room) => (
                        <div key={room.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Room {room.number}</h3>
                            <Badge className={`${getStatusColor(room.status)} text-white`}>
                              {room.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{room.type}</p>
                          {room.currentGuest && (
                            <p className="text-sm">
                              <Users className="h-3 w-3 inline mr-1" />
                              {room.currentGuest}
                            </p>
                          )}
                          <div className="flex items-center justify-between text-sm">
                            <span>Rate: ${room.rate}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={
                                room.housekeepingStatus === 'clean' ? 'border-green-500 text-green-700' : 
                                room.housekeepingStatus === 'dirty' ? 'border-yellow-500 text-yellow-700' : 
                                'border-gray-500 text-gray-700'
                              }>
                                {room.housekeepingStatus}
                              </Badge>
                              {room.maintenanceIssues > 0 && (
                                <Badge variant="outline" className="border-red-500 text-red-700">
                                  <Wrench className="h-3 w-3 mr-1" />
                                  {room.maintenanceIssues}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="arrivals">
                <Card>
                  <CardHeader>
                    <CardTitle>Today's Arrivals ({dashboard.arrivals.today})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboard.arrivals.details.map((arrival) => (
                        <div key={arrival.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{arrival.guestName}</h3>
                            <Badge className={
                              arrival.status === 'confirmed' ? 'bg-green-500' :
                              arrival.status === 'checked_in' ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }>
                              {arrival.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p>Booking: {arrival.bookingCode}</p>
                              <p>Room Type: {arrival.roomType}</p>
                              <p>Guests: {arrival.adults} adults{arrival.children > 0 && `, ${arrival.children} children`}</p>
                            </div>
                            <div>
                              <p>Check-in: {new Date(arrival.checkIn).toLocaleDateString()}</p>
                              <p>Check-out: {new Date(arrival.checkOut).toLocaleDateString()}</p>
                              <p>Contact: {arrival.email}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="housekeeping">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Housekeeping Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Pending Tasks</span>
                          <Badge className="bg-yellow-500">{dashboard.housekeeping.pending}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>In Progress</span>
                          <Badge className="bg-blue-500">{dashboard.housekeeping.inProgress}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Completed</span>
                          <Badge className="bg-green-500">{dashboard.housekeeping.completed}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Priority Tasks</span>
                          <Badge className="bg-red-500">{dashboard.housekeeping.priority}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Maintenance Requests</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>Open Requests</span>
                          <Badge className="bg-yellow-500">{dashboard.maintenance.open}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>In Progress</span>
                          <Badge className="bg-blue-500">{dashboard.maintenance.inProgress}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Urgent</span>
                          <Badge className="bg-red-500">{dashboard.maintenance.urgent}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="forecast">
                {dashboard.forecasting ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>30-Day Occupancy Forecast</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Line
                          data={{
                            labels: dashboard.forecasting.forecast.slice(0, 14).map(day => 
                              new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            ),
                            datasets: [{
                              label: 'Occupancy Rate (%)',
                              data: dashboard.forecasting.forecast.slice(0, 14).map(day => day.occupancyRate),
                              borderColor: '#3b82f6',
                              backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              fill: true
                            }]
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { display: false },
                            },
                            scales: {
                              y: { 
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                  callback: function(value) {
                                    return value + '%'
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Forecast Summary</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Average Occupancy:</span>
                          <span className="font-semibold">{dashboard.forecasting.averageOccupancy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Peak Occupancy:</span>
                          <span className="font-semibold">{dashboard.forecasting.peakOccupancy}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lowest Occupancy:</span>
                          <span className="font-semibold">{dashboard.forecasting.lowOccupancy}%</span>
                        </div>
                        <div className="text-sm text-gray-600 mt-4">
                          Forecast covers next 30 days based on confirmed bookings and historical patterns.
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Enable Forecasting</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Get insights into future occupancy patterns and trends.
                      </p>
                      <Button 
                        onClick={() => setIncludeForecasting(true)}
                        className="mb-4"
                      >
                        <Activity className="h-4 w-4 mr-2" />
                        Generate Forecast
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}

        {view === 'properties' && (
          <>
            {/* Properties View Header & Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="hotel">Hotel</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="resort">Resort</SelectItem>
                  </SelectContent>
                </Select>

                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <Card key={property._id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{property.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{property.title}</p>
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {property.address.city}, {property.address.state}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <Badge className={getStatusColor(property.status) + " text-white"}>
                        {property.status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        {property.rating} ({property.reviewCount} reviews)
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600">Rooms:</span>
                        <span className="ml-1 font-medium">{property.totalHotelRooms}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium capitalize">{property.propertyType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price/Night:</span>
                        <span className="ml-1 font-medium">₹{property.pricing.perNight}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Occupancy:</span>
                        <span className="ml-1 font-medium text-green-600">{property.occupancyRate || 0}%</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePropertyAction(property, 'dashboard')}
                        variant="default"
                        size="sm"
                        className="flex-1"
                      >
                        <Activity className="h-4 w-4 mr-1" />
                        Dashboard
                      </Button>
                      <Button
                        onClick={() => handlePropertyAction(property, 'rooms')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <BedDouble className="h-4 w-4 mr-1" />
                        Rooms
                      </Button>
                      <Button
                        onClick={() => handlePropertyAction(property, 'settings')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProperties.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first property</p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}