import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  CreditCard,
  Clock,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

async function getRevenueAnalytics() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/reports/revenue`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch revenue analytics:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
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

export default async function OwnerReportsPage() {
  await requireOwnerAuth();
  const data = await getRevenueAnalytics();

  if (!data || !data.success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Analytics</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { summary, daily, byProperty, dateRange } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last 30 days ({formatDate(dateRange.from)} - {formatDate(dateRange.to)})
          </p>
        </div>
        <Link
          href="/os/reports/analytics"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5" />
          Interactive Analytics
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.totalRevenue)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {summary.growth >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <p className="text-sm text-green-600">
                  +{summary.growth}% from previous period
                </p>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-600">
                  {summary.growth}% from previous period
                </p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Online Revenue</p>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.onlineRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {summary.totalRevenue > 0
              ? Math.round((summary.onlineRevenue / summary.totalRevenue) * 100)
              : 0}% of total
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Hotel Revenue</p>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.hotelRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Collected at property
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Pending Collection</p>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.pendingRevenue)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Yet to be collected
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{summary.totalBookings}</p>
          <p className="text-sm text-gray-500 mt-2">in this period</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary.averageBookingValue)}
          </p>
          <p className="text-sm text-gray-500 mt-2">per booking</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Collection Rate</p>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {(summary.hotelRevenue + summary.pendingRevenue) > 0
              ? Math.round(
                  (summary.hotelRevenue / (summary.hotelRevenue + summary.pendingRevenue)) * 100
                )
              : 100}%
          </p>
          <p className="text-sm text-gray-500 mt-2">of hotel payments</p>
        </div>
      </div>

      {/* Revenue by Property */}
      {byProperty && byProperty.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Revenue by Property</h2>
            <p className="text-sm text-gray-600 mt-1">Top performing properties</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {byProperty.map((property: any, index: number) => (
                  <tr key={property.propertyId} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-indigo-600">
                            #{index + 1}
                          </span>
                        </div>
                        <span className="font-medium text-gray-900">
                          {property.propertyTitle}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900">{property.bookings}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatCurrency(property.amount)}
                    </td>
                    <td className="px-6 py-4 text-gray-900">
                      {formatCurrency(property.amount / property.bookings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Revenue Chart - Simplified Table View */}
      {daily && daily.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Daily Revenue</h2>
            <p className="text-sm text-gray-600 mt-1">Revenue breakdown by day</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {daily.slice(-7).map((day: any) => {
                const maxAmount = Math.max(...daily.map((d: any) => d.amount));
                const percentage = (day.amount / maxAmount) * 100;

                return (
                  <div key={day.date}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {formatDate(day.date)}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(day.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{day.bookings} bookings</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Analytics CTA */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              📊 Interactive Analytics Now Available!
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Explore your data with interactive charts and customizable date ranges
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ Interactive charts with date range selection</li>
              <li>✅ Revenue trends over time</li>
              <li>✅ Booking status distribution</li>
              <li>✅ Payment breakdown analysis</li>
              <li>✅ Occupancy rate tracking</li>
            </ul>
          </div>
          <Link
            href="/os/reports/analytics"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
          >
            <BarChart3 className="w-5 h-5" />
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}
