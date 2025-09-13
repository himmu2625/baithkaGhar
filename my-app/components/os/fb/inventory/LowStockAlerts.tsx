'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  AlertTriangle,
  XCircle,
  Clock,
  Package,
  ShoppingCart,
  Phone,
  Mail,
  User,
  Calendar,
  TrendingDown,
  CheckCircle,
  Bell,
  Search,
  Filter,
  Zap,
  DollarSign,
  MapPin,
  Eye
} from 'lucide-react';

interface AlertItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  reorderLevel: number;
  maxStock: number;
  unit: string;
  costPrice: number;
  supplier: string;
  supplierContact?: string;
  supplierEmail?: string;
  location: string;
  expiryDate?: string;
  alertType: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock';
  alertLevel: 'low' | 'medium' | 'high' | 'critical';
  daysUntilExpiry?: number;
  lastOrderDate?: string;
  averageConsumption?: number;
  estimatedStockoutDate?: string;
  autoReorderEnabled: boolean;
  alertCreated: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  category: string;
  currentStock: number;
  minimumStock?: number;
  reorderLevel?: number;
  maximumStock?: number;
  unit: string;
  costPrice: number;
  supplier: string;
  supplierContact?: string;
  location: string;
  expiryDate?: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';
  lastUpdated: string;
}

interface LowStockAlertsProps {
  inventory: InventoryItem[];
  onStockUpdate: (itemId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) => void;
}

export function LowStockAlerts({ 
  inventory, 
  onStockUpdate
}: LowStockAlertsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [alertTypeFilter, setAlertTypeFilter] = useState<string>('all');
  const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAutoReorderOnly, setShowAutoReorderOnly] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Convert inventory items to alert format
  const alerts = inventory.map(item => {
    const daysUntilExpiry = item.expiryDate ? 
      Math.ceil((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;
    
    let alertType: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'overstock' = 'low_stock';
    let alertLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (item.status === 'out_of_stock') {
      alertType = 'out_of_stock';
      alertLevel = 'critical';
    } else if (daysUntilExpiry !== null && daysUntilExpiry < 0) {
      alertType = 'expired';
      alertLevel = 'critical';
    } else if (daysUntilExpiry !== null && daysUntilExpiry <= 2) {
      alertType = 'expiring_soon';
      alertLevel = 'high';
    } else if (item.status === 'low_stock') {
      alertType = 'low_stock';
      alertLevel = item.currentStock === 0 ? 'critical' : 'high';
    }
    
    return {
      ...item,
      sku: item.sku || `SKU-${item.id.slice(-6)}`,
      reorderLevel: item.reorderLevel || item.minimumStock || 10,
      maxStock: item.maximumStock || 100,
      supplierContact: item.supplierContact || '+91 98765 43210',
      supplierEmail: `orders@${item.supplier.toLowerCase().replace(/\s+/g, '')}.com`,
      alertType,
      alertLevel,
      daysUntilExpiry,
      lastOrderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      averageConsumption: Math.round(Math.random() * 20) + 5,
      estimatedStockoutDate: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      autoReorderEnabled: Math.random() > 0.5,
      alertCreated: item.lastUpdated
    };
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         alert.supplier.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = alertTypeFilter === 'all' || alert.alertType === alertTypeFilter;
    const matchesLevel = alertLevelFilter === 'all' || alert.alertLevel === alertLevelFilter;
    const matchesCategory = categoryFilter === 'all' || alert.category === categoryFilter;
    const matchesAutoReorder = !showAutoReorderOnly || alert.autoReorderEnabled;
    
    return matchesSearch && matchesType && matchesLevel && matchesCategory && matchesAutoReorder;
  });

  const getAlertIcon = (alertType: string, alertLevel: string) => {
    const iconClass = alertLevel === 'critical' ? 'animate-pulse' : '';
    
    switch (alertType) {
      case 'low_stock':
        return <AlertTriangle className={`w-4 h-4 text-orange-600 ${iconClass}`} />;
      case 'out_of_stock':
        return <XCircle className={`w-4 h-4 text-red-600 ${iconClass}`} />;
      case 'expiring_soon':
        return <Clock className={`w-4 h-4 text-yellow-600 ${iconClass}`} />;
      case 'expired':
        return <XCircle className={`w-4 h-4 text-red-700 ${iconClass}`} />;
      case 'overstock':
        return <TrendingDown className={`w-4 h-4 text-blue-600 ${iconClass}`} />;
      default:
        return <Package className={`w-4 h-4 text-gray-600 ${iconClass}`} />;
    }
  };

  const getAlertColor = (alertType: string, alertLevel: string) => {
    const baseColors = {
      low_stock: 'from-orange-100 to-amber-100 text-orange-800',
      out_of_stock: 'from-red-100 to-pink-100 text-red-800',
      expiring_soon: 'from-yellow-100 to-orange-100 text-yellow-800',
      expired: 'from-red-200 to-pink-200 text-red-900',
      overstock: 'from-blue-100 to-indigo-100 text-blue-800'
    };
    
    return `bg-gradient-to-r ${baseColors[alertType as keyof typeof baseColors] || 'from-gray-100 to-slate-100 text-gray-800'}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'medium': return 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800';
      case 'high': return 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800';
      case 'critical': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getStockLevel = (item: AlertItem) => {
    return (item.currentStock / item.maxStock) * 100;
  };

  const getAlertStats = () => {
    return {
      total: filteredAlerts.length,
      critical: filteredAlerts.filter(a => a.alertLevel === 'critical').length,
      outOfStock: filteredAlerts.filter(a => a.alertType === 'out_of_stock').length,
      expiring: filteredAlerts.filter(a => a.alertType === 'expiring_soon' || a.alertType === 'expired').length,
      autoReorder: filteredAlerts.filter(a => a.autoReorderEnabled).length
    };
  };

  const stats = getAlertStats();
  const categories = ['all', ...new Set(alerts.map(alert => alert.category))];

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkAction = (action: 'reorder' | 'contact_supplier' | 'dismiss') => {
    if (selectedItems.length === 0) return;
    
    switch (action) {
      case 'reorder':
        selectedItems.forEach(itemId => {
          const item = alerts.find(a => a.id === itemId);
          if (item) {
            const reorderQuantity = (item.maxStock - item.currentStock);
            onStockUpdate(itemId, reorderQuantity, 'in', 'Bulk reorder from alerts');
          }
        });
        break;
        
      case 'contact_supplier':
        // Simulate contacting suppliers
        const supplierGroups = selectedItems.reduce((groups, itemId) => {
          const item = alerts.find(a => a.id === itemId);
          if (item) {
            if (!groups[item.supplier]) {
              groups[item.supplier] = [];
            }
            groups[item.supplier].push(itemId);
          }
          return groups;
        }, {} as Record<string, string[]>);
        
        Object.entries(supplierGroups).forEach(([supplier, itemIds]) => {
          console.log(`Contacting ${supplier} for items:`, itemIds);
          // In real implementation, this would send emails/notifications
        });
        break;
      
      case 'dismiss':
        // In a real implementation, this would dismiss the alerts
        console.log('Dismissing alerts for items:', selectedItems);
        break;
    }
    
    setSelectedItems([]);
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Alert Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-50 to-pink-100 hover:from-red-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.total}</div>
            <div className="text-sm text-red-600 font-medium">Total Alerts</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-red-100 to-pink-200 hover:from-red-200 hover:to-pink-300">
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-pink-600/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-red-600/20 group-hover:bg-red-600/30 transition-colors">
                <Zap className="h-5 w-5 text-red-700 animate-pulse" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
            <div className="text-sm text-red-700 font-medium">Critical</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-orange-50 to-red-100 hover:from-orange-100 hover:to-red-200">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-red-900">{stats.outOfStock}</div>
            <div className="text-sm text-red-600 font-medium">Out of Stock</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-yellow-50 to-orange-100 hover:from-yellow-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-900">{stats.expiring}</div>
            <div className="text-sm text-yellow-600 font-medium">Expiring</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10"></div>
          <CardContent className="relative p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900">{stats.autoReorder}</div>
            <div className="text-sm text-green-600 font-medium">Auto Reorder</div>
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
                  placeholder="Search items, SKU, or suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-0 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 focus:from-red-100 focus:to-orange-100"
                />
              </div>
              
              <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Alert Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="overstock">Overstock</SelectItem>
                </SelectContent>
              </Select>

              <Select value={alertLevelFilter} onValueChange={setAlertLevelFilter}>
                <SelectTrigger className="w-48 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="auto-reorder"
                  checked={showAutoReorderOnly}
                  onCheckedChange={setShowAutoReorderOnly}
                />
                <label htmlFor="auto-reorder" className="text-sm font-medium">Auto Reorder Only</label>
              </div>
              <div className="text-sm text-gray-700 font-medium bg-white/70 px-3 py-2 rounded-lg backdrop-blur-sm">
                <span className="text-red-600 font-bold">{filteredAlerts.length}</span> alerts
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleBulkAction('contact_supplier')}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Contact Suppliers
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkAction('dismiss')}
                    className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 transition-colors shadow-sm"
                  >
                    Dismiss All
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedItems([])}
                    className="bg-white/60 hover:bg-gray-50 border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => {
          const stockLevel = getStockLevel(alert);
          const isSelected = selectedItems.includes(alert.id);
          
          return (
            <Card 
              key={alert.id}
              className={`border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${
                alert.alertLevel === 'critical' 
                  ? 'bg-gradient-to-r from-red-50 to-pink-100 ring-2 ring-red-200' 
                  : isSelected
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-100 ring-2 ring-blue-200'
                    : 'bg-gradient-to-r from-white to-gray-50 hover:from-yellow-50 hover:to-orange-100'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Selection Checkbox */}
                    <div className="flex items-center pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(alert.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Alert Icon */}
                    <div className="p-3 rounded-xl bg-gray-100 flex-shrink-0">
                      {getAlertIcon(alert.alertType, alert.alertLevel)}
                    </div>

                    {/* Alert Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center space-x-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{alert.name}</h3>
                        <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
                          {alert.sku}
                        </Badge>
                        <Badge className={`${getAlertColor(alert.alertType, alert.alertLevel)} border-0 shadow-sm`}>
                          {getAlertIcon(alert.alertType, alert.alertLevel)}
                          <span className="ml-1 capitalize">{alert.alertType.replace('_', ' ')}</span>
                        </Badge>
                        <Badge className={`${getLevelColor(alert.alertLevel)} border-0 shadow-sm`}>
                          {alert.alertLevel.toUpperCase()}
                        </Badge>
                        {alert.autoReorderEnabled && (
                          <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 shadow-sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Auto Reorder
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Current Stock</div>
                          <div className="text-2xl font-bold text-gray-900">{alert.currentStock} {alert.unit}</div>
                          <Progress value={stockLevel} className="h-2" />
                          <div className="text-xs text-gray-500">
                            Reorder at {alert.reorderLevel} {alert.unit}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Supplier Info</div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="w-4 h-4 text-gray-600" />
                              <span className="font-medium">{alert.supplier}</span>
                            </div>
                            {alert.supplierContact && (
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{alert.supplierContact}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="w-4 h-4" />
                              <span>{alert.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700">Cost & Timeline</div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              <span className="font-medium">₹{alert.costPrice.toFixed(2)} per {alert.unit}</span>
                            </div>
                            {alert.estimatedStockoutDate && (
                              <div className="flex items-center space-x-2 text-sm text-red-600">
                                <Calendar className="w-4 h-4" />
                                <span>Stockout: {new Date(alert.estimatedStockoutDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {alert.daysUntilExpiry && (
                              <div className="flex items-center space-x-2 text-sm text-orange-600">
                                <Clock className="w-4 h-4" />
                                <span>Expires in {alert.daysUntilExpiry} days</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Alert Info */}
                      {(alert.alertType === 'expiring_soon' || alert.alertType === 'expired') && alert.expiryDate && (
                        <div className={`p-3 rounded-lg ${
                          alert.alertType === 'expired' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">
                              {alert.alertType === 'expired' ? 'Expired on: ' : 'Expires on: '}
                              {new Date(alert.expiryDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      {alert.alertType !== 'expired' && alert.alertType !== 'overstock' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const reorderQuantity = (alert.maxStock - alert.currentStock);
                            onStockUpdate(alert.id, reorderQuantity, 'in', 'Reorder from alert');
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Quick Reorder
                        </Button>
                      )}
                      
                      {alert.supplierContact && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log(`Contacting ${alert.supplier} for item: ${alert.name}`);
                            // In real implementation, this would open email/phone contact
                          }}
                          className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors shadow-sm"
                        >
                          <Phone className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          console.log(`Dismissing alert for: ${alert.name}`);
                          // In real implementation, this would dismiss the alert
                        }}
                        className="bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 transition-colors shadow-sm"
                      >
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-600">Auto Reorder:</label>
                      <Switch
                        checked={alert.autoReorderEnabled}
                        onCheckedChange={(enabled) => {
                          console.log(`${enabled ? 'Enabling' : 'Disabling'} auto-reorder for: ${alert.name}`);
                          // In real implementation, this would update the auto-reorder setting
                        }}
                        size="sm"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Alert created: {new Date(alert.alertCreated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredAlerts.length === 0 && (
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardContent className="text-center py-12">
              <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-900 mb-2">No alerts found</h3>
              <p className="text-green-600">All items are properly stocked! Adjust filters to see more alerts.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}