import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-10 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-1/2 max-w-sm" />
      </div>
      
      {/* Main content area skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {Array(6).fill(null).map((_, i) => (
          <div key={i} className="rounded-lg border overflow-hidden">
            <Skeleton className="h-48 w-full" /> {/* Image placeholder */}
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" /> {/* Title */}
              <Skeleton className="h-4 w-1/2" /> {/* Subtitle */}
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-5 w-20" /> {/* Price */}
                <Skeleton className="h-8 w-24 rounded-full" /> {/* Button */}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
