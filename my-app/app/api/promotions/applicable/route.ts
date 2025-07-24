import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import PromotionEngine from '@/lib/services/promotion-engine';

export async function GET(req: NextRequest) {
  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const propertyId = searchParams.get('propertyId');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    const guests = searchParams.get('guests');
    const rooms = searchParams.get('rooms');
    const totalAmount = searchParams.get('totalAmount');
    const couponCode = searchParams.get('couponCode');
    const userId = searchParams.get('userId'); // Optional for logged-in users

    // Validate required parameters
    if (!propertyId || !checkInDate || !checkOutDate || !guests || !rooms || !totalAmount) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters: propertyId, checkInDate, checkOutDate, guests, rooms, totalAmount' 
        },
        { status: 400 }
      );
    }

    // Build booking details object
    const bookingDetails = {
      propertyId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      guests: parseInt(guests),
      rooms: parseInt(rooms),
      totalAmount: parseFloat(totalAmount),
      userId: userId || undefined,
      bookingDate: new Date()
    };

    // Validate dates
    if (bookingDetails.checkInDate >= bookingDetails.checkOutDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Check-in date must be before check-out date' 
        },
        { status: 400 }
      );
    }

    if (bookingDetails.checkInDate < new Date()) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Check-in date cannot be in the past' 
        },
        { status: 400 }
      );
    }

    // Find applicable promotions
    const applicablePromotions = await PromotionEngine.findApplicablePromotions(
      bookingDetails,
      couponCode || undefined
    );

    // Format response with promotion display information
    const formattedPromotions = applicablePromotions.map(({ promotion, discountAmount, finalAmount, discountPercentage }) => {
      const displayInfo = PromotionEngine.getPromotionDisplayInfo(promotion, discountAmount);
      
      return {
        _id: promotion._id,
        name: promotion.name,
        type: promotion.type,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        discountAmount,
        finalAmount,
        discountPercentage,
        savings: displayInfo.savings,
        displaySettings: {
          title: displayInfo.title,
          subtitle: displayInfo.description,
          badgeText: displayInfo.badge,
          urgencyMessage: displayInfo.urgency,
          highlightColor: promotion.displaySettings?.highlightColor || '#ef4444'
        },
        conditions: {
          validFrom: promotion.conditions.validFrom,
          validTo: promotion.conditions.validTo,
          minStayNights: promotion.conditions.minStayNights,
          minBookingAmount: promotion.conditions.minBookingAmount,
          advanceBookingDays: promotion.conditions.advanceBookingDays
        },
        couponCode: promotion.couponCode
      };
    });

    // Calculate potential savings summary
    const totalPotentialSavings = applicablePromotions.reduce((sum, promo) => sum + promo.discountAmount, 0);
    const bestPromotion = applicablePromotions[0];

    return NextResponse.json({
      success: true,
      promotions: formattedPromotions,
      summary: {
        count: formattedPromotions.length,
        totalPotentialSavings,
        bestSavings: bestPromotion ? bestPromotion.discountAmount : 0,
        originalAmount: bookingDetails.totalAmount,
        bestFinalAmount: bestPromotion ? bestPromotion.finalAmount : bookingDetails.totalAmount
      },
      bookingDetails: {
        propertyId,
        checkInDate: bookingDetails.checkInDate.toISOString(),
        checkOutDate: bookingDetails.checkOutDate.toISOString(),
        guests: bookingDetails.guests,
        rooms: bookingDetails.rooms,
        totalAmount: bookingDetails.totalAmount,
        nights: Math.ceil((bookingDetails.checkOutDate.getTime() - bookingDetails.checkInDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    });

  } catch (error) {
    console.error('Error finding applicable promotions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to find applicable promotions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// POST: Apply a specific promotion to a booking
export async function POST(req: NextRequest) {
  await dbConnect();

  try {
    const body = await req.json();
    
    // Validate required fields
    const { promotionId, bookingDetails } = body;
    
    if (!promotionId || !bookingDetails) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: promotionId, bookingDetails' 
        },
        { status: 400 }
      );
    }

    // Convert dates
    const bookingData = {
      ...bookingDetails,
      checkInDate: new Date(bookingDetails.checkInDate),
      checkOutDate: new Date(bookingDetails.checkOutDate),
      bookingDate: new Date()
    };

    // Find and validate the specific promotion
    const applicablePromotions = await PromotionEngine.findApplicablePromotions(bookingData);
    const selectedPromotion = applicablePromotions.find(p => p.promotion._id.toString() === promotionId);

    if (!selectedPromotion) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Promotion is not applicable to this booking or has expired' 
        },
        { status: 400 }
      );
    }

    // Apply the promotion (this would typically be done during actual booking creation)
    const applied = await PromotionEngine.applyPromotionToBooking(
      promotionId,
      bookingData,
      selectedPromotion.discountAmount
    );

    if (!applied) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to apply promotion' 
        },
        { status: 500 }
      );
    }

    // Return applied promotion details
    return NextResponse.json({
      success: true,
      message: 'Promotion applied successfully',
      appliedPromotion: {
        promotionId,
        discountAmount: selectedPromotion.discountAmount,
        finalAmount: selectedPromotion.finalAmount,
        discountPercentage: selectedPromotion.discountPercentage,
        promotionName: selectedPromotion.promotion.name,
        displayTitle: selectedPromotion.promotion.displaySettings?.title
      }
    });

  } catch (error) {
    console.error('Error applying promotion:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to apply promotion',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 