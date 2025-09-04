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
  X
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Menu Categories</h2>
          <p className="text-gray-600">Organize your menu items into categories</p>
        </div>
        <div className="flex items-center space-x-3">
          <CategoryImportExportButtons
            onImportComplete={handleCategoryImport}
            exportData={categories}
            exportFilename="menu-categories"
            splitButtons={true}
          />
          <Button onClick={() => setIsCreateMode(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
          <CardDescription>
            Drag and drop to reorder categories. The order will be reflected in your menu display.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                          className={`flex items-center justify-between p-4 border rounded-lg bg-white ${
                            snapshot.isDragging ? 'shadow-lg' : ''
                          } ${!category.isActive ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center space-x-4">
                            <div
                              {...provided.dragHandleProps}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <GripVertical className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-lg">{category.name}</h3>
                                <Badge variant="outline">
                                  {getCategoryTypeLabel(category.categoryType)}
                                </Badge>
                                <Badge variant="secondary">
                                  {category.itemCount} items
                                </Badge>
                              </div>
                              {category.description && (
                                <p className="text-gray-600 text-sm mt-1">{category.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(category.id, category.isActive)}
                            >
                              {category.isActive ? (
                                <Eye className="w-4 h-4 text-green-600" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-gray-400" />
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditMode(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteCategory(category.id)}
                              disabled={category.itemCount > 0}
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
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No categories created yet</p>
              <Button onClick={() => setIsCreateMode(true)}>
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
              <Label htmlFor="categoryType">Category Type</Label>
              <Select value={formData.categoryType} onValueChange={(value) => setFormData({ ...formData, categoryType: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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