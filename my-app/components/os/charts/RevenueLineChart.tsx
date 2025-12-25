'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IndianRupee, TrendingUp, TrendingDown } from 'lucide-react';

interface RevenueLineChartProps {
  data: Array<{
    date: string;
    onlinePayment: number;
    hotelPayment: number;
    total: number;
  }>;
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function RevenueLineChart({ data, loading = false }: RevenueLineChartProps) {
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
          <IndianRupee className="w-5 h-5" />
          Revenue Over Time
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No revenue data available for the selected period
        </div>
      </div>
    );
  }

  // Calculate total revenue and trend
  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
  const avgRevenue = totalRevenue / data.length;

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, midpoint).reduce((sum, item) => sum + item.total, 0) / midpoint;
  const secondHalfAvg = data.slice(midpoint).reduce((sum, item) => sum + item.total, 0) / (data.length - midpoint);
  const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  const isPositiveTrend = trendPercentage > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-5 h-5" />
            Revenue Over Time
          </h3>
          <div className={`flex items-center gap-1 text-sm font-medium ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {Math.abs(trendPercentage).toFixed(1)}%
          </div>
        </div>
        <div className="flex items-baseline gap-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-700">{formatCurrency(avgRevenue)}</p>
            <p className="text-xs text-gray-500">Daily Average</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
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
            tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => [formatCurrency(value), '']}
            labelFormatter={(label) => formatDate(label)}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="onlinePayment"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Online Payment"
          />
          <Line
            type="monotone"
            dataKey="hotelPayment"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 4 }}
            activeDot={{ r: 6 }}
            name="Hotel Payment"
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="#6366F1"
            strokeWidth={3}
            dot={{ fill: '#6366F1', r: 5 }}
            activeDot={{ r: 7 }}
            name="Total Revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
