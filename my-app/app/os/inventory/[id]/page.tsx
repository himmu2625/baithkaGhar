'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Settings, 
  Target,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  BarChart3,
  CalendarDays,
  Users
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface RoomInventory {
  id: string
  number: string
  type: string
  status: string
  currentRate: number
  rates: {
    baseRate: number
    seasonalRates: Array<{
      name: string
      startDate: string
      endDate: string
      multiplier: number
      fixedRate?: number
    }>
    occupancyRates: Array<{
      threshold: number
      multiplier: number
    }>
    weekendMultiplier: number
  }
  availability: {
    blockedDates: Array<{
      startDate: string
      endDate: string
      reason: string
      note?: string
    }>
    restrictions: Array<{
      date: string
      minimumStay?: number
      maximumStay?: number
      closedToArrival?: boolean
      closedToDeparture?: boolean
    }>
    minimumStay: number
    maximumStay: number
  }
  occupancy: {
    rate: number
    bookedNights: number
    availableNights: number
  }
  performance: {
    averageRate: number
    revenue: number
    bookings: number
    revPAR: number
  }
}

interface InventoryData {
  property: {
    id: string
    dateRange: {
      startDate: string
      endDate: string
    }
    lastUpdated: string
  }
  rooms: RoomInventory[]
  calendar: Array<{
    date: string
    dayOfWeek: number
    isWeekend: boolean
    rates: Array<{
      roomId: string
      roomNumber: string
      type: string
      rate: number
      available: boolean
    }>
  }>
  performance: {
    overall: {
      totalRevenue: number
      totalBookings: number
      averageRate: number
      revPAR: number
    }
  }
  occupancy: {
    occupancyRate: number
    totalRoomNights: number
    bookedRoomNights: number
    availableRoomNights: number
  }
  competitive: {
    averageMarketRate: number
    competitorRates: Array<{
      name: string
      rate: number
      occupancy: number
    }>
    marketPosition: string
    priceAdvantage: number
    recommendations: string[]
  }
  suggestions: Array<{
    type: string
    priority: string
    message: string
    action: string
    expectedImpact: string
  }>
}

export default function InventoryManagementPage({ params }: { params: { id: string } }) {
  const [inventory, setInventory] = useState<InventoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [roomType, setRoomType] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null)
  const [editingRates, setEditingRates] = useState(false)
  const [bulkUpdateMode, setBulkUpdateMode] = useState(false)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([])

  useEffect(() => {
    fetchInventory()
  }, [params.id, startDate, endDate, roomType])

  const fetchInventory = async () => {
    try {
      setLoading(true)
      setError('')

      const searchParams = new URLSearchParams({
        startDate,
        endDate,
        ...(roomType !== 'all' && { roomType })
      })

      const response = await fetch(`/api/os/inventory/${params.id}?${searchParams}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory')
      }

      setInventory(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateRoomRate = async (roomId: string, rateData: any) => {
    try {
      const response = await fetch(`/api/os/inventory/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_rate',
          roomId,
          ...rateData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update rate')
      }

      await fetchInventory()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const updateRoomAvailability = async (roomId: string, availabilityData: any) => {
    try {
      const response = await fetch(`/api/os/inventory/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_availability',
          roomId,
          ...availabilityData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update availability')
      }

      await fetchInventory()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const performBulkUpdate = async (updateData: any) => {
    try {
      const response = await fetch(`/api/os/inventory/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_rate_update',
          roomIds: selectedRooms,
          ...updateData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to perform bulk update')
      }

      await fetchInventory()
      setSelectedRooms([])
      setBulkUpdateMode(false)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getRoomTypes = () => {
    if (!inventory) return []
    return [...new Set(inventory.rooms.map(room => room.type))]
  }

  const getStatusColor = (status: string) => {
    const colors = {
      available: 'bg-green-500',
      occupied: 'bg-blue-500',
      maintenance: 'bg-orange-500',
      out_of_order: 'bg-red-500',
      blocked: 'bg-gray-500'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-400'
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'border-red-200 bg-red-50 text-red-800',
      medium: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      low: 'border-blue-200 bg-blue-50 text-blue-800'
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  if (loading) {
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
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error || 'Failed to load inventory data'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rate & Inventory Management</h1>
            <p className="text-gray-600">Optimize pricing and availability for maximum revenue</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-auto"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-auto"
            />
            
            <Select value={roomType} onValueChange={setRoomType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getRoomTypes().map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setBulkUpdateMode(!bulkUpdateMode)}
              variant={bulkUpdateMode ? "default" : "outline"}
            >
              {bulkUpdateMode ? "Exit Bulk Mode" : "Bulk Update"}
            </Button>

            <Button onClick={fetchInventory}>
              <RefreshCw className="h-4 w-4 mr-2" />
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${inventory.performance.overall.averageRate}</div>
              <p className="text-xs text-muted-foreground">
                vs Market: ${inventory.competitive.averageMarketRate}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">RevPAR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${inventory.performance.overall.revPAR}</div>
              <p className="text-xs text-muted-foreground">
                Revenue per available room
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.occupancy.occupancyRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {inventory.occupancy.bookedRoomNights} / {inventory.occupancy.totalRoomNights} nights
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${inventory.performance.overall.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 90 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Suggestions */}
        {inventory.suggestions.length > 0 && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">Revenue Optimization Suggestions</h3>
            {inventory.suggestions.map((suggestion, index) => (
              <Alert key={index} className={getPriorityColor(suggestion.priority)}>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong>{suggestion.message}</strong>
                      <br />
                      <span className="text-sm">{suggestion.action}</span>
                      <br />
                      <span className="text-xs italic">Expected: {suggestion.expectedImpact}</span>
                    </div>
                    <Badge variant="outline">
                      {suggestion.priority.toUpperCase()}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        <Tabs defaultValue="rooms" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rooms">Room Rates</TabsTrigger>
            <TabsTrigger value="calendar">Rate Calendar</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="competitive">Market Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="space-y-6">
            {bulkUpdateMode && (
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Update ({selectedRooms.length} rooms selected)</CardTitle>
                </CardHeader>
                <CardContent>
                  <BulkUpdateForm 
                    onUpdate={performBulkUpdate}
                    selectedCount={selectedRooms.length}
                  />
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {inventory.rooms.map((room) => (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Room {room.number}</h3>
                        <p className="text-sm text-gray-600">{room.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {bulkUpdateMode && (
                          <input
                            type="checkbox"
                            checked={selectedRooms.includes(room.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRooms([...selectedRooms, room.id])
                              } else {
                                setSelectedRooms(selectedRooms.filter(id => id !== room.id))
                              }
                            }}
                            className="rounded"
                          />
                        )}
                        <Badge className={`${getStatusColor(room.status)} text-white`}>
                          {room.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Base Rate:</span>
                        <span className="font-semibold">${room.rates.baseRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekend Multiplier:</span>
                        <span className="font-semibold">{room.rates.weekendMultiplier}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Occupancy:</span>
                        <span className="font-semibold">{room.occupancy.rate.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">RevPAR:</span>
                        <span className="font-semibold">${room.performance.revPAR}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Rates
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Calendar className="h-4 w-4 mr-1" />
                        Availability
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar">
            <Card>
              <CardHeader>
                <CardTitle>Rate Calendar</CardTitle>
                <p className="text-sm text-gray-600">
                  Daily rate overview for the selected period
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-left p-2">Day</th>
                        {getRoomTypes().map(type => (
                          <th key={type} className="text-left p-2">{type}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.calendar.slice(0, 14).map((day) => (
                        <tr key={day.date} className={`border-b ${day.isWeekend ? 'bg-blue-50' : ''}`}>
                          <td className="p-2 font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="p-2">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.dayOfWeek]}
                          </td>
                          {getRoomTypes().map(type => {
                            const typeRates = day.rates.filter(r => r.type === type)
                            const avgRate = typeRates.length > 0 ? 
                              typeRates.reduce((sum, r) => sum + r.rate, 0) / typeRates.length : 0
                            return (
                              <td key={type} className="p-2">
                                <span className="font-semibold">${Math.round(avgRate)}</span>
                                <br />
                                <span className="text-xs text-gray-500">
                                  {typeRates.filter(r => r.available).length} avail
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <Bar
                    data={{
                      labels: inventory.rooms.map(room => `Room ${room.number}`),
                      datasets: [{
                        label: 'Revenue ($)',
                        data: inventory.rooms.map(room => room.performance.revenue),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)'
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: { beginAtZero: true }
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Occupancy vs Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inventory.rooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">Room {room.number}</span>
                          <span className="text-sm text-gray-600 ml-2">{room.type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="text-center">
                            <div className="font-semibold">{room.occupancy.rate.toFixed(1)}%</div>
                            <div className="text-gray-500">Occupancy</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">${room.rates.baseRate}</div>
                            <div className="text-gray-500">Base Rate</div>
                          </div>
                          <div className="text-center">
                            <div className="font-semibold">${room.performance.revPAR}</div>
                            <div className="text-gray-500">RevPAR</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competitive">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Market Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-blue-50 rounded-lg">
                      <div className="text-3xl font-bold text-blue-600">
                        {inventory.competitive.priceAdvantage > 0 ? '+' : ''}
                        {inventory.competitive.priceAdvantage}%
                      </div>
                      <div className="text-sm text-gray-600 mt-2">
                        Price advantage vs market average
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {inventory.competitive.competitorRates.map((competitor, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">{competitor.name}</span>
                          <div className="flex items-center gap-4 text-sm">
                            <span>${competitor.rate}</span>
                            <span className="text-gray-500">{competitor.occupancy}% occ</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Market Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inventory.competitive.recommendations.map((rec, index) => (
                      <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BulkUpdateForm({ onUpdate, selectedCount }: { onUpdate: (data: any) => void; selectedCount: number }) {
  const [rateType, setRateType] = useState('base')
  const [operation, setOperation] = useState('set')
  const [value, setValue] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate({
      rateType,
      operation,
      value: parseFloat(value)
    })
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Rate Type</label>
          <Select value={rateType} onValueChange={setRateType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="base">Base Rate</SelectItem>
              <SelectItem value="weekend">Weekend Multiplier</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Operation</label>
          <Select value={operation} onValueChange={setOperation}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="set">Set To</SelectItem>
              <SelectItem value="increase">Increase By</SelectItem>
              <SelectItem value="decrease">Decrease By</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Value</label>
          <Input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
      </div>

      <Button type="submit" disabled={selectedCount === 0 || !value}>
        Apply to {selectedCount} rooms
      </Button>
    </form>
  )
}