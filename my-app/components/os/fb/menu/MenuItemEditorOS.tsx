'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2,
  Star,
  Clock,
  DollarSign,
  ChefHat,
  Camera,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Package,
  Tag,
  Utensils,
  Settings,
  Shield
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

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
    dairyFree?: boolean;
    nutFree?: boolean;
    halal?: boolean;
    kosher?: boolean;
  };
  sizes?: Array<{
    name: string;
    price: number;
    isDefault: boolean;
  }>;
  ingredients?: string[];
  allergens?: string[];
}

interface MenuItemEditorProps {
  item?: MenuItem | null;
  categories: MenuCategory[];
  propertyId: string;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}

const ITEM_TYPES = [
  { value: 'food', label: 'Food', icon: Utensils, color: 'green' },
  { value: 'beverage', label: 'Beverage', icon: ChefHat, color: 'blue' },
  { value: 'combo', label: 'Combo', icon: Package, color: 'purple' },
];

const SPICY_LEVELS = [
  { value: 'none', label: 'Not Spicy', icon: '🟢', color: 'gray' },
  { value: 'mild', label: 'Mild', icon: '🟡', color: 'green' },
  { value: 'medium', label: 'Medium', icon: '🟠', color: 'yellow' },
  { value: 'hot', label: 'Hot', icon: '🔴', color: 'orange' },
  { value: 'extra_hot', label: 'Extra Hot', icon: '🌶️', color: 'red' },
];

const COMMON_ALLERGENS = [
  { id: 'nuts', label: 'Nuts', icon: '🥜' },
  { id: 'dairy', label: 'Dairy', icon: '🥛' },
  { id: 'eggs', label: 'Eggs', icon: '🥚' },
  { id: 'soy', label: 'Soy', icon: '🌱' },
  { id: 'wheat', label: 'Wheat', icon: '🌾' },
  { id: 'shellfish', label: 'Shellfish', icon: '🦐' },
  { id: 'fish', label: 'Fish', icon: '🐟' },
  { id: 'sesame', label: 'Sesame', icon: '🌰' },
];

const DIETARY_OPTIONS = [
  { key: 'vegetarian', label: 'Vegetarian', icon: '🥬', color: 'green' },
  { key: 'vegan', label: 'Vegan', icon: '🌱', color: 'emerald' },
  { key: 'glutenFree', label: 'Gluten Free', icon: '🚫🌾', color: 'blue' },
  { key: 'dairyFree', label: 'Dairy Free', icon: '🚫🥛', color: 'purple' },
  { key: 'nutFree', label: 'Nut Free', icon: '🚫🥜', color: 'orange' },
  { key: 'halal', label: 'Halal', icon: '🌙', color: 'teal' },
  { key: 'kosher', label: 'Kosher', icon: '✡️', color: 'indigo' },
];

export function MenuItemEditorOS({ item, categories, propertyId, onClose, onSave }: MenuItemEditorProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    categoryId: item?.categoryId || '',
    basePrice: item?.basePrice || 0,
    itemType: item?.itemType || 'food' as 'food' | 'beverage' | 'combo',
    isActive: item?.isActive ?? true,
    isAvailable: item?.isAvailable ?? true,
    isFeatured: item?.isFeatured || false,
    preparationTime: item?.preparationTime || 15,
    spicyLevel: item?.spicyLevel || 'none' as 'none' | 'mild' | 'medium' | 'hot' | 'extra_hot',
    image: item?.image || '',
    dietary: {
      vegetarian: item?.dietary?.vegetarian || false,
      vegan: item?.dietary?.vegan || false,
      glutenFree: item?.dietary?.glutenFree || false,
      dairyFree: item?.dietary?.dairyFree || false,
      nutFree: item?.dietary?.nutFree || false,
      halal: item?.dietary?.halal || false,
      kosher: item?.dietary?.kosher || false,
    },
  });
  
  const [tags, setTags] = useState<string[]>(item?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [sizes, setSizes] = useState(item?.sizes || []);
  const [ingredients, setIngredients] = useState<string[]>(item?.ingredients || []);
  const [newIngredient, setNewIngredient] = useState('');
  const [allergens, setAllergens] = useState<string[]>(item?.allergens || []);

  // Calculate completion progress
  useEffect(() => {
    const totalFields = 12;
    const completedFields = [
      formData.name,
      formData.description,
      formData.categoryId,
      formData.basePrice > 0,
      formData.itemType,
      formData.preparationTime > 0,
      tags.length > 0,
      ingredients.length > 0,
      true, // dietary options always count
      true, // status switches always count
      true, // spicy level always has default
      true  // allergens is optional but always count as available
    ].filter(Boolean).length;
    
    setCompletionProgress(Math.round((completedFields / totalFields) * 100));
  }, [formData, tags, ingredients]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required';
    }
    if (formData.basePrice <= 0) {
      newErrors.basePrice = 'Price must be greater than 0';
    }
    if (formData.preparationTime <= 0) {
      newErrors.preparationTime = 'Preparation time must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const itemData = {
        ...formData,
        propertyId,
        tags,
        sizes: sizes.length > 0 ? sizes : undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
        allergens: allergens.length > 0 ? allergens : undefined,
      };

      const url = item 
        ? `/api/fb/menu/items/${item.id}`
        : '/api/fb/menu/items';
      
      const method = item ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(itemData),
      });

      if (response.ok) {
        const result = await response.json();
        const savedItem = result.item;
        
        const category = categories.find(c => c.id === savedItem.categoryId);
        const itemWithCategoryName = {
          ...savedItem,
          categoryName: category?.name || ''
        };

        onSave(itemWithCategoryName);
      } else {
        throw new Error('Failed to save menu item');
      }
    } catch (error) {
      console.error('Error saving menu item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddSize = () => {
    const newSize = {
      name: `Size ${sizes.length + 1}`,
      price: formData.basePrice,
      isDefault: sizes.length === 0,
    };
    setSizes([...sizes, newSize]);
  };

  const handleUpdateSize = (index: number, field: string, value: any) => {
    const updatedSizes = sizes.map((size, i) => 
      i === index ? { ...size, [field]: value } : size
    );
    setSizes(updatedSizes);
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !ingredients.includes(newIngredient.trim())) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (ingredientToRemove: string) => {
    setIngredients(ingredients.filter(ingredient => ingredient !== ingredientToRemove));
  };

  const handleAllergenToggle = (allergen: string) => {
    if (allergens.includes(allergen)) {
      setAllergens(allergens.filter(a => a !== allergen));
    } else {
      setAllergens([...allergens, allergen]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* OS Theme Header */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm shadow-lg">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {item ? 'Edit Menu Item' : 'New Menu Item'}
                </h1>
                <p className="text-blue-100 mt-1">
                  {item ? `Update details for ${item.name}` : 'Add a new item to your menu'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Progress Indicator */}
              <div className="hidden md:block text-center">
                <div className="text-sm text-blue-100 mb-2">Progress</div>
                <div className="flex items-center space-x-3">
                  <Progress 
                    value={completionProgress} 
                    className="w-24 h-2 bg-white/20"
                  />
                  <span className="text-sm font-bold text-white min-w-[2.5rem]">{completionProgress}%</span>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="lg"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-xl p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* OS Theme Tabs */}
        <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
              <TabsTrigger 
                value="basic" 
                className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Utensils className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              
              <TabsTrigger 
                value="details" 
                className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Package className="w-4 h-4 mr-2" />
                Details
              </TabsTrigger>
              
              <TabsTrigger 
                value="pricing" 
                className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Pricing
              </TabsTrigger>
              
              <TabsTrigger 
                value="dietary" 
                className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                <Shield className="w-4 h-4 mr-2" />
                Dietary
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="h-[calc(95vh-280px)] overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Item Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Menu Item Information</CardTitle>
                    <CardDescription>Basic details about your menu item</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Item Name *</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Butter Chicken, Masala Dosa"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the item, ingredients, preparation method, and what makes it special..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Base Price (₹) *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.basePrice}
                        onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className={errors.basePrice ? 'border-red-500' : ''}
                      />
                      {errors.basePrice && <p className="text-red-600 text-sm">{errors.basePrice}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <Input
                        id="image"
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => handleInputChange('image', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category & Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Classification</CardTitle>
                    <CardDescription>Categorize and classify your item</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select 
                        value={formData.categoryId} 
                        onValueChange={(value) => handleInputChange('categoryId', value)}
                      >
                        <SelectTrigger className={errors.categoryId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.filter(cat => cat.isActive).map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.categoryId && <p className="text-red-600 text-sm">{errors.categoryId}</p>}
                    </div>

                    <div className="space-y-3">
                      <Label>Item Type *</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {ITEM_TYPES.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            className={`p-3 border-2 rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                              formData.itemType === type.value 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => handleInputChange('itemType', type.value)}
                          >
                            <type.icon className={`h-6 w-6 ${
                              formData.itemType === type.value ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                            <span className={`text-sm font-medium ${
                              formData.itemType === type.value ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {type.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="preparationTime">Preparation Time (minutes) *</Label>
                      <Input
                        id="preparationTime"
                        type="number"
                        min="1"
                        value={formData.preparationTime}
                        onChange={(e) => handleInputChange('preparationTime', parseInt(e.target.value) || 15)}
                        className={errors.preparationTime ? 'border-red-500' : ''}
                      />
                      {errors.preparationTime && <p className="text-red-600 text-sm">{errors.preparationTime}</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Status Toggles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Item Status</CardTitle>
                  <CardDescription>Configure visibility and availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="isActive" className="text-sm font-medium">
                          Active Item
                        </Label>
                        <p className="text-xs text-gray-500">Enable in menu system</p>
                      </div>
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="isAvailable" className="text-sm font-medium">
                          Available Today
                        </Label>
                        <p className="text-xs text-gray-500">Ready for orders</p>
                      </div>
                      <Switch
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="isFeatured" className="text-sm font-medium">
                          Featured Item
                        </Label>
                        <p className="text-xs text-gray-500">Highlight to customers</p>
                      </div>
                      <Switch
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Details Tab */}
            <TabsContent value="details" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Spicy Level & Tags */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Spice Level & Tags</CardTitle>
                    <CardDescription>Set heat level and descriptive tags</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Spicy Level</Label>
                      <div className="space-y-2">
                        {SPICY_LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            className={`w-full p-3 border-2 rounded-lg flex items-center space-x-3 text-left transition-colors ${
                              formData.spicyLevel === level.value 
                                ? 'border-orange-500 bg-orange-50' 
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => handleInputChange('spicyLevel', level.value)}
                          >
                            <span className="text-lg">{level.icon}</span>
                            <span className={`font-medium ${
                              formData.spicyLevel === level.value ? 'text-orange-700' : 'text-gray-700'
                            }`}>
                              {level.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-3 block">Tags</Label>
                      <div className="flex items-center space-x-2 mb-3">
                        <Input
                          placeholder="Add a tag (e.g., spicy, popular, new)"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                          className="flex-1"
                        />
                        <Button onClick={handleAddTag} size="sm">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <Badge 
                            key={index} 
                            variant="secondary"
                            className="cursor-pointer"
                          >
                            {tag}
                            <X 
                              className="w-3 h-3 ml-1 hover:text-red-600" 
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ingredients */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Ingredients</CardTitle>
                    <CardDescription>List key ingredients for this item</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add an ingredient (e.g., tomatoes, chicken, spices)"
                        value={newIngredient}
                        onChange={(e) => setNewIngredient(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                        className="flex-1"
                      />
                      <Button onClick={handleAddIngredient} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {ingredients.map((ingredient, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group"
                        >
                          <span className="text-sm capitalize">{ingredient}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveIngredient(ingredient)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {ingredients.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <p className="text-sm">No ingredients added yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Allergens */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Allergen Information</CardTitle>
                  <CardDescription>Select allergens present in this item</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <button
                        key={allergen.id}
                        type="button"
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          allergens.includes(allergen.id)
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => handleAllergenToggle(allergen.id)}
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-xl">{allergen.icon}</span>
                          <span className={`text-xs font-medium text-center ${
                            allergens.includes(allergen.id) ? 'text-orange-700' : 'text-gray-700'
                          }`}>
                            {allergen.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    Size Variations & Pricing
                    <Button onClick={handleAddSize} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Size
                    </Button>
                  </CardTitle>
                  <CardDescription>Create different size options with custom pricing</CardDescription>
                </CardHeader>
                <CardContent>
                  {sizes.length > 0 ? (
                    <div className="space-y-4">
                      {sizes.map((size, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Size Name</Label>
                                <Input
                                  value={size.name}
                                  onChange={(e) => handleUpdateSize(index, 'name', e.target.value)}
                                  placeholder="e.g., Small, Medium, Large"
                                />
                              </div>
                              
                              <div>
                                <Label className="text-sm font-medium mb-2 block">Price (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={size.price}
                                  onChange={(e) => handleUpdateSize(index, 'price', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={size.isDefault}
                                  onCheckedChange={(checked) => {
                                    const updatedSizes = sizes.map((s, i) => ({
                                      ...s,
                                      isDefault: i === index ? checked : false
                                    }));
                                    setSizes(updatedSizes);
                                  }}
                                />
                                <Label className="text-sm">Default Size</Label>
                              </div>
                              
                              <div className="flex justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveSize(index)}
                                  className="text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium mb-2">No size variations added</h3>
                      <p className="text-gray-600 mb-4">The base price will be used for all orders</p>
                      <Button onClick={handleAddSize}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Size Variation
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dietary Tab */}
            <TabsContent value="dietary" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Dietary Restrictions & Preferences</CardTitle>
                  <CardDescription>
                    Help customers identify items that match their dietary needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {DIETARY_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData.dietary[option.key as keyof typeof formData.dietary]
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => 
                          setFormData({
                            ...formData,
                            dietary: { 
                              ...formData.dietary, 
                              [option.key]: !formData.dietary[option.key as keyof typeof formData.dietary] 
                            }
                          })
                        }
                      >
                        <div className="flex flex-col items-center space-y-2">
                          <span className="text-2xl">{option.icon}</span>
                          <span className={`text-sm font-medium text-center ${
                            formData.dietary[option.key as keyof typeof formData.dietary]
                              ? 'text-blue-700' 
                              : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* OS Theme Footer */}
        <div className="border-t bg-gradient-to-r from-gray-50 to-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">{completionProgress}% Complete</Badge>
              
              {Object.keys(errors).length > 0 ? (
                <div className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {Object.keys(errors).length} field{Object.keys(errors).length > 1 ? 's' : ''} need attention
                </div>
              ) : (
                <div className="text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  All fields validated
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              
              <Button 
                onClick={handleSave}
                disabled={loading || !formData.name || !formData.categoryId || formData.basePrice <= 0}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {item ? 'Update Menu Item' : 'Create Menu Item'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



