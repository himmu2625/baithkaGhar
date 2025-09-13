'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Eye, Image, Utensils, IndianRupee } from 'lucide-react';

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
      {/* Enhanced Display Settings - OS Style */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
          <CardTitle className="text-indigo-800 flex items-center space-x-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <Settings className="h-5 w-5 text-indigo-600" />
            </div>
            <span>Display Settings</span>
          </CardTitle>
          <CardDescription className="text-indigo-600">Configure how your menu appears to customers</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <IndianRupee className="h-5 w-5 text-green-600" />
                </div>
                <Label htmlFor="show-prices" className="font-semibold text-green-800 cursor-pointer">Show Prices</Label>
              </div>
              <Switch
                id="show-prices"
                checked={showPrices}
                onCheckedChange={setShowPrices}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Image className="h-5 w-5 text-blue-600" />
                </div>
                <Label htmlFor="show-images" className="font-semibold text-blue-800 cursor-pointer">Show Images</Label>
              </div>
              <Switch
                id="show-images"
                checked={showImages}
                onCheckedChange={setShowImages}
                className="data-[state=checked]:bg-blue-600"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Utensils className="h-5 w-5 text-purple-600" />
                </div>
                <Label htmlFor="show-dietary" className="font-semibold text-purple-800 cursor-pointer">Show Dietary Info</Label>
              </div>
              <Switch
                id="show-dietary"
                checked={showDietary}
                onCheckedChange={setShowDietary}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Display Mode Toggle */}
      <Tabs value={displayMode} onValueChange={(value) => setDisplayMode(value as 'customer' | 'preview')}>
        <TabsList className="bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md">
          <TabsTrigger 
            value="preview" 
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md font-semibold"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Mode
          </TabsTrigger>
          <TabsTrigger 
            value="customer" 
            className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-md font-semibold"
          >
            <Utensils className="w-4 h-4 mr-2" />
            Customer View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Eye className="h-5 w-5 text-green-600" />
                </div>
                <span>Menu Preview</span>
              </CardTitle>
              <CardDescription className="text-green-600">This is how your menu will appear to customers</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
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
                          <div key={item.id} className="flex items-start justify-between p-6 border-0 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-lg">{item.name}</h3>
                                {item.isFeatured && (
                                  <Badge variant="secondary" className="bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200 shadow-sm">
                                    ⭐ Popular
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
                                    <Badge key={index} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
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