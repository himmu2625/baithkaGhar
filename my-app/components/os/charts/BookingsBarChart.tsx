'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar } from 'lucide-react';

interface BookingsBarChartProps {
  data: Array<{
    date: string;
    confirmed: number;
    pending: number;
    cancelled: number;
    completed: number;
  }>;
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function BookingsBarChart({ data, loading = false }: BookingsBarChartProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Bookings by Status
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No booking data available for the selected period
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalConfirmed = data.reduce((sum, item) => sum + item.confirmed, 0);
  const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
  const totalCancelled = data.reduce((sum, item) => sum + item.cancelled, 0);
  const totalCompleted = data.reduce((sum, item) => sum + item.completed, 0);
  const totalBookings = totalConfirmed + totalPending + totalCancelled + totalCompleted;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" />
          Bookings by Status
        </h3>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-600 font-medium mb-1">Confirmed</p>
            <p className="text-xl font-bold text-green-900">{totalConfirmed}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-600 font-medium mb-1">Pending</p>
            <p className="text-xl font-bold text-yellow-900">{totalPending}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-600 font-medium mb-1">Completed</p>
            <p className="text-xl font-bold text-blue-900">{totalCompleted}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-xs text-red-600 font-medium mb-1">Cancelled</p>
            <p className="text-xl font-bold text-red-900">{totalCancelled}</p>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">{totalBookings}</span> bookings
        </p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            labelFormatter={(label) => formatDate(label)}
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                confirmed: 'Confirmed',
                pending: 'Pending',
                completed: 'Completed',
                cancelled: 'Cancelled',
              };
              return [value, labels[name] || name];
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
          />
          <Bar
            dataKey="confirmed"
            fill="#10B981"
            name="Confirmed"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="pending"
            fill="#F59E0B"
            name="Pending"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="completed"
            fill="#3B82F6"
            name="Completed"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="cancelled"
            fill="#EF4444"
            name="Cancelled"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
