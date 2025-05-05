"use client"

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  change?: number
  trend?: "up" | "down" | "neutral"
  description?: string
  isLoading?: boolean
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  change,
  trend = "neutral",
  description,
  isLoading = false
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="h-5 w-5 text-gray-500" />
          {trend && change !== undefined && (
            <div className={`flex items-center text-xs font-medium ${
              trend === "up" 
                ? "text-green-500" 
                : trend === "down" 
                ? "text-red-500" 
                : "text-gray-500"
            }`}>
              {trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : trend === "down" ? (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              ) : null}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        
        {isLoading ? (
          <>
            <div className="h-7 bg-gray-200 rounded-md w-24 mb-1 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-md w-32 animate-pulse"></div>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold">
              {value}
            </h3>
            <p className="text-sm text-muted-foreground">
              {title}
              {description && (
                <span className="block text-xs opacity-70 mt-1">
                  {description}
                </span>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
} 