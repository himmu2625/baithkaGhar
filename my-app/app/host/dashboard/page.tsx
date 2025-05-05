"use client"

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { SessionProvider } from '@/components/common/session-provider'
import { Loader2 } from 'lucide-react'
import HostDashboardComponent from '@/components/host/dashboard/dashboard-content'
import HostLoginForm from '@/components/host/dashboard/login-form'

function HostDashboardContent() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Wait for session to be checked
    if (status !== 'loading') {
      setIsLoading(false)
    }
  }, [status])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-darkGreen" />
          <p className="mt-4 text-lg text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show login form
  if (!session) {
    return <HostLoginForm />
  }

  // If authenticated but not a host, show upgrade account option
  if (session.user?.role !== 'host' && session.user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
          <h1 className="text-2xl font-bold text-center text-darkGreen mb-6">Become a Host</h1>
          <p className="text-gray-600 mb-6">
            You need to upgrade your account to access the host dashboard. List your property with Baithaka Ghar and start earning today.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/list-property')}
              className="px-6 py-3 bg-darkGreen text-white rounded-md hover:bg-darkGreen/90 transition-colors"
            >
              Upgrade to Host
            </button>
          </div>
        </div>
      </div>
    )
  }

  // If authenticated and is a host, show dashboard
  return <HostDashboardComponent />
}

export default function HostDashboard() {
  return (
    <SessionProvider>
      <HostDashboardContent />
    </SessionProvider>
  )
}