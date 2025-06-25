import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageLoadingProps {
  message?: string
  className?: string
  showContainer?: boolean
}

export function PageLoading({ 
  message = "Loading...", 
  className,
  showContainer = true 
}: PageLoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 text-mediumGreen animate-spin" />
      <p className="mt-4 text-darkGreen font-medium">{message}</p>
    </div>
  )

  if (!showContainer) {
    return content
  }

  return (
    <div className={cn("min-h-screen flex items-center justify-center", className)}>
      {content}
    </div>
  )
}

export default PageLoading 