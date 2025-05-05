import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center">
        <Loader2 className="h-12 w-12 text-mediumGreen animate-spin" />
        <p className="mt-4 text-darkGreen">Loading properties...</p>
      </div>
    </div>
  )
}
