/**
 * Lazy-loaded dashboard components with performance optimizations
 */

import React, { Suspense } from "react"
import { createLazyComponent, LazyImage, useLazyData } from "@/lib/lazy-loading"
import { useOptimizedFetch } from "@/hooks/use-optimized-fetch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react"

// Loading skeleton components
const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-3 w-32" />
        </CardContent>
      </Card>
    ))}
  </div>
)

const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-5 w-32" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-64 w-full" />
    </CardContent>
  </Card>
)

// Lazy-loaded Key Metrics Component
const LazyKeyMetrics = createLazyComponent(
  () =>
    import("./key-metrics").then((module) => ({ default: module.KeyMetrics })),
  {
    threshold: 0.1,
    rootMargin: "100px",
    fallback: <DashboardSkeleton />,
    preload: true, // Preload as it's critical
  }
)

// Lazy-loaded Charts Component
const LazyInteractiveCharts = createLazyComponent(
  () =>
    import("./interactive-charts").then((module) => ({
      default: module.InteractiveCharts,
    })),
  {
    threshold: 0.05,
    rootMargin: "200px",
    fallback: <ChartSkeleton />,
    preload: false,
  }
)

// Lazy-loaded Recent Bookings Component
const LazyRecentBookings = createLazyComponent(
  () =>
    import("./recent-bookings").then((module) => ({
      default: module.RecentBookings,
    })),
  {
    threshold: 0.1,
    rootMargin: "150px",
    fallback: (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ),
  }
)

// Lazy-loaded System Alerts Component
const LazySystemAlerts = createLazyComponent(
  () =>
    import("./system-alerts").then((module) => ({
      default: module.SystemAlerts,
    })),
  {
    threshold: 0.1,
    rootMargin: "100px",
    fallback: (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    ),
  }
)

// Optimized Performance Metrics Component
export function OptimizedPerformanceMetrics() {
  const { data, isLoading, error, refresh, metrics } = useOptimizedFetch({
    url: "/api/os/dashboard/performance",
    cacheKey: "dashboard_performance",
    cacheTTL: 2 * 60 * 1000, // 2 minutes
    tags: ["dashboard", "performance"],
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Failed to load performance metrics</span>
          </div>
          <Button
            onClick={refresh}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const performanceData = data || {
    pageLoadTime: 0,
    memoryUsage: 0,
    cacheHitRate: 0,
    networkRequests: 0,
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {performanceData.pageLoadTime}ms
          </div>
          <p className="text-xs text-muted-foreground">
            {performanceData.pageLoadTime < 1000
              ? "Excellent"
              : "Needs optimization"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(performanceData.memoryUsage / 1024 / 1024).toFixed(1)}MB
          </div>
          <p className="text-xs text-muted-foreground">
            {performanceData.memoryUsage < 50 * 1024 * 1024
              ? "Normal"
              : "High usage"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {performanceData.cacheHitRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            {performanceData.cacheHitRate > 80
              ? "Excellent"
              : "Needs improvement"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Network Requests
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {performanceData.networkRequests}
          </div>
          <p className="text-xs text-muted-foreground">
            {performanceData.networkRequests < 10
              ? "Optimized"
              : "Too many requests"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Optimized Image Gallery Component
export function OptimizedImageGallery({ images }: { images?: string[] }) {
  const [visibleCount, setVisibleCount] = React.useState(6)
  const [showAll, setShowAll] = React.useState(false)

  // Handle undefined or null images array
  const safeImages = images || []
  const visibleImages = showAll ? safeImages : safeImages.slice(0, visibleCount)

  // Don't render if no images
  if (safeImages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <p>No images available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Property Gallery
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {visibleImages.map((src, index) => (
            <LazyImage
              key={index}
              src={src}
              alt={`Gallery image ${index + 1}`}
              width={200}
              height={200}
              className="aspect-square rounded-lg overflow-hidden"
              threshold={0.1}
              rootMargin="50px"
            />
          ))}
        </div>

        {safeImages.length > visibleCount && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              size="sm"
            >
              {showAll ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Show All ({safeImages.length - visibleCount} more)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Lazy Data Table Component
export function LazyDataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 10,
}: {
  data?: T[]
  columns: Array<{
    key: keyof T
    header: string
    render?: (value: any, row: T) => React.ReactNode
  }>
  pageSize?: number
}) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)

  // Handle undefined or null data
  const safeData = data || []
  const totalPages = Math.ceil(safeData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentData = safeData.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 300)
  }

  // Don't render if no data
  if (safeData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table</h3>
        <div className="text-center text-gray-500">
          <p>No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Table</h3>
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="border border-gray-200 px-4 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: pageSize }).map((_, index) => (
                    <tr key={index}>
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className="border border-gray-200 px-4 py-2"
                        >
                          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                : currentData.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {columns.map((column) => (
                        <td
                          key={String(column.key)}
                          className="border border-gray-200 px-4 py-2 text-sm text-gray-900"
                        >
                          {column.render
                            ? column.render(row[column.key], row)
                            : String(row[column.key] || "")}
                        </td>
                      ))}
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, safeData.length)}{" "}
              of {safeData.length} results
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export lazy components
export {
  LazyKeyMetrics,
  LazyInteractiveCharts,
  LazyRecentBookings,
  LazySystemAlerts,
}
