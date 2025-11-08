import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { cityService } from '@/services/cityService';

export const dynamic = 'force-dynamic';

// POST /api/cities/bulk-update - Bulk update city order and visibility (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    console.log('Bulk update - Session:', {
      user: session?.user?.email,
      role: session?.user?.role
    });

    // Check if user is admin
    if (session?.user?.role !== 'admin' && session?.user?.role !== 'super_admin') {
      console.error('Bulk update - Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required' },
        { status: 403 }
      );
    }

    const { updates } = await req.json();

    console.log('Bulk update - Received updates:', updates?.length, 'cities');

    if (!Array.isArray(updates)) {
      console.error('Bulk update - Invalid format, not an array');
      return NextResponse.json(
        { error: 'Invalid request format. Expected array of updates' },
        { status: 400 }
      );
    }

    // Update each city
    const results = [];
    const errors = [];

    for (const update of updates) {
      const { id, ...updateData } = update;
      if (!id) {
        console.warn('Bulk update - Skipping update without ID');
        continue;
      }

      console.log(`Bulk update - Updating city ${id}:`, updateData);

      try {
        const updatedCity = await cityService.updateCity(id, updateData);
        if (updatedCity) {
          results.push(updatedCity);
          console.log(`Bulk update - Successfully updated city ${id}`);
        } else {
          console.warn(`Bulk update - City ${id} not found`);
          errors.push({ id, error: 'City not found' });
        }
      } catch (err: any) {
        console.error(`Bulk update - Error updating city ${id}:`, err);
        errors.push({ id, error: err.message });
      }
    }

    console.log(`Bulk update - Completed: ${results.length} success, ${errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: `Updated ${results.length} of ${updates.length} cities`,
      cities: results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error in POST /api/cities/bulk-update:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk update cities' },
      { status: 500 }
    );
  }
}
