'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  IndianRupee,
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
      {/* Enhanced Pricing Overview - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold text-purple-700 flex items-center">
              <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors mr-2">
                <IndianRupee className="w-4 h-4 text-purple-600" />
              </div>
              Average Price
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">₹{getAveragePrice()}</div>
            <p className="text-xs text-purple-600">Across all items</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center">
              <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors mr-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              Price Range
            </CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              ₹{Math.min(...menuItems.map(i => i.basePrice))} - ₹{Math.max(...menuItems.map(i => i.basePrice))}
            </div>
            <p className="text-xs text-blue-600">Min - Max price</p>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative pb-3">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">{menuItems.length}</div>
            <p className="text-xs text-emerald-600">Menu items</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Bulk Price Adjustment */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 rounded-t-lg">
          <CardTitle className="text-orange-800 flex items-center space-x-2">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <span>Bulk Price Adjustment</span>
          </CardTitle>
          <CardDescription className="text-orange-600">
            Apply percentage or fixed amount changes to multiple items at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="adjustment-type" className="text-orange-800 font-medium">Adjustment Type</Label>
              <div className="relative group">
                <select 
                  id="adjustment-type"
                  className="w-full p-4 border-0 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-100 hover:to-red-100 backdrop-blur-sm font-medium text-orange-800 focus:ring-2 focus:ring-orange-500/20 cursor-pointer appearance-none"
                  value={priceAdjustment.type}
                  onChange={(e) => setPriceAdjustment(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'percentage' | 'fixed' 
                  }))}
                >
                  <option value="percentage">📊 Percentage Adjustment</option>
                  <option value="fixed">💰 Fixed Amount Adjustment</option>
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <Percent className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="adjustment-value" className="text-orange-800 font-medium">
                {priceAdjustment.type === 'percentage' ? '📊 Percentage (%)' : '💰 Amount (₹)'}
              </Label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                <div className="relative flex items-center">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-orange-500/20 group-hover:bg-orange-500/30 transition-colors">
                    {priceAdjustment.type === 'percentage' ? (
                      <Percent className="w-4 h-4 text-orange-600" />
                    ) : (
                      <IndianRupee className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <Input
                    id="adjustment-value"
                    type="number"
                    placeholder={priceAdjustment.type === 'percentage' ? '10' : '50'}
                    value={priceAdjustment.value}
                    onChange={(e) => setPriceAdjustment(prev => ({ 
                      ...prev, 
                      value: parseFloat(e.target.value) || 0 
                    }))}
                    className="pl-16 pr-4 py-3 border-0 bg-gradient-to-r from-orange-50 to-red-50 focus:from-orange-100 focus:to-red-100 focus:ring-2 focus:ring-orange-500/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-orange-800 placeholder:text-orange-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <Label htmlFor="category-filter" className="text-orange-800 font-medium">Category (Optional)</Label>
              <div className="relative group">
                <select 
                  id="category-filter"
                  className="w-full p-4 border-0 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:from-orange-100 hover:to-red-100 backdrop-blur-sm font-medium text-orange-800 focus:ring-2 focus:ring-orange-500/20 cursor-pointer appearance-none"
                  value={priceAdjustment.category || ''}
                  onChange={(e) => setPriceAdjustment(prev => ({ 
                    ...prev, 
                    category: e.target.value || undefined 
                  }))}
                >
                  <option value="">🍽️ All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      📂 {category.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleBulkPriceAdjustment} 
                className="w-full bg-orange-600 hover:bg-orange-700 shadow-md hover:shadow-lg transition-all"
              >
                <Percent className="w-4 h-4 mr-2" />
                Apply Adjustment
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Individual Item Pricing */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
          <div>
            <CardTitle className="text-green-800 flex items-center space-x-2">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Edit className="h-5 w-5 text-green-600" />
              </div>
              <span>Individual Item Pricing</span>
            </CardTitle>
            <CardDescription className="text-green-600">Edit prices for individual menu items</CardDescription>
          </div>
          {Object.keys(editingPrices).length > 0 && (
            <Button 
              onClick={handleSavePrices} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all"
            >
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
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Avg: ₹{getAveragePrice(category.id)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryItems.map(item => (
                      <Card key={item.id} className="p-4 border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
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