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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-md">
        The page you are looking for might have been removed, had its name changed, 
        or is temporarily unavailable.
      </p>
      
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/">
            Go Home
          </Link>
        </Button>
        
        <Suspense fallback={<Button variant="outline">Loading...</Button>}>
          <BackButton />
        </Suspense>
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
