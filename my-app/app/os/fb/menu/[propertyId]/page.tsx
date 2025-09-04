'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Clock,
  IndianRupee,
  ChefHat,
  Utensils,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MenuCategoryManager } from '@/components/os/fb/menu/MenuCategoryManager';
import { MenuItemEditor } from '@/components/os/fb/menu/MenuItemEditor';
import { MenuDisplayBoard } from '@/components/os/fb/menu/MenuDisplayBoard';
import { MenuPricing } from '@/components/os/fb/menu/MenuPricing';
import { MenuImportExportButtons, CategoryImportExportButtons } from '@/components/ui/import-export/ImportExportButtons';
import { ImportResult } from '@/lib/utils/fileProcessor';

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

export default function MenuManagement() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showInactive, setShowInactive] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories and menu items
        const [categoriesRes, itemsRes] = await Promise.all([
          fetch(`/api/fb/menu/categories/property?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/menu/items?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (!categoriesRes.ok || !itemsRes.ok) {
          throw new Error('Failed to fetch menu data');
        }

        const [categoriesData, itemsData] = await Promise.all([
          categoriesRes.json(),
          itemsRes.json()
        ]);
        
        setCategories(categoriesData.categories || []);
        if (categoriesData.success && itemsData.success) {
          setCategories(categoriesData.categories || []);
          setMenuItems(itemsData.items || []);
        } else {
          throw new Error('Menu API returned error responses');
        }
      } catch (err) {
        console.error('Error fetching menu data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load menu data');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchMenuData();
    }
  }, [propertyId, session]);

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesActiveFilter = showInactive || item.isActive;
    
    return matchesSearch && matchesCategory && matchesActiveFilter;
  });

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/fb/menu/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      });

      if (response.ok) {
        setMenuItems(items =>
          items.map(item =>
            item.id === itemId ? { ...item, isAvailable: !isAvailable } : item
          )
        );
      }
    } catch (err) {
      console.error('Error updating item availability:', err);
    }
  };

  const getDietaryBadges = (dietary: MenuItem['dietary']) => {
    const badges = [];
    if (dietary.vegetarian) badges.push('Veg');
    if (dietary.vegan) badges.push('Vegan');
    if (dietary.glutenFree) badges.push('Gluten-Free');
    return badges;
  };

  const getSpicyLevelColor = (level: string) => {
    switch (level) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hot': return 'bg-orange-100 text-orange-800';
      case 'extra_hot': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Import/Export Handlers
  const handleMenuItemImport = async (result: ImportResult, transformedData: any[]) => {
    try {
      const response = await fetch(`/api/fb/menu/items/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          items: transformedData,
          options: {
            skipExisting: false,
            updateExisting: true
          }
        })
      });

      if (response.ok) {
        const importResult = await response.json();
        alert(`Import completed: ${importResult.importResults.imported} imported, ${importResult.importResults.updated} updated, ${importResult.importResults.failed} failed`);
        
        // Refresh menu data
        const fetchMenuData = async () => {
          try {
            setLoading(true);
            
            const [categoriesRes, itemsRes] = await Promise.all([
              fetch(`/api/fb/menu/categories/property?propertyId=${propertyId}`),
              fetch(`/api/fb/menu/items?propertyId=${propertyId}`)
            ]);

            const [categoriesData, itemsData] = await Promise.all([
              categoriesRes.json(),
              itemsRes.json()
            ]);
            
            if (categoriesData.success && itemsData.success) {
              setCategories(categoriesData.categories || []);
              setMenuItems(itemsData.items || []);
            }
          } catch (err) {
            console.error('Error refreshing menu data:', err);
          } finally {
            setLoading(false);
          }
        };

        fetchMenuData();
      } else {
        alert('Import failed. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    }
  };

  const handleCategoryImport = async (result: ImportResult, transformedData: any[]) => {
    try {
      const response = await fetch(`/api/fb/menu/categories/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          categories: transformedData,
          options: {
            skipExisting: false,
            updateExisting: true
          }
        })
      });

      if (response.ok) {
        const importResult = await response.json();
        alert(`Import completed: ${importResult.importResults.imported} imported, ${importResult.importResults.updated} updated, ${importResult.importResults.failed} failed`);
        
        // Refresh categories
        const categoriesRes = await fetch(`/api/fb/menu/categories/property?propertyId=${propertyId}`);
        const categoriesData = await categoriesRes.json();
        if (categoriesData.success) {
          setCategories(categoriesData.categories || []);
        }
      } else {
        alert('Import failed. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to F&B Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
            <p className="text-gray-600 mt-2">Manage your restaurant menu, categories, and pricing</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button 
            onClick={() => setIsCreateMode(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="menu">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="menu" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="show-inactive"
                      checked={showInactive}
                      onCheckedChange={setShowInactive}
                    />
                    <label htmlFor="show-inactive" className="text-sm">Show Inactive</label>
                  </div>
                  
                  <div className="flex items-center space-x-1 border rounded-md">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Import/Export Buttons */}
                  <MenuImportExportButtons
                    onImportComplete={handleMenuItemImport}
                    exportData={menuItems}
                    exportFilename="menu-items"
                    splitButtons={true}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Grid/List */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => (
              <Card key={item.id} className={`relative ${!item.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center">
                        {item.name}
                        {item.isFeatured && <Star className="w-4 h-4 text-yellow-500 ml-2" />}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {item.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                    >
                      {item.isAvailable ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Price and Category */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <IndianRupee className="w-4 h-4 text-gray-500" />
                        <span className="font-semibold text-lg">₹{item.basePrice}</span>
                      </div>
                      <Badge variant="outline">{item.categoryName}</Badge>
                    </div>

                    {/* Preparation Time */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{item.preparationTime} mins</span>
                    </div>

                    {/* Dietary and Spicy Level */}
                    <div className="flex flex-wrap gap-2">
                      {getDietaryBadges(item.dietary).map((badge, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                      {item.spicyLevel !== 'none' && (
                        <Badge className={`${getSpicyLevelColor(item.spicyLevel)} text-xs`}>
                          {item.spicyLevel}
                        </Badge>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingItem(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Utensils className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No menu items found</p>
                <Button 
                  className="mt-4"
                  onClick={() => setIsCreateMode(true)}
                >
                  Add First Menu Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <MenuCategoryManager 
            propertyId={propertyId}
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing">
          <MenuPricing 
            propertyId={propertyId}
            menuItems={menuItems}
            onItemsChange={setMenuItems}
          />
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display">
          <MenuDisplayBoard 
            propertyId={propertyId}
            categories={categories}
            menuItems={menuItems}
          />
        </TabsContent>
      </Tabs>

      {/* Menu Item Editor Modal */}
      {(editingItem || isCreateMode) && (
        <MenuItemEditor
          item={editingItem}
          categories={categories}
          propertyId={propertyId}
          onClose={() => {
            setEditingItem(null);
            setIsCreateMode(false);
          }}
          onSave={(updatedItem) => {
            if (editingItem) {
              setMenuItems(items =>
                items.map(item => item.id === updatedItem.id ? updatedItem : item)
              );
            } else {
              setMenuItems(items => [...items, updatedItem]);
            }
            setEditingItem(null);
            setIsCreateMode(false);
          }}
        />
      )}
    </div>
  );
}