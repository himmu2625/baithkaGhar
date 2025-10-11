"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function RatesRedirect() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    const propertyId = session?.user?.propertyId
    if (propertyId) {
      router.replace(`/os/inventory/rates/${propertyId}`)
    }
  }, [session, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to property rates...</p>
      </div>
    </div>
  )
}





