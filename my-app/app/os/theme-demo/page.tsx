"use client"

import React, { useState } from "react"
import { ProtectedRoute } from "@/components/os/auth"
import { MainLayout } from "@/components/os/layout"
import {
  ThemedButton,
  Spinner,
  Pulse,
  Skeleton,
  ProgressBar,
  LoadingOverlay,
  Icon,
  Icons,
  useTheme,
} from "@/components/os/theme"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ThemeDemoPage() {
  const { isDark, toggleMode } = useTheme()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleLoadingDemo = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 3000)
  }

  const handleProgressDemo = () => {
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)
  }

  return (
    <ProtectedRoute>
      <MainLayout
        title="Theme & Branding Demo"
        description="Showcase of Baithaka GHAR OS theme system, loading animations, and icon library"
      >
        <div className="space-y-6">
          {/* Theme Toggle */}
          <Card>
            <CardHeader>
              <CardTitle>Theme System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ThemedButton onClick={toggleMode} variant="primary">
                  {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                </ThemedButton>
                <Badge variant={isDark ? "secondary" : "default"}>
                  Current: {isDark ? "Dark" : "Light"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Themed Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Themed Buttons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ThemedButton variant="primary" icon={Icons.Plus}>
                  Primary
                </ThemedButton>
                <ThemedButton variant="secondary" icon={Icons.Settings}>
                  Secondary
                </ThemedButton>
                <ThemedButton variant="accent" icon={Icons.Star}>
                  Accent
                </ThemedButton>
                <ThemedButton variant="success" icon={Icons.Check}>
                  Success
                </ThemedButton>
                <ThemedButton variant="warning" icon={Icons.AlertCircle}>
                  Warning
                </ThemedButton>
                <ThemedButton variant="error" icon={Icons.Close}>
                  Error
                </ThemedButton>
              </div>
            </CardContent>
          </Card>

          {/* Loading Animations */}
          <Card>
            <CardHeader>
              <CardTitle>Loading Animations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Spinners */}
              <div>
                <h4 className="font-medium mb-3">Spinners</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm">Small</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="md" />
                    <span className="text-sm">Medium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="lg" />
                    <span className="text-sm">Large</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Spinner size="xl" />
                    <span className="text-sm">Extra Large</span>
                  </div>
                </div>
              </div>

              {/* Pulse */}
              <div>
                <h4 className="font-medium mb-3">Pulse Animation</h4>
                <Pulse size="lg" />
              </div>

              {/* Skeleton */}
              <div>
                <h4 className="font-medium mb-3">Skeleton Loading</h4>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <h4 className="font-medium mb-3">Progress Bar</h4>
                <div className="space-y-4">
                  <ProgressBar value={progress} showLabel />
                  <ThemedButton onClick={handleProgressDemo} size="sm">
                    Start Progress Demo
                  </ThemedButton>
                </div>
              </div>

              {/* Loading Overlay */}
              <div>
                <h4 className="font-medium mb-3">Loading Overlay</h4>
                <LoadingOverlay isLoading={loading}>
                  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <p>
                      This content will be covered by a loading overlay when the
                      button is clicked.
                    </p>
                  </div>
                </LoadingOverlay>
                <ThemedButton
                  onClick={handleLoadingDemo}
                  size="sm"
                  className="mt-2"
                >
                  Show Loading Overlay
                </ThemedButton>
              </div>
            </CardContent>
          </Card>

          {/* Icon Library */}
          <Card>
            <CardHeader>
              <CardTitle>Icon Library</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="dashboard" size={24} />
                  <span className="text-xs text-center">Dashboard</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="users" size={24} />
                  <span className="text-xs text-center">Users</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="calendar" size={24} />
                  <span className="text-xs text-center">Calendar</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="bar-chart" size={24} />
                  <span className="text-xs text-center">Analytics</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="settings" size={24} />
                  <span className="text-xs text-center">Settings</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="bell" size={24} />
                  <span className="text-xs text-center">Notifications</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="credit-card" size={24} />
                  <span className="text-xs text-center">Payments</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <Icon name="file-text" size={24} />
                  <span className="text-xs text-center">Reports</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Color Palette</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Primary (Blue)</h5>
                  <div className="space-y-1">
                    <div className="h-8 bg-blue-600 rounded"></div>
                    <div className="h-6 bg-blue-500 rounded"></div>
                    <div className="h-6 bg-blue-400 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Secondary (Gray)</h5>
                  <div className="space-y-1">
                    <div className="h-8 bg-gray-600 rounded"></div>
                    <div className="h-6 bg-gray-500 rounded"></div>
                    <div className="h-6 bg-gray-400 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Accent (Orange)</h5>
                  <div className="space-y-1">
                    <div className="h-8 bg-orange-600 rounded"></div>
                    <div className="h-6 bg-orange-500 rounded"></div>
                    <div className="h-6 bg-orange-400 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h5 className="font-medium text-sm">Success (Green)</h5>
                  <div className="space-y-1">
                    <div className="h-8 bg-green-600 rounded"></div>
                    <div className="h-6 bg-green-500 rounded"></div>
                    <div className="h-6 bg-green-400 rounded"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h1 className="text-4xl font-bold">Heading 1 - 4xl</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 700
                  </p>
                </div>
                <div>
                  <h2 className="text-3xl font-semibold">Heading 2 - 3xl</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 600
                  </p>
                </div>
                <div>
                  <h3 className="text-2xl font-medium">Heading 3 - 2xl</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 500
                  </p>
                </div>
                <div>
                  <h4 className="text-xl font-medium">Heading 4 - xl</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 500
                  </p>
                </div>
                <div>
                  <p className="text-lg">Body Large - lg</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 400
                  </p>
                </div>
                <div>
                  <p className="text-base">Body - base</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 400
                  </p>
                </div>
                <div>
                  <p className="text-sm">Body Small - sm</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Font: Inter, Weight: 400
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}
