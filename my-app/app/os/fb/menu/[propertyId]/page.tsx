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
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to F&B Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Utensils className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Menu Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <ChefHat className="h-4 w-4" />
                    <span className="text-green-100">Restaurant Menu & Pricing</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-yellow-200 font-medium">Live Menu</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{menuItems.length}</div>
              <div className="text-green-200 text-sm">Menu Items</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-green-200 text-sm">Categories</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <Button 
              onClick={() => setIsCreateMode(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Menu Item
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Total Menu Items</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <Utensils className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">
              {menuItems.length}
            </div>
            <div className="flex items-center space-x-1">
              <ChefHat className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-emerald-600">Active items</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Categories</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Filter className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">
              {categories.length}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs text-blue-600">Menu sections</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">Available Items</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <Eye className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-amber-900 mb-1">
              {menuItems.filter(item => item.isAvailable).length}
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-amber-600">Ready to order</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Avg Price</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">
              ₹{menuItems.length ? Math.round(menuItems.reduce((sum, item) => sum + item.basePrice, 0) / menuItems.length) : 0}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-purple-600">Per item</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="menu" 
            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center space-x-2">
              <Utensils className="h-4 w-4" />
              <span>Menu Items</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-50 data-[state=active]:to-indigo-100 data-[state=active]:text-blue-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-blue-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                <Filter className="h-4 w-4 text-blue-600" />
              </div>
              <span>Categories</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="pricing" 
            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center space-x-2">
              <IndianRupee className="h-4 w-4" />
              <span>Pricing</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="display" 
            className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300"
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>Display</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Menu Items Tab */}
        <TabsContent value="menu" className="space-y-6 h-[calc(100vh-300px)] overflow-y-auto">
          {/* Enhanced Filters and Search - Modern OS Style */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
              <CardTitle className="text-green-800 flex items-center space-x-2">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Search className="h-5 w-5 text-green-600" />
                </div>
                <span>Search & Filter Menu Items</span>
              </CardTitle>
              <CardDescription className="text-green-600">
                Find and organize your menu items with advanced filtering options
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Search and Category Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                      <div className="relative flex items-center">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                          <Search className="w-4 h-4 text-green-600" />
                        </div>
                        <Input
                          placeholder="Search menu items by name or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-16 pr-4 py-3 w-96 border-0 bg-gradient-to-r from-green-50 to-emerald-50 focus:from-green-100 focus:to-emerald-100 focus:ring-2 focus:ring-green-500/20 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm rounded-xl font-medium text-green-800 placeholder:text-green-500"
                        />
                      </div>
                    </div>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="w-64 border-0 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-green-100 hover:to-emerald-100 group backdrop-blur-sm">
                        <div className="flex items-center space-x-3 w-full">
                          <div className="p-2 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                            <Filter className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <SelectValue placeholder="Filter by category" className="text-green-800 font-medium" />
                          </div>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                        <SelectItem value="all" className="rounded-lg hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 p-3 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100">
                              <Utensils className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium text-green-800">All Categories</span>
                          </div>
                        </SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id} className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                                <Filter className="w-4 h-4 text-blue-600" />
                              </div>
                              <span className="font-medium text-blue-800">{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="text-sm text-gray-700 font-medium bg-gradient-to-r from-green-50 to-teal-50 px-4 py-2 rounded-lg border border-green-200 shadow-sm">
                    <span className="text-green-600 font-bold text-lg">{filteredItems.length}</span> 
                    <span className="text-gray-500 mx-1">of</span> 
                    <span className="font-semibold text-gray-800">{menuItems.length}</span> 
                    <span className="text-gray-600 ml-1">items found</span>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <Switch 
                        id="show-inactive"
                        checked={showInactive}
                        onCheckedChange={setShowInactive}
                        className="data-[state=checked]:bg-blue-600"
                      />
                      <label htmlFor="show-inactive" className="text-sm font-medium text-blue-800 cursor-pointer">
                        Show Inactive Items
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className={viewMode === 'grid' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}
                      >
                        <Grid className="w-4 h-4" />
                        <span className="ml-2 hidden sm:inline">Grid</span>
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className={viewMode === 'list' ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-gray-100'}
                      >
                        <List className="w-4 h-4" />
                        <span className="ml-2 hidden sm:inline">List</span>
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <MenuImportExportButtons
                      onImportComplete={handleMenuItemImport}
                      exportData={menuItems}
                      exportFilename="menu-items"
                      splitButtons={true}
                    />
                    <Button 
                      onClick={() => setIsCreateMode(true)}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Item
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Menu Items Grid/List - OS Style */}
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredItems.map((item) => (
              <Card key={item.id} className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 ${!item.isActive ? 'opacity-60' : ''}`}>
                <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-teal-50 rounded-t-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center text-green-800">
                        <span className="font-bold">{item.name}</span>
                        {item.isFeatured && (
                          <div className="p-1 bg-yellow-100 rounded-full ml-2">
                            <Star className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-2 text-green-600">
                        {item.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                        className="p-2 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
                      >
                        {item.isAvailable ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Enhanced Price and Category */}
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                      <div className="flex items-center space-x-2">
                        <div className="p-2 bg-teal-500/20 rounded-lg">
                          <IndianRupee className="w-4 h-4 text-teal-600" />
                        </div>
                        <span className="font-bold text-xl text-teal-900">₹{item.basePrice}</span>
                      </div>
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 shadow-sm">{item.categoryName}</Badge>
                    </div>

                    {/* Enhanced Preparation Time */}
                    <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-800">{item.preparationTime} mins preparation</span>
                    </div>

                    {/* Enhanced Dietary and Spicy Level */}
                    <div className="flex flex-wrap gap-2">
                      {getDietaryBadges(item.dietary).map((badge, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm">
                          {badge}
                        </Badge>
                      ))}
                      {item.spicyLevel !== 'none' && (
                        <Badge className={`${getSpicyLevelColor(item.spicyLevel)} text-xs shadow-sm`}>
                          🌶️ {item.spicyLevel}
                        </Badge>
                      )}
                    </div>

                    {/* Enhanced Tags */}
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
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
                        className="border-green-200 text-green-600 hover:bg-green-50 hover:border-green-300 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm"
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
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="text-center py-12">
                <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-green-900 mb-2">No menu items found</h3>
                <p className="text-green-600 mb-6">Start building your menu by adding your first item</p>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white shadow-lg"
                  onClick={() => setIsCreateMode(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Menu Item
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="h-[calc(100vh-300px)] overflow-y-auto">
          <MenuCategoryManager 
            propertyId={propertyId}
            categories={categories}
            onCategoriesChange={setCategories}
          />
        </TabsContent>

        {/* Pricing Tab */}
        <TabsContent value="pricing" className="h-[calc(100vh-300px)] overflow-y-auto">
          <MenuPricing 
            propertyId={propertyId}
            menuItems={menuItems}
            onItemsChange={setMenuItems}
          />
        </TabsContent>

        {/* Display Tab */}
        <TabsContent value="display" className="h-[calc(100vh-300px)] overflow-y-auto">
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