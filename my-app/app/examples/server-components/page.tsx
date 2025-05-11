export const dynamic = 'force-dynamic';

import { headers } from 'next/headers'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import ClientSearchParamsExample from './client-search-params'

// Get the auth function from NextAuth
const { auth } = NextAuth(authOptions)

export default async function ServerComponentsExample() {
  // This is a server component, so we can use getServerSession directly
  const session = await auth()
  
  // Access headers in a server component
  const headersList = await headers()
  const userAgent = headersList.get('user-agent')
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Server Components Example</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Server-side Headers</h2>
        <p><strong>User Agent:</strong> {userAgent}</p>
      </div>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">Server-side Session</h2>
        {session ? (
          <div>
            <p><strong>Logged in as:</strong> {session.user?.name || 'Unknown'}</p>
            <p><strong>Email:</strong> {session.user?.email || 'Not available'}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
      
      {/* The client component that uses useSearchParams */}
      <ClientSearchParamsExample />
      
      <div className="mt-8">
        <Link 
          href="/"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
} 