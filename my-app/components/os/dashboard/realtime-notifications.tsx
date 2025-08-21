"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export function RealTimeNotifications() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Real-time Notifications</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">3</div>
        <p className="text-sm text-gray-600">Live notifications</p>
      </CardContent>
    </Card>
  )
}




















