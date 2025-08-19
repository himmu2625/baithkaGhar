"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Settings,
  Eye,
  BarChart3,
  Zap,
  Calendar,
  Target,
  DollarSign,
  Clock,
  Users,
  ArrowRight,
} from "lucide-react"
import { motion } from "framer-motion"

interface DynamicPricingData {
  isEnabled: boolean
  basePrice: number
  currentPrice: number
  todayPrice: number
  weekendPrice: number
  priceChange: {
    direction: "up" | "down" | "stable"
    percentage: number
    reason: string
  }
  activeFactor: string
  nextWeekendRate: number
  revenueImpact: {
    daily: number
    weekly: number
    percentage: number
  }
  bookingTrend: "increasing" | "decreasing" | "stable"
  lastUpdated: Date
}

interface AdminDynamicPricingIndicatorProps {
  propertyId: string
  basePrice: number
  variant?: "compact" | "detailed" | "card"
  showControls?: boolean
  showPreview?: boolean
  className?: string
}

export default function AdminDynamicPricingIndicator({
  propertyId,
  basePrice,
  variant = "compact",
  showControls = true,
  showPreview = false,
  className = "",
}: AdminDynamicPricingIndicatorProps) {
  const [pricingData, setPricingData] = useState<DynamicPricingData | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  const fetchDynamicPricingData = useCallback(async () => {
    try {
      setLoading(true)

      // Mock data for demonstration - replace with actual API call
      const mockData: DynamicPricingData = {
        isEnabled: Math.random() > 0.3, // 70% chance enabled
        basePrice,
        currentPrice: Math.round(basePrice * (0.9 + Math.random() * 0.4)), // ±20% variation
        todayPrice: Math.round(basePrice * (0.95 + Math.random() * 0.2)), // ±10% variation
        weekendPrice: Math.round(basePrice * (1.1 + Math.random() * 0.3)), // +10-40%
        priceChange: {
          direction:
            Math.random() > 0.6
              ? "up"
              : Math.random() > 0.3
              ? "down"
              : "stable",
          percentage: Math.round(Math.random() * 20 + 5), // 5-25%
          reason: [
            "High demand",
            "Seasonal adjustment",
            "Event pricing",
            "Last-minute discount",
            "Weekend premium",
          ][Math.floor(Math.random() * 5)],
        },
        activeFactor: [
          "Seasonality",
          "Demand surge",
          "Event pricing",
          "Weekend premium",
          "Last-minute booking",
        ][Math.floor(Math.random() * 5)],
        nextWeekendRate: Math.round(basePrice * (1.15 + Math.random() * 0.25)),
        revenueImpact: {
          daily: Math.round(Math.random() * 5000 + 2000),
          weekly: Math.round(Math.random() * 25000 + 10000),
          percentage: Math.round(Math.random() * 30 + 5), // 5-35%
        },
        bookingTrend: ["increasing", "decreasing", "stable"][
          Math.floor(Math.random() * 3)
        ] as any,
        lastUpdated: new Date(),
      }

      setPricingData(mockData)
    } catch (error) {
      console.error("Error fetching dynamic pricing data:", error)
    } finally {
      setLoading(false)
    }
  }, [propertyId, basePrice])

  useEffect(() => {
    fetchDynamicPricingData()
  }, [fetchDynamicPricingData])

  const getStatusColor = () => {
    if (!pricingData?.isEnabled) return "text-gray-500 bg-gray-100"

    switch (pricingData.priceChange.direction) {
      case "up":
        return "text-green-700 bg-green-100"
      case "down":
        return "text-blue-700 bg-blue-100"
      default:
        return "text-purple-700 bg-purple-100"
    }
  }

  const getRevenueChangeIcon = () => {
    if (!pricingData) return <DollarSign className="h-4 w-4" />

    switch (pricingData.priceChange.direction) {
      case "up":
        return <TrendingUp className="h-4 w-4" />
      case "down":
        return <TrendingDown className="h-4 w-4" />
      default:
        return <BarChart3 className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {variant === "compact" && (
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-gray-200 rounded"></div>
            <div className="h-4 w-12 bg-gray-200 rounded"></div>
          </div>
        )}
        {variant === "detailed" && (
          <div className="space-y-2">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
        )}
        {variant === "card" && (
          <div className="p-4 space-y-3">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        )}
      </div>
    )
  }

  if (!pricingData) return null

  // Compact variant for table cells
  if (variant === "compact") {
    return (
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="flex items-center gap-1">
            <span className="font-medium">
              ₹{pricingData.currentPrice.toLocaleString()}
            </span>
            {pricingData.isEnabled && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Dynamic
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-2 max-w-xs">
                    <div className="font-medium">Dynamic Pricing Active</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Base: ₹{pricingData.basePrice.toLocaleString()}</div>
                      <div>
                        Current: ₹{pricingData.currentPrice.toLocaleString()}
                      </div>
                      <div>
                        Today: ₹{pricingData.todayPrice.toLocaleString()}
                      </div>
                      <div>
                        Weekend: ₹{pricingData.weekendPrice.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active factor: {pricingData.activeFactor}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {pricingData.isEnabled &&
            pricingData.priceChange.direction !== "stable" && (
              <Tooltip>
                <TooltipTrigger>
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${getStatusColor()}`}
                  >
                    {getRevenueChangeIcon()}
                    <span>{pricingData.priceChange.percentage}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="text-sm">
                    {pricingData.priceChange.reason} • Revenue impact: +₹
                    {pricingData.revenueImpact.daily.toLocaleString()}/day
                  </div>
                </TooltipContent>
              </Tooltip>
            )}

          {showControls && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        window.open(
                          `/admin/properties/${propertyId}/pricing`,
                          "_blank"
                        )
                      }
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Manage pricing settings</span>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Detailed variant for larger displays
  if (variant === "detailed") {
    return (
      <TooltipProvider>
        <div className={`space-y-3 ${className}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">
                ₹{pricingData.currentPrice.toLocaleString()}
              </span>
              {pricingData.isEnabled && (
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-300"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Dynamic
                </Badge>
              )}
            </div>

            {pricingData.isEnabled && (
              <div
                className={`flex items-center gap-1 text-sm px-3 py-1 rounded-full ${getStatusColor()}`}
              >
                {getRevenueChangeIcon()}
                <span>
                  {pricingData.priceChange.direction === "up"
                    ? "+"
                    : pricingData.priceChange.direction === "down"
                    ? "-"
                    : ""}
                  {pricingData.priceChange.percentage}%
                </span>
              </div>
            )}
          </div>

          {pricingData.isEnabled && (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Today</div>
                <div className="font-medium">
                  ₹{pricingData.todayPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Weekend</div>
                <div className="font-medium">
                  ₹{pricingData.weekendPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Revenue +</div>
                <div className="font-medium text-green-600">
                  ₹{pricingData.revenueImpact.daily.toLocaleString()}/day
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Active factor: {pricingData.activeFactor}</span>
            <span>•</span>
            <span>Updated {pricingData.lastUpdated.toLocaleTimeString()}</span>
          </div>

          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `/admin/properties/${propertyId}/pricing`,
                    "_blank"
                  )
                }
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Pricing
              </Button>
              {showPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(`/property/${propertyId}`, "_blank")
                  }
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          )}
        </div>
      </TooltipProvider>
    )
  }

  // Card variant for dashboard displays
  if (variant === "card") {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span>Dynamic Pricing</span>
            </div>
            {pricingData.isEnabled ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-100 text-gray-600">
                Disabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                ₹{pricingData.currentPrice.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Current Rate</div>
            </div>
            {pricingData.isEnabled &&
              pricingData.priceChange.direction !== "stable" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getStatusColor()}`}
                >
                  {getRevenueChangeIcon()}
                  <div>
                    <div className="font-medium">
                      {pricingData.priceChange.percentage}%
                    </div>
                    <div className="text-xs">
                      {pricingData.priceChange.reason}
                    </div>
                  </div>
                </motion.div>
              )}
          </div>

          {pricingData.isEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Base Price
                  </div>
                  <div className="font-medium">
                    ₹{pricingData.basePrice.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    Weekend Rate
                  </div>
                  <div className="font-medium">
                    ₹{pricingData.weekendPrice.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800">
                      Revenue Impact
                    </div>
                    <div className="text-xs text-green-600">Last 7 days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-800">
                      +₹{pricingData.revenueImpact.weekly.toLocaleString()}
                    </div>
                    <div className="text-xs text-green-600">
                      +{pricingData.revenueImpact.percentage}% increase
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Target className="h-4 w-4" />
                  <span>Active: {pricingData.activeFactor}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Next weekend: ₹
                    {pricingData.nextWeekendRate.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}

          {showControls && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() =>
                  window.open(
                    `/admin/properties/${propertyId}/pricing`,
                    "_blank"
                  )
                }
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`/property/${propertyId}`, "_blank")}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return null
}
