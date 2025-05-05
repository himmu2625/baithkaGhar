"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-lightYellow/20 px-4">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-darkGreen mb-4">Something went wrong!</h2>
        <p className="text-mediumGreen mb-6">We apologize for the inconvenience. Please try again.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => reset()} className="bg-mediumGreen hover:bg-darkGreen text-lightYellow">
            Try again
          </Button>
          <Button onClick={() => router.push("/")} variant="outline" className="border-lightGreen text-darkGreen">
            Go back home
          </Button>
        </div>
      </div>
    </div>
  )
}
