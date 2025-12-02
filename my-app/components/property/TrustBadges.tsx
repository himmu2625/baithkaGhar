"use client"

import {
  Shield,
  CheckCircle2,
  Lock,
  Award,
  Calendar,
  Star,
  RefreshCcw,
  Verified,
} from "lucide-react"

interface TrustBadge {
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  color: string
}

export function TrustBadges() {
  const badges: TrustBadge[] = [
    {
      icon: Verified,
      label: "Verified Property",
      description: "This property has been verified by our team",
      color: "blue",
    },
    {
      icon: Lock,
      label: "Secure Payment",
      description: "Your payment information is encrypted and secure",
      color: "green",
    },
    {
      icon: RefreshCcw,
      label: "Free Cancellation",
      description: "Cancel up to 24 hours before check-in",
      color: "purple",
    },
    {
      icon: Award,
      label: "Best Price Guarantee",
      description: "We match or beat competitor prices",
      color: "amber",
    },
  ]

  const colorClasses: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    blue: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-900",
    },
    green: {
      bg: "bg-green-50",
      border: "border-green-200",
      icon: "text-green-600",
      text: "text-green-900",
    },
    purple: {
      bg: "bg-purple-50",
      border: "border-purple-200",
      icon: "text-purple-600",
      text: "text-purple-900",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      text: "text-amber-900",
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {badges.map((badge, index) => {
        const Icon = badge.icon
        const colors = colorClasses[badge.color]

        return (
          <div
            key={index}
            className={`flex items-start gap-3 p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-shadow duration-200`}
          >
            <div className="flex-shrink-0">
              <Icon className={`h-6 w-6 ${colors.icon}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-sm ${colors.text} mb-1`}>
                {badge.label}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {badge.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
