'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MenuCategory {
  id: string;
  name: string;
  description: string;
  categoryType: string;
  displayOrder: number;
  isActive: boolean;
  itemCount: number;
}

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

interface MenuDisplayBoardProps {
  propertyId: string;
  categories: MenuCategory[];
  menuItems: MenuItem[];
}

export function MenuDisplayBoard({ propertyId, categories, menuItems }: MenuDisplayBoardProps) {
  const [displayMode, setDisplayMode] = useState<'customer' | 'preview'>('preview');
  const [showPrices, setShowPrices] = useState(true);
  const [showImages, setShowImages] = useState(true);
  const [showDietary, setShowDietary] = useState(true);

  const activeCategories = categories.filter(cat => cat.isActive).sort((a, b) => a.displayOrder - b.displayOrder);

  const getDietaryBadges = (dietary: MenuItem['dietary']) => {
    const badges = [];
    if (dietary.vegetarian) badges.push('🥬 Veg');
    if (dietary.vegan) badges.push('🌱 Vegan');
    if (dietary.glutenFree) badges.push('🌾 Gluten-Free');
    return badges;
  };

  const getSpicyLevelIndicator = (level: string) => {
    switch (level) {
      case 'mild': return '🌶️';
      case 'medium': return '🌶️🌶️';
      case 'hot': return '🌶️🌶️🌶️';
      case 'extra_hot': return '🌶️🌶️🌶️🌶️';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Configure how your menu appears to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="show-prices"
                checked={showPrices}
                onCheckedChange={setShowPrices}
              />
              <Label htmlFor="show-prices">Show Prices</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-images"
                checked={showImages}
                onCheckedChange={setShowImages}
              />
              <Label htmlFor="show-images">Show Images</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="show-dietary"
                checked={showDietary}
                onCheckedChange={setShowDietary}
              />
              <Label htmlFor="show-dietary">Show Dietary Info</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Mode Toggle */}
      <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as 'customer' | 'preview')}>
        <TabsList>
          <TabsTrigger value="preview">Preview Mode</TabsTrigger>
          <TabsTrigger value="customer">Customer View</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menu Preview</CardTitle>
              <CardDescription>This is how your menu will appear to customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {activeCategories.map((category) => {
                  const categoryItems = menuItems.filter(
                    item => item.categoryId === category.id && item.isActive && item.isAvailable
                  );

                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category.id}>
                      <div className="border-b pb-2 mb-4">
                        <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
                        {category.description && (
                          <p className="text-gray-600 mt-1">{category.description}</p>
                        )}
                      </div>
                      
                      <div className="grid gap-4">
                        {categoryItems.map((item) => (
                          <div key={item.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                {item.isFeatured && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    Popular
                                  </Badge>
                                )}
                                {getSpicyLevelIndicator(item.spicyLevel) && (
                                  <span>{getSpicyLevelIndicator(item.spicyLevel)}</span>
                                )}
                              </div>
                              
                              <p className="text-gray-600 mt-1">{item.description}</p>
                              
                              {showDietary && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {getDietaryBadges(item.dietary).map((badge, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {badge}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-sm text-gray-500">
                                  🕐 {item.preparationTime} mins
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right ml-4">
                              {showPrices && (
                                <div className="text-xl font-bold text-gray-800">
                                  ₹{item.basePrice}
                                </div>
                              )}
                              {showImages && item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-20 h-20 object-cover rounded-lg mt-2"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customer" className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Menu</h1>
              <p className="text-gray-600">Fresh ingredients, authentic flavors</p>
            </div>
            
            <div className="space-y-10">
              {activeCategories.map((category) => {
                const categoryItems = menuItems.filter(
                  item => item.categoryId === category.id && item.isActive && item.isAvailable
                );

                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="border-b-2 border-gray-200 pb-3 mb-6">
                      <h2 className="text-3xl font-serif font-bold text-gray-800">{category.name}</h2>
                      {category.description && (
                        <p className="text-gray-600 mt-2 italic">{category.description}</p>
                      )}
                    </div>
                    
                    <div className="space-y-6">
                      {categoryItems.map((item) => (
                        <div key={item.id} className="border-b border-gray-100 pb-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-800">{item.name}</h3>
                                {item.isFeatured && (
                                  <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                                    Chef's Special
                                  </span>
                                )}
                                {getSpicyLevelIndicator(item.spicyLevel) && (
                                  <span className="text-lg">{getSpicyLevelIndicator(item.spicyLevel)}</span>
                                )}
                              </div>
                              
                              <p className="text-gray-600 leading-relaxed mb-3">{item.description}</p>
                              
                              {showDietary && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {getDietaryBadges(item.dietary).map((badge, index) => (
                                    <span key={index} className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                                      {badge}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="text-sm text-gray-500">
                                Preparation time: {item.preparationTime} minutes
                              </div>
                            </div>
                            
                            <div className="ml-6 text-right">
                              {showPrices && (
                                <div className="text-2xl font-bold text-gray-800">
                                  ₹{item.basePrice}
                                </div>
                              )}
                              {showImages && item.image && (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-24 h-24 object-cover rounded-lg mt-2 shadow-md"
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}