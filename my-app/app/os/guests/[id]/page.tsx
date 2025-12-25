import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

async function getGuestDetails(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/guests/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch guest:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching guest:', error);
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
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default async function GuestDetailPage({ params }: { params: { id: string } }) {
  await requireOwnerAuth();
  const data = await getGuestDetails(params.id);

  if (!data || !data.success) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Guest Not Found</h3>
          <p className="text-gray-600 mb-6">
            The guest you're looking for doesn't exist or you don't have access to their information.
          </p>
          <Link
            href="/os/guests"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Guests
          </Link>
        </div>
      </div>
    );
  }

  const { guest, stats, bookings, specialRequests } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/os/guests"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to Guests
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Guest Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Guest Info & Stats */}
        <div className="space-y-6">
          {/* Guest Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-indigo-600" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 text-center mb-4">
              {guest.name}
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700 break-all">{guest.email}</span>
              </div>

              {guest.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{guest.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm pt-3 border-t border-gray-200">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-gray-700">{formatDate(guest.joinedDate)}</p>
                </div>
              </div>

              {guest.firstVisit && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">First Visit</p>
                    <p className="text-gray-700">{formatDate(guest.firstVisit)}</p>
                  </div>
                </div>
              )}

              {guest.lastVisit && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Last Visit</p>
                    <p className="text-gray-700">{formatDate(guest.lastVisit)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Bookings</span>
                <span className="font-semibold text-gray-900">{stats.totalBookings}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="font-semibold text-green-600">{stats.completedBookings}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Cancelled</span>
                <span className="font-semibold text-red-600">{stats.cancelledBookings}</span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <span className="text-sm text-gray-600">Total Spent</span>
                <span className="font-semibold text-indigo-600">
                  {formatCurrency(stats.totalSpent)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Stay Duration</span>
                <span className="font-semibold text-gray-900">{stats.avgStayDuration} nights</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Properties Visited</span>
                <span className="font-semibold text-gray-900">{stats.propertiesVisited}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Booking Frequency</span>
                <span className="font-semibold text-gray-900">
                  {stats.bookingFrequency}/month
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {stats.paymentMethodDistribution && Object.keys(stats.paymentMethodDistribution).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </h3>
              <div className="space-y-2">
                {Object.entries(stats.paymentMethodDistribution).map(([method, count]: [string, any]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">{method}</span>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Booking History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue by Year */}
          {stats.revenueByYear && Object.keys(stats.revenueByYear).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Revenue by Year
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.revenueByYear)
                  .sort(([a], [b]) => parseInt(b) - parseInt(a))
                  .map(([year, revenue]: [string, any]) => (
                    <div key={year} className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">{year}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(revenue)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Booking History */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Booking History</h2>
              <p className="text-sm text-gray-600 mt-1">
                All bookings from this guest
              </p>
            </div>

            {bookings.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {bookings.map((booking: any) => (
                  <Link
                    key={booking._id}
                    href={`/os/bookings/${booking._id}`}
                    className="block p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {booking.propertyImage && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image
                            src={booking.propertyImage}
                            alt={booking.propertyTitle}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              {booking.propertyTitle}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(booking.dateFrom)} - {formatDate(booking.dateTo)}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(booking.totalAmount)}
                            </p>
                            <span
                              className={`inline-block mt-1 px-2 py-1 rounded text-xs font-medium ${
                                booking.status === 'confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : booking.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : booking.status === 'completed'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        </div>

                        {booking.isPartialPayment && (
                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                            <span className="text-orange-600 font-medium">Partial Payment</span>
                            {booking.hotelPaymentStatus === 'pending' && (
                              <span>Hotel payment pending</span>
                            )}
                            {booking.hotelPaymentStatus === 'collected' && (
                              <span className="text-green-600">Hotel payment collected</span>
                            )}
                          </div>
                        )}

                        {booking.specialRequests && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                            <span className="font-medium">Special Request:</span> {booking.specialRequests}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No bookings found</p>
              </div>
            )}
          </div>

          {/* Recent Special Requests */}
          {specialRequests && specialRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Special Requests</h2>
              <div className="space-y-3">
                {specialRequests.map((request: string, index: number) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {request}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
