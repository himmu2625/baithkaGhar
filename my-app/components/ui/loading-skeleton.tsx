"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Fast Card Loading Skeleton
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 border rounded-lg bg-white shadow-sm", className)}>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-[80%]" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

// Grid of Cards Skeleton
function CardsGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}

// Stats Cards Skeleton
function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
          <div className="mt-3">
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Page Header Skeleton
function PageHeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 m-6 text-white">
      <div className="flex items-center mb-4">
        <Skeleton className="h-6 w-6 mr-2 bg-white/20" />
        <Skeleton className="h-6 w-32 bg-white/20" />
      </div>
      <Skeleton className="h-10 w-64 mb-4 bg-white/20" />
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 bg-white/20" />
          <Skeleton className="h-4 w-16 bg-white/20" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4 bg-white/20" />
          <Skeleton className="h-4 w-20 bg-white/20" />
        </div>
      </div>
    </div>
  )
}

// Dashboard Layout Skeleton
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderSkeleton />
      <div className="p-6">
        <StatsCardsSkeleton />
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <CardsGridSkeleton />
      </div>
    </div>
  )
}

// List Page Skeleton
function ListPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeaderSkeleton />
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mb-4 flex gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <CardsGridSkeleton count={9} />
      </div>
    </div>
  )
}

export {
  Skeleton,
  CardSkeleton,
  CardsGridSkeleton,
  StatsCardsSkeleton,
  PageHeaderSkeleton,
  DashboardSkeleton,
  ListPageSkeleton
}