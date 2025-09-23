"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BarChart3, TrendingUp, TrendingDown, Eye, Download, Filter, Settings, Brain, Target, Lightbulb, AlertTriangle, CheckCircle } from 'lucide-react'

interface KPIMetric {
  id: string
  name: string
  value: string
  change: number
  changeType: 'increase' | 'decrease'
  category: string
  benchmark?: string
  status: 'good' | 'warning' | 'critical'
}

interface Insight {
  id: string
  type: 'opportunity' | 'risk' | 'trend' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionRequired: boolean
  category: string
  confidence: number
}

interface ForecastData {
  metric: string
  current: number
  predicted: number
  confidence: number
  trend: 'up' | 'down' | 'stable'
  timeframe: string
}

interface BenchmarkData {
  category: string
  ourPerformance: number
  industryAverage: number
  topPerformers: number
  status: 'above' | 'below' | 'average'
}

const BusinessIntelligenceDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [insights, setInsights] = useState<Insight[]>([])
  const [kpis, setKpis] = useState<KPIMetric[]>([])
  const [forecasts, setForecast] = useState<ForecastData[]>([])
  const [benchmarks, setBenchmarks] = useState<BenchmarkData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock data initialization
  const initializeData = useCallback(() => {
    const mockKPIs: KPIMetric[] = [
      {
        id: '1',
        name: 'Revenue per Available Room (RevPAR)',
        value: '₹4,250',
        change: 12.5,
        changeType: 'increase',
        category: 'revenue',
        benchmark: '₹4,100',
        status: 'good'
      },
      {
        id: '2',
        name: 'Average Daily Rate (ADR)',
        value: '₹5,680',
        change: 8.3,
        changeType: 'increase',
        category: 'revenue',
        benchmark: '₹5,500',
        status: 'good'
      },
      {
        id: '3',
        name: 'Occupancy Rate',
        value: '74.8%',
        change: -2.1,
        changeType: 'decrease',
        category: 'occupancy',
        benchmark: '78%',
        status: 'warning'
      },
      {
        id: '4',
        name: 'Guest Satisfaction Score',
        value: '4.6/5',
        change: 0.2,
        changeType: 'increase',
        category: 'guest',
        benchmark: '4.4/5',
        status: 'good'
      },
      {
        id: '5',
        name: 'Direct Booking Ratio',
        value: '42%',
        change: -5.2,
        changeType: 'decrease',
        category: 'distribution',
        benchmark: '45%',
        status: 'critical'
      },
      {
        id: '6',
        name: 'Cost per Acquisition (CPA)',
        value: '₹680',
        change: 15.7,
        changeType: 'increase',
        category: 'marketing',
        benchmark: '₹650',
        status: 'warning'
      }
    ]

    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'opportunity',
        title: 'Weekend Premium Pricing Opportunity',
        description: 'Analysis shows demand exceeds supply on weekends. Consider increasing rates by 15-20% for Friday-Sunday.',
        impact: 'high',
        actionRequired: true,
        category: 'revenue',
        confidence: 87
      },
      {
        id: '2',
        type: 'risk',
        title: 'Declining Direct Bookings',
        description: 'Direct booking ratio has dropped 5.2% this month. OTA dependency is increasing commission costs.',
        impact: 'medium',
        actionRequired: true,
        category: 'distribution',
        confidence: 94
      },
      {
        id: '3',
        type: 'trend',
        title: 'Business Travel Recovery',
        description: 'Corporate bookings have increased 28% month-over-month, indicating business travel recovery.',
        impact: 'medium',
        actionRequired: false,
        category: 'market',
        confidence: 91
      },
      {
        id: '4',
        type: 'recommendation',
        title: 'Optimize Check-in Process',
        description: 'Guest feedback indicates check-in delays. Implementing mobile check-in could improve satisfaction scores.',
        impact: 'low',
        actionRequired: true,
        category: 'operations',
        confidence: 76
      }
    ]

    const mockForecasts: ForecastData[] = [
      {
        metric: 'Revenue',
        current: 2450000,
        predicted: 2680000,
        confidence: 85,
        trend: 'up',
        timeframe: 'Next 30 days'
      },
      {
        metric: 'Occupancy',
        current: 74.8,
        predicted: 78.2,
        confidence: 78,
        trend: 'up',
        timeframe: 'Next 30 days'
      },
      {
        metric: 'ADR',
        current: 5680,
        predicted: 5890,
        confidence: 82,
        trend: 'up',
        timeframe: 'Next 30 days'
      },
      {
        metric: 'Guest Satisfaction',
        current: 4.6,
        predicted: 4.7,
        confidence: 71,
        trend: 'up',
        timeframe: 'Next 30 days'
      }
    ]

    const mockBenchmarks: BenchmarkData[] = [
      {
        category: 'Revenue per Room',
        ourPerformance: 4250,
        industryAverage: 4100,
        topPerformers: 4800,
        status: 'above'
      },
      {
        category: 'Occupancy Rate',
        ourPerformance: 74.8,
        industryAverage: 78.2,
        topPerformers: 85.5,
        status: 'below'
      },
      {
        category: 'Guest Satisfaction',
        ourPerformance: 4.6,
        industryAverage: 4.4,
        topPerformers: 4.8,
        status: 'above'
      },
      {
        category: 'Direct Booking %',
        ourPerformance: 42,
        industryAverage: 45,
        topPerformers: 62,
        status: 'below'
      }
    ]

    setKpis(mockKPIs)
    setInsights(mockInsights)
    setForecast(mockForecasts)
    setBenchmarks(mockBenchmarks)
  }, [])

  useEffect(() => {
    initializeData()
  }, [initializeData])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <Target className="h-4 w-4 text-green-500" />
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-yellow-500" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'critical':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const filteredInsights = insights.filter(insight =>
    selectedCategory === 'all' || insight.category === selectedCategory
  )

  const filteredKPIs = kpis.filter(kpi =>
    selectedCategory === 'all' || kpi.category === selectedCategory
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Business Intelligence Dashboard
            </h1>
            <p className="text-gray-600 mt-2">AI-powered insights and predictive analytics for your property</p>
          </div>
          <div className="flex items-center gap-4 mt-4 lg:mt-0">
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refresh">Auto Refresh</Label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-4">
          <Label>Category:</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="occupancy">Occupancy</SelectItem>
              <SelectItem value="guest">Guest Experience</SelectItem>
              <SelectItem value="distribution">Distribution</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKPIs.map((kpi) => (
                <Card key={kpi.id} className="relative overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        {kpi.name}
                      </CardTitle>
                      <div className={`h-2 w-2 rounded-full ${
                        kpi.status === 'good' ? 'bg-green-500' :
                        kpi.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">{kpi.value}</div>
                        <div className="flex items-center gap-1 text-sm">
                          {kpi.changeType === 'increase' ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                          <span className={kpi.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}>
                            {Math.abs(kpi.change)}%
                          </span>
                          <span className="text-gray-500">vs last period</span>
                        </div>
                      </div>
                    </div>
                    {kpi.benchmark && (
                      <div className="mt-2 text-xs text-gray-500">
                        Benchmark: {kpi.benchmark}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Insights Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Recent AI Insights</CardTitle>
                <CardDescription>Latest automated insights from your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredInsights.slice(0, 3).map((insight) => (
                    <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <Badge className={getImpactColor(insight.impact)}>
                            {insight.impact} impact
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{insight.description}</p>
                      </div>
                      {insight.actionRequired && (
                        <Button size="sm" variant="outline">
                          Take Action
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    View All Insights
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {filteredInsights.map((insight) => (
                  <Card key={insight.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getInsightIcon(insight.type)}
                          <div>
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{insight.type}</Badge>
                              <Badge className={getImpactColor(insight.impact)}>
                                {insight.impact} impact
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{insight.confidence}%</div>
                          <div className="text-xs text-gray-500">confidence</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{insight.category}</Badge>
                          {insight.actionRequired && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Action Required
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                          {insight.actionRequired && (
                            <Button size="sm">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Insights Summary */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Insights Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Insights</span>
                      <span className="font-medium">{insights.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Action Required</span>
                      <span className="font-medium text-orange-600">
                        {insights.filter(i => i.actionRequired).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Impact</span>
                      <span className="font-medium text-red-600">
                        {insights.filter(i => i.impact === 'high').length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Confidence</span>
                      <span className="font-medium">
                        {Math.round(insights.reduce((acc, i) => acc + i.confidence, 0) / insights.length)}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {['revenue', 'distribution', 'market', 'operations'].map((category) => {
                        const count = insights.filter(i => i.category === category).length
                        return (
                          <div key={category} className="flex justify-between">
                            <span className="capitalize">{category}</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Forecasting Tab */}
          <TabsContent value="forecasting" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {forecasts.map((forecast, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {forecast.metric} Forecast
                      <Badge variant="outline">
                        {forecast.confidence}% confidence
                      </Badge>
                    </CardTitle>
                    <CardDescription>{forecast.timeframe}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600">Current</div>
                          <div className="text-2xl font-bold">
                            {forecast.metric === 'Revenue' ? `₹${forecast.current.toLocaleString()}` :
                             forecast.metric === 'Occupancy' ? `${forecast.current}%` :
                             forecast.metric === 'ADR' ? `₹${forecast.current}` :
                             `${forecast.current}/5`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Predicted</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {forecast.metric === 'Revenue' ? `₹${forecast.predicted.toLocaleString()}` :
                             forecast.metric === 'Occupancy' ? `${forecast.predicted}%` :
                             forecast.metric === 'ADR' ? `₹${forecast.predicted}` :
                             `${forecast.predicted}/5`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {forecast.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : forecast.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-gray-400" />
                        )}
                        <span className="text-sm text-gray-600">
                          {((forecast.predicted - forecast.current) / forecast.current * 100).toFixed(1)}% change
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Prediction Confidence</span>
                          <span>{forecast.confidence}%</span>
                        </div>
                        <Progress value={forecast.confidence} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {benchmarks.map((benchmark, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {benchmark.category}
                      <Badge className={
                        benchmark.status === 'above' ? 'bg-green-100 text-green-800' :
                        benchmark.status === 'below' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {benchmark.status} average
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Your Performance</span>
                          <span className="font-bold text-blue-600">
                            {benchmark.category.includes('%') || benchmark.category.includes('Rate') || benchmark.category.includes('Booking') ?
                              `${benchmark.ourPerformance}%` :
                              `₹${benchmark.ourPerformance}`}
                          </span>
                        </div>
                        <Progress
                          value={(benchmark.ourPerformance / benchmark.topPerformers) * 100}
                          className="h-2"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Industry Average</span>
                          <span className="font-medium">
                            {benchmark.category.includes('%') || benchmark.category.includes('Rate') || benchmark.category.includes('Booking') ?
                              `${benchmark.industryAverage}%` :
                              `₹${benchmark.industryAverage}`}
                          </span>
                        </div>
                        <Progress
                          value={(benchmark.industryAverage / benchmark.topPerformers) * 100}
                          className="h-2 opacity-60"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Top Performers</span>
                          <span className="font-medium text-green-600">
                            {benchmark.category.includes('%') || benchmark.category.includes('Rate') || benchmark.category.includes('Booking') ?
                              `${benchmark.topPerformers}%` :
                              `₹${benchmark.topPerformers}`}
                          </span>
                        </div>
                        <Progress value={100} className="h-2" />
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-600">
                          Gap to top performers: {benchmark.topPerformers - benchmark.ourPerformance > 0 ?
                            `${(benchmark.topPerformers - benchmark.ourPerformance).toFixed(1)}` :
                            'Leading performance'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Insights Settings</CardTitle>
                  <CardDescription>Configure how insights are generated and displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-insights">Auto-generate insights</Label>
                    <Switch id="auto-insights" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-impact">Only high-impact insights</Label>
                    <Switch id="high-impact" />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum confidence threshold</Label>
                    <Input type="number" placeholder="70" />
                  </div>
                  <div className="space-y-2">
                    <Label>Insight categories</Label>
                    <div className="space-y-2">
                      {['Revenue', 'Operations', 'Guest Experience', 'Marketing'].map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <input type="checkbox" id={category} defaultChecked />
                          <Label htmlFor={category}>{category}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Forecasting Settings</CardTitle>
                  <CardDescription>Adjust forecasting parameters and models</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Forecasting horizon</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Model accuracy</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Fast (lower accuracy)</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="accurate">High accuracy (slower)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="seasonal">Include seasonal patterns</Label>
                    <Switch id="seasonal" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="external">Include external factors</Label>
                    <Switch id="external" defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Preferences</CardTitle>
                  <CardDescription>Customize your dashboard experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Default time period</Label>
                    <Select defaultValue="30d">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Refresh interval</Label>
                    <Select defaultValue="15">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Email notifications</Label>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="export-auto">Auto-export reports</Label>
                    <Switch id="export-auto" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>Manage connected data sources and integrations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: 'PMS Integration', status: 'connected', icon: CheckCircle },
                      { name: 'Channel Manager', status: 'connected', icon: CheckCircle },
                      { name: 'Google Analytics', status: 'pending', icon: AlertTriangle },
                      { name: 'Review Sites', status: 'disconnected', icon: AlertTriangle }
                    ].map((source) => (
                      <div key={source.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <source.icon className={`h-4 w-4 ${
                            source.status === 'connected' ? 'text-green-500' : 'text-yellow-500'
                          }`} />
                          <span>{source.name}</span>
                        </div>
                        <Badge variant={source.status === 'connected' ? 'default' : 'secondary'}>
                          {source.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button className="w-full" variant="outline">
                    Add Data Source
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BusinessIntelligenceDashboard