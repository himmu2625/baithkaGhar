import { NextRequest, NextResponse } from "next/server";

// Force dynamic to prevent caching
export const dynamic = 'force-dynamic';

// Helper function to handle all methods
async function handleRequest(request: NextRequest, method: string) {
  let body = null;
  try {
    // Only try to parse body for non-GET methods
    if (method !== 'GET') {
      // Try to parse the request body as JSON
      try {
        body = await request.json();
      } catch (e) {
        // If can't parse as JSON, just get the text
        try {
          body = { rawText: await request.text() };
        } catch (e) {
          body = null;
        }
      }
    }

    // Return a standard response
    return NextResponse.json({
      success: true,
      message: `${method} method handled successfully`,
      method,
      timestamp: new Date().toISOString(),
      body,
      headers: Object.fromEntries([...request.headers.entries()]),
      url: request.url
    });
  } catch (error) {
    console.error(`Error in ${method}:`, error);
    return NextResponse.json({
      success: false,
      message: `Error handling ${method} request`,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// Method handlers
export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleRequest(request, 'PUT');
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request, 'PATCH');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

export async function OPTIONS(request: NextRequest) {
  // Special handling for OPTIONS
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 