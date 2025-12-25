'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Download } from 'lucide-react';
import DateRangePicker from '@/components/os/DateRangePicker';
import RevenueLineChart from '@/components/os/charts/RevenueLineChart';
import BookingsBarChart from '@/components/os/charts/BookingsBarChart';
import PaymentPieChart from '@/components/os/charts/PaymentPieChart';
import OccupancyAreaChart from '@/components/os/charts/OccupancyAreaChart';

export default function AnalyticsPage() {
  // Initialize date range (last 30 days)
  const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
    };
  };

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Fetch analytics data
  const fetchAnalytics = async (start: string, end: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `/api/os/reports/analytics?startDate=${start}&endDate=${end}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, []);

  // Handle date range change
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    fetchAnalytics(newStartDate, newEndDate);
    setShowDatePicker(false);
  };

  const formatDateRange = () => {
    const start = new Date(startDate).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const end = new Date(endDate).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            Interactive Analytics
          </h1>
          <p className="text-sm text-gray-600 mt-1">{formatDateRange()}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            {showDatePicker ? 'Hide' : 'Change'} Date Range
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      {showDatePicker && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart - Full Width */}
        <div className="lg:col-span-2">
          <RevenueLineChart data={data?.revenue || []} loading={loading} />
        </div>

        {/* Bookings Bar Chart */}
        <div>
          <BookingsBarChart data={data?.bookings || []} loading={loading} />
        </div>

        {/* Payment Distribution Pie Chart */}
        <div>
          <PaymentPieChart
            data={data?.paymentDistribution || { onlinePayment: 0, hotelPayment: 0, pending: 0 }}
            loading={loading}
          />
        </div>

        {/* Occupancy Area Chart - Full Width */}
        <div className="lg:col-span-2">
          <OccupancyAreaChart data={data?.occupancy || []} loading={loading} />
        </div>
      </div>

      {/* Summary Footer */}
      {!loading && data && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
          <h3 className="font-semibold text-gray-900 mb-3">📊 Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(
                  (data.paymentDistribution?.onlinePayment || 0) +
                    (data.paymentDistribution?.hotelPayment || 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-xl font-bold text-gray-900">
                {data.bookings?.reduce(
                  (sum: number, day: any) =>
                    sum + day.confirmed + day.pending + day.cancelled + day.completed,
                  0
                ) || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Occupancy</p>
              <p className="text-xl font-bold text-gray-900">
                {data.occupancy && data.occupancy.length > 0
                  ? (
                      data.occupancy.reduce((sum: number, day: any) => sum + day.occupancyRate, 0) /
                      data.occupancy.length
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending Collection</p>
              <p className="text-xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(data.paymentDistribution?.pending || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>💡 Tip: Use the date range picker to analyze different time periods</p>
      </div>
    </div>
  );
}
