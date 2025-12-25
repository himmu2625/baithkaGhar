'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Wallet, CreditCard, Banknote } from 'lucide-react';

interface PaymentPieChartProps {
  data: {
    onlinePayment: number;
    hotelPayment: number;
    pending: number;
  };
  loading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

const COLORS = {
  onlinePayment: '#10B981', // Green
  hotelPayment: '#F59E0B', // Amber
  pending: '#EF4444', // Red
};

export default function PaymentPieChart({ data, loading = false }: PaymentPieChartProps) {
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

  const totalAmount = data.onlinePayment + data.hotelPayment + data.pending;

  if (totalAmount === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          Payment Distribution
        </h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No payment data available for the selected period
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Online Payment', value: data.onlinePayment, color: COLORS.onlinePayment },
    { name: 'Hotel Payment', value: data.hotelPayment, color: COLORS.hotelPayment },
    { name: 'Pending Payment', value: data.pending, color: COLORS.pending },
  ].filter(item => item.value > 0);

  const renderCustomLabel = (entry: any) => {
    const percentage = ((entry.value / totalAmount) * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5" />
          Payment Distribution
        </h3>
        <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
        <p className="text-sm text-gray-600">Total Amount</p>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
            formatter={(value: number) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with Details */}
      <div className="grid grid-cols-1 gap-3 mt-6">
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Online Payment</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-green-900">{formatCurrency(data.onlinePayment)}</p>
            <p className="text-xs text-green-600">
              {((data.onlinePayment / totalAmount) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Hotel Payment</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-amber-900">{formatCurrency(data.hotelPayment)}</p>
            <p className="text-xs text-amber-600">
              {((data.hotelPayment / totalAmount) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        {data.pending > 0 && (
          <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Pending Payment</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-red-900">{formatCurrency(data.pending)}</p>
              <p className="text-xs text-red-600">
                {((data.pending / totalAmount) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
