'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Package, 
  Plus, 
  Minus,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  MapPin,
  User,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  maxStock: number;
  costPrice: number;
  sellPrice?: number;
  supplier: string;
  location: string;
  expiryDate?: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'discontinued';
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface InventoryListProps {
  inventory: InventoryItem[];
  categories: Category[];
  onItemSelect: (item: InventoryItem) => void;
  onStockUpdate: (itemId: string, quantity: number, type: 'in' | 'out' | 'adjustment', reason: string) => void;
}

export function InventoryList({ inventory, categories, onItemSelect, onStockUpdate }: InventoryListProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [stockMovement, setStockMovement] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    reason: ''
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_stock': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'low_stock': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'out_of_stock': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <Clock className="w-4 h-4 text-red-600" />;
      case 'discontinued': return <Minus className="w-4 h-4 text-gray-500" />;
      default: return <Package className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800';
      case 'low_stock': return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800';
      case 'out_of_stock': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      case 'expired': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
      case 'discontinued': return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
      default: return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800';
    }
  };

  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    return Math.min(percentage, 100);
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  const handleStockUpdate = () => {
    if (selectedItem && stockMovement.quantity > 0) {
      onStockUpdate(selectedItem.id, stockMovement.quantity, stockMovement.type, stockMovement.reason);
      setShowStockDialog(false);
      setStockMovement({ type: 'in', quantity: 0, reason: '' });
      setSelectedItem(null);
    }
  };

  if (inventory.length === 0) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardContent className="text-center py-12">
          <div className="p-4 bg-amber-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Package className="w-12 h-12 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-amber-900 mb-2">No inventory items found</h3>
          <p className="text-amber-600">Add items to your inventory to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {inventory.map((item) => {
          const stockLevel = getStockLevel(item);
          const expiringSoon = isExpiringSoon(item.expiryDate);
          const expired = isExpired(item.expiryDate);
          const categoryColor = categories.find(c => c.id === item.category)?.color || '#6B7280';

          return (
            <Card 
              key={item.id} 
              className={`relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${
                expired ? 'bg-gradient-to-br from-red-50 to-pink-100' :
                expiringSoon ? 'bg-gradient-to-br from-orange-50 to-amber-100' :
                item.status === 'out_of_stock' ? 'bg-gradient-to-br from-red-50 to-pink-50' :
                item.status === 'low_stock' ? 'bg-gradient-to-br from-yellow-50 to-orange-100' :
                'bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-indigo-100'
              }`}
              onClick={() => onItemSelect(item)}
            >
              {/* Category Color Bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 opacity-80"
                style={{ backgroundColor: categoryColor }}
              ></div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1 truncate">
                      {item.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm text-xs">
                        {item.sku}
                      </Badge>
                      <Badge className={`${getStatusColor(item.status)} border-0 shadow-sm text-xs`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">
                      Category: {categories.find(c => c.id === item.category)?.name || item.category}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  {/* Stock Level */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Stock Level</span>
                      <span className="text-sm font-bold text-gray-900">{item.currentStock} {item.unit}</span>
                    </div>
                    <Progress 
                      value={stockLevel} 
                      className={`h-2 ${
                        item.status === 'out_of_stock' ? 'bg-red-200' :
                        item.status === 'low_stock' ? 'bg-orange-200' : 'bg-green-200'
                      }`}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Reorder: {item.reorderLevel}</span>
                      <span>Max: {item.maxStock}</span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg">
                    <div>
                      <div className="text-xs text-gray-500">Cost Price</div>
                      <div className="font-semibold text-gray-900">₹{item.costPrice.toFixed(2)}</div>
                    </div>
                    {item.sellPrice && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Sell Price</div>
                        <div className="font-semibold text-green-600">₹{item.sellPrice.toFixed(2)}</div>
                      </div>
                    )}
                  </div>

                  {/* Location & Supplier */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{item.supplier}</span>
                    </div>
                  </div>

                  {/* Expiry Warning */}
                  {item.expiryDate && (
                    <div className={`p-2 rounded-lg text-sm ${
                      expired ? 'bg-red-100 text-red-800' :
                      expiringSoon ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {expired ? 'Expired: ' : expiringSoon ? 'Expires: ' : 'Expires: '}
                          {new Date(item.expiryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                        setShowStockDialog(true);
                      }}
                      className="flex-1 bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors shadow-sm"
                    >
                      <Package className="w-4 h-4 mr-1 text-blue-600" />
                      <span className="text-blue-700 font-medium">Update Stock</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onItemSelect(item);
                      }}
                      className="bg-white/60 hover:bg-green-50 border-green-200 hover:border-green-300 transition-colors shadow-sm"
                    >
                      <Eye className="w-4 h-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Stock Update Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-900 flex items-center space-x-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <span>Update Stock - {selectedItem?.name}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-blue-800 font-medium">Current Stock:</span>
                <span className="text-2xl font-bold text-blue-900">{selectedItem?.currentStock} {selectedItem?.unit}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-700 font-semibold">Movement Type</Label>
                <Select value={stockMovement.type} onValueChange={(value: any) => setStockMovement({...stockMovement, type: value})}>
                  <SelectTrigger className="mt-2 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={stockMovement.quantity}
                  onChange={(e) => setStockMovement({...stockMovement, quantity: parseInt(e.target.value) || 0})}
                  className="mt-2 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <Label className="text-gray-700 font-semibold">Reason</Label>
                <Input
                  value={stockMovement.reason}
                  onChange={(e) => setStockMovement({...stockMovement, reason: e.target.value})}
                  className="mt-2 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300"
                  placeholder="Enter reason for stock movement"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <Button
                onClick={() => setShowStockDialog(false)}
                variant="outline"
                className="flex-1 bg-white/60 hover:bg-red-50 border-red-200 hover:border-red-300 text-red-600 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStockUpdate}
                disabled={stockMovement.quantity <= 0 || !stockMovement.reason}
                className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:from-gray-300 disabled:to-gray-400"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}