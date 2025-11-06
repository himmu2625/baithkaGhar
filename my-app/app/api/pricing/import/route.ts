import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PropertyPricing from '@/models/PropertyPricing';
import { connectToDatabase } from '@/lib/mongodb';
import { ExcelPricingParser, ParsedPricingRow } from '@/lib/excel-parser';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const propertyId = formData.get('propertyId') as string;
    const replaceExisting = formData.get('replaceExisting') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel file
    const parser = new ExcelPricingParser();
    const parseResult = await parser.parseExcelFile(buffer);

    if (!parseResult.success) {
      return NextResponse.json({
        error: 'Failed to parse Excel file',
        details: parseResult.errors,
        summary: parseResult.summary
      }, { status: 400 });
    }

    // Process and save pricing data
    const importResult = await processPricingImport(
      parseResult.data,
      propertyId,
      replaceExisting,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: 'Pricing data imported successfully',
      summary: parseResult.summary,
      importResult: importResult,
      previewData: parseResult.data.slice(0, 5) // First 5 rows for preview
    });

  } catch (error) {
    console.error('Pricing import error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

async function processPricingImport(
  data: ParsedPricingRow[],
  propertyId: string,
  replaceExisting: boolean,
  userId: string
) {
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    conflicts: [] as string[],
    rolledBack: false
  };

  // Start a MongoDB session for transaction support
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Validate all data first before any writes
    const validationErrors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Additional validation for price range
      if (row.price <= 0 || row.price > 1000000) {
        validationErrors.push(`Row ${i + 2}: Price ${row.price} is out of valid range (0 - 1,000,000)`);
      }

      // Validate dates
      const startDate = new Date(row.startDate);
      const endDate = new Date(row.endDate);
      if (startDate >= endDate) {
        validationErrors.push(`Row ${i + 2}: Start date must be before end date`);
      }
    }

    // If there are validation errors, abort before any database operations
    if (validationErrors.length > 0) {
      await session.abortTransaction();
      return {
        ...results,
        errors: validationErrors.length,
        conflicts: validationErrors,
        rolledBack: true
      };
    }

    // If replacing existing, delete current pricing data
    if (replaceExisting) {
      await PropertyPricing.deleteMany({ propertyId }, { session });
    }

    for (const row of data) {
      const pricingData = {
        propertyId,
        roomCategory: row.roomCategory,
        planType: row.planType,
        occupancyType: row.occupancyType,
        pricingType: (row as any).pricingType || 'PLAN_BASED', // Default to PLAN_BASED
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        price: row.price,
        currency: 'INR',
        seasonType: row.seasonType,
        reason: (row as any).reason,
        isActive: true,
        isAvailable: true
      };

      // Check for conflicts (overlapping date ranges for same room/plan/occupancy)
      const conflictingPricing = await PropertyPricing.findOne({
        propertyId,
        roomCategory: row.roomCategory,
        planType: row.planType,
        occupancyType: row.occupancyType,
        $or: [
          {
            startDate: { $lte: pricingData.endDate },
            endDate: { $gte: pricingData.startDate }
          }
        ]
      }).session(session);

      if (conflictingPricing && !replaceExisting) {
        results.conflicts.push(
          `Conflict for ${row.roomCategory} ${row.planType} ${row.occupancyType} from ${row.startDate} to ${row.endDate}`
        );
        // Abort transaction on conflict
        await session.abortTransaction();
        results.rolledBack = true;
        results.errors = results.conflicts.length;
        return results;
      }

      // Create or update pricing
      if (replaceExisting || !conflictingPricing) {
        await PropertyPricing.create([pricingData], { session });
        results.created++;
      } else {
        await PropertyPricing.findByIdAndUpdate(conflictingPricing._id, pricingData, { session });
        results.updated++;
      }
    }

    // Commit the transaction - all or nothing
    await session.commitTransaction();
    console.log(`✅ Successfully imported ${results.created} pricing records for property ${propertyId}`);

  } catch (error) {
    // Rollback on any error
    await session.abortTransaction();
    console.error('❌ Error during pricing import, rolling back:', error);
    results.errors++;
    results.rolledBack = true;
    results.conflicts.push(`Transaction failed: ${error.message}`);
  } finally {
    session.endSession();
  }

  return results;
}

// GET endpoint to download template
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Excel template with sample data
    const templateData = [
      ['ROOM CATEGORY', 'PLAN TYPE', 'OCCUPANCY TYPE', 'PRICING TYPE', 'START DATE', 'END DATE', 'PRICE', 'SEASON TYPE', 'REASON'],
      ['deluxe', 'EP', 'SINGLE', 'PLAN_BASED', '2025-01-01', '2025-12-31', '5000', 'Regular', ''],
      ['deluxe', 'CP', 'DOUBLE', 'PLAN_BASED', '2025-01-01', '2025-12-31', '6000', 'Regular', ''],
      ['deluxe', 'EP', 'DOUBLE', 'DIRECT', '2025-12-25', '2026-01-05', '10000', 'Peak', 'Holiday Special'],
    ];

    return NextResponse.json({
      template: templateData,
      instructions: {
        required_headers: ['ROOM CATEGORY', 'PLAN TYPE', 'OCCUPANCY TYPE', 'PRICING TYPE', 'START DATE', 'END DATE', 'PRICE'],
        plan_types: ['EP', 'CP', 'MAP', 'AP'],
        occupancy_types: ['SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'],
        pricing_types: ['PLAN_BASED', 'DIRECT', 'BASE'],
        date_format: 'YYYY-MM-DD or MM/DD/YYYY',
        notes: [
          'All required fields must be filled',
          'Room Category should match property unit codes (e.g., deluxe, suite)',
          'Pricing Type: PLAN_BASED (default), DIRECT (date overrides), BASE (fallback)',
          'Dates should not overlap for the same room/plan/occupancy/pricing-type combination',
          'Prices should be numeric values only',
          'Season Type and Reason are optional'
        ]
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}