import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Property from '@/models/Property';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Define interface for room category
interface RoomCategory {
  id: string;
  name: string;
  description: string;
  price: number;
  count: number;
  maxGuests: number;
}

// GET: Fetch dynamicPricing for a property
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;
  try {
    const property = await Property.findById(id).select('dynamicPricing price propertyUnits');
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    
    // Process room categories from propertyUnits
    let roomCategories: RoomCategory[] = [];
    if (property.propertyUnits && Array.isArray(property.propertyUnits) && property.propertyUnits.length > 0) {
      roomCategories = property.propertyUnits.map((unit: any) => ({
        id: unit.unitTypeCode || `unit-${Math.random().toString(36).substr(2, 9)}`,
        name: unit.unitTypeName || "Standard Room",
        description: `${unit.unitTypeName} with ${unit.count} available rooms`,
        price: parseFloat(unit.pricing?.price) || property.price?.base || 0,
        count: unit.count || 1,
        maxGuests: 3 // Default, could be made configurable
      }));
    }
    
    return NextResponse.json({ 
      dynamicPricing: property.dynamicPricing || null,
      basePrice: property.dynamicPricing?.basePrice || property.price?.base || 0,
      currency: 'INR', // Default currency
      roomCategories: roomCategories
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error', details: error }, { status: 500 });
  }
}

// PUT: Update dynamicPricing for a property with transaction support and backup
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbConnect();
  const { id } = await params;

  // Get user session for audit trail
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id || 'system';
  const userName = (session?.user as any)?.name || 'System';

  // Start a MongoDB session for transaction support
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const body = await req.json();
    const { dynamicPricing } = body;
    if (!dynamicPricing) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: 'Missing dynamicPricing data' }, { status: 400 });
    }

    // 🔥 STEP 1: Validate enhanced features
    const validateEnhancedPricing = (pricing: any) => {
      // Validate direct pricing
      if (pricing.directPricing?.enabled && pricing.directPricing?.customPrices) {
        for (const customPrice of pricing.directPricing.customPrices) {
          if (!customPrice.startDate || !customPrice.endDate || !customPrice.price) {
            throw new Error('Invalid custom price data');
          }

          // Additional validation
          if (customPrice.price <= 0 || customPrice.price > 1000000) {
            throw new Error(`Price ${customPrice.price} is out of valid range (0 - 1,000,000)`);
          }

          const start = new Date(customPrice.startDate);
          const end = new Date(customPrice.endDate);
          if (start >= end) {
            throw new Error('Start date must be before end date');
          }
        }
      }

      // Validate availability control and blocked dates
      if (pricing.availabilityControl?.enabled && pricing.availabilityControl?.blockedDates) {
        for (const blockedDate of pricing.availabilityControl.blockedDates) {
          if (!blockedDate.startDate || !blockedDate.endDate || !blockedDate.reason) {
            throw new Error('Invalid blocked date data');
          }

          // Validate date format
          if (isNaN(Date.parse(blockedDate.startDate)) || isNaN(Date.parse(blockedDate.endDate))) {
            throw new Error('Invalid date format in blocked dates');
          }

          // Validate that end date is not before start date
          if (new Date(blockedDate.endDate) < new Date(blockedDate.startDate)) {
            throw new Error('End date cannot be before start date for blocked dates');
          }
        }
      }

      // Validate base price
      if (pricing.basePrice !== undefined) {
        if (pricing.basePrice <= 0 || pricing.basePrice > 1000000) {
          throw new Error(`Base price ${pricing.basePrice} is out of valid range (0 - 1,000,000)`);
        }
      }

      // Validate tax rates
      if (pricing.taxes) {
        const { gst, serviceFee } = pricing.taxes;
        if (gst !== undefined && (gst < 0 || gst > 1)) {
          throw new Error('GST rate must be between 0 and 1 (0% to 100%)');
        }
        if (serviceFee !== undefined && (serviceFee < 0 || serviceFee > 1)) {
          throw new Error('Service fee rate must be between 0 and 1 (0% to 100%)');
        }
      }

      return true;
    };

    validateEnhancedPricing(dynamicPricing);

    // 🔥 STEP 2: Update property with transaction
    const property = await Property.findByIdAndUpdate(
      id,
      { dynamicPricing },
      { new: true, runValidators: true, session: mongoSession }
    );

    if (!property) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // 🔥 STEP 3: Commit transaction
    await mongoSession.commitTransaction();
    console.log(`✅ Successfully committed pricing changes for property ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Dynamic pricing updated successfully',
      dynamicPricing: property.dynamicPricing
    });

  } catch (error) {
    // Rollback transaction on any error
    await mongoSession.abortTransaction();
    console.error('❌ Error updating dynamic pricing (rolled back):', error);
    return NextResponse.json({
      error: 'Server error - all changes rolled back',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    mongoSession.endSession();
  }
} 