'use client';

import { useState, useEffect } from 'react';
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
  BarChart3,
  RefreshCw,
  Search,
  Download,
  Upload,
  Clock,
  DollarSign
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
  expiryDate?: Date;
  lastUpdated: Date;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired' | 'discontinued';
}

interface StockMovement {
  id: string;
  itemId: string;
  type: 'in' | 'out' | 'adjustment' | 'waste' | 'transfer';
  quantity: number;
  reason: string;
  reference?: string;
  timestamp: Date;
  userId: string;
  userName: string;
  cost?: number;
}

interface InventoryTrackerProps {
  items: InventoryItem[];
  movements: StockMovement[];
  onStockUpdate: (itemId: string, quantity: number, type: StockMovement['type'], reason: string) => void;
  onItemUpdate: (itemId: string, updates: Partial<InventoryItem>) => void;
  onBulkImport: (items: InventoryItem[]) => void;
}

export default function InventoryTracker({
  items,
  movements,
  onStockUpdate,
  onItemUpdate,
  onBulkImport
}: InventoryTrackerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<StockMovement['type']>('adjustment');
  const [movementQuantity, setMovementQuantity] = useState(0);
  const [movementReason, setMovementReason] = useState('');
  const [showAnalytics, setShowAnalytics] = useState(false);

  const categories = ['all', ...new Set(items.map(item => item.category))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: InventoryItem['status']) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'out_of_stock': return 'bg-red-500';
      case 'expired': return 'bg-purple-500';
      case 'discontinued': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockPercentage = (item: InventoryItem) => {
    return Math.min((item.currentStock / item.maxStock) * 100, 100);
  };

  const getTotalInventoryValue = () => {
    return items.reduce((total, item) => total + (item.currentStock * item.costPrice), 0);
  };

  const getLowStockItems = () => {
    return items.filter(item => item.currentStock <= item.reorderLevel).length;
  };

  const getOutOfStockItems = () => {
    return items.filter(item => item.currentStock === 0).length;
  };

  const getExpiredItems = () => {
    return items.filter(item => 
      item.expiryDate && item.expiryDate < new Date()
    ).length;
  };

  const handleMovementSubmit = () => {
    if (selectedItem && movementQuantity !== 0 && movementReason) {
      onStockUpdate(selectedItem.id, movementQuantity, movementType, movementReason);
      setMovementDialogOpen(false);
      setMovementQuantity(0);
      setMovementReason('');
      setSelectedItem(null);
    }
  };

  const getRecentMovements = (itemId: string) => {
    return movements
      .filter(movement => movement.itemId === itemId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  };

  const MovementDialog = () => (
    <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Stock Movement - {selectedItem?.name}</DialogTitle>
        </DialogHeader>
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Stock</Label>
                <div className="text-2xl font-bold">
                  {selectedItem.currentStock} {selectedItem.unit}
                </div>
              </div>
              <div>
                <Label>Stock Level</Label>
                <Progress value={getStockPercentage(selectedItem)} className="mt-2" />
                <div className="text-sm text-muted-foreground mt-1">
                  {getStockPercentage(selectedItem).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <Label>Movement Type</Label>
              <Select value={movementType} onValueChange={(value: any) => setMovementType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In (Increase)</SelectItem>
                  <SelectItem value="out">Stock Out (Decrease)</SelectItem>
                  <SelectItem value="adjustment">Stock Adjustment</SelectItem>
                  <SelectItem value="waste">Waste/Loss</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMovementQuantity(prev => 
                    movementType === 'out' || movementType === 'waste' ? prev - 1 : prev + 1
                  )}
                >
                  {movementType === 'out' || movementType === 'waste' ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
                <Input
                  id="quantity"
                  type="number"
                  value={Math.abs(movementQuantity) || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setMovementQuantity(
                      movementType === 'out' || movementType === 'waste' ? -Math.abs(value) : Math.abs(value)
                    );
                  }}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMovementQuantity(prev => 
                    movementType === 'out' || movementType === 'waste' ? prev - 1 : prev + 1
                  )}
                >
                  {movementType === 'out' || movementType === 'waste' ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                New stock will be: {selectedItem.currentStock + movementQuantity} {selectedItem.unit}
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason</Label>
              <Select value={movementReason} onValueChange={setMovementReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {movementType === 'in' && (
                    <>
                      <SelectItem value="purchase">New Purchase</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="transfer_in">Transfer In</SelectItem>
                    </>
                  )}
                  {movementType === 'out' && (
                    <>
                      <SelectItem value="sale">Sale</SelectItem>
                      <SelectItem value="usage">Kitchen Usage</SelectItem>
                      <SelectItem value="transfer_out">Transfer Out</SelectItem>
                    </>
                  )}
                  {movementType === 'adjustment' && (
                    <>
                      <SelectItem value="count_correction">Physical Count Correction</SelectItem>
                      <SelectItem value="system_error">System Error Correction</SelectItem>
                    </>
                  )}
                  {movementType === 'waste' && (
                    <>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="spoiled">Spoiled</SelectItem>
                    </>
                  )}
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setMovementDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleMovementSubmit} className="flex-1">
                Record Movement
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{items.length}</p>
              </div>
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{getLowStockItems()}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{getOutOfStockItems()}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ${getTotalInventoryValue().toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Tracker
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* Inventory Items */}
      <div className="grid gap-4">
        {filteredItems.map(item => {
          const stockPercentage = getStockPercentage(item);
          const recentMovements = getRecentMovements(item.id);
          const isExpiring = item.expiryDate && 
            (item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7;
          
          return (
            <Card key={item.id} className={isExpiring ? 'border-orange-300' : ''}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Item Info */}
                  <div className="lg:col-span-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>SKU: {item.sku}</p>
                          <p>Location: {item.location}</p>
                          <p>Supplier: {item.supplier}</p>
                        </div>
                        <div className="flex gap-1 mt-2">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="lg:col-span-3">
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Current Stock:</span>
                          <span className="font-bold">{item.currentStock} {item.unit}</span>
                        </div>
                        <Progress value={stockPercentage} className="h-2 mt-1" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {stockPercentage.toFixed(1)}% of capacity
                        </div>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>Reorder: {item.reorderLevel} {item.unit}</div>
                        <div>Max: {item.maxStock} {item.unit}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="lg:col-span-2">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Cost Price:</span>
                        <div className="font-bold">${item.costPrice.toFixed(2)}</div>
                      </div>
                      {item.sellPrice && (
                        <div>
                          <span className="text-muted-foreground">Sell Price:</span>
                          <div className="font-bold text-green-600">${item.sellPrice.toFixed(2)}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Total Value:</span>
                        <div className="font-bold">${(item.currentStock * item.costPrice).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="lg:col-span-2">
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Recent Activity:</div>
                      {recentMovements.length > 0 ? (
                        <div className="space-y-1">
                          {recentMovements.slice(0, 2).map(movement => (
                            <div key={movement.id} className="flex items-center gap-1 text-xs">
                              {movement.type === 'in' ? (
                                <TrendingUp className="h-3 w-3 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 text-red-500" />
                              )}
                              <span>
                                {movement.type === 'in' ? '+' : ''}{movement.quantity} ({movement.reason})
                              </span>
                            </div>
                          ))}
                          {recentMovements.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{recentMovements.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">No recent activity</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="lg:col-span-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setMovementDialogOpen(true);
                      }}
                      className="w-full"
                    >
                      Update Stock
                    </Button>
                  </div>
                </div>

                {/* Expiry Warning */}
                {isExpiring && item.expiryDate && (
                  <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        Expires on {item.expiryDate.toLocaleDateString()} 
                        ({Math.ceil((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Items Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No inventory items available'}
            </p>
          </CardContent>
        </Card>
      )}

      <MovementDialog />
    </div>
  );
}