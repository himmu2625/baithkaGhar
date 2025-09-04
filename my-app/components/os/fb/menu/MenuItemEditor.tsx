'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Save, 
  X, 
  Upload, 
  Plus, 
  Trash2,
  Star,
  Clock,
  DollarSign,
  ChefHat
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  { value: 'food', label: 'Food' },
  { value: 'beverage', label: 'Beverage' },
  { value: 'combo', label: 'Combo' },
];

const SPICY_LEVELS = [
  { value: 'none', label: 'Not Spicy' },
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'hot', label: 'Hot' },
  { value: 'extra_hot', label: 'Extra Hot' },
];

const COMMON_ALLERGENS = [
  'nuts', 'dairy', 'eggs', 'soy', 'wheat', 'shellfish', 'fish', 'sesame'
];

export function MenuItemEditor({ item, categories, propertyId, onClose, onSave }: MenuItemEditorProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
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

  const handleSave = async () => {
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
        
        // Add category name for display
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
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Edit Menu Item' : 'Create Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {item 
              ? 'Update the menu item details below.'
              : 'Add a new item to your menu.'
            }
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="dietary">Dietary</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Item Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Butter Chicken"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  value={formData.categoryId} 
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger>
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
              </div>

              <div>
                <Label htmlFor="itemType">Item Type *</Label>
                <Select 
                  value={formData.itemType} 
                  onValueChange={(value) => setFormData({ ...formData, itemType: value as 'food' | 'beverage' | 'combo' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="basePrice">Base Price (₹) *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the item, ingredients, preparation method..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                placeholder="https://example.com/image.jpg"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
                />
                <Label htmlFor="isAvailable">Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                />
                <Label htmlFor="isFeatured">Featured</Label>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="preparationTime">Preparation Time (minutes)</Label>
                <Input
                  id="preparationTime"
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) || 15 })}
                />
              </div>

              <div>
                <Label htmlFor="spicyLevel">Spicy Level</Label>
                <Select 
                  value={formData.spicyLevel} 
                  onValueChange={(value) => setFormData({ ...formData, spicyLevel: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPICY_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button onClick={handleAddTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer">
                    {tag}
                    <X 
                      className="w-3 h-3 ml-1" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <Label>Ingredients</Label>
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  placeholder="Add an ingredient"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                />
                <Button onClick={handleAddIngredient} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer">
                    {ingredient}
                    <X 
                      className="w-3 h-3 ml-1" 
                      onClick={() => handleRemoveIngredient(ingredient)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Allergens */}
            <div>
              <Label>Allergens</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {COMMON_ALLERGENS.map((allergen) => (
                  <div key={allergen} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`allergen-${allergen}`}
                      checked={allergens.includes(allergen)}
                      onChange={() => handleAllergenToggle(allergen)}
                      className="rounded"
                    />
                    <Label 
                      htmlFor={`allergen-${allergen}`}
                      className="text-sm capitalize cursor-pointer"
                    >
                      {allergen}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Size Variations</Label>
              <Button onClick={handleAddSize} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Size
              </Button>
            </div>
            
            <div className="space-y-4">
              {sizes.map((size, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Size Name</Label>
                        <Input
                          value={size.name}
                          onChange={(e) => handleUpdateSize(index, 'name', e.target.value)}
                          placeholder="e.g., Small, Medium, Large"
                        />
                      </div>
                      <div>
                        <Label>Price (₹)</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={size.price}
                          onChange={(e) => handleUpdateSize(index, 'price', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={size.isDefault}
                            onCheckedChange={(checked) => {
                              // Ensure only one default size
                              const updatedSizes = sizes.map((s, i) => ({
                                ...s,
                                isDefault: i === index ? checked : false
                              }));
                              setSizes(updatedSizes);
                            }}
                          />
                          <Label className="text-sm">Default</Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSize(index)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {sizes.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <p>No size variations added. The base price will be used.</p>
              </div>
            )}
          </TabsContent>

          {/* Dietary Tab */}
          <TabsContent value="dietary" className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Dietary Restrictions</Label>
              <p className="text-sm text-gray-600 mb-4">
                Select all dietary categories that apply to this item.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(formData.dietary).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <Switch
                      id={`dietary-${key}`}
                      checked={value}
                      onCheckedChange={(checked) => 
                        setFormData({
                          ...formData,
                          dietary: { ...formData.dietary, [key]: checked }
                        })
                      }
                    />
                    <Label htmlFor={`dietary-${key}`} className="capitalize cursor-pointer">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={loading || !formData.name || !formData.categoryId || formData.basePrice <= 0}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : item ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}