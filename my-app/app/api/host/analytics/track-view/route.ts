import { NextResponse } from "next/server";
import { trackPropertyView } from "@/lib/host-analytics";
import { z } from "zod";

const trackViewSchema = z.object({
  propertyId: z.string(),
  visitorId: z.string().optional(),
});

export async function POST(
  request: Request
) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = trackViewSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validationResult.error.issues },
        { status: 400 }
      );
    }
    
    const { propertyId, visitorId } = validationResult.data;
    
    // Track the property view
    const result = await trackPropertyView(propertyId, visitorId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to track property view" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(result.data);
  } catch (error: any) {
    console.error("Error tracking property view:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track property view" },
      { status: 500 }
    );
  }
} 