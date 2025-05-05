import { NextResponse } from "next/server";
import { getSession } from "@/lib/get-session";
import { generatePriceRecommendations } from "@/lib/host-analytics";
import { z } from "zod";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db/dbConnect";
import Property from "@/models/Property";

// Mark this route as dynamic since it uses session
export const dynamic = 'force-dynamic';

const recommendationSchema = z.object({
  propertyId: z.string(),
});

export async function POST(
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
    
    // Parse and validate request body
    const body = await request.json();
    const validationResult = recommendationSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { propertyId } = validationResult.data;
    
    // Generate price recommendations
    const result = await generatePriceRecommendations(propertyId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to generate price recommendations" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Error generating price recommendations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate price recommendations" },
      { status: 500 }
    );
  }
} 