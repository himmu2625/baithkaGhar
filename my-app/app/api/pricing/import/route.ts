import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import PropertyPricing from '@/models/PropertyPricing';
import { connectToDatabase } from '@/lib/mongodb';
import { ExcelPricingParser, ParsedPricingRow } from '@/lib/excel-parser';

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
    conflicts: [] as string[]
  };

  // If replacing existing, delete current pricing data
  if (replaceExisting) {
    await PropertyPricing.deleteMany({ propertyId });
  }

  for (const row of data) {
    try {
      const pricingData = {
        propertyId,
        roomCategory: row.roomCategory,
        planType: row.planType,
        occupancyType: row.occupancyType,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        price: row.price,
        currency: 'INR',
        seasonType: row.seasonType,
        isActive: true
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
      });

      if (conflictingPricing && !replaceExisting) {
        results.conflicts.push(
          `Conflict for ${row.roomCategory} ${row.planType} ${row.occupancyType} from ${row.startDate} to ${row.endDate}`
        );
        continue;
      }

      // Create or update pricing
      if (replaceExisting || !conflictingPricing) {
        await PropertyPricing.create(pricingData);
        results.created++;
      } else {
        await PropertyPricing.findByIdAndUpdate(conflictingPricing._id, pricingData);
        results.updated++;
      }

    } catch (error) {
      console.error('Error processing row:', row, error);
      results.errors++;
    }
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
      ['PROPERTY', 'ROOM CATEGORY', 'PLAN TYPE', 'OCCUPANCY TYPE', 'START DATE', 'END DATE', 'PRICE', 'SEASON TYPE'],
      ['Sample Property', 'DELUXE ROOM', 'EP', 'SINGLE SHARING', '2025-10-01', '2025-10-31', '5000', 'Regular'],
      ['Sample Property', 'DELUXE ROOM', 'CP', 'DOUBLE SHARING', '2025-10-01', '2025-10-31', '3500', 'Regular'],
      ['Sample Property', 'FAMILY ROOM', 'MAP', 'TRIPLE SHARING', '2025-11-01', '2025-11-30', '4200', 'Peak'],
    ];

    return NextResponse.json({
      template: templateData,
      instructions: {
        required_headers: ['PROPERTY', 'ROOM CATEGORY', 'PLAN TYPE', 'OCCUPANCY TYPE', 'START DATE', 'END DATE', 'PRICE'],
        plan_types: ['EP', 'CP', 'MAP', 'AP'],
        occupancy_types: ['SINGLE SHARING', 'DOUBLE SHARING', 'TRIPLE SHARING', 'QUAD SHARING'],
        date_format: 'YYYY-MM-DD or MM/DD/YYYY',
        notes: [
          'All required fields must be filled',
          'Dates should not overlap for the same room/plan/occupancy combination',
          'Prices should be numeric values only',
          'Season Type is optional'
        ]
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}