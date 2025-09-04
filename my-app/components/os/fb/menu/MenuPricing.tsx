'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  DollarSign,
  TrendingUp,
  Percent,
  Edit,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  basePrice: number;
  itemType: 'food' | 'beverage' | 'combo';
  isActive: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  preparationTime: number;
  image?: string;
  tags: string[];
  spicyLevel: 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot';
  dietary: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
  };
}

interface MenuPricingProps {
  propertyId: string;
  menuItems: MenuItem[];
  onItemsChange: (items: MenuItem[]) => void;
}

export function MenuPricing({ propertyId, menuItems, onItemsChange }: MenuPricingProps) {
  const { data: session } = useSession();
  const [editingPrices, setEditingPrices] = useState<Record<string, number>>({});
  const [priceAdjustment, setPriceAdjustment] = useState<{
    type: 'percentage' | 'fixed';
    value: number;
    category?: string;
  }>({
    type: 'percentage',
    value: 0
  });
  const [loading, setLoading] = useState(false);

  const handlePriceEdit = (itemId: string, price: number) => {
    setEditingPrices(prev => ({ ...prev, [itemId]: price }));
  };

  const handleSavePrices = async () => {
    if (Object.keys(editingPrices).length === 0) return;

    try {
      setLoading(true);
      
      const updatedItems = menuItems.map(item => {
        if (editingPrices[item.id] !== undefined) {
          return { ...item, basePrice: editingPrices[item.id] };
        }
        return item;
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onItemsChange(updatedItems);
      setEditingPrices({});
    } catch (error) {
      console.error('Error updating prices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPriceAdjustment = () => {
    const { type, value, category } = priceAdjustment;
    
    const updatedItems = menuItems.map(item => {
      if (category && item.categoryId !== category) return item;
      
      let newPrice = item.basePrice;
      if (type === 'percentage') {
        newPrice = item.basePrice * (1 + value / 100);
      } else {
        newPrice = item.basePrice + value;
      }
      
      // Round to nearest whole number and ensure minimum price
      newPrice = Math.max(Math.round(newPrice), 1);
      
      setEditingPrices(prev => ({ ...prev, [item.id]: newPrice }));
      return item;
    });
  };

  const categories = Array.from(new Set(menuItems.map(item => ({
    id: item.categoryId,
    name: item.categoryName
  }))));

  const getAveragePrice = (categoryId?: string) => {
    const items = categoryId 
      ? menuItems.filter(item => item.categoryId === categoryId)
      : menuItems;
    
    if (items.length === 0) return 0;
    
    const total = items.reduce((sum, item) => sum + item.basePrice, 0);
    return Math.round(total / items.length);
  };

  return (
    <div className="space-y-6">
      {/* Pricing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{getAveragePrice()}</div>
            <p className="text-xs text-muted-foreground">Across all items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.min(...menuItems.map(i => i.basePrice))} - ₹{Math.max(...menuItems.map(i => i.basePrice))}
            </div>
            <p className="text-xs text-muted-foreground">Min - Max price</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{menuItems.length}</div>
            <p className="text-xs text-muted-foreground">Menu items</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Price Adjustment */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Price Adjustment</CardTitle>
          <CardDescription>
            Apply percentage or fixed amount changes to multiple items at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="adjustment-type">Adjustment Type</Label>
              <select 
                id="adjustment-type"
                className="w-full p-2 border rounded-md"
                value={priceAdjustment.type}
                onChange={(e) => setPriceAdjustment(prev => ({ 
                  ...prev, 
                  type: e.target.value as 'percentage' | 'fixed' 
                }))}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="adjustment-value">
                {priceAdjustment.type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}
              </Label>
              <Input
                id="adjustment-value"
                type="number"
                placeholder={priceAdjustment.type === 'percentage' ? '10' : '50'}
                value={priceAdjustment.value}
                onChange={(e) => setPriceAdjustment(prev => ({ 
                  ...prev, 
                  value: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
            
            <div>
              <Label htmlFor="category-filter">Category (Optional)</Label>
              <select 
                id="category-filter"
                className="w-full p-2 border rounded-md"
                value={priceAdjustment.category || ''}
                onChange={(e) => setPriceAdjustment(prev => ({ 
                  ...prev, 
                  category: e.target.value || undefined 
                }))}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={handleBulkPriceAdjustment} className="w-full">
                Apply Adjustment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Item Pricing */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Individual Item Pricing</CardTitle>
            <CardDescription>Edit prices for individual menu items</CardDescription>
          </div>
          {Object.keys(editingPrices).length > 0 && (
            <Button onClick={handleSavePrices} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes ({Object.keys(editingPrices).length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {Object.keys(editingPrices).length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You have unsaved price changes. Click "Save Changes" to apply them.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            {categories.map(category => {
              const categoryItems = menuItems.filter(item => item.categoryId === category.id);
              
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Badge variant="outline">
                      Avg: ₹{getAveragePrice(category.id)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => (
                      <Card key={item.id} className="p-4">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`price-${item.id}`} className="text-sm">
                              Price (₹)
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id={`price-${item.id}`}
                                type="number"
                                min="1"
                                value={editingPrices[item.id] ?? item.basePrice}
                                onChange={(e) => handlePriceEdit(item.id, parseFloat(e.target.value) || 0)}
                                className="w-24"
                              />
                              {editingPrices[item.id] !== undefined && 
                               editingPrices[item.id] !== item.basePrice && (
                                <Badge variant="secondary" className="text-xs">
                                  {editingPrices[item.id] > item.basePrice ? '+' : ''}
                                  {editingPrices[item.id] - item.basePrice}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}