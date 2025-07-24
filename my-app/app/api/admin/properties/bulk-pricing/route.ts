import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Property from '@/models/Property';

interface BulkPriceUpdate {
  propertyIds: string[];
  dateRanges: Array<{
    startDate: string;
    endDate: string;
    price?: number;
    multiplier?: number;
    reason: 'bulk_update' | 'seasonal' | 'event' | 'promotion';
  }>;
  updateType: 'direct_price' | 'multiplier' | 'base_price';
  basePrice?: number;
}

interface BulkUpdateResult {
  success: boolean;
  updatedProperties: number;
  updatedDateRanges: number;
  errors: Array<{
    propertyId: string;
    error: string;
  }>;
}

// POST: Bulk update prices for multiple properties
export async function POST(req: NextRequest) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body: BulkPriceUpdate = await req.json();
    const { propertyIds, dateRanges, updateType, basePrice } = body;

    if (!propertyIds || propertyIds.length === 0) {
      return NextResponse.json({ error: 'Property IDs are required' }, { status: 400 });
    }

    const result: BulkUpdateResult = {
      success: false,
      updatedProperties: 0,
      updatedDateRanges: 0,
      errors: []
    };

    // Process each property
    for (const propertyId of propertyIds) {
      try {
        const property = await Property.findById(propertyId);
        if (!property) {
          result.errors.push({
            propertyId,
            error: 'Property not found'
          });
          continue;
        }

        let updated = false;

        // Update base price if specified
        if (updateType === 'base_price' && basePrice) {
          if (typeof property.price === 'object' && property.price !== null) {
            property.price.base = basePrice;
          } else {
            property.price = { base: basePrice };
          }
          updated = true;
        }

        // Update date ranges
        if (dateRanges && dateRanges.length > 0) {
          // Initialize dynamic pricing if not exists
          if (!property.dynamicPricing) {
            property.dynamicPricing = {
              enabled: false, // Admin must explicitly enable
              basePrice: typeof property.price === 'object' ? property.price.base || 0 : (typeof property.price === 'number' ? property.price : 0),
              minPrice: 0,
              maxPrice: 0,
              // No default pricing rules - admin must configure these explicitly
              directPricing: {
                enabled: false,
                customPrices: []
              }
            };
          }
          // Type guard to ensure dynamicPricing is always defined
          if (!property.dynamicPricing) {
            throw new Error('property.dynamicPricing is undefined after initialization');
          }

          if (!property.dynamicPricing!.directPricing) {
            property.dynamicPricing!.directPricing = {
              enabled: true,
              customPrices: []
            };
          }

          if (!property.dynamicPricing!.directPricing.customPrices) {
            property.dynamicPricing!.directPricing.customPrices = [];
          }

          // Add or update custom prices for each date range
          for (const dateRange of dateRanges) {
            let priceToSet = 0;

            if (updateType === 'direct_price' && dateRange.price) {
              priceToSet = dateRange.price;
            } else if (updateType === 'multiplier' && dateRange.multiplier) {
              const currentBasePrice = typeof property.price === 'object' 
                ? property.price.base || 0 
                : property.price || 0;
              priceToSet = Math.round(currentBasePrice * dateRange.multiplier);
            }

            if (priceToSet > 0) {
              // Check if a custom price already exists for this date range
              const existingIndex = property.dynamicPricing!.directPricing.customPrices.findIndex(
                (cp: any) => cp.startDate === dateRange.startDate && cp.endDate === dateRange.endDate
              );

              if (existingIndex !== -1) {
                // Update existing custom price
                property.dynamicPricing!.directPricing.customPrices[existingIndex].price = priceToSet;
                property.dynamicPricing!.directPricing.customPrices[existingIndex].reason = dateRange.reason;
                property.dynamicPricing!.directPricing.customPrices[existingIndex].isActive = true;
              } else {
                // Add new custom price
                property.dynamicPricing!.directPricing.customPrices.push({
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  price: priceToSet,
                  reason: dateRange.reason,
                  isActive: true
                });
              }

              result.updatedDateRanges++;
              updated = true;
            }
          }
        }

        if (updated) {
          await property.save();
          result.updatedProperties++;
        }

      } catch (error) {
        console.error(`Error updating property ${propertyId}:`, error);
        result.errors.push({
          propertyId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    result.success = result.updatedProperties > 0;

    return NextResponse.json(result);

  } catch (error) {
    console.error('Bulk pricing update error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET: Get bulk pricing preview (calculate what would be updated)
export async function GET(req: NextRequest) {
  await connectMongo();

  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const propertyIds = searchParams.get('propertyIds')?.split(',') || [];
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const multiplier = parseFloat(searchParams.get('multiplier') || '1');
    const directPrice = parseFloat(searchParams.get('directPrice') || '0');

    if (propertyIds.length === 0) {
      return NextResponse.json({ error: 'Property IDs are required' }, { status: 400 });
    }

    const preview = [];

    for (const propertyId of propertyIds) {
      try {
        const property = await Property.findById(propertyId).select('title price dynamicPricing');
        if (!property) continue;

        const currentBasePrice = typeof property.price === 'object' 
          ? property.price.base || 0 
          : property.price || 0;

        let newPrice = directPrice || Math.round(currentBasePrice * multiplier);

        preview.push({
          propertyId,
          propertyTitle: property.title,
          currentPrice: currentBasePrice,
          newPrice,
          priceChange: newPrice - currentBasePrice,
          percentageChange: currentBasePrice > 0 ? ((newPrice - currentBasePrice) / currentBasePrice * 100) : 0
        });

      } catch (error) {
        console.error(`Error previewing property ${propertyId}:`, error);
      }
    }

    return NextResponse.json({ preview });

  } catch (error) {
    console.error('Bulk pricing preview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 