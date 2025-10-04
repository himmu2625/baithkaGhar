import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <WifiOff className="w-24 h-24 mx-auto text-gray-400 mb-6" />
        <h1 className="text-4xl font-bold mb-4">You're Offline</h1>
        <p className="text-gray-600 mb-8">
          It looks like you've lost your internet connection. Don't worry, you can still browse cached pages.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Return to Homepage</Link>
          </Button>
          <p className="text-sm text-gray-500">
            Your connection will be restored automatically when you're back online.
          </p>
        </div>
      </div>
    </div>
  )
}
