"use client"

import React, { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import {
  X,
  Package,
  Save,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Truck,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Scanner,
  ShoppingCart,
  Clock,
  Hash,
  FileText,
  Phone,
  User,
  Building,
  Settings,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface InventoryItem {
  id?: string
  name: string
  description?: string
  category: string
  subcategory?: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderLevel: number
  costPrice: number
  sellingPrice?: number
  supplier: string
  supplierContact?: string
  location: string
  expiryDate?: string
  batchNumber?: string
  status: "in_stock" | "low_stock" | "out_of_stock" | "discontinued"
  isPerishable: boolean
  lastRestocked?: string
  lastUpdated?: string
  createdBy?: string
  notes?: string
}

interface InventoryCategory {
  id: string
  name: string
  description?: string
  subcategories: string[]
}

interface InventoryFormProps {
  propertyId: string
  item?: InventoryItem | null
  categories: InventoryCategory[]
  onClose: () => void
  onSave: (item: InventoryItem) => void
}

const UNITS = [
  "kg",
  "g",
  "lbs",
  "oz",
  "liters",
  "ml",
  "pieces",
  "boxes",
  "bottles",
  "cans",
  "packets",
  "bags",
]

const LOCATIONS = [
  "Kitchen Storage",
  "Refrigerator",
  "Freezer",
  "Bar Storage",
  "Pantry",
  "Dry Storage",
  "Wine Cellar",
  "Cold Room",
]

export function InventoryForm({
  propertyId,
  item,
  categories,
  onClose,
  onSave,
}: InventoryFormProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState("basic")
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<InventoryItem>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    unit: "kg",
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    reorderLevel: 0,
    costPrice: 0,
    sellingPrice: 0,
    supplier: "",
    supplierContact: "",
    location: "Kitchen Storage",
    expiryDate: "",
    batchNumber: "",
    status: "in_stock",
    isPerishable: false,
    notes: "",
    ...item,
  })

  const [completionProgress, setCompletionProgress] = useState(0)

  useEffect(() => {
    // Calculate form completion progress
    const totalFields = 15
    const filledFields = [
      formData.name,
      formData.category,
      formData.unit,
      formData.costPrice > 0,
      formData.supplier,
      formData.location,
      formData.minimumStock >= 0,
      formData.maximumStock > 0,
      formData.reorderLevel >= 0,
      formData.currentStock >= 0,
      formData.description,
      formData.supplierContact,
      formData.sellingPrice,
      formData.batchNumber,
      formData.notes,
    ].filter(Boolean).length

    setCompletionProgress(Math.round((filledFields / totalFields) * 100))
  }, [formData])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Item name is required"
    }
    if (!formData.category) {
      newErrors.category = "Category is required"
    }
    if (!formData.unit) {
      newErrors.unit = "Unit is required"
    }
    if (formData.costPrice <= 0) {
      newErrors.costPrice = "Cost price must be greater than 0"
    }
    if (!formData.supplier.trim()) {
      newErrors.supplier = "Supplier is required"
    }
    if (!formData.location) {
      newErrors.location = "Location is required"
    }
    if (formData.minimumStock < 0) {
      newErrors.minimumStock = "Minimum stock cannot be negative"
    }
    if (formData.maximumStock <= 0) {
      newErrors.maximumStock = "Maximum stock must be greater than 0"
    }
    if (formData.maximumStock <= formData.minimumStock) {
      newErrors.maximumStock =
        "Maximum stock must be greater than minimum stock"
    }
    if (formData.reorderLevel < formData.minimumStock) {
      newErrors.reorderLevel =
        "Reorder level should be at least equal to minimum stock"
    }
    if (formData.currentStock < 0) {
      newErrors.currentStock = "Current stock cannot be negative"
    }
    if (formData.sellingPrice && formData.sellingPrice <= formData.costPrice) {
      newErrors.sellingPrice = "Selling price should be greater than cost price"
    }
    if (formData.isPerishable && !formData.expiryDate) {
      newErrors.expiryDate = "Expiry date is required for perishable items"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const method = item?.id ? "PUT" : "POST"
      const url = item?.id
        ? `/api/fb/inventory/${item.id}`
        : "/api/fb/inventory"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          propertyId,
          createdBy: session?.user?.id || "user",
          lastUpdated: new Date().toISOString(),
          ...(method === "POST" && { id: Date.now().toString() }),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        onSave(result.item || formData)
        onClose()
      } else {
        console.error("Failed to save inventory item")
      }
    } catch (error) {
      console.error("Error saving inventory item:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof InventoryItem, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const getSelectedCategory = () => {
    return categories.find(
      (cat) => cat.id === formData.category || cat.name === formData.category
    )
  }

  const getStockStatusColor = () => {
    if (formData.currentStock === 0)
      return "text-red-600 bg-red-50 border-red-200"
    if (formData.currentStock <= formData.minimumStock)
      return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getStockStatusIcon = () => {
    if (formData.currentStock === 0)
      return <AlertTriangle className="w-4 h-4" />
    if (formData.currentStock <= formData.minimumStock)
      return <AlertTriangle className="w-4 h-4" />
    return <CheckCircle className="w-4 h-4" />
  }

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
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {item?.id ? "Edit Inventory Item" : "New Inventory Item"}
                </h1>
                <p className="text-blue-100 mt-1">
                  {item?.id
                    ? `Update details for ${item.name}`
                    : "Add a new item to inventory"}
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
                  <span className="text-sm font-bold text-white min-w-[2.5rem]">
                    {completionProgress}%
                  </span>
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

        <form
          onSubmit={handleSubmit}
          className="h-[calc(90vh-200px)] overflow-y-auto"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            {/* OS Theme Tabs */}
            <div className="border-b bg-gradient-to-r from-gray-50 to-blue-50">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
                  <TabsTrigger
                    value="basic"
                    className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Basic Info
                  </TabsTrigger>

                  <TabsTrigger
                    value="stock"
                    className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    Stock & Pricing
                  </TabsTrigger>

                  <TabsTrigger
                    value="supplier"
                    className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Supplier
                  </TabsTrigger>

                  <TabsTrigger
                    value="advanced"
                    className="text-sm font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {/* Basic Information Tab */}
            <TabsContent value="basic" className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Item Details</CardTitle>
                      <CardDescription>
                        Basic information about the inventory item
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className="text-sm font-medium text-slate-700"
                        >
                          Item Name *
                        </Label>
                        <div className="relative">
                          <Package className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            placeholder="e.g., Fresh Tomatoes, Chicken Breast, Wine Glass"
                            className={`pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                              errors.name ? "border-red-300" : ""
                            }`}
                          />
                        </div>
                        {errors.name && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="description"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder="Detailed description of the item, quality, brand, etc."
                          className="border-gray-300 focus:border-amber-500 min-h-[80px]"
                          rows={3}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <Card className="border border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50 border-b border-slate-200">
                      <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                        <Building className="h-4 w-4 text-blue-600" />
                        Classification
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <Label
                          htmlFor="category"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Category <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            handleInputChange("category", value)
                          }
                        >
                          <SelectTrigger
                            className={`h-12 ${
                              errors.category
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.name}
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <span>{category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.category}
                          </p>
                        )}
                      </div>

                      {getSelectedCategory()?.subcategories.length > 0 && (
                        <div>
                          <Label
                            htmlFor="subcategory"
                            className="text-sm font-semibold text-gray-700 mb-2 block"
                          >
                            Subcategory
                          </Label>
                          <Select
                            value={formData.subcategory}
                            onValueChange={(value) =>
                              handleInputChange("subcategory", value)
                            }
                          >
                            <SelectTrigger className="h-12">
                              <SelectValue placeholder="Select subcategory (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              {getSelectedCategory()?.subcategories.map(
                                (subcategory) => (
                                  <SelectItem
                                    key={subcategory}
                                    value={subcategory}
                                  >
                                    {subcategory}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div>
                        <Label
                          htmlFor="unit"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Unit of Measurement{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(value) =>
                            handleInputChange("unit", value)
                          }
                        >
                          <SelectTrigger
                            className={`h-12 ${
                              errors.unit ? "border-red-300" : "border-gray-300"
                            }`}
                          >
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.unit && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.unit}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Stock & Pricing Tab */}
            <TabsContent value="stock" className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stock Information */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <Package className="h-4 w-4 text-blue-600" />
                      Stock Levels
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Set stock thresholds and current inventory
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="currentStock"
                          className="text-sm font-medium text-slate-700"
                        >
                          Current Stock *
                        </Label>
                        <div className="relative">
                          <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="currentStock"
                            type="number"
                            className={`pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${
                              errors.currentStock ? "border-red-300" : ""
                            }`}
                            value={formData.currentStock}
                            onChange={(e) =>
                              handleInputChange(
                                "currentStock",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            {formData.unit}
                          </div>
                        </div>
                        {errors.currentStock && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.currentStock}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="minimumStock"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Minimum Stock <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="minimumStock"
                            type="number"
                            value={formData.minimumStock}
                            onChange={(e) =>
                              handleInputChange(
                                "minimumStock",
                                Number(e.target.value)
                              )
                            }
                            className={`${
                              errors.minimumStock
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            } h-12 pr-12`}
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            {formData.unit}
                          </div>
                        </div>
                        {errors.minimumStock && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.minimumStock}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label
                          htmlFor="maximumStock"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Maximum Stock <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="maximumStock"
                            type="number"
                            value={formData.maximumStock}
                            onChange={(e) =>
                              handleInputChange(
                                "maximumStock",
                                Number(e.target.value)
                              )
                            }
                            className={`${
                              errors.maximumStock
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            } h-12 pr-12`}
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            {formData.unit}
                          </div>
                        </div>
                        {errors.maximumStock && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.maximumStock}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="reorderLevel"
                          className="text-sm font-semibold text-gray-700 mb-2 block"
                        >
                          Reorder Level <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="reorderLevel"
                            type="number"
                            value={formData.reorderLevel}
                            onChange={(e) =>
                              handleInputChange(
                                "reorderLevel",
                                Number(e.target.value)
                              )
                            }
                            className={`${
                              errors.reorderLevel
                                ? "border-red-300 focus:border-red-500"
                                : "border-gray-300 focus:border-blue-500"
                            } h-12 pr-12`}
                            min="0"
                            step="0.01"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                            {formData.unit}
                          </div>
                        </div>
                        {errors.reorderLevel && (
                          <p className="text-red-600 text-xs mt-1 flex items-center">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {errors.reorderLevel}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stock Status Indicator */}
                    <div
                      className={`mt-4 p-3 rounded-lg border ${getStockStatusColor()}`}
                    >
                      <div className="flex items-center space-x-2">
                        {getStockStatusIcon()}
                        <span className="text-sm font-medium">
                          Current Status:{" "}
                          {formData.currentStock === 0
                            ? "Out of Stock"
                            : formData.currentStock <= formData.minimumStock
                            ? "Low Stock"
                            : "In Stock"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      Pricing
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Set cost and selling prices
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label
                        htmlFor="costPrice"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Cost Price (per {formData.unit}){" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          ₹
                        </div>
                        <Input
                          id="costPrice"
                          type="number"
                          value={formData.costPrice}
                          onChange={(e) =>
                            handleInputChange(
                              "costPrice",
                              Number(e.target.value)
                            )
                          }
                          className={`${
                            errors.costPrice
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-300 focus:border-green-500"
                          } h-12 pl-8`}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      {errors.costPrice && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {errors.costPrice}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="sellingPrice"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Selling Price (per {formData.unit})
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          ₹
                        </div>
                        <Input
                          id="sellingPrice"
                          type="number"
                          value={formData.sellingPrice}
                          onChange={(e) =>
                            handleInputChange(
                              "sellingPrice",
                              Number(e.target.value)
                            )
                          }
                          className={`${
                            errors.sellingPrice
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-300 focus:border-green-500"
                          } h-12 pl-8`}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      {errors.sellingPrice && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {errors.sellingPrice}
                        </p>
                      )}
                    </div>

                    {/* Profit Margin Indicator */}
                    {formData.costPrice > 0 && formData.sellingPrice > 0 && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">
                            Profit Margin
                          </span>
                          <span className="text-sm font-bold text-green-700">
                            {Math.round(
                              ((formData.sellingPrice - formData.costPrice) /
                                formData.sellingPrice) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Profit per {formData.unit}: ₹
                          {(formData.sellingPrice - formData.costPrice).toFixed(
                            2
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Supplier & Location Tab */}
            <TabsContent value="supplier" className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Supplier Information */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <Truck className="h-4 w-4 text-blue-600" />
                      Supplier Details
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Vendor and supplier information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label
                        htmlFor="supplier"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Supplier Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <Input
                          id="supplier"
                          value={formData.supplier}
                          onChange={(e) =>
                            handleInputChange("supplier", e.target.value)
                          }
                          placeholder="e.g., Fresh Market Suppliers"
                          className={`${
                            errors.supplier
                              ? "border-red-300 focus:border-red-500"
                              : "border-gray-300 focus:border-green-500"
                          } h-12 pl-12`}
                        />
                      </div>
                      {errors.supplier && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {errors.supplier}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="supplierContact"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Supplier Contact
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <Input
                          id="supplierContact"
                          value={formData.supplierContact}
                          onChange={(e) =>
                            handleInputChange("supplierContact", e.target.value)
                          }
                          placeholder="Phone number or email"
                          className="h-12 pl-12 border-gray-300 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Storage Location */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      Storage Location
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Where the item is stored
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label
                        htmlFor="location"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Storage Location <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) =>
                          handleInputChange("location", value)
                        }
                      >
                        <SelectTrigger
                          className={`h-12 ${
                            errors.location
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                        >
                          <SelectValue placeholder="Select storage location" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-purple-600" />
                                <span>{location}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.location && (
                        <p className="text-red-600 text-xs mt-1 flex items-center">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          {errors.location}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="p-6 space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Perishable Items */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Expiry & Batch
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Perishable item details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div>
                        <Label
                          htmlFor="isPerishable"
                          className="text-sm font-semibold text-yellow-800"
                        >
                          Perishable Item
                        </Label>
                        <p className="text-xs text-yellow-600 mt-1">
                          Does this item have an expiry date?
                        </p>
                      </div>
                      <Switch
                        id="isPerishable"
                        checked={formData.isPerishable}
                        onCheckedChange={(checked) =>
                          handleInputChange("isPerishable", checked)
                        }
                        className="data-[state=checked]:bg-yellow-500"
                      />
                    </div>

                    {formData.isPerishable && (
                      <>
                        <div>
                          <Label
                            htmlFor="expiryDate"
                            className="text-sm font-semibold text-gray-700 mb-2 block"
                          >
                            Expiry Date <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <Input
                              id="expiryDate"
                              type="date"
                              value={formData.expiryDate}
                              onChange={(e) =>
                                handleInputChange("expiryDate", e.target.value)
                              }
                              className={`${
                                errors.expiryDate
                                  ? "border-red-300 focus:border-red-500"
                                  : "border-gray-300 focus:border-yellow-500"
                              } h-12 pl-12`}
                            />
                          </div>
                          {errors.expiryDate && (
                            <p className="text-red-600 text-xs mt-1 flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {errors.expiryDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="batchNumber"
                            className="text-sm font-semibold text-gray-700 mb-2 block"
                          >
                            Batch Number
                          </Label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <Input
                              id="batchNumber"
                              value={formData.batchNumber}
                              onChange={(e) =>
                                handleInputChange("batchNumber", e.target.value)
                              }
                              placeholder="e.g., BT-2024-001"
                              className="h-12 pl-12 border-gray-300 focus:border-yellow-500"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Additional Notes */}
                <Card className="border border-slate-200 shadow-sm">
                  <CardHeader className="bg-slate-50 border-b border-slate-200">
                    <CardTitle className="text-slate-800 flex items-center gap-2 text-base font-medium">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Additional Information
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Extra notes and information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label
                        htmlFor="notes"
                        className="text-sm font-semibold text-gray-700 mb-2 block"
                      >
                        Notes & Comments
                      </Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          handleInputChange("notes", e.target.value)
                        }
                        placeholder="Any additional notes, special handling instructions, or comments..."
                        className="border-gray-300 focus:border-gray-500 min-h-[120px]"
                        rows={5}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* OS Theme Footer */}
          <div className="border-t bg-gradient-to-r from-gray-50 to-blue-50 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {completionProgress}% Complete
                </Badge>

                {Object.keys(errors).length > 0 ? (
                  <div className="text-sm text-red-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {Object.keys(errors).length} field
                    {Object.keys(errors).length > 1 ? "s" : ""} need attention
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
                  type="submit"
                  disabled={loading || Object.keys(errors).length > 0}
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
                      {item?.id ? "Update Item" : "Create Item"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
