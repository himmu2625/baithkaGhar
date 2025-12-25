import { NextRequest, NextResponse } from 'next/server';
import { getOwnerSession, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getOwnerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(session.user.id!);

    // Handle super_admin and admin who can see all properties
    const propertyFilter = propertyIds.includes('*')
      ? { status: { $ne: 'deleted' } }
      : { _id: { $in: propertyIds }, status: { $ne: 'deleted' } };

    // Fetch properties
    const properties = await Property.find(propertyFilter)
      .select('title slug location address price images categorizedImages legacyGeneralImages status isPublished rating reviewCount totalHotelRooms propertyType paymentSettings')
      .sort({ createdAt: -1 })
      .lean();

    // Get booking counts for each property
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        const now = new Date();

        // Active bookings
        const activeBookings = await Booking.countDocuments({
          propertyId: property._id,
          status: { $in: ['confirmed', 'pending'] },
          dateTo: { $gte: now }
        });

        // Total bookings
        const totalBookings = await Booking.countDocuments({
          propertyId: property._id
        });

        // This month's revenue
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenueAgg = await Booking.aggregate([
          {
            $match: {
              propertyId: property._id,
              status: { $in: ['completed', 'confirmed'] },
              createdAt: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalPrice' }
            }
          }
        ]);

        const monthlyRevenue = monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

        // Get property image
        let propertyImage = '/images/default-property.jpg';

        if (property.categorizedImages && property.categorizedImages.length > 0) {
          const exteriorImages = property.categorizedImages.find((cat: any) =>
            cat.category === 'exterior' || cat.category === 'general'
          );
          if (exteriorImages && exteriorImages.files && exteriorImages.files.length > 0) {
            propertyImage = exteriorImages.files[0].url;
          }
        } else if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
          propertyImage = property.legacyGeneralImages[0].url;
        } else if (property.images && property.images.length > 0) {
          propertyImage = property.images[0];
        }

        return {
          ...property,
          propertyImage,
          activeBookings,
          totalBookings,
          monthlyRevenue
        };
      })
    );

    return NextResponse.json({
      properties: propertiesWithStats,
      total: propertiesWithStats.length
    });

  } catch (error) {
    console.error('Error fetching properties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    );
  }
}
