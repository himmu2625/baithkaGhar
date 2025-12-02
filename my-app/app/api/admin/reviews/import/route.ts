import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectMongo } from "@/lib/db/mongodb";
import Review from "@/models/Review";
import Property from "@/models/Property";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const token = await getToken({ req, secret: authOptions.secret });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongo();

    const body = await req.json();
    const {
      propertyId,
      reviews, // Array of reviews to import
    } = body;

    if (!propertyId || !reviews || !Array.isArray(reviews)) {
      return NextResponse.json(
        { success: false, error: "Property ID and reviews array are required" },
        { status: 400 }
      );
    }

    console.log('Import: Received propertyId:', propertyId);

    // Verify property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      console.log('Import: Property not found for ID:', propertyId);
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 }
      );
    }

    console.log('Import: Property found:', property._id.toString(), property.name || property.title);

    const importedReviews = [];
    const errors = [];

    for (const reviewData of reviews) {
      try {
        // Validate required fields
        if (!reviewData.userName || !reviewData.rating || !reviewData.comment) {
          errors.push({
            review: reviewData,
            error: "Missing required fields (userName, rating, comment)"
          });
          continue;
        }

        // Check for duplicate (by source and sourceReviewId if provided)
        if (reviewData.sourceReviewId) {
          const existing = await Review.findOne({
            propertyId,
            source: reviewData.source || 'imported',
            sourceReviewId: reviewData.sourceReviewId
          });

          if (existing) {
            errors.push({
              review: reviewData,
              error: "Review already exists (duplicate sourceReviewId)"
            });
            continue;
          }
        }

        // Create review
        const review = await Review.create({
          propertyId,
          userName: reviewData.userName,
          userImage: reviewData.userImage || undefined,
          rating: reviewData.rating,
          comment: reviewData.comment,
          source: reviewData.source || 'imported',
          sourceReviewId: reviewData.sourceReviewId || undefined,
          isVerified: true, // Mark as verified since from OTA
          isPublished: reviewData.isPublished !== undefined ? reviewData.isPublished : true,
          ratingBreakdown: reviewData.ratingBreakdown || {
            cleanliness: reviewData.rating,
            accuracy: reviewData.rating,
            communication: reviewData.rating,
            location: reviewData.rating,
            checkIn: reviewData.rating,
            value: reviewData.rating,
          },
          checkInDate: reviewData.checkInDate || undefined,
          checkOutDate: reviewData.checkOutDate || undefined,
          createdAt: reviewData.reviewDate || new Date(),
          helpfulCount: reviewData.helpfulCount || 0,
        });

        console.log('Import: Created review for property:', propertyId, 'Review ID:', review._id);

        importedReviews.push(review);
      } catch (error: any) {
        errors.push({
          review: reviewData,
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Imported ${importedReviews.length} reviews successfully`,
      imported: importedReviews.length,
      failed: errors.length,
      reviews: importedReviews,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("Import Reviews Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
