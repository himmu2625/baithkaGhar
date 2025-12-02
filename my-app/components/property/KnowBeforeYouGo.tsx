"use client"

import {
  Clock,
  Ban,
  PawPrint,
  PartyPopper,
  Moon,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Calendar,
  FileText,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface HouseRules {
  checkInTime?: string
  checkOutTime?: string
  quietHours?: string
  smokingAllowed?: boolean
  petsAllowed?: boolean
  partiesAllowed?: boolean
  additionalRules?: string[]
}

interface KnowBeforeYouGoProps {
  houseRules?: HouseRules
  cancellationPolicy?: string
  safetyInfo?: string[]
}

export function KnowBeforeYouGo({
  houseRules,
  cancellationPolicy,
  safetyInfo = []
}: KnowBeforeYouGoProps) {
  const defaultRules: HouseRules = {
    checkInTime: "2:00 PM",
    checkOutTime: "11:00 AM",
    quietHours: "10:00 PM - 7:00 AM",
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
    ...houseRules
  }

  const defaultCancellationPolicy = cancellationPolicy ||
    "Free cancellation up to 24 hours before check-in. After that, 50% of the booking amount will be charged."

  const defaultSafetyInfo = safetyInfo.length > 0 ? safetyInfo : [
    "Fire extinguisher on premises",
    "First aid kit available",
    "24/7 security",
    "CCTV surveillance in common areas"
  ]

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-darkGreen mb-6 flex items-center gap-2">
          <Info className="h-6 w-6 text-blue-600" />
          Know Before You Go
        </h2>

        {/* House Rules */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            House Rules
          </h3>

          <div className="space-y-4">
            {/* Check-in/Check-out */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Check-in</p>
                  <p className="text-sm text-blue-700">{defaultRules.checkInTime}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">Check-out</p>
                  <p className="text-sm text-orange-700">{defaultRules.checkOutTime}</p>
                </div>
              </div>
            </div>

            {/* Quiet Hours */}
            {defaultRules.quietHours && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Moon className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900">Quiet Hours</p>
                  <p className="text-sm text-purple-700">{defaultRules.quietHours}</p>
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <PolicyBadge
                allowed={defaultRules.smokingAllowed}
                icon={Ban}
                label="Smoking"
              />
              <PolicyBadge
                allowed={defaultRules.petsAllowed}
                icon={PawPrint}
                label="Pets"
              />
              <PolicyBadge
                allowed={defaultRules.partiesAllowed}
                icon={PartyPopper}
                label="Parties/Events"
              />
            </div>

            {/* Additional Rules */}
            {defaultRules.additionalRules && defaultRules.additionalRules.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900 mb-2">Additional Rules:</p>
                <ul className="space-y-1">
                  {defaultRules.additionalRules.map((rule, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-emerald-600 mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <Separator className="my-6" />

        {/* Cancellation Policy */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-rose-600" />
            Cancellation Policy
          </h3>

          <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
            <p className="text-sm text-rose-900 leading-relaxed">
              {defaultCancellationPolicy}
            </p>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Safety Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Safety & Security
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {defaultSafetyInfo.map((info, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-900">{info}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PolicyBadge({
  allowed,
  icon: Icon,
  label,
}: {
  allowed?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <div
      className={`flex items-center gap-2 p-3 rounded-lg border ${
        allowed
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      {allowed ? (
        <CheckCircle2 className="h-5 w-5 text-green-600" />
      ) : (
        <XCircle className="h-5 w-5 text-red-600" />
      )}
      <Icon className={`h-4 w-4 ${allowed ? "text-green-700" : "text-red-700"}`} />
      <span className={`text-sm font-medium ${allowed ? "text-green-900" : "text-red-900"}`}>
        {label} {allowed ? "Allowed" : "Not Allowed"}
      </span>
    </div>
  )
}
