"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Color palettes for charts
const COLORS = {
  primary: ['#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#10B981', '#F97316', '#EC4899', '#6366F1'],
  gradient: ['#3B82F6', '#1E40AF', '#1E3A8A'],
  success: ['#10B981', '#059669', '#047857'],
  warning: ['#F59E0B', '#D97706', '#B45309'],
  error: ['#EF4444', '#DC2626', '#B91C1C'],
};

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Revenue Trend Chart
export function RevenueTrendChart({ 
  data, 
  timeRange = '30d',
  onTimeRangeChange,
  className = '',
  height = 300,
}: {
  data: ChartData[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
  height?: number;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
          <div className="flex items-center space-x-2">
            {onTimeRangeChange && (
              <Select value={timeRange} onValueChange={onTimeRangeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Commission Breakdown Pie Chart
export function CommissionBreakdownChart({ 
  data,
  className = '',
  height = 300,
}: {
  data: ChartData[];
  className?: string;
  height?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Commission Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS.primary[index % COLORS.primary.length]}
                    stroke={activeIndex === index ? '#fff' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'brightness(1)',
                      transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                      transformOrigin: 'center',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Performance Metrics Bar Chart
export function PerformanceBarChart({ 
  data,
  className = '',
  height = 300,
}: {
  data: ChartData[];
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                fill="url(#barGradient)"
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Multi-line comparison chart
export function ComparisonLineChart({ 
  data,
  lines = [],
  className = '',
  height = 300,
}: {
  data: ChartData[];
  lines: Array<{
    dataKey: string;
    name: string;
    color: string;
  }>;
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Comparison Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis 
                dataKey="name" 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {lines.map((line, index) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  stroke={line.color}
                  strokeWidth={2}
                  name={line.name}
                  dot={{ r: 4, strokeWidth: 2, fill: line.color }}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: line.color }}
                  animationDuration={1000}
                  animationDelay={index * 200}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}

// Charts Grid Layout
export function ChartsGrid({ 
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {children}
    </div>
  );
}

// Chart Loading Skeleton
export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-32"></div>
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          className="bg-gray-200 rounded animate-pulse" 
          style={{ height: `${height}px` }}
        ></div>
      </CardContent>
    </Card>
  );
}