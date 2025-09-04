'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Book,
  Utensils,
  Scale,
  Timer,
  Star,
  Search,
  Filter
} from 'lucide-react';

interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  preparation?: string;
  optional: boolean;
  substituteIds?: string[];
}

interface Recipe {
  id: string;
  name: string;
  description: string;
  category: string;
  cuisine: string;
  difficulty: 'easy' | 'medium' | 'hard';
  preparationTime: number; // minutes
  cookingTime: number; // minutes
  servings: number;
  ingredients: RecipeIngredient[];
  instructions: string[];
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  allergens: string[];
  dietaryTags: string[];
  costPerServing: number;
  profitMargin: number;
  popularity: number; // 1-5 stars
  lastUpdated: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'testing';
  photos?: string[];
  notes?: string;
}

interface RecipeManagementProps {
  recipes: Recipe[];
  availableIngredients: Array<{
    id: string;
    name: string;
    unit: string;
    costPerUnit: number;
    category: string;
  }>;
  onRecipeCreate: (recipe: Omit<Recipe, 'id'>) => void;
  onRecipeUpdate: (recipeId: string, updates: Partial<Recipe>) => void;
  onRecipeDelete: (recipeId: string) => void;
  onRecipeStatusChange: (recipeId: string, status: Recipe['status']) => void;
}

export default function RecipeManagement({
  recipes,
  availableIngredients,
  onRecipeCreate,
  onRecipeUpdate,
  onRecipeDelete,
  onRecipeStatusChange
}: RecipeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Form state for recipe creation/editing
  const [formData, setFormData] = useState<Partial<Recipe>>({
    name: '',
    description: '',
    category: '',
    cuisine: '',
    difficulty: 'medium',
    preparationTime: 0,
    cookingTime: 0,
    servings: 1,
    ingredients: [],
    instructions: [''],
    allergens: [],
    dietaryTags: [],
    status: 'testing'
  });

  const categories = ['all', ...new Set(recipes.map(r => r.category))];
  const cuisines = [...new Set(recipes.map(r => r.cuisine))];
  const commonAllergens = ['Dairy', 'Eggs', 'Fish', 'Shellfish', 'Nuts', 'Peanuts', 'Soy', 'Wheat', 'Gluten'];
  const dietaryTags = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Nut-Free', 'Low-Carb', 'Keto', 'Halal', 'Kosher'];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || recipe.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || recipe.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'all' || recipe.status === statusFilter;
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
  });

  const getDifficultyColor = (difficulty: Recipe['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: Recipe['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'testing': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateRecipeCost = (ingredients: RecipeIngredient[]) => {
    return ingredients.reduce((total, ingredient) => {
      const availableIngredient = availableIngredients.find(ai => ai.id === ingredient.ingredientId);
      if (availableIngredient) {
        return total + (ingredient.quantity * availableIngredient.costPerUnit);
      }
      return total;
    }, 0);
  };

  const addIngredientToForm = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [
        ...(prev.ingredients || []),
        {
          id: Date.now().toString(),
          ingredientId: '',
          ingredientName: '',
          quantity: 0,
          unit: '',
          preparation: '',
          optional: false
        }
      ]
    }));
  };

  const removeIngredientFromForm = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.filter((_, i) => i !== index) || []
    }));
  };

  const updateIngredientInForm = (index: number, updates: Partial<RecipeIngredient>) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients?.map((ing, i) => 
        i === index ? { ...ing, ...updates } : ing
      ) || []
    }));
  };

  const addInstructionStep = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...(prev.instructions || []), '']
    }));
  };

  const updateInstructionStep = (index: number, instruction: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.map((inst, i) => 
        i === index ? instruction : inst
      ) || []
    }));
  };

  const removeInstructionStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions?.filter((_, i) => i !== index) || []
    }));
  };

  const handleSubmit = () => {
    if (formData.name && formData.ingredients?.length && formData.instructions?.length) {
      const totalCost = calculateRecipeCost(formData.ingredients);
      const costPerServing = totalCost / (formData.servings || 1);
      
      const recipe: Omit<Recipe, 'id'> = {
        ...formData as Recipe,
        costPerServing,
        profitMargin: 0.3, // Default 30% margin
        popularity: 0,
        lastUpdated: new Date(),
        createdBy: 'current_user' // Replace with actual user
      };
      
      if (selectedRecipe) {
        onRecipeUpdate(selectedRecipe.id, recipe);
      } else {
        onRecipeCreate(recipe);
      }
      
      setIsCreateDialogOpen(false);
      setSelectedRecipe(null);
      setFormData({
        name: '',
        description: '',
        category: '',
        cuisine: '',
        difficulty: 'medium',
        preparationTime: 0,
        cookingTime: 0,
        servings: 1,
        ingredients: [],
        instructions: [''],
        allergens: [],
        dietaryTags: [],
        status: 'testing'
      });
    }
  };

  const RecipeFormDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => { setSelectedRecipe(null); setFormData({ name: '', ingredients: [], instructions: [''] }); }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Recipe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {selectedRecipe ? 'Edit Recipe' : 'Create New Recipe'}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Recipe Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter recipe name"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Appetizer, Main Course, Dessert"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="cuisine">Cuisine</Label>
                <Input
                  id="cuisine"
                  value={formData.cuisine || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuisine: e.target.value }))}
                  placeholder="e.g., Italian, Chinese"
                />
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select 
                  value={formData.difficulty || 'medium'} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, difficulty: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prepTime">Prep Time (min)</Label>
                <Input
                  id="prepTime"
                  type="number"
                  min="0"
                  value={formData.preparationTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, preparationTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="cookTime">Cook Time (min)</Label>
                <Input
                  id="cookTime"
                  type="number"
                  min="0"
                  value={formData.cookingTime || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookingTime: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                value={formData.servings || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                className="w-32"
              />
            </div>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Recipe Ingredients</h4>
              <Button onClick={addIngredientToForm} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.ingredients?.map((ingredient, index) => (
                <div key={ingredient.id} className="grid grid-cols-12 gap-2 items-end p-3 border rounded-lg">
                  <div className="col-span-4">
                    <Label className="text-xs">Ingredient</Label>
                    <Select 
                      value={ingredient.ingredientId} 
                      onValueChange={(value) => {
                        const selected = availableIngredients.find(ai => ai.id === value);
                        if (selected) {
                          updateIngredientInForm(index, {
                            ingredientId: value,
                            ingredientName: selected.name,
                            unit: selected.unit
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ingredient" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableIngredients.map(ing => (
                          <SelectItem key={ing.id} value={ing.id}>
                            {ing.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ingredient.quantity || ''}
                      onChange={(e) => updateIngredientInForm(index, {
                        quantity: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label className="text-xs">Unit</Label>
                    <Input
                      value={ingredient.unit}
                      onChange={(e) => updateIngredientInForm(index, {
                        unit: e.target.value
                      })}
                    />
                  </div>
                  
                  <div className="col-span-3">
                    <Label className="text-xs">Preparation</Label>
                    <Input
                      value={ingredient.preparation || ''}
                      onChange={(e) => updateIngredientInForm(index, {
                        preparation: e.target.value
                      })}
                      placeholder="e.g., chopped, minced"
                    />
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeIngredientFromForm(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Cooking Instructions</h4>
              <Button onClick={addInstructionStep} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={instruction}
                      onChange={(e) => updateInstructionStep(index, e.target.value)}
                      placeholder={`Step ${index + 1} instructions...`}
                      rows={2}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeInstructionStep(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div>
              <Label>Allergens</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonAllergens.map(allergen => (
                  <Button
                    key={allergen}
                    size="sm"
                    variant={formData.allergens?.includes(allergen) ? 'default' : 'outline'}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        allergens: prev.allergens?.includes(allergen) 
                          ? prev.allergens.filter(a => a !== allergen)
                          : [...(prev.allergens || []), allergen]
                      }));
                    }}
                  >
                    {allergen}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {dietaryTags.map(tag => (
                  <Button
                    key={tag}
                    size="sm"
                    variant={formData.dietaryTags?.includes(tag) ? 'default' : 'outline'}
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        dietaryTags: prev.dietaryTags?.includes(tag) 
                          ? prev.dietaryTags.filter(t => t !== tag)
                          : [...(prev.dietaryTags || []), tag]
                      }));
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any additional notes or tips for preparation"
                rows={3}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1">
            {selectedRecipe ? 'Update Recipe' : 'Create Recipe'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Recipe Management
            </CardTitle>
            <RecipeFormDialog />
          </div>
          
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => {
          const totalTime = recipe.preparationTime + recipe.cookingTime;
          
          return (
            <Card key={recipe.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{recipe.name}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {recipe.description}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRecipe(recipe);
                        setFormData(recipe);
                        setIsCreateDialogOpen(true);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRecipeDelete(recipe.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(recipe.status)}>
                    {recipe.status}
                  </Badge>
                  <Badge className={getDifficultyColor(recipe.difficulty)}>
                    {recipe.difficulty}
                  </Badge>
                  <Badge variant="outline">{recipe.category}</Badge>
                  <Badge variant="outline">{recipe.cuisine}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{totalTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{recipe.servings} servings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Scale className="h-4 w-4" />
                    <span>${recipe.costPerServing.toFixed(2)}/serving</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    <span>{recipe.popularity}/5</span>
                  </div>
                </div>

                {recipe.dietaryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {recipe.dietaryTags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.dietaryTags.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{recipe.dietaryTags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {recipe.allergens.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Contains: {recipe.allergens.slice(0, 2).join(', ')}</span>
                    {recipe.allergens.length > 2 && <span>+{recipe.allergens.length - 2}</span>}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Select
                    value={recipe.status}
                    onValueChange={(status: Recipe['status']) => onRecipeStatusChange(recipe.id, status)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="testing">Testing</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredRecipes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <ChefHat className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Recipes Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first recipe to get started'}
            </p>
            <RecipeFormDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}