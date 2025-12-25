import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  CreditCard,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  Calendar,
  User,
  MapPin,
  Banknote
} from 'lucide-react';
import Link from 'next/link';

async function getPendingPayments() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/payments/pending`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch pending payments:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching pending payments:', error);
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
    year: 'numeric',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export default async function OwnerPaymentsPage() {
  await requireOwnerAuth();
  const data = await getPendingPayments();

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment Collection</h1>
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { pendingPayments, stats, recentlyCollected } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Collection</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and track partial payment collections
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Pending</p>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.totalPending)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.totalPendingCount} {stats.totalPendingCount === 1 ? 'booking' : 'bookings'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Due Today</p>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.dueToday}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatCurrency(stats.dueTodayAmount)} to collect
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Due This Week</p>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.dueThisWeek}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatCurrency(stats.dueThisWeekAmount)} pending
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Collected This Month</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(stats.thisMonthCollected)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Total collected amount
          </p>
        </div>
      </div>

      {/* Pending Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Payments</h2>
          <p className="text-sm text-gray-600 mt-1">
            Payments awaiting collection at property
          </p>
        </div>

        {pendingPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest & Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check-in Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingPayments.map((payment: any) => (
                  <tr key={payment.bookingId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-gray-400" />
                          <p className="font-medium text-gray-900">{payment.guestName}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin className="w-3 h-3" />
                          {payment.propertyTitle}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(payment.checkInDate)}
                      </div>
                      {payment.daysUntilCheckIn >= 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {payment.daysUntilCheckIn === 0
                            ? 'Today'
                            : payment.daysUntilCheckIn === 1
                            ? 'Tomorrow'
                            : `In ${payment.daysUntilCheckIn} days`}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(payment.amountPending)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        of {formatCurrency(payment.totalAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          payment.daysUntilCheckIn === 0
                            ? 'bg-red-100 text-red-700'
                            : payment.daysUntilCheckIn <= 3
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {payment.daysUntilCheckIn === 0 ? (
                          <>
                            <AlertCircle className="w-3 h-3" />
                            Due Today
                          </>
                        ) : payment.daysUntilCheckIn <= 3 ? (
                          <>
                            <Clock className="w-3 h-3" />
                            Due Soon
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" />
                            Upcoming
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/os/bookings/${payment.bookingId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        View & Collect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-gray-600">There are no pending payments to collect.</p>
          </div>
        )}
      </div>

      {/* Recently Collected */}
      {recentlyCollected.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recently Collected</h2>
            <p className="text-sm text-gray-600 mt-1">
              Last 10 collected payments
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {recentlyCollected.map((payment: any, index: number) => (
              <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {payment.guestName}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {payment.propertyTitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDateTime(payment.collectedDate)} • {payment.collectedBy}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{payment.method}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
