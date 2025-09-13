'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
  Trash2,
  Calendar,
  User,
  Package,
  Search,
  Filter,
  Download,
  Eye,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  unit: string;
  reason: string;
  reference?: string;
  timestamp: string;
  userId: string;
  userName: string;
  cost?: number;
  location?: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  unit: string;
  currentStock: number;
  costPrice: number;
}

interface StockMovementsProps {
  movements: StockMovement[];
  inventory: InventoryItem[];
  onMovementApprove?: (movementId: string) => void;
  onMovementReject?: (movementId: string) => void;
}

export function StockMovements({ movements, inventory, onMovementApprove, onMovementReject }: StockMovementsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.itemSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || movement.status === statusFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const movementDate = new Date(movement.timestamp);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = movementDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = movementDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = movementDate >= monthAgo;
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'out': return <ArrowDownLeft className="w-4 h-4 text-red-600" />;
      case 'adjustment': return <Edit3 className="w-4 h-4 text-blue-600" />;
      case 'waste': return <Trash2 className="w-4 h-4 text-orange-600" />;
      case 'transfer': return <RefreshCw className="w-4 h-4 text-purple-600" />;
      default: return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'out': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      case 'adjustment': return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800';
      case 'waste': return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800';
      case 'transfer': return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-700" />;
      case 'rejected': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800';
      case 'approved': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'completed': return 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-900';
      case 'rejected': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getTotalValue = () => {
    return filteredMovements.reduce((sum, movement) => {
      return sum + (movement.cost || 0) * movement.quantity;
    }, 0);
  };

  const getMovementStats = () => {
    const today = new Date();
    const todayMovements = filteredMovements.filter(m => 
      new Date(m.timestamp).toDateString() === today.toDateString()
    );
    
    return {
      total: filteredMovements.length,
      today: todayMovements.length,
      stockIn: filteredMovements.filter(m => m.type === 'in').length,
      stockOut: filteredMovements.filter(m => m.type === 'out').length,
      pending: filteredMovements.filter(m => m.status === 'pending').length
    };
  };

  const stats = getMovementStats();

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <div className="text-sm text-blue-600 font-medium">Total Movements</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <ArrowUpRight className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.stockIn}</div>
            <div className="text-sm text-green-600 font-medium">Stock In</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <ArrowDownLeft className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.stockOut}</div>
            <div className="text-sm text-red-600 font-medium">Stock Out</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900">{stats.pending}</div>
            <div className="text-sm text-orange-600 font-medium">Pending</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="text-lg font-bold text-purple-900">₹{getTotalValue().toLocaleString()}</div>
            <div className="text-sm text-purple-600 font-medium">Total Value</div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search movements, items, or reasons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 focus:from-blue-100 focus:to-indigo-100"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-700 font-medium bg-white/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-blue-600 font-bold">{filteredMovements.length}</span> movements
              </div>
              <Button variant="outline" size="sm" className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors shadow-sm">
                <Download className="w-4 h-4 mr-2 text-blue-600" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Movements List */}
      <div className="space-y-4">
        {filteredMovements.map((movement) => (
          <Card 
            key={movement.id}
            className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-white to-gray-50 hover:from-blue-50 hover:to-indigo-100"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Movement Icon */}
                  <div className="p-3 rounded-xl bg-gray-100 group-hover:bg-blue-100 transition-colors">
                    {getMovementIcon(movement.type)}
                  </div>

                  {/* Movement Details */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{movement.itemName}</h3>
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
                        {movement.itemSku}
                      </Badge>
                      <Badge className={`${getMovementColor(movement.type)} border-0 shadow-sm`}>
                        {getMovementIcon(movement.type)}
                        <span className="ml-1 capitalize">{movement.type}</span>
                      </Badge>
                      <Badge className={`${getStatusColor(movement.status)} border-0 shadow-sm`}>
                        {getStatusIcon(movement.status)}
                        <span className="ml-1 capitalize">{movement.status}</span>
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {movement.type === 'out' ? '-' : '+'}{movement.quantity} {movement.unit}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Stock Change:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          {movement.previousStock} → {movement.newStock} {movement.unit}
                        </span>
                      </div>
                      {movement.cost && (
                        <div>
                          <span className="text-gray-600">Value:</span>
                          <span className="ml-2 font-semibold text-green-600">
                            ₹{(movement.cost * movement.quantity).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4" />
                        <span>{movement.userName}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(movement.timestamp).toLocaleDateString()}</span>
                        <span>{new Date(movement.timestamp).toLocaleTimeString()}</span>
                      </div>
                      {movement.location && (
                        <div className="flex items-center space-x-1">
                          <Package className="w-4 h-4" />
                          <span>{movement.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
                      <div className="text-sm">
                        <span className="text-gray-600 font-medium">Reason:</span>
                        <span className="ml-2 text-gray-800">{movement.reason}</span>
                      </div>
                      {movement.reference && (
                        <div className="text-sm mt-1">
                          <span className="text-gray-600 font-medium">Reference:</span>
                          <span className="ml-2 text-gray-800">{movement.reference}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {movement.status === 'pending' && onMovementApprove && onMovementReject && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => onMovementApprove(movement.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMovementReject(movement.id)}
                        className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 transition-colors shadow-sm"
                      >
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedMovement(movement)}
                    className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredMovements.length === 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="text-center py-12">
              <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Package className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">No stock movements found</h3>
              <p className="text-blue-600">Adjust your filters or check back later for movement history</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}