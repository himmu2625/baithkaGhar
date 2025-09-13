'use client';

import { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  DollarSign, 
  TrendingUp, 
  Users, 
  ChefHat,
  Utensils,
  Timer,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  averagePreparationTime: number;
}

interface FBOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  totalAmount: number;
  createdAt: string;
  estimatedTime?: number;
  tableName?: string;
}

interface OrderDashboardProps {
  propertyId: string;
  stats: OrderStats;
  recentOrders: FBOrder[];
  onOrderStatusUpdate: (orderId: string, newStatus: string) => void;
}

export function OrderDashboard({ propertyId, stats, recentOrders, onOrderStatusUpdate }: OrderDashboardProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'preparing': return <ChefHat className="w-4 h-4 text-orange-500" />;
      case 'ready': return <Utensils className="w-4 h-4 text-green-500" />;
      case 'served': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-700" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800';
      case 'confirmed': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800';
      case 'preparing': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800';
      case 'ready': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'served': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'completed': return 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-900';
      case 'cancelled': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
      case 'normal': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800';
      case 'high': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800';
      case 'urgent': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'dine_in': return <Utensils className="w-4 h-4" />;
      case 'takeaway': return <Users className="w-4 h-4" />;
      case 'delivery': return <ChefHat className="w-4 h-4" />;
      default: return <Utensils className="w-4 h-4" />;
    }
  };

  const completionRate = stats.totalOrders > 0 
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Key Metrics - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Orders</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Utensils className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{stats.totalOrders}</div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12% from yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-red-100 hover:from-orange-100 hover:to-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-orange-700">Active Orders</CardTitle>
            <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-orange-900 mb-1">{stats.pendingOrders + stats.preparingOrders}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-orange-600">{stats.pendingOrders} pending, {stats.preparingOrders} preparing</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">₹{stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="w-3 h-3" />
                <span>+8% from last week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Avg Order Value</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">₹{stats.averageOrderValue}</div>
            <div className="flex items-center space-x-1">
              <Timer className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">Avg prep: {stats.averagePreparationTime} mins</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Order Status Overview - Modern OS Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/8 via-indigo-500/6 to-purple-500/8 opacity-70"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
          
          <CardHeader className="relative bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 rounded-t-lg border-b border-blue-200/50 backdrop-blur-sm">
            <CardTitle className="text-blue-900 flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Utensils className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <span className="text-xl font-bold">Order Status Overview</span>
                <div className="text-sm font-normal text-blue-600 mt-1">Real-time order distribution</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative pt-8 pb-6">
            <div className="space-y-6">
              {/* Pending Orders */}
              <div className="group hover:bg-gradient-to-r hover:from-yellow-50/60 hover:to-orange-50/60 p-4 rounded-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl group-hover:shadow-lg transition-all duration-300">
                      <Clock className="w-5 h-5 text-orange-600 group-hover:animate-pulse" />
                    </div>
                    <div>
                      <span className="text-base font-semibold text-gray-900">Pending Orders</span>
                      <div className="text-xs text-orange-600 font-medium">Awaiting confirmation</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-900 mb-1">{stats.pendingOrders}</div>
                    <div className="text-xs text-orange-600 font-medium">
                      {stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0} 
                  className="h-3 bg-gradient-to-r from-yellow-200/50 to-orange-200/50"
                />
              </div>

              {/* Preparing Orders */}
              <div className="group hover:bg-gradient-to-r hover:from-orange-50/60 hover:to-red-50/60 p-4 rounded-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl group-hover:shadow-lg transition-all duration-300">
                      <ChefHat className="w-5 h-5 text-red-600 group-hover:animate-bounce" />
                    </div>
                    <div>
                      <span className="text-base font-semibold text-gray-900">In Kitchen</span>
                      <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>Being prepared</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-900 mb-1">{stats.preparingOrders}</div>
                    <div className="text-xs text-red-600 font-medium">
                      {stats.totalOrders > 0 ? Math.round((stats.preparingOrders / stats.totalOrders) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={stats.totalOrders > 0 ? (stats.preparingOrders / stats.totalOrders) * 100 : 0} 
                  className="h-3 bg-gradient-to-r from-orange-200/50 to-red-200/50"
                />
              </div>

              {/* Completed Orders */}
              <div className="group hover:bg-gradient-to-r hover:from-green-50/60 hover:to-emerald-50/60 p-4 rounded-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl group-hover:shadow-lg transition-all duration-300">
                      <CheckCircle className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <div>
                      <span className="text-base font-semibold text-gray-900">Completed</span>
                      <div className="text-xs text-emerald-600 font-medium">Successfully delivered</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-900 mb-1">{stats.completedOrders}</div>
                    <div className="text-xs text-emerald-600 font-medium">
                      {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={stats.totalOrders > 0 ? (stats.completedOrders / stats.totalOrders) * 100 : 0} 
                  className="h-3 bg-gradient-to-r from-green-200/50 to-emerald-200/50"
                />
              </div>

              {/* Cancelled Orders */}
              <div className="group hover:bg-gradient-to-r hover:from-red-50/60 hover:to-pink-50/60 p-4 rounded-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2.5 bg-gradient-to-r from-red-100 to-pink-100 rounded-xl group-hover:shadow-lg transition-all duration-300">
                      <XCircle className="w-5 h-5 text-pink-600 group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div>
                      <span className="text-base font-semibold text-gray-900">Cancelled</span>
                      <div className="text-xs text-pink-600 font-medium">Order cancellations</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-pink-900 mb-1">{stats.cancelledOrders}</div>
                    <div className="text-xs text-pink-600 font-medium">
                      {stats.totalOrders > 0 ? Math.round((stats.cancelledOrders / stats.totalOrders) * 100) : 0}% of total
                    </div>
                  </div>
                </div>
                <Progress 
                  value={stats.totalOrders > 0 ? (stats.cancelledOrders / stats.totalOrders) * 100 : 0} 
                  className="h-3 bg-gradient-to-r from-red-200/50 to-pink-200/50"
                />
              </div>
            </div>

            {/* Enhanced Completion Rate Section */}
            <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-blue-200/50 to-transparent">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative text-center p-6 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl border border-green-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl w-fit mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-4xl font-bold text-green-900 mb-2">{completionRate}%</div>
                  <div className="text-base font-semibold text-green-700 mb-1">Success Rate</div>
                  <div className="text-sm text-green-600 font-medium">
                    {stats.completedOrders} of {stats.totalOrders} orders completed successfully
                  </div>
                  
                  {/* Progress Ring Visual */}
                  <div className="mt-4">
                    <div className="relative w-24 h-24 mx-auto">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgb(220, 252, 231)"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgb(34, 197, 94)"
                          strokeWidth="2"
                          strokeDasharray={`${completionRate}, 100`}
                          className="animate-pulse"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white via-green-50/20 to-emerald-50/30 backdrop-blur-xl hover:shadow-3xl transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/8 via-emerald-500/6 to-teal-500/8 opacity-70"></div>
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent"></div>
          
          <CardHeader className="relative bg-gradient-to-r from-green-50/80 via-emerald-50/60 to-teal-50/80 rounded-t-lg border-b border-green-200/50 backdrop-blur-sm">
            <CardTitle className="text-green-900 flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <span className="text-xl font-bold">Performance Metrics</span>
                <div className="text-sm font-normal text-green-600 mt-1">Real-time operational insights</div>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="relative pt-8 pb-6">
            <div className="space-y-8">
              {/* Enhanced Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <div className="relative text-center p-6 bg-gradient-to-br from-blue-50/90 to-indigo-100/90 rounded-2xl border border-blue-200/50 hover:shadow-2xl transition-all duration-500">
                    <div className="p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Timer className="w-8 h-8 text-blue-600 group-hover:animate-spin" />
                    </div>
                    <div className="text-4xl font-bold text-blue-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                      {stats.averagePreparationTime}
                    </div>
                    <div className="text-sm font-semibold text-blue-700 mb-1">Avg Prep Time</div>
                    <div className="text-xs text-blue-600 font-medium">minutes per order</div>
                    
                    {/* Performance indicator */}
                    <div className="mt-3 flex items-center justify-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">Within target</span>
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-200/20 to-emerald-200/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <div className="relative text-center p-6 bg-gradient-to-br from-green-50/90 to-emerald-100/90 rounded-2xl border border-green-200/50 hover:shadow-2xl transition-all duration-500">
                    <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl w-fit mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Star className="w-8 h-8 text-green-600 group-hover:animate-bounce" />
                    </div>
                    <div className="text-4xl font-bold text-green-900 mb-2 group-hover:scale-105 transition-transform duration-300">
                      4.8
                    </div>
                    <div className="text-sm font-semibold text-green-700 mb-1">Customer Rating</div>
                    <div className="text-xs text-green-600 font-medium">out of 5 stars</div>
                    
                    {/* Star rating display */}
                    <div className="mt-3 flex items-center justify-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3 h-3 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Metrics */}
              <div className="space-y-6">
                <div className="group p-5 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-2xl border border-purple-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <Utensils className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900">Peak Hour Efficiency</span>
                        <div className="text-xs text-purple-600 font-medium">Kitchen performance during busy periods</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-900">92%</div>
                      <div className="text-xs text-purple-600 font-medium">Excellent</div>
                    </div>
                  </div>
                  <Progress value={92} className="h-3 bg-gradient-to-r from-purple-200/50 to-pink-200/50" />
                </div>
                
                <div className="group p-5 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-2xl border border-green-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900">Order Accuracy</span>
                        <div className="text-xs text-green-600 font-medium">Correct orders vs total orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-900">96%</div>
                      <div className="text-xs text-green-600 font-medium">Outstanding</div>
                    </div>
                  </div>
                  <Progress value={96} className="h-3 bg-gradient-to-r from-green-200/50 to-emerald-200/50" />
                </div>
                
                <div className="group p-5 bg-gradient-to-r from-orange-50/80 to-amber-50/80 rounded-2xl border border-orange-200/50 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500/20 to-amber-500/20 rounded-lg group-hover:scale-110 transition-transform duration-300">
                        <Clock className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <span className="text-base font-semibold text-gray-900">On-time Delivery</span>
                        <div className="text-xs text-orange-600 font-medium">Orders delivered within estimated time</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-900">88%</div>
                      <div className="text-xs text-orange-600 font-medium">Good</div>
                    </div>
                  </div>
                  <Progress value={88} className="h-3 bg-gradient-to-r from-orange-200/50 to-amber-200/50" />
                </div>
              </div>

              {/* Enhanced Summary Stats */}
              <div className="mt-8 pt-6 border-t border-gradient-to-r from-transparent via-green-200/50 to-transparent">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl border border-blue-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-2xl font-bold text-blue-900 mb-1">98.7%</div>
                    <div className="text-xs text-blue-600 font-medium">Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 rounded-xl border border-green-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-2xl font-bold text-green-900 mb-1">2.3m</div>
                    <div className="text-xs text-green-600 font-medium">Avg Response</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl border border-purple-200/50 hover:shadow-lg transition-all duration-300">
                    <div className="text-2xl font-bold text-purple-900 mb-1">147</div>
                    <div className="text-xs text-purple-600 font-medium">Orders/Hour</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Recent Orders */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-indigo-800 flex items-center space-x-2">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-indigo-600" />
                </div>
                <span>Recent Orders</span>
              </CardTitle>
              <CardDescription className="text-indigo-600">Latest orders requiring attention</CardDescription>
            </div>
            <Button variant="outline" className="bg-white/60 hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300 text-indigo-700 transition-colors shadow-sm" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border-0 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 hover:from-blue-50 hover:to-indigo-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {getOrderTypeIcon(order.orderType)}
                    <span className="font-medium">{order.orderNumber}</span>
                  </div>
                  <div>
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-gray-500">
                      {order.tableName || order.orderType.replace('_', ' ')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium">₹{order.totalAmount}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(order.status).replace('bg-', 'bg-gradient-to-r from-').replace('-100 ', '-100 to-').replace('-800', '-200 ').replace('text-', 'text-').replace('-800', '-800')} border-0 shadow-sm`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{order.status}</span>
                    </Badge>
                    
                    {order.priority !== 'normal' && (
                      <Badge className={`${getPriorityColor(order.priority).replace('bg-', 'bg-gradient-to-r from-').replace('-100 ', '-100 to-').replace('-800', '-200 ').replace('text-', 'text-').replace('-800', '-800')} border-0 shadow-sm`}>
                        {order.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    {order.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => onOrderStatusUpdate(order.id, 'confirmed')}
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      >
                        Confirm
                      </Button>
                    )}
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        onClick={() => onOrderStatusUpdate(order.id, 'preparing')}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      >
                        Start Prep
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        onClick={() => onOrderStatusUpdate(order.id, 'ready')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        onClick={() => onOrderStatusUpdate(order.id, 'served')}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      >
                        Served
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardHeader className="relative">
            <CardTitle className="text-lg text-red-800 flex items-center space-x-2">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <span>Urgent Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-red-900 mb-2">
                {recentOrders.filter(o => o.priority === 'urgent').length}
              </div>
              <div className="text-sm text-red-700 font-medium mb-4">Orders need immediate attention</div>
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0" size="sm">
                View Urgent
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardHeader className="relative">
            <CardTitle className="text-lg text-green-800 flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span>Ready to Serve</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-green-900 mb-2">
                {recentOrders.filter(o => o.status === 'ready').length}
              </div>
              <div className="text-sm text-green-700 font-medium mb-4">Orders ready for pickup/delivery</div>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0" size="sm">
                View Ready
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-yellow-100 hover:from-orange-100 hover:to-yellow-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10"></div>
          <CardHeader className="relative">
            <CardTitle className="text-lg text-orange-800 flex items-center space-x-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <span>Pending Payment</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-center py-4">
              <div className="text-4xl font-bold text-orange-900 mb-2">3</div>
              <div className="text-sm text-orange-700 font-medium mb-4">Orders awaiting payment</div>
              <Button className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0" size="sm">
                Process Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}