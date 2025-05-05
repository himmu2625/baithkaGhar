import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { getHostDashboardStats } from "@/lib/host-analytics";

// Explicitly mark this route as dynamic since it uses headers via auth
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request
) {
  try {
    // Check authentication
    const session = await getSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Check if user is a host or admin
    if (session.user.role !== 'host' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Only hosts can access this endpoint" },
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") as "7days" | "30days" | "90days" | "year" || "30days";
    
    // Get host ID from session
    const hostId = session.user.id;
    
    // Get dashboard stats for the host
    const result = await getHostDashboardStats(hostId, timeframe);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch analytics data" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Error fetching host analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 