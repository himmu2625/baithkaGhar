'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
  IndianRupee,
  ChefHat,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { CategoryImportExportButtons } from '@/components/ui/import-export/ImportExportButtons';
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

interface MenuCategoryManagerProps {
  propertyId: string;
  categories: MenuCategory[];
  onCategoriesChange: (categories: MenuCategory[]) => void;
}

const CATEGORY_TYPES = [
  { value: 'appetizer', label: 'Appetizers' },
  { value: 'main_course', label: 'Main Course' },
  { value: 'dessert', label: 'Desserts' },
  { value: 'beverage', label: 'Beverages' },
  { value: 'snack', label: 'Snacks' },
  { value: 'salad', label: 'Salads' },
  { value: 'soup', label: 'Soups' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

export function MenuCategoryManager({ propertyId, categories, onCategoriesChange }: MenuCategoryManagerProps) {
  const { data: session } = useSession();
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryType: '',
    isActive: true,
  });

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(categories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update display orders
    const updatedItems = items.map((item, index) => ({
      ...item,
      displayOrder: index + 1,
    }));

    onCategoriesChange(updatedItems);

    // Save order to backend
    try {
      await fetch(`/api/fb/menu/categories/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          propertyId,
          categories: updatedItems.map(item => ({ id: item.id, displayOrder: item.displayOrder })),
        }),
      });
    } catch (error) {
      console.error('Error updating category order:', error);
    }
  };

  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      
      const categoryData = {
        ...formData,
        propertyId,
        displayOrder: editingCategory ? editingCategory.displayOrder : categories.length + 1,
      };

      const url = editingCategory 
        ? `/api/fb/menu/categories/${editingCategory.id}`
        : '/api/fb/menu/categories';
      
      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(categoryData),
      });

      if (response.ok) {
        const result = await response.json();
        const savedCategory = result.category;

        if (editingCategory) {
          onCategoriesChange(
            categories.map(cat => 
              cat.id === editingCategory.id ? { ...savedCategory, itemCount: cat.itemCount } : cat
            )
          );
        } else {
          onCategoriesChange([...categories, { ...savedCategory, itemCount: 0 }]);
        }

        resetForm();
      } else {
        throw new Error('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/fb/menu/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        onCategoriesChange(categories.filter(cat => cat.id !== categoryId));
      } else {
        throw new Error('Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const handleToggleActive = async (categoryId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/fb/menu/categories/${categoryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        onCategoriesChange(
          categories.map(cat =>
            cat.id === categoryId ? { ...cat, isActive: !isActive } : cat
          )
        );
      }
    } catch (error) {
      console.error('Error toggling category status:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', categoryType: '', isActive: true });
    setEditingCategory(null);
    setIsCreateMode(false);
  };

  const openEditMode = (category: MenuCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
      categoryType: category.categoryType,
      isActive: category.isActive,
    });
    setEditingCategory(category);
    setIsCreateMode(true);
  };

  const handleCategoryImport = async (result: ImportResult, transformedData: any[]) => {
    try {
      const response = await fetch(`/api/fb/menu/categories/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
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
          onCategoriesChange(categoriesData.categories || []);
        }
      } else {
        alert('Import failed. Please try again.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    }
  };

  const getCategoryTypeLabel = (type: string) => {
    return CATEGORY_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header - OS Style */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Menu Categories</h2>
                <p className="text-purple-100 mt-1">Organize your menu items into categories</p>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-3">
            <div className="text-center">
              <div className="text-2xl font-bold">{categories.length}</div>
              <div className="text-purple-200 text-sm">Categories</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <CategoryImportExportButtons
              onImportComplete={handleCategoryImport}
              exportData={categories}
              exportFilename="menu-categories"
              splitButtons={true}
            />
            <Button 
              onClick={() => setIsCreateMode(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Categories List - OS Style */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
          <CardTitle className="text-purple-800 flex items-center space-x-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <GripVertical className="h-5 w-5 text-purple-600" />
            </div>
            <span>Categories ({categories.length})</span>
          </CardTitle>
          <CardDescription className="text-purple-600">
            Drag and drop to reorder categories. The order will be reflected in your menu display.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`relative overflow-hidden flex items-center justify-between p-6 border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group ${
                            snapshot.isDragging ? 'shadow-2xl scale-105 bg-gradient-to-r from-blue-50 to-indigo-100' : 'bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200'
                          } ${!category.isActive ? 'opacity-60' : ''}`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
                          <div className="relative flex items-center space-x-4">
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg text-blue-900">{category.name}</h3>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  {getCategoryTypeLabel(category.categoryType)}
                                </Badge>
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                  {category.itemCount} items
                                </Badge>
                              </div>
                              {category.description && (
                                <p className="text-blue-600 text-sm mt-1">{category.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="relative flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(category.id, category.isActive)}
                            >
                              {category.isActive ? (
                                <Eye className="w-4 h-4 text-blue-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditMode(category)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 shadow-sm"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={category.itemCount > 0}
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 shadow-sm disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="p-4 bg-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Plus className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-purple-900 mb-2">No categories created yet</h3>
              <p className="text-purple-600 mb-6">Create your first category to organize menu items</p>
              <Button 
                onClick={() => setIsCreateMode(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Category Dialog */}
      <Dialog open={isCreateMode} onOpenChange={setIsCreateMode}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update the category details below.'
                : 'Add a new category to organize your menu items.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Course, Appetizers"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="categoryType" className="text-blue-800 font-medium">Category Type</Label>
              <Select value={formData.categoryType} onValueChange={(value) => setFormData({ ...formData, categoryType: value })}>
                <SelectTrigger className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 group backdrop-blur-sm">
                  <div className="flex items-center space-x-3 w-full">
                    <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                      <Filter className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <SelectValue placeholder="Select category type" className="text-blue-800 font-medium" />
                    </div>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                  {CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                          <ChefHat className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="font-medium text-blue-800">{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active Category</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveCategory}
              disabled={loading || !formData.name || !formData.categoryType}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}