import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Property from '@/models/Property';

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
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
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

// PUT: Update dynamicPricing for a property
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const { id } = params;
  try {
    const body = await req.json();
    const { dynamicPricing } = body;
    if (!dynamicPricing) {
      return NextResponse.json({ error: 'Missing dynamicPricing data' }, { status: 400 });
    }

    // Validate enhanced features
    const validateEnhancedPricing = (pricing: any) => {
      // Validate direct pricing
      if (pricing.directPricing?.enabled && pricing.directPricing?.customPrices) {
        for (const customPrice of pricing.directPricing.customPrices) {
          if (!customPrice.startDate || !customPrice.endDate || !customPrice.price) {
            throw new Error('Invalid custom price data');
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
      
      return true;
    };

    validateEnhancedPricing(dynamicPricing);

    const property = await Property.findByIdAndUpdate(
      id,
      { dynamicPricing },
      { new: true, runValidators: true }
    );

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Dynamic pricing updated successfully',
      dynamicPricing: property.dynamicPricing 
    });
  } catch (error) {
    console.error('Error updating dynamic pricing:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 