"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useOSAuth } from "@/hooks/use-os-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: string[]
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
}: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, user, checkAuth } = useOSAuth()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    // Ensure auth state is up to date on mount
    checkAuth?.()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/os/login")
        setAuthorized(false)
      } else if (requiredPermissions.length > 0) {
        const hasAll = requiredPermissions.every((perm) =>
          user?.permissions?.includes(perm)
        )
        if (!hasAll) {
          router.push("/os/dashboard")
          setAuthorized(false)
        } else {
          setAuthorized(true)
        }
      } else {
        setAuthorized(true)
      }
    }
  }, [isAuthenticated, isLoading, requiredPermissions, router, user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}

export default ProtectedRoute
