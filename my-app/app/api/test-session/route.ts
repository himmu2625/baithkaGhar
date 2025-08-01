import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/get-session'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    console.log("[API/test-session/GET] Request received")
    
    const session = await getSession()
    console.log("[API/test-session/GET] Session:", session)
    
    if (!session || !session.user) {
      return NextResponse.json({ 
        error: "No session found",
        session: session 
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role
      },
      sessionExists: !!session,
      userExists: !!session.user
    })
  } catch (error: any) {
    console.error("[API/test-session/GET] Error:", error)
    return NextResponse.json({ 
      error: "Session test failed", 
      details: error.message 
    }, { status: 500 })
  }
}