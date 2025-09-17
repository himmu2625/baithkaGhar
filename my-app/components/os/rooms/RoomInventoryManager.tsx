'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Archive, Barcode, Calendar, DollarSign, Edit, Filter, Package, Plus, Search, Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RoomInventoryItem {
  _id: string;
  item: string;
  category: 'furniture' | 'electronics' | 'linens' | 'bathroom' | 'kitchen' | 'decor' | 'safety';
  quantity: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  lastChecked: Date;
  needsReplacement: boolean;
  cost: number;
  supplier?: string;
}

interface InventoryStats {
  totalItems: number;
  totalValue: number;
  categories: { [key: string]: number };
  conditions: { [key: string]: number };
  needsReplacement: number;
  lastChecked: {
    oldest: Date | null;
    newest: Date | null;
    overdue: number;
  };
}

interface RoomInventoryManagerProps {
  roomId: string;
  items: RoomInventoryItem[];
  onItemUpdate: (item: RoomInventoryItem) => void;
  onConditionChange: (itemId: string, condition: string) => void;
}

export default function RoomInventoryManager({ roomId, items: initialItems, onItemUpdate, onConditionChange }: RoomInventoryManagerProps) {
  const [items, setItems] = useState<RoomInventoryItem[]>(initialItems);
  const [filteredItems, setFilteredItems] = useState<RoomInventoryItem[]>(initialItems);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RoomInventoryItem | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // New item form state
  const [newItem, setNewItem] = useState({
    item: '',
    category: 'furniture' as const,
    quantity: 1,
    condition: 'good' as const,
    cost: 0,
    supplier: '',
    needsReplacement: false,
  });

  useEffect(() => {
    fetchInventoryData();
  }, [roomId]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, categoryFilter, conditionFilter]);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/rooms/${roomId}/inventory?includeStats=true`);

      if (!response.ok) {
        throw new Error('Failed to fetch inventory data');
      }

      const data = await response.json();
      setItems(data.data.inventory);
      setStats(data.data.statistics);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (conditionFilter !== 'all') {
      filtered = filtered.filter(item => item.condition === conditionFilter);
    }

    setFilteredItems(filtered);
  };

  const addInventoryItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/rooms/${roomId}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error('Failed to add inventory item');
      }

      const data = await response.json();
      const addedItem = data.data.inventoryItem;

      setItems(prev => [...prev, addedItem]);
      onItemUpdate(addedItem);
      setShowAddDialog(false);
      resetNewItemForm();

      toast({
        title: 'Success',
        description: 'Inventory item added successfully',
      });
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to add inventory item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateInventoryItem = async (itemId: string, updates: Partial<RoomInventoryItem>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/rooms/${roomId}/inventory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update inventory item');
      }

      setItems(prev =>
        prev.map(item =>
          item._id === itemId ? { ...item, ...updates } : item
        )
      );

      if (updates.condition) {
        onConditionChange(itemId, updates.condition);
      }

      toast({
        title: 'Success',
        description: 'Inventory item updated successfully',
      });
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to update inventory item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/os/rooms/${roomId}/inventory?itemId=${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete inventory item');
      }

      setItems(prev => prev.filter(item => item._id !== itemId));

      toast({
        title: 'Success',
        description: 'Inventory item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete inventory item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetNewItemForm = () => {
    setNewItem({
      item: '',
      category: 'furniture',
      quantity: 1,
      condition: 'good',
      cost: 0,
      supplier: '',
      needsReplacement: false,
    });
  };

  const getConditionColor = (condition: string) => {
    const colors = {
      excellent: 'bg-green-500',
      good: 'bg-blue-500',
      fair: 'bg-yellow-500',
      poor: 'bg-orange-500',
      missing: 'bg-red-500',
    };
    return colors[condition as keyof typeof colors] || 'bg-gray-500';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      furniture: '🪑',
      electronics: '📺',
      linens: '🛏️',
      bathroom: '🚿',
      kitchen: '🍽️',
      decor: '🖼️',
      safety: '🔒',
    };
    return icons[category as keyof typeof icons] || '📦';
  };

  if (loading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Room Inventory</h2>
          <p className="text-gray-600">Manage and track room items and equipment</p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
              <DialogDescription>
                Add a new item to the room inventory.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="item">Item Name</Label>
                  <Input
                    id="item"
                    value={newItem.item}
                    onChange={(e) => setNewItem(prev => ({ ...prev, item: e.target.value }))}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newItem.category}
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="linens">Linens</SelectItem>
                      <SelectItem value="bathroom">Bathroom</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="decor">Decor</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select
                    value={newItem.condition}
                    onValueChange={(value) => setNewItem(prev => ({ ...prev, condition: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newItem.cost}
                    onChange={(e) => setNewItem(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Supplier name"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addInventoryItem} disabled={!newItem.item}>
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Needs Replacement</p>
                  <p className="text-2xl font-bold">{stats.needsReplacement}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Overdue Checks</p>
                  <p className="text-2xl font-bold">{stats.lastChecked.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="linens">Linens</SelectItem>
                    <SelectItem value="bathroom">Bathroom</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                    <SelectItem value="decor">Decor</SelectItem>
                    <SelectItem value="safety">Safety</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Items ({filteredItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Last Checked</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getCategoryIcon(item.category)}</span>
                            <div>
                              <p className="font-medium">{item.item}</p>
                              {item.supplier && (
                                <p className="text-sm text-gray-500">by {item.supplier}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <Badge className={`${getConditionColor(item.condition)} text-white`}>
                            {item.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>₹{item.cost.toLocaleString()}</TableCell>
                        <TableCell>
                          {new Date(item.lastChecked).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteInventoryItem(item._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Category Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.categories).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span>{getCategoryIcon(category)}</span>
                          <span className="capitalize">{category}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Condition Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(stats.conditions).map(([condition, count]) => (
                      <div key={condition} className="flex justify-between items-center">
                        <span className="capitalize">{condition}</span>
                        <Badge className={`${getConditionColor(condition)} text-white`}>
                          {count}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items Needing Attention</CardTitle>
              <CardDescription>
                Items that need replacement or maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredItems
                  .filter(item => item.needsReplacement || item.condition === 'poor' || item.condition === 'missing')
                  .map((item) => (
                    <div key={item._id} className="flex justify-between items-center p-4 border rounded">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getCategoryIcon(item.category)}</span>
                        <div>
                          <p className="font-medium">{item.item}</p>
                          <p className="text-sm text-gray-600">
                            Condition: <Badge className={`${getConditionColor(item.condition)} text-white ml-1`}>
                              {item.condition}
                            </Badge>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {item.needsReplacement && (
                          <Badge variant="destructive">Needs Replacement</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateInventoryItem(item._id, { needsReplacement: false, condition: 'good' })}
                        >
                          Mark Fixed
                        </Button>
                      </div>
                    </div>
                  ))}

                {filteredItems.filter(item => item.needsReplacement || item.condition === 'poor' || item.condition === 'missing').length === 0 && (
                  <p className="text-gray-500 text-center py-8">No items need attention</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the inventory item details.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="0"
                    defaultValue={selectedItem.quantity}
                    onChange={(e) => setSelectedItem(prev => prev ? { ...prev, quantity: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select
                    defaultValue={selectedItem.condition}
                    onValueChange={(value) => setSelectedItem(prev => prev ? { ...prev, condition: value as any } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Cost (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={selectedItem.cost}
                  onChange={(e) => setSelectedItem(prev => prev ? { ...prev, cost: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedItem) {
                  updateInventoryItem(selectedItem._id, {
                    quantity: selectedItem.quantity,
                    condition: selectedItem.condition,
                    cost: selectedItem.cost,
                  });
                  setShowEditDialog(false);
                }
              }}
            >
              Update Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}