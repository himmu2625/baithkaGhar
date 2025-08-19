"use client"

import React from "react"
import { Wifi, WifiOff, AlertTriangle } from "lucide-react"

interface ConnectionStatusProps {
  status: "online" | "offline" | "error"
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "online":
        return {
          icon: Wifi,
          color: "text-green-600",
          bgColor: "bg-green-100",
          text: "Connected",
        }
      case "offline":
        return {
          icon: WifiOff,
          color: "text-red-600",
          bgColor: "bg-red-100",
          text: "Offline",
        }
      case "error":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          text: "Error",
        }
      default:
        return {
          icon: WifiOff,
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          text: "Unknown",
        }
    }
  }

  const statusInfo = getStatusInfo()
  const IconComponent = statusInfo.icon

  return (
    <div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {statusInfo.text}
    </div>
  )
}












