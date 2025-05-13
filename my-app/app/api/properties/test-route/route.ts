import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET handler to test API health (no auth required)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "API is working correctly",
    methods: ["GET", "PATCH", "PUT", "DELETE"],
    availableRoutes: {
      propertyDetail: "/api/properties/:id",
      propertyImages: "/api/properties/:id/images",
      deleteImage: "/api/properties/:id/images/:publicId",
    }
  });
}

// Helper function to check admin authentication
async function checkAdminAuth(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: authOptions.secret });
    
    if (!token) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        userId: null,
        error: "Not authenticated"
      };
    }
    
    // Check if user is admin or super_admin
    let isAdmin = false;
    
    if (token.sub) {
      const User = (await import('@/models/User')).default;
      try {
        const user = await User.findById(token.sub);
        if (user && ['admin', 'super_admin'].includes(user.role)) {
          isAdmin = true;
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
      }
    }
    
    return {
      isAuthenticated: true,
      isAdmin,
      userId: token.sub || null,
      error: null
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      userId: null,
      error: "Auth check error"
    };
  }
}

// PATCH handler to test PATCH functionality (auth required)
export async function PATCH(request: NextRequest) {
  const authStatus = await checkAdminAuth(request);
  
  if (!authStatus.isAuthenticated) {
    return NextResponse.json(
      { success: false, message: "Authentication required", authStatus },
      { status: 401 }
    );
  }
  
  if (!authStatus.isAdmin) {
    return NextResponse.json(
      { success: false, message: "Admin access required", authStatus },
      { status: 403 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "PATCH method is working correctly",
    receivedData: await request.json().catch(() => null),
    authStatus
  });
}

// PUT handler to test PUT functionality (auth required)
export async function PUT(request: NextRequest) {
  const authStatus = await checkAdminAuth(request);
  
  if (!authStatus.isAuthenticated) {
    return NextResponse.json(
      { success: false, message: "Authentication required", authStatus },
      { status: 401 }
    );
  }
  
  if (!authStatus.isAdmin) {
    return NextResponse.json(
      { success: false, message: "Admin access required", authStatus },
      { status: 403 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "PUT method is working correctly",
    receivedData: await request.json().catch(() => null),
    authStatus
  });
}

// DELETE handler to test DELETE functionality (auth required)
export async function DELETE(request: NextRequest) {
  const authStatus = await checkAdminAuth(request);
  
  if (!authStatus.isAuthenticated) {
    return NextResponse.json(
      { success: false, message: "Authentication required", authStatus },
      { status: 401 }
    );
  }
  
  if (!authStatus.isAdmin) {
    return NextResponse.json(
      { success: false, message: "Admin access required", authStatus },
      { status: 403 }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: "DELETE method is working correctly",
    authStatus
  });
} 