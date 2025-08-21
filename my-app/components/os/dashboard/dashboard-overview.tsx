"use client"

import React, { useState, useEffect } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { MainLayout } from "@/components/os/layout/main-layout"
import { ConnectionStatus } from "@/components/os/common/connection-status"
import { RealAnalyticsDashboard } from "./real-analytics-dashboard"
import { ArrivalsDepartures } from "./arrivals-departures"
import { OccupancyWidget } from "./occupancy-widget"
import { RevenueSummary } from "./revenue-summary"
import { PendingTasks } from "./pending-tasks"
import { NotificationSystem } from "./notification-system"
import { RealTimeDashboard } from "./realtime-dashboard"
import { RealTimeNotifications } from "./realtime-notifications"
import { RefreshCw } from "lucide-react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"

export function DashboardOverview() {
  const params = useParams();
  const { user } = useOSAuth();
  const propertyId = params.id as string;
  
  const [currentTime, setCurrentTime] = useState(new Date())
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: navigator.onLine,
    error: null as string | null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus({ isOnline: true, error: null })
    }

    const handleOffline = () => {
      setNetworkStatus({ isOnline: false, error: "Network connection lost" })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const getConnectionStatus = () => {
    if (!networkStatus.isOnline) return "offline"
    if (networkStatus.error) return "error"
    return "online"
  }

  const handleRetryConnection = () => {
    setNetworkStatus({ isOnline: navigator.onLine, error: null })
  }

  // Sample images for the gallery
  const sampleImages = [
    "/images/property-1.jpg",
    "/images/property-2.jpg",
    "/images/property-3.jpg",
    "/images/property-4.jpg",
    "/images/property-5.jpg",
    "/images/property-6.jpg",
  ]

  // Sample data for the data table
  const sampleTableData = [
    { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      status: "Inactive",
    },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", status: "Active" },
  ]

  const tableColumns = [
    { key: "name" as const, header: "Name" },
    { key: "email" as const, header: "Email" },
    { key: "status" as const, header: "Status" },
  ]

  return (
    <ErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We're having trouble loading the dashboard
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <MainLayout>
        {/* Network Status Alert */}
        {!networkStatus.isOnline && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    Connection Issue
                  </h3>
                  <p className="text-sm text-gray-600">
                    {networkStatus.error || "Unable to connect to server"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRetryConnection}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {/* Welcome Section with Current Time and Connection Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Welcome to Baithaka GHAR OS
                </h2>
                <p className="text-sm sm:text-base text-gray-600">
                  Your comprehensive property management system. Monitor
                  bookings, track revenue, and manage your property efficiently.
                </p>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="text-sm text-gray-500">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <ConnectionStatus status={getConnectionStatus()} />
              </div>
            </div>
          </div>

          {/* Real Analytics Dashboard */}
          <RealAnalyticsDashboard />

          {/* Arrivals & Departures */}
          <ArrivalsDepartures />

          {/* Occupancy Widget */}
          <OccupancyWidget />

          {/* Revenue Summary */}
          <RevenueSummary />

          {/* Pending Tasks */}
          <PendingTasks />

          {/* Notification System */}
          <NotificationSystem />

          {/* Real-time Dashboard */}
          <RealTimeDashboard />

          {/* Real-time Notifications */}
          <RealTimeNotifications />
        </div>
      </MainLayout>
    </ErrorBoundary>
  )
}
