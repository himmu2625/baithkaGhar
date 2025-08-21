"use client"

import React from "react"
import { useParams } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"
import { useRouter } from "next/navigation"
import { RealMaintenanceManager } from "@/components/os/maintenance/real-maintenance-manager"

export default function MaintenancePage() {
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useOSAuth()
  const router = useRouter()
  const propertyId = (params as { id?: string } | null)?.id as string

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    router.push("/os/login")
    return null
  }

  if (user?.propertyId !== propertyId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied</p>
        </div>
      </div>
    )
  }

  return <RealMaintenanceManager />
}