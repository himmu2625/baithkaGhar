'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { useRouter } from "next/navigation"

// Client Component for the back button
function BackButton() {
  const router = useRouter()
  
  return (
    <Button 
      variant="outline" 
      onClick={() => router.back()}
    >
      Go Back
    </Button>
  )
}

// Client component for NotFound content
function NotFoundContent() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Not Found</h2>
        <p className="text-gray-600 mb-8">Could not find the requested resource.</p>
        <Link 
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  )
}
