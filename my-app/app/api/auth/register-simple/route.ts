import { NextRequest, NextResponse } from "next/server"

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Parse request body
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
    
    // Validate required fields without any external dependencies
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    // Return a success response
    return NextResponse.json({
      message: "Registration would be successful (simplified endpoint)",
      user: {
        name: body.name,
        email: body.email,
        profileComplete: false
      }
    }, { status: 201 });
    
  } catch (error: any) {
    console.error("Simple registration error:", error);
    return NextResponse.json(
      { message: error.message || "An error occurred during registration" },
      { status: 500 }
    );
  }
} 