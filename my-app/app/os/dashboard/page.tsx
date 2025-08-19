"use client"

import React, { useEffect } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { LoadingSpinner } from "@/components/os/common/loading-spinner"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user?.propertyId) {
        // Redirect to property-specific dashboard
        router.push(`/os/dashboard/${user.propertyId}`)
      } else if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.push("/os/login")
      }
    }
  }, [isLoading, isAuthenticated, user, router])

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}
