import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Access the already configured NextAuth handlers
const { auth } = NextAuth(authOptions)

export async function GET(request: NextRequest) {
  // Get the search params
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('query') || 'No query provided'
  
  // Get headers
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || 'Unknown user agent'
  const referer = headersList.get('referer') || 'No referer'
  
  // Get server session (optional - will be null if not authenticated)
  const session = await auth()
  
  // Return dynamic response
  return NextResponse.json({
    message: 'This is a dynamic server-side API route',
    data: {
      query,
      headers: {
        userAgent,
        referer
      },
      timestamp: new Date().toISOString(),
      authenticated: !!session,
      user: session?.user || null
    }
  })
}

// Example POST handler
export async function POST(request: NextRequest) {
  try {
    // Parse body as JSON
    const body = await request.json()
    
    // Get headers
    const headersList = headers()
    const contentType = headersList.get('content-type') || 'Not specified'
    
    return NextResponse.json({
      message: 'POST request received',
      receivedData: body,
      contentType,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    )
  }
} 