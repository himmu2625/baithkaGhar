"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckSquare } from "lucide-react"

export function PendingTasks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckSquare className="w-5 h-5" />
          <span>Pending Tasks</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">12</div>
        <p className="text-sm text-gray-600">Tasks to complete</p>
      </CardContent>
    </Card>
  )
}
