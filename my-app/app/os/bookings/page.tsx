import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import EnhancedBookingsView from '@/components/os/EnhancedBookingsView';
import { dbConnect } from '@/lib/db';
import Booking from '@/models/Booking';

async function getOwnerBookings(userId: string) {
  try {
    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(userId);
    console.log('[Bookings] User ID:', userId, 'Property IDs:', propertyIds);

    // Build query
    const query: any = {
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds }
    };

    // Fetch bookings (limit to 1000 for client-side filtering)
    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .populate('propertyId', 'title location address')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    // Get total count
    const totalCount = await Booking.countDocuments(query);

    // Calculate statistics
    const stats = {
      total: totalCount,
      confirmed: await Booking.countDocuments({ ...query, status: 'confirmed' }),
      pending: await Booking.countDocuments({ ...query, status: 'pending' }),
      completed: await Booking.countDocuments({ ...query, status: 'completed' }),
      cancelled: await Booking.countDocuments({ ...query, status: 'cancelled' }),
    };

    // Serialize data to convert MongoDB ObjectIds to strings
    return JSON.parse(JSON.stringify({
      bookings,
      stats
    }));

  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], stats: null };
  }
}

export default async function OwnerBookingsPage() {
  const session = await requireOwnerAuth();
  const { bookings, stats } = await getOwnerBookings(session.user!.id!);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-600 mt-1">
          {stats?.total || 0} total bookings
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Confirmed</p>
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
        </div>
      )}

      {/* Enhanced Bookings View with Search, Filters, Bulk Actions, and Pagination */}
      <EnhancedBookingsView bookings={bookings} stats={stats} />
    </div>
  );
}
