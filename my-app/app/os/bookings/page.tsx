import { requireOwnerAuth } from '@/lib/auth/os-auth';
import EnhancedBookingsView from '@/components/os/EnhancedBookingsView';

async function getOwnerBookings() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = new URL(`${baseUrl}/api/os/bookings`);

    url.searchParams.set('limit', '1000'); // Get all bookings for client-side filtering

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch bookings:', response.statusText);
      return { bookings: [], stats: null };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return { bookings: [], stats: null };
  }
}

export default async function OwnerBookingsPage() {
  await requireOwnerAuth();
  const { bookings, stats } = await getOwnerBookings();

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
