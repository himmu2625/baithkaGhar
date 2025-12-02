import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Review from "@/models/Review";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const { reviewId } = params;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      {
        isPublished: true,
        publishedAt: new Date(),
      },
      { new: true }
    );

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review approved and published",
      review
    });

  } catch (error: any) {
    console.error("Approve Review Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
