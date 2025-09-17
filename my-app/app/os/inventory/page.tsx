"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function InventoryRedirect() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Redirect to property-specific dashboard page using the canonical propertyId only
    const propertyId = session?.user?.propertyId
    if (propertyId) {
      router.replace(`/os/inventory/dashboard/${propertyId}`)
    }
  }, [session, router])

  // Show loading while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">
          Redirecting to inventory dashboard...
        </p>
      </div>
    </div>
  )
}
