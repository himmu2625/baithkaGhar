import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import City from '@/models/city';

export const dynamic = 'force-dynamic';

// GET /api/cities/visible/debug - Debug visible cities filtering
export async function GET() {
  try {
    await connectToDatabase();

    // Get all cities
    const allCities = await City.find({}).sort({ displayOrder: 1, name: 1 }).lean();

    // Get cities with isVisible: true
    const visibleTrue = await City.find({ isVisible: true }).sort({ displayOrder: 1, name: 1 }).lean();

    // Get cities with isVisible: false
    const visibleFalse = await City.find({ isVisible: false }).sort({ displayOrder: 1, name: 1 }).lean();

    // Get cities where isVisible doesn't exist
    const visibleUndefined = await City.find({ isVisible: { $exists: false } }).sort({ displayOrder: 1, name: 1 }).lean();

    const analysis = {
      total: allCities.length,
      counts: {
        visibleTrue: visibleTrue.length,
        visibleFalse: visibleFalse.length,
        visibleUndefined: visibleUndefined.length,
      },
      allCities: allCities.map((c: any) => ({
        name: c.name,
        isVisible: c.isVisible,
        displayOrder: c.displayOrder,
        hasIsVisibleField: c.hasOwnProperty('isVisible'),
      })),
      visibleTrueCities: visibleTrue.map((c: any) => c.name),
      visibleFalseCities: visibleFalse.map((c: any) => c.name),
      visibleUndefinedCities: visibleUndefined.map((c: any) => c.name),
    };

    return NextResponse.json(analysis);
  } catch (error: any) {
    console.error('Error in visible debug:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to debug visible cities' },
      { status: 500 }
    );
  }
}
