import { requireOwnerAuth, getOwnerPropertyIds } from '@/lib/auth/os-auth';
import { Building2, Calendar, CreditCard, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dbConnect } from '@/lib/db';
import Property from '@/models/Property';
import Booking from '@/models/Booking';

async function getDashboardStats(userId: string) {
  try {
    await dbConnect();

    // Get owner's property IDs
    const propertyIds = await getOwnerPropertyIds(userId);
    console.log('[Dashboard] User ID:', userId, 'Property IDs:', propertyIds);

    // Handle super_admin and admin who can see all properties
    const propertyFilter = propertyIds.includes('*')
      ? {} // No filter - show all properties
      : { _id: { $in: propertyIds } };

    // Calculate statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Total Properties
    const totalProperties = await Property.countDocuments({
      ...propertyFilter,
      status: { $ne: 'deleted' }
    });

    // Active Bookings (confirmed bookings with future check-out dates)
    const activeBookings = await Booking.countDocuments({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds },
      status: { $in: ['confirmed', 'pending'] },
      dateTo: { $gte: now }
    });

    // Pending Hotel Payments (partial payments with hotel payment pending)
    const pendingPaymentsAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
          isPartialPayment: true,
          hotelPaymentStatus: 'pending',
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$hotelPaymentAmount' }
        }
      }
    ]);

    const pendingPayments = pendingPaymentsAgg.length > 0 ? pendingPaymentsAgg[0].total : 0;

    // This Month's Revenue (completed bookings this month)
    const thisMonthRevenueAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
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

    const thisMonthRevenue = thisMonthRevenueAgg.length > 0 ? thisMonthRevenueAgg[0].total : 0;

    // Last Month's Revenue (for comparison)
    const lastMonthRevenueAgg = await Booking.aggregate([
      {
        $match: {
          propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds.map(id => id) },
          status: { $in: ['completed', 'confirmed'] },
          createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);

    const lastMonthRevenue = lastMonthRevenueAgg.length > 0 ? lastMonthRevenueAgg[0].total : 0;

    // Calculate percentage change
    const revenueChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    // Upcoming Check-ins (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const upcomingCheckins = await Booking.countDocuments({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds },
      status: 'confirmed',
      dateFrom: { $gte: now, $lte: sevenDaysFromNow }
    });

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({
      propertyId: propertyIds.includes('*') ? { $exists: true } : { $in: propertyIds }
    })
      .populate('userId', 'name email')
      .populate('propertyId', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id userId propertyId status dateFrom dateTo totalPrice createdAt')
      .lean();

    // Serialize data to convert MongoDB ObjectIds to strings
    return JSON.parse(JSON.stringify({
      totalProperties,
      activeBookings,
      pendingPayments,
      thisMonthRevenue,
      revenueChange: Math.round(revenueChange * 10) / 10, // Round to 1 decimal
      upcomingCheckins,
      recentBookings,
      lastUpdated: new Date().toISOString()
    }));

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}

export default async function OwnerDashboardPage() {
  const session = await requireOwnerAuth();
  const stats = await getDashboardStats(session.user!.id!);

  // Fallback values if stats are not available
  const totalProperties = stats?.totalProperties || 0;
  const activeBookings = stats?.activeBookings || 0;
  const pendingPayments = stats?.pendingPayments || 0;
  const thisMonthRevenue = stats?.thisMonthRevenue || 0;
  const revenueChange = stats?.revenueChange || 0;
  const upcomingCheckins = stats?.upcomingCheckins || 0;
  const recentBookings = stats?.recentBookings || [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session.user?.name || 'Owner'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your properties and bookings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Properties */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalProperties}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Active listings on platform
          </p>
        </div>

        {/* Active Bookings */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Bookings</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{activeBookings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            {upcomingCheckins > 0 ? `${upcomingCheckins} checking in today` : 'Current and upcoming stays'}
          </p>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(pendingPayments)}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            To be collected at property
          </p>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(thisMonthRevenue)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4">
            {revenueChange >= 0 ? (
              <>
                <ArrowUpRight className="w-3 h-3 text-green-600" />
                <p className="text-xs text-green-600">
                  +{revenueChange.toFixed(1)}% from last month
                </p>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-3 h-3 text-red-600" />
                <p className="text-xs text-red-600">
                  {revenueChange.toFixed(1)}% from last month
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      {recentBookings.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              <a
                href="/os/bookings"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View all
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentBookings.slice(0, 5).map((booking: any) => (
              <div key={booking._id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-500' :
                        booking.status === 'pending' ? 'bg-yellow-500' :
                        booking.status === 'cancelled' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.propertyId?.title || 'Unknown Property'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.userId?.name || 'Guest'} • {booking.userId?.email || ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(booking.dateFrom)} - {formatDate(booking.dateTo)}
                      </span>
                      <span className="capitalize">{booking.status}</span>
                      {booking.isPartialPayment && (
                        <span className="text-orange-600 font-medium">Partial Payment</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(booking.totalAmount || 0)}
                    </p>
                    {booking.isPartialPayment && booking.hotelPaymentAmount > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        {formatCurrency(booking.hotelPaymentAmount)} pending
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/os/properties"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <Building2 className="w-6 h-6 text-indigo-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Properties</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your listings</p>
          </a>

          <a
            href="/os/bookings"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <Calendar className="w-6 h-6 text-indigo-600 mb-2" />
            <h3 className="font-medium text-gray-900">View Bookings</h3>
            <p className="text-sm text-gray-500 mt-1">Check reservations</p>
          </a>

          <a
            href="/os/payments"
            className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
          >
            <CreditCard className="w-6 h-6 text-indigo-600 mb-2" />
            <h3 className="font-medium text-gray-900">Collect Payments</h3>
            <p className="text-sm text-gray-500 mt-1">Manage payments</p>
          </a>
        </div>
      </div>

      {/* Phase Progress */}
      {totalProperties === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            🚀 Getting Started
          </h2>
          <p className="text-gray-700 mb-4">
            Welcome to the Baithaka Ghar Owner Portal! Your dashboard is ready to use.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✅ Owner authentication system is working</p>
            <p>✅ Dashboard with real-time data is active</p>
            <p>💡 No properties found - Please contact admin to assign properties to your account</p>
            <p>🔄 Phase 4: Payment collection features (coming soon)</p>
          </div>
        </div>
      )}
    </div>
  );
}
