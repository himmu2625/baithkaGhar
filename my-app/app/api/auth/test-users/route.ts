import 'server-only'
import { NextResponse, type NextRequest } from "next/server"
import { connectMongo } from "@/lib/db/mongodb"
import User from "@/models/User"

// Create test users for the application
export async function POST(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "This endpoint is only available in development mode" },
      { status: 403 }
    )
  }

  try {
    await connectMongo()

    // Create test admin user
    const adminEmail = "admin@test.com"
    let admin = await User.findOne({ email: adminEmail })
    
    if (!admin) {
      admin = await User.create({
        name: "Test Admin",
        email: adminEmail,
        password: "Admin@123",
        isAdmin: true,
        profileComplete: true,
        phone: "+919876543210",
      })
    }

    // Create regular test user
    const userEmail = "user@test.com"
    let regularUser = await User.findOne({ email: userEmail })
    
    if (!regularUser) {
      regularUser = await User.create({
        name: "Test User",
        email: userEmail,
        password: "User@123",
        isAdmin: false,
        profileComplete: true,
        phone: "+919876543211",
      })
    }

    // Create host user (property owner)
    const hostEmail = "host@test.com"
    let hostUser = await User.findOne({ email: hostEmail })
    
    if (!hostUser) {
      hostUser = await User.create({
        name: "Test Host",
        email: hostEmail,
        password: "Host@123",
        isAdmin: false,
        profileComplete: true,
        phone: "+919876543212",
      })
    }

    return NextResponse.json({
      success: true,
      message: "Test users created successfully",
      users: {
        admin: {
          email: adminEmail,
          password: "Admin@123",
          phone: "+919876543210"
        },
        user: {
          email: userEmail,
          password: "User@123",
          phone: "+919876543211"
        },
        host: {
          email: hostEmail,
          password: "Host@123",
          phone: "+919876543212"
        }
      }
    })
  } catch (error) {
    console.error("Error creating test users:", error)
    return NextResponse.json(
      { error: "Failed to create test users" },
      { status: 500 }
    )
  }
} 