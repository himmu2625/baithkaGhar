"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Star,
  Shield,
  Clock,
  MessageCircle,
  User,
  TrendingUp,
  Award,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"

interface HostInfo {
  name?: string
  image?: string
  responseRate?: number
  responseTime?: string
  joinedDate?: string
  isSuperhost?: boolean
  isVerified?: boolean
  totalProperties?: number
  totalReviews?: number
  averageRating?: number
}

interface EnhancedHostInfoProps {
  host?: HostInfo
  propertyOwnerId?: string
}

export function EnhancedHostInfo({ host, propertyOwnerId }: EnhancedHostInfoProps) {
  const defaultHost: HostInfo = {
    name: "Property Owner",
    image: "/placeholder.svg",
    responseRate: 100,
    responseTime: "within 24 hours",
    joinedDate: "2024",
    isSuperhost: false,
    isVerified: true,
    ...host
  }

  const initials = defaultHost.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <Card className="mb-6 border-emerald-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-emerald-200">
        <h2 className="text-2xl font-bold text-darkGreen flex items-center gap-2">
          <User className="h-6 w-6" />
          Meet Your Host
        </h2>
      </div>

      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Host Avatar and Basic Info */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-4 border-emerald-200">
                <AvatarImage src={defaultHost.image} alt={defaultHost.name} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {defaultHost.isVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
              )}
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-gray-900">{defaultHost.name}</h3>
              <p className="text-sm text-gray-600">Joined in {defaultHost.joinedDate}</p>

              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                {defaultHost.isSuperhost && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Superhost
                  </Badge>
                )}
                {defaultHost.isVerified && (
                  <Badge className="bg-blue-500 text-white">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Host Stats */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Response Rate */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">Response Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {defaultHost.responseRate}%
                </p>
              </div>

              {/* Response Time */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">Response Time</span>
                </div>
                <p className="text-sm font-medium text-blue-700">
                  {defaultHost.responseTime}
                </p>
              </div>

              {/* Total Reviews */}
              {defaultHost.totalReviews !== undefined && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-900">Total Reviews</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {defaultHost.totalReviews}
                  </p>
                </div>
              )}

              {/* Average Rating */}
              {defaultHost.averageRating !== undefined && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-amber-600" />
                    <span className="font-semibold text-amber-900">Average Rating</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-2xl font-bold text-amber-700">
                      {defaultHost.averageRating.toFixed(1)}
                    </p>
                    <Star className="h-4 w-4 text-amber-600 fill-amber-600" />
                  </div>
                </div>
              )}
            </div>

            {/* Contact Host Button */}
            <div className="flex gap-3">
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Host
              </Button>

              {propertyOwnerId && (
                <Link href={`/host/${propertyOwnerId}`} className="flex-1">
                  <Button variant="outline" className="w-full border-emerald-600 text-emerald-600 hover:bg-emerald-50">
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                </Link>
              )}
            </div>

            {/* Trust Message */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                <Shield className="h-3 w-3 inline mr-1" />
                To protect your payment, never transfer money or communicate outside of the Baithaka Ghar website or app.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
