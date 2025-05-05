import { NextResponse } from "next/server"
import { dbConnect, isConnectionActive } from "@/lib/db"
import mongoose from "mongoose"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Check MongoDB connection
    await dbConnect()
    
    const isConnected = isConnectionActive()
    const connectionState = mongoose.connection.readyState
    
    // Map the connection state to a readable status
    const connectionStatus = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
      99: "uninitialized"
    }[connectionState] || "unknown"
    
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: {
        connected: isConnected,
        status: connectionStatus,
        name: mongoose.connection.name || "unknown"
      },
      environment: process.env.NODE_ENV || "development"
    })
  } catch (error: any) {
    console.error("Health check failed:", error)
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: error.message || "Unknown error occurred",
      database: {
        connected: false,
        status: "error",
      },
      environment: process.env.NODE_ENV || "development"
    }, { status: 500 })
  }
} 