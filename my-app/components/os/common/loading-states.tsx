"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  RefreshCw,
  Database,
  Wifi,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LoadingSpinner({
  size = "md",
  text,
  className = "",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <RefreshCw
        className={`${sizeClasses[size]} animate-spin text-blue-600 mr-2`}
      />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  )
}

interface SkeletonCardProps {
  title?: string
  lines?: number
  className?: string
}

export function SkeletonCard({
  title,
  lines = 3,
  className = "",
}: SkeletonCardProps) {
  return (
    <Card className={`border-0 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        {title && <Skeleton className="h-6 w-32" />}
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "pulse" | "dots"
  message?: string
  size?: "sm" | "md" | "lg"
  className?: string
}

export function LoadingState({
  type = "spinner",
  message = "Loading...",
  size = "md",
  className = "",
}: LoadingStateProps) {
  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return <LoadingSpinner size={size} text={message} />

      case "skeleton":
        return (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )

      case "pulse":
        return (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.4s" }}
            ></div>
            <span className="text-sm text-gray-600 ml-2">{message}</span>
          </div>
        )

      case "dots":
        return (
          <div className="flex items-center space-x-1">
            <span className="text-sm text-gray-600">{message}</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
          </div>
        )

      default:
        return <LoadingSpinner size={size} text={message} />
    }
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {renderLoader()}
    </div>
  )
}

interface ConnectionStatusProps {
  status: "connected" | "connecting" | "disconnected" | "error"
  message?: string
}

export function ConnectionStatus({ status, message }: ConnectionStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "connected":
        return {
          icon: <CheckCircle className="w-4 h-4 text-green-600" />,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        }

      case "connecting":
        return {
          icon: <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        }

      case "disconnected":
        return {
          icon: <Wifi className="w-4 h-4 text-gray-600" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }

      case "error":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-red-600" />,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        }

      default:
        return {
          icon: <Database className="w-4 h-4 text-gray-600" />,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}
    >
      {config.icon}
      <span className={`text-sm font-medium ${config.color}`}>
        {message || status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    </div>
  )
}

interface DataLoadingStateProps {
  isLoading: boolean
  error: string | null
  isEmpty: boolean
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
  children: React.ReactNode
}

export function DataLoadingState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "No data available",
  errorMessage,
  onRetry,
  children,
}: DataLoadingStateProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingState type="spinner" message="Loading data..." size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error Loading Data
        </h3>
        <p className="text-gray-600 mb-4 max-w-md">{errorMessage || error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Database className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-600 max-w-md">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}

interface SkeletonGridProps {
  rows?: number
  cols?: number
  className?: string
}

export function SkeletonGrid({
  rows = 3,
  cols = 4,
  className = "",
}: SkeletonGridProps) {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols} gap-6 ${className}`}
    >
      {Array.from({ length: rows * cols }).map((_, index) => (
        <SkeletonCard key={index} lines={2} />
      ))}
    </div>
  )
}
