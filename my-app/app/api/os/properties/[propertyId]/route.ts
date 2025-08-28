import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    await dbConnect();
    
    const property = await Property.findById(params.propertyId).lean();
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Transform property data to include mock room types and rate plans
    // In a real scenario, these would come from your actual property management system
    const transformedProperty = {
      id: property._id.toString(),
      title: property.title,
      name: property.name,
      ownerEmail: property.ownerEmail || property.email,
      roomTypes: property.propertyUnits?.map((unit: any, index: number) => ({
        id: unit.unitTypeCode || `room-${index}`,
        name: unit.unitTypeName || `Room Type ${index + 1}`,
        code: unit.unitTypeCode || `RT${index + 1}`
      })) || [
        { id: 'deluxe', name: 'Deluxe Room', code: 'DLX' },
        { id: 'suite', name: 'Suite', code: 'STE' }
      ],
      ratePlans: [
        { id: 'standard', name: 'Standard Rate', code: 'STD' },
        { id: 'advance', name: 'Advance Purchase', code: 'ADV' }
      ]
    };

    return NextResponse.json(transformedProperty);
  } catch (error) {
    console.error('Error fetching property:', error);
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    );
  }
}