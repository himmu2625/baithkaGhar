import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import Property from '@/models/Property';
import { auth } from '@/lib/auth';
import { formatPropertyType } from '@/lib/utils';

export const dynamic = 'force-dynamic';

// GET /api/fix-property-types - Update property types in the database
export async function GET(req: NextRequest) {
  try {
    // Check for admin authentication
    const session = await auth();
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    await connectMongo();
    
    // Get all properties
    const properties = await Property.find({});
    const updateResults = [];
    
    // Track counts
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // For each property, fix the property type capitalization
    for (const property of properties) {
      try {
        const originalType = property.propertyType;
        
        // Skip if property type is not set
        if (!originalType) {
          skippedCount++;
          updateResults.push({
            id: String((property as any)._id),
            title: property.title || property.name || 'Unnamed Property',
            originalType: originalType || 'N/A',
            newType: 'N/A',
            status: 'skipped',
            reason: 'No property type set'
          });
          continue;
        }
        
        // Format the property type correctly
        const formattedType = formatPropertyType(originalType);
        
        // Skip if already formatted correctly
        if (originalType === formattedType) {
          skippedCount++;
          updateResults.push({
            id: String((property as any)._id),
            title: property.title || property.name || 'Unnamed Property',
            originalType,
            newType: formattedType,
            status: 'skipped',
            reason: 'Already correctly formatted'
          });
          continue;
        }
        
        // Update the property type
        property.propertyType = formattedType;
        await property.save();
        
        updatedCount++;
        updateResults.push({
          id: String((property as any)._id),
          title: property.title || property.name || 'Unnamed Property',
          originalType,
          newType: formattedType,
          status: 'updated',
          reason: 'Capitalization fixed'
        });
      } catch (error) {
        console.error(`Error updating property type for property ${property._id}:`, error);
        errorCount++;
        updateResults.push({
          id: String((property as any)._id),
          title: property.title || property.name || 'Unnamed Property',
          originalType: property.propertyType || 'N/A',
          newType: 'Error',
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed property types: ${updatedCount} updated, ${skippedCount} skipped, ${errorCount} failed`,
      stats: { total: properties.length, updated: updatedCount, skipped: skippedCount, error: errorCount },
      results: updateResults
    });
  } catch (error) {
    console.error('Error fixing property types:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix property types', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 