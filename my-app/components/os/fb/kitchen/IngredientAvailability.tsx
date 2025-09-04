'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
  Package, 
  AlertTriangle, 
  CheckCircle,
  Minus,
  Plus,
  ShoppingCart,
  Clock,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  Bell,
  Truck,
  Calendar
} from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minimumLevel: number;
  maximumLevel: number;
  costPerUnit: number;
  supplier: string;
  expiryDate?: Date;
  lastRestocked: Date;
  consumptionRate: number; // per day
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
  location: string;
  allergenInfo?: string[];
}

interface Recipe {
  id: string;
  dishName: string;
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
  canMake: boolean;
  maxPortions: number;
  missingIngredients: string[];
}

interface RestockRequest {
  id: string;
  ingredientId: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  requestDate: Date;
  status: 'pending' | 'approved' | 'ordered' | 'received';
  estimatedDelivery?: Date;
  notes?: string;
}

interface IngredientAvailabilityProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  restockRequests: RestockRequest[];
  onStockUpdate: (ingredientId: string, newStock: number, reason: string) => void;
  onRestockRequest: (ingredientId: string, quantity: number, priority: string, notes?: string) => void;
  onIngredientAdd: (ingredient: Omit<Ingredient, 'id'>) => void;
}

export default function IngredientAvailability({
  ingredients,
  recipes,
  restockRequests,
  onStockUpdate,
  onRestockRequest,
  onIngredientAdd
}: IngredientAvailabilityProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [stockUpdateQuantity, setStockUpdateQuantity] = useState(0);
  const [stockUpdateReason, setStockUpdateReason] = useState('');
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [restockPriority, setRestockPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [restockNotes, setRestockNotes] = useState('');

  const categories = ['all', ...new Set(ingredients.map(ing => ing.category))];

  const getStatusColor = (status: Ingredient['status']) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'out_of_stock': return 'bg-red-500';
      case 'expired': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getStockLevel = (ingredient: Ingredient) => {
    return (ingredient.currentStock / ingredient.maximumLevel) * 100;
  };

  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getEstimatedDaysLeft = (ingredient: Ingredient) => {
    if (ingredient.consumptionRate <= 0) return Infinity;
    return Math.floor(ingredient.currentStock / ingredient.consumptionRate);
  };

  const filteredIngredients = ingredients.filter(ingredient => {
    const matchesSearch = ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || ingredient.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || ingredient.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = ingredients.filter(ing => ing.status === 'low_stock').length;
  const outOfStockCount = ingredients.filter(ing => ing.status === 'out_of_stock').length;
  const expiredCount = ingredients.filter(ing => ing.status === 'expired').length;
  const expiringSoonCount = ingredients.filter(ing => 
    ing.expiryDate && getDaysUntilExpiry(ing.expiryDate) <= 3
  ).length;

  const unavailableRecipes = recipes.filter(recipe => !recipe.canMake).length;

  const handleStockUpdate = () => {
    if (selectedIngredient && stockUpdateQuantity !== 0 && stockUpdateReason) {
      onStockUpdate(
        selectedIngredient.id, 
        selectedIngredient.currentStock + stockUpdateQuantity,
        stockUpdateReason
      );
      setStockUpdateQuantity(0);
      setStockUpdateReason('');
      setSelectedIngredient(null);
    }
  };

  const handleRestockRequest = () => {
    if (selectedIngredient && restockQuantity > 0) {
      onRestockRequest(
        selectedIngredient.id,
        restockQuantity,
        restockPriority,
        restockNotes
      );
      setRestockQuantity(0);
      setRestockPriority('medium');
      setRestockNotes('');
      setSelectedIngredient(null);
    }
  };

  const StockUpdateDialog = ({ ingredient }: { ingredient: Ingredient | null }) => (
    <Dialog open={!!ingredient} onOpenChange={() => setSelectedIngredient(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Stock - {ingredient?.name}</DialogTitle>
        </DialogHeader>
        {ingredient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Stock</Label>
                <div className="text-2xl font-bold">
                  {ingredient.currentStock} {ingredient.unit}
                </div>
              </div>
              <div>
                <Label>Stock Level</Label>
                <Progress value={getStockLevel(ingredient)} className="mt-2" />
                <div className="text-sm text-muted-foreground mt-1">
                  {getStockLevel(ingredient).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="stockChange">Stock Change</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStockUpdateQuantity(prev => prev - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="stockChange"
                  type="number"
                  value={stockUpdateQuantity || ''}
                  onChange={(e) => setStockUpdateQuantity(parseInt(e.target.value) || 0)}
                  className="text-center"
                />
                <Button
                  variant="outline"
                  onClick={() => setStockUpdateQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                New stock will be: {ingredient.currentStock + stockUpdateQuantity} {ingredient.unit}
              </div>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Update</Label>
              <Select value={stockUpdateReason} onValueChange={setStockUpdateReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usage">Used in preparation</SelectItem>
                  <SelectItem value="waste">Waste/Spoilage</SelectItem>
                  <SelectItem value="restock">New delivery received</SelectItem>
                  <SelectItem value="count_correction">Inventory count correction</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setSelectedIngredient(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleStockUpdate} className="flex-1">
                Update Stock
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const RestockRequestDialog = ({ ingredient }: { ingredient: Ingredient | null }) => (
    <Dialog open={!!ingredient && restockQuantity > 0} onOpenChange={() => {
      setSelectedIngredient(null);
      setRestockQuantity(0);
    }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Restock - {ingredient?.name}</DialogTitle>
        </DialogHeader>
        {ingredient && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Current Stock</Label>
                <div className="text-lg font-bold text-red-600">
                  {ingredient.currentStock} {ingredient.unit}
                </div>
              </div>
              <div>
                <Label>Minimum Level</Label>
                <div className="text-lg font-bold">
                  {ingredient.minimumLevel} {ingredient.unit}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="restockQuantity">Quantity to Order</Label>
              <Input
                id="restockQuantity"
                type="number"
                min="1"
                value={restockQuantity || ''}
                onChange={(e) => setRestockQuantity(parseInt(e.target.value) || 0)}
              />
              <div className="text-sm text-muted-foreground mt-1">
                Estimated cost: ${(restockQuantity * ingredient.costPerUnit).toFixed(2)}
              </div>
            </div>

            <div>
              <Label>Priority</Label>
              <Select value={restockPriority} onValueChange={(value: any) => setRestockPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Can wait</SelectItem>
                  <SelectItem value="medium">Medium - Normal restock</SelectItem>
                  <SelectItem value="high">High - Needed soon</SelectItem>
                  <SelectItem value="urgent">Urgent - Critical shortage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                placeholder="Additional information or special requirements"
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setRestockQuantity(0)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleRestockRequest} className="flex-1">
                Submit Request
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      {/* Alert Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
              </div>
              <Package className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired Items</p>
                <p className="text-2xl font-bold text-purple-600">{expiredCount}</p>
              </div>
              <Clock className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-orange-600">{expiringSoonCount}</p>
              </div>
              <Calendar className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unavailable Dishes</p>
                <p className="text-2xl font-bold text-red-600">{unavailableRecipes}</p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ingredients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ingredients">Ingredients</TabsTrigger>
          <TabsTrigger value="recipes">Recipe Availability</TabsTrigger>
          <TabsTrigger value="restock">Restock Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Ingredient Inventory</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search ingredients..."
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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredIngredients.map(ingredient => {
                  const stockLevel = getStockLevel(ingredient);
                  const daysLeft = getEstimatedDaysLeft(ingredient);
                  const expiryDays = ingredient.expiryDate ? getDaysUntilExpiry(ingredient.expiryDate) : null;
                  
                  return (
                    <div key={ingredient.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{ingredient.name}</h4>
                            <Badge className={getStatusColor(ingredient.status)}>
                              {ingredient.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">{ingredient.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {ingredient.location} • Supplier: {ingredient.supplier}
                          </div>
                          {ingredient.allergenInfo && ingredient.allergenInfo.length > 0 && (
                            <div className="text-sm text-orange-600 mt-1">
                              Allergens: {ingredient.allergenInfo.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {ingredient.currentStock} {ingredient.unit}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${ingredient.costPerUnit.toFixed(2)}/{ingredient.unit}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Stock Level</Label>
                          <Progress 
                            value={stockLevel} 
                            className={`h-2 mt-1 ${
                              stockLevel < 25 ? 'progress-red' : 
                              stockLevel < 50 ? 'progress-yellow' : 'progress-green'
                            }`}
                          />
                          <div className="text-xs mt-1">
                            {stockLevel.toFixed(1)}% ({ingredient.minimumLevel}-{ingredient.maximumLevel} {ingredient.unit})
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Days Left</Label>
                          <div className={`font-bold ${daysLeft <= 2 ? 'text-red-600' : daysLeft <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {daysLeft === Infinity ? '∞' : `${daysLeft} days`}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            @ {ingredient.consumptionRate} {ingredient.unit}/day
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-muted-foreground">Expiry</Label>
                          <div className={`font-bold ${
                            expiryDays && expiryDays <= 0 ? 'text-purple-600' :
                            expiryDays && expiryDays <= 3 ? 'text-red-600' :
                            expiryDays && expiryDays <= 7 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {ingredient.expiryDate ? 
                              expiryDays && expiryDays <= 0 ? 'EXPIRED' : `${expiryDays} days` :
                              'No expiry'
                            }
                          </div>
                          {ingredient.expiryDate && (
                            <div className="text-xs text-muted-foreground">
                              {ingredient.expiryDate.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedIngredient(ingredient);
                            setStockUpdateQuantity(0);
                          }}
                        >
                          Update Stock
                        </Button>
                        
                        {(ingredient.status === 'low_stock' || ingredient.status === 'out_of_stock') && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedIngredient(ingredient);
                              setRestockQuantity(ingredient.maximumLevel - ingredient.currentStock);
                            }}
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Restock
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recipes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipe Availability Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recipes.map(recipe => (
                  <div key={recipe.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{recipe.dishName}</h4>
                          {recipe.canMake ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Available
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        
                        {recipe.canMake ? (
                          <div className="text-sm text-green-600">
                            Can make up to {recipe.maxPortions} portions
                          </div>
                        ) : (
                          <div className="text-sm text-red-600">
                            Missing: {recipe.missingIngredients.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="restock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Restock Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {restockRequests.map(request => {
                  const ingredient = ingredients.find(ing => ing.id === request.ingredientId);
                  return (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{ingredient?.name}</h4>
                            <Badge className={
                              request.priority === 'urgent' ? 'bg-red-500' :
                              request.priority === 'high' ? 'bg-orange-500' :
                              request.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                            }>
                              {request.priority}
                            </Badge>
                            <Badge variant="outline">{request.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Requested: {request.quantity} {ingredient?.unit} by {request.requestedBy}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Date: {request.requestDate.toLocaleDateString()}
                          </div>
                          {request.estimatedDelivery && (
                            <div className="text-sm text-green-600">
                              Expected: {request.estimatedDelivery.toLocaleDateString()}
                            </div>
                          )}
                          {request.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Notes: {request.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold">
                            ${((ingredient?.costPerUnit || 0) * request.quantity).toFixed(2)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            estimated cost
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <StockUpdateDialog ingredient={selectedIngredient} />
      <RestockRequestDialog ingredient={selectedIngredient} />
    </div>
  );
}