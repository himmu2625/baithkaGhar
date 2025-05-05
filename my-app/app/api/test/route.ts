import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "success",
    message: "API is working"
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    return NextResponse.json({
      status: "success",
      message: "POST request received",
      receivedData: body
    })
  } catch (error) {
    console.error("Error in test endpoint:", error)
    return NextResponse.json({
      status: "error",
      message: "Failed to parse request body"
    }, { status: 400 })
  }
} 