import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { Building2, Search, Filter } from 'lucide-react';
import PropertyCard from '@/components/os/PropertyCard';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

async function getOwnerProperties(userId: string) {
  try {
    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(userId);
    console.log('[Properties] User ID:', userId, 'Property IDs:', propertyIds);

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

        // Convert MongoDB ObjectIds to strings for client components
        const serializedProperty = JSON.parse(JSON.stringify({
          ...property,
          propertyImage,
          activeBookings,
          totalBookings,
          monthlyRevenue
        }));

        return serializedProperty;
      })
    );

    return {
      properties: propertiesWithStats,
      total: propertiesWithStats.length
    };

  } catch (error) {
    console.error('Error fetching properties:', error);
    return { properties: [], total: 0 };
  }
}

export default async function OwnerPropertiesPage() {
  const session = await requireOwnerAuth(); // Ensure user is authenticated
  const { properties, total } = await getOwnerProperties(session.user!.id!);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
          <p className="text-sm text-gray-600 mt-1">
            {total} {total === 1 ? 'property' : 'properties'} found
          </p>
        </div>
        <a
          href="/admin/properties/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Add Property
        </a>
      </div>

      {/* Search and Filters - Placeholder for future enhancement */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search properties..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled
            />
          </div>
          <button
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            disabled
          >
            <Filter className="w-5 h-5" />
            Filters
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Search and filter features coming soon
        </p>
      </div>

      {/* Properties Grid */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <PropertyCard key={property._id} property={property} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
          <p className="text-gray-600 mb-6">
            You don't have any properties assigned to your account yet.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the administrator to assign properties to your account.
          </p>
        </div>
      )}
    </div>
  );
}
