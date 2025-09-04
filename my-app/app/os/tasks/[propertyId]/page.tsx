"use client"

import React, { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertTriangle,
  Calendar,
  TrendingUp,
  Users,
  IndianRupee,
  BedIcon,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  ArrowLeft,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { PendingTasks } from "@/components/os/dashboard/pending-tasks"

interface Report {
  id: string
  name: string
  type: string
  lastGenerated: string
  status: 'ready' | 'generating' | 'failed'
  size?: string
  downloadUrl?: string
}

export default function TasksAndReportsPage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("tasks")

  const propertyId = params?.propertyId as string

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/os/login")
    }
  }, [isLoading, isAuthenticated, router])

  const fetchReports = async () => {
    try {
      setIsLoadingData(true)
      
      if (!propertyId) {
        throw new Error("Property ID not found")
      }

      // Fetch real reports data from API
      const response = await fetch(`/api/os/reports/list?propertyId=${propertyId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }
      
      const data = await response.json()
      
      if (data.success) {
        setReports(data.data || [])
      } else {
        throw new Error(data.error || 'Failed to fetch reports')
      }
    } catch (error) {
      console.error("Error fetching reports:", error)
      setError("Failed to load reports")
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && propertyId) {
      fetchReports()
    }
  }, [isAuthenticated, propertyId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>
      case 'generating':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Generating</Badge>
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading tasks and reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-4 text-center">
            <Button onClick={fetchReports} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => router.push(`/os/dashboard/${propertyId}`)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20 mr-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Tasks & Reports
                </h1>
                <p className="text-purple-100 mt-2">
                  Manage daily operations and generate insights
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Button variant="secondary" onClick={() => router.push('/os/reports/daily')}>
              <Calendar className="h-4 w-4 mr-2" />
              Daily Reports
            </Button>
            <Button variant="secondary" onClick={fetchReports}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tasks">Pending Tasks</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tasks" className="space-y-6">
          {/* Tasks Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">27</div>
                <p className="text-xs text-muted-foreground">+3 from yesterday</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">5</div>
                <p className="text-xs text-muted-foreground">Requires immediate attention</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">12</div>
                <p className="text-xs text-muted-foreground">Great progress!</p>
              </CardContent>
            </Card>
          </div>

          {/* Pending Tasks Component */}
          <PendingTasks />
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-6">
          {/* Reports Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search reports..."
                  className="pl-10"
                />
              </div>
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="operational">Operational</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>

          {/* Reports Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Reports</CardTitle>
              <CardDescription>
                View and download generated reports for your property
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {report.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {report.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDate(report.lastGenerated)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(report.status)}
                      </TableCell>
                      <TableCell>{report.size || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {report.status === 'ready' && (
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Generate Daily Report</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Create comprehensive daily operations report
                </p>
                <Button variant="outline" className="w-full">
                  Generate Now
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  <span>Revenue Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Analyze revenue trends and performance
                </p>
                <Button variant="outline" className="w-full">
                  Generate Now
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <span>Guest Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Understand guest behavior and preferences
                </p>
                <Button variant="outline" className="w-full">
                  Generate Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}