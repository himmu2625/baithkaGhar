import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import dbConnect from "@/lib/db/dbConnect"
import User from "@/models/User"
import { sendWelcomeEmail } from "@/lib/services/email"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // First verify we can parse the request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Failed to parse request body:", error);
      return NextResponse.json(
        { message: "Invalid request body" },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      )
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      )
    }
    
    // Validate password strength
    if (body.password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }
    
    // Connect to database
    try {
      await dbConnect()
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { message: "Database connection error. Please try again later." },
        { status: 500 }
      );
    }
    
    // Check if user already exists
    try {
      const existingUser = await User.findOne({ email: body.email })
      
      if (existingUser) {
        return NextResponse.json(
          { message: "User already exists with this email" },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error("Error checking existing user:", error);
      return NextResponse.json(
        { message: "Error checking user data. Please try again later." },
        { status: 500 }
      );
    }
    
    // Create new user
    let user;
    try {
      user = await User.create({
        name: body.name,
        email: body.email,
        password: body.password, // Will be hashed by pre-save hook
        phone: body.phone,
        profileComplete: false
      })
    } catch (error) {
      console.error("User creation error:", error);
      return NextResponse.json(
        { message: "Failed to create user. Please try again later." },
        { status: 500 }
      );
    }
    
    // Send welcome email
    try {
      await sendWelcomeEmail({
        to: body.email,
        name: body.name
      })
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Continue with registration even if email fails
    }
    
    return NextResponse.json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profileComplete: false
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { message: error.message || "An error occurred during registration" },
      { status: 500 }
    )
  }
} 