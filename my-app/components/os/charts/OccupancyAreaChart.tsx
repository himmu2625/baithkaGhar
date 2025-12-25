'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

interface OccupancyAreaChartProps {
  data: Array<{
    date: string;
    occupancyRate: number;
    occupiedRooms: number;
    totalRooms: number;
  }>;
  loading?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

export default function OccupancyAreaChart({ data, loading = false }: OccupancyAreaChartProps) {
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
          <Building2 className="w-5 h-5" />
          Occupancy Rate Over Time
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No occupancy data available for the selected period
        </div>
      </div>
    );
  }

  // Calculate average occupancy
  const avgOccupancy = data.reduce((sum, item) => sum + item.occupancyRate, 0) / data.length;

  // Calculate trend
  const midpoint = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, midpoint).reduce((sum, item) => sum + item.occupancyRate, 0) / midpoint;
  const secondHalfAvg = data.slice(midpoint).reduce((sum, item) => sum + item.occupancyRate, 0) / (data.length - midpoint);
  const trendPercentage = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  const isPositiveTrend = trendPercentage > 0;

  // Get peak and lowest occupancy
  const peakOccupancy = Math.max(...data.map(item => item.occupancyRate));
  const lowestOccupancy = Math.min(...data.map(item => item.occupancyRate));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Occupancy Rate Over Time
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">{avgOccupancy.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Average</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-green-700">{peakOccupancy.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Peak</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-orange-700">{lowestOccupancy.toFixed(1)}%</p>
            <p className="text-xs text-gray-500">Lowest</p>
          </div>
        </div>

        {/* Occupancy Range Indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Status:</span>
          {avgOccupancy >= 80 ? (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Excellent
            </span>
          ) : avgOccupancy >= 60 ? (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              Good
            </span>
          ) : avgOccupancy >= 40 ? (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
              Moderate
            </span>
          ) : (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              Low
            </span>
          )}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
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
            labelFormatter={(label) => formatDate(label)}
            formatter={(value: number, name: string, props: any) => {
              const item = props.payload;
              return [
                <div key="tooltip" className="space-y-1">
                  <div className="font-semibold text-indigo-600">
                    {value.toFixed(1)}% Occupancy
                  </div>
                  <div className="text-sm text-gray-600">
                    {item.occupiedRooms} / {item.totalRooms} rooms occupied
                  </div>
                </div>,
                '',
              ];
            }}
          />
          <Area
            type="monotone"
            dataKey="occupancyRate"
            stroke="#6366F1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorOccupancy)"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>80-100%: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>60-79%: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>40-59%: Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>0-39%: Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
