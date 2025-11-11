import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import RoomCategory from "@/models/RoomCategory";

// GET - Fetch all room categories
export async function GET() {
  try {
    await dbConnect();
    const categories = await RoomCategory.find().sort({ label: 1 });
    return NextResponse.json({ success: true, categories });
  } catch (error) {
    console.error("Error fetching room categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room categories" },
      { status: 500 }
    );
  }
}

// Helper function to normalize label to Title Case
function normalizeLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split by whitespace
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// POST - Add new room category
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { label, description, category } = await request.json();

    // Validate required fields
    if (!label || !label.trim()) {
      return NextResponse.json(
        { success: false, error: "Label is required" },
        { status: 400 }
      );
    }

    // Normalize label to Title Case (e.g., "grandeur premier" -> "Grandeur Premier")
    const normalizedLabel = normalizeLabel(label);

    // Generate value from label (lowercase, replace spaces with underscores)
    const value = normalizedLabel
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "") // Remove special characters
      .replace(/\s+/g, "_"); // Replace spaces with underscores

    // Check if category already exists (case-insensitive search)
    const existingCategory = await RoomCategory.findOne({
      $or: [
        { value },
        { label: { $regex: new RegExp(`^${normalizedLabel}$`, 'i') } }
      ]
    });

    if (existingCategory) {
      return NextResponse.json(
        {
          success: false,
          error: "Category already exists",
          existingLabel: existingCategory.label
        },
        { status: 409 }
      );
    }

    // Determine category type (default to 'specialty')
    const categoryType = category || "specialty";

    // Create new category with normalized label
    const newCategory = await RoomCategory.create({
      value,
      label: normalizedLabel,
      description: description?.trim() || `${normalizedLabel} accommodation`,
      category: categoryType,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      category: {
        value: newCategory.value,
        label: newCategory.label,
        description: newCategory.description,
        category: newCategory.category,
      },
    });
  } catch (error: any) {
    console.error("Error creating room category:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create room category",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}
