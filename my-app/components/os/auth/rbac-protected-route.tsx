"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthRBAC } from "@/hooks/use-auth-rbac"
import { PERMISSIONS, ROLES, type Permission, type Role } from "@/lib/rbac"
import { LoadingState } from "@/components/os/common/loading-states"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Shield,
  AlertTriangle,
  Lock,
  UserCheck,
  Home,
  ArrowLeft,
} from "lucide-react"

interface RBACProtectedRouteProps {
  children: React.ReactNode
  requiredPermissions?: Permission[]
  requiredRoles?: Role[]
  fallback?: React.ReactNode
  redirectTo?: string
  showAccessDenied?: boolean
}

export function RBACProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  fallback,
  redirectTo = "/login",
  showAccessDenied = true,
}: RBACProtectedRouteProps) {
  const {
    isAuthenticated,
    isLoading,
    role,
    roleDisplayName,
    hasPermission,
    hasAllPermissions,
    requireAuth,
    redirectIfUnauthorized,
  } = useAuthRBAC()
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      redirectIfUnauthorized(redirectTo)
    }
  }, [isAuthenticated, isLoading, redirectIfUnauthorized, redirectTo])

  // Check permissions and roles
  const hasRequiredPermissions =
    requiredPermissions.length === 0 || hasAllPermissions(requiredPermissions)

  const hasRequiredRole =
    requiredRoles.length === 0 || (role && requiredRoles.includes(role))

  const isAuthorized = hasRequiredPermissions && hasRequiredRole

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState
          type="spinner"
          message="Checking permissions..."
          size="lg"
        />
      </div>
    )
  }

  // Show custom fallback if provided
  if (!isAuthorized && fallback) {
    return <>{fallback}</>
  }

  // Show access denied page
  if (!isAuthorized && showAccessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Access Denied
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              You don't have permission to access this page.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current user info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <UserCheck className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  Current User
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <strong>Role:</strong> {roleDisplayName}
                </p>
                <p>
                  <strong>Permissions:</strong>{" "}
                  {requiredPermissions.length > 0
                    ? requiredPermissions.join(", ")
                    : "None required"}
                </p>
                {requiredRoles.length > 0 && (
                  <p>
                    <strong>Required Roles:</strong> {requiredRoles.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Missing permissions */}
            {requiredPermissions.length > 0 && !hasRequiredPermissions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Missing Permissions
                  </span>
                </div>
                <div className="text-sm text-yellow-700">
                  {requiredPermissions
                    .filter((permission) => !hasPermission(permission))
                    .map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-1"
                      >
                        <Lock className="w-3 h-3" />
                        <span>{permission}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col space-y-2">
              <Button
                onClick={() => router.push("/os/dashboard")}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>

              <Button
                onClick={() => router.back()}
                variant="outline"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>

            {/* Contact support */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                If you believe this is an error, please contact your
                administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Return children if authorized
  return isAuthorized ? <>{children}</> : null
}

// Convenience components for common access patterns
export function RequireOSAccess({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.OS_DASHBOARD_ACCESS]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireAdminAccess({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RBACProtectedRoute
      requiredPermissions={[PERMISSIONS.ADMIN_PANEL_ACCESS]}
      requiredRoles={[ROLES.ADMIN, ROLES.SUPER_ADMIN]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredRoles={[ROLES.SUPER_ADMIN]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequirePropertyOwner({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RBACProtectedRoute
      requiredRoles={[ROLES.PROPERTY_OWNER, ROLES.ADMIN, ROLES.SUPER_ADMIN]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequirePropertyManager({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RBACProtectedRoute
      requiredRoles={[
        ROLES.PROPERTY_MANAGER,
        ROLES.PROPERTY_OWNER,
        ROLES.ADMIN,
        ROLES.SUPER_ADMIN,
      ]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireUserManagement({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RBACProtectedRoute
      requiredPermissions={[PERMISSIONS.ADMIN_USER_MANAGEMENT]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireSystemConfig({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.ADMIN_SYSTEM_CONFIG]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireAnalytics({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute
      requiredPermissions={[
        PERMISSIONS.OS_ANALYTICS_ACCESS,
        PERMISSIONS.ADMIN_ANALYTICS,
      ]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireReports({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute
      requiredPermissions={[
        PERMISSIONS.OS_REPORTS_ACCESS,
        PERMISSIONS.ADMIN_REPORTS,
      ]}
    >
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireFinancial({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.OS_FINANCIAL_ACCESS]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireInventory({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.OS_INVENTORY_ACCESS]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireStaff({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.OS_STAFF_ACCESS]}>
      {children}
    </RBACProtectedRoute>
  )
}

export function RequireSettings({ children }: { children: React.ReactNode }) {
  return (
    <RBACProtectedRoute requiredPermissions={[PERMISSIONS.OS_SETTINGS_ACCESS]}>
      {children}
    </RBACProtectedRoute>
  )
}
