"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Calendar,
  Users,
  Percent,
  IndianRupee,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  _id: string;
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed_amount";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  userUsageLimit: number;
  isActive: boolean;
  validFrom: Date;
  validTo: Date;
  applicableFor: "all" | "specific_properties" | "specific_users";
  createdAt: Date;
  updatedAt: Date;
}

interface CouponFormData {
  code: string;
  name: string;
  description: string;
  type: "percentage" | "fixed_amount";
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number;
  usageLimit: number;
  userUsageLimit: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
  applicableFor: "all" | "specific_properties" | "specific_users";
}

export default function AdminCouponsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "percentage" | "fixed_amount">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CouponFormData>({
    code: "",
    name: "",
    description: "",
    type: "percentage",
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    usageLimit: 0,
    userUsageLimit: 1,
    isActive: true,
    validFrom: "",
    validTo: "",
    applicableFor: "all",
  });

  // Check admin permissions
  useEffect(() => {
    if (session && !["admin", "super_admin"].includes(session.user?.role || "")) {
      router.push("/admin/login");
    }
  }, [session, router]);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch coupons",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // Filter coupons
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && coupon.isActive) ||
                         (statusFilter === "inactive" && !coupon.isActive);
    const matchesType = typeFilter === "all" || coupon.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const url = editingCoupon 
      ? `/api/admin/coupons/${editingCoupon._id}`
      : "/api/admin/coupons";
    
    const method = editingCoupon ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Coupon ${editingCoupon ? "updated" : "created"} successfully`,
        });
        setIsCreateDialogOpen(false);
        setEditingCoupon(null);
        resetForm();
        fetchCoupons();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to save coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving coupon:", error);
      toast({
        title: "Error",
        description: "Failed to save coupon",
        variant: "destructive",
      });
    }
  };

  // Handle delete
  const handleDelete = async (couponId: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Coupon deleted successfully",
        });
        fetchCoupons();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete coupon",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting coupon:", error);
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  // Handle copy coupon code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Coupon code copied to clipboard",
    });
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      usageLimit: 0,
      userUsageLimit: 1,
      isActive: true,
      validFrom: "",
      validTo: "",
      applicableFor: "all",
    });
  };

  // Handle edit
  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscountAmount: coupon.maxDiscountAmount || 0,
      usageLimit: coupon.usageLimit || 0,
      userUsageLimit: coupon.userUsageLimit,
      isActive: coupon.isActive,
      validFrom: format(new Date(coupon.validFrom), "yyyy-MM-dd'T'HH:mm"),
      validTo: format(new Date(coupon.validTo), "yyyy-MM-dd'T'HH:mm"),
      applicableFor: coupon.applicableFor,
    });
    setIsCreateDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lightGreen mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupons Management</h1>
          <p className="text-muted-foreground">
            Create and manage discount coupons for your platform
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setEditingCoupon(null);
              }}
              className="bg-lightGreen hover:bg-lightGreen/90 text-darkGreen"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </DialogTitle>
              <DialogDescription>
                {editingCoupon 
                  ? "Update the coupon details below"
                  : "Fill in the details to create a new discount coupon"
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SAVE20"
                    required
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label htmlFor="name">Coupon Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., 20% Off Summer Sale"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this coupon is for..."
                  maxLength={500}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: "percentage" | "fixed_amount") => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">
                    {formData.type === "percentage" ? "Percentage (%)" : "Amount (₹)"} *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                    min="0"
                    max={formData.type === "percentage" ? "100" : undefined}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderAmount">Minimum Order Amount (₹)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: Number(e.target.value) })}
                    min="0"
                  />
                </div>
                {formData.type === "percentage" && (
                  <div>
                    <Label htmlFor="maxDiscountAmount">Max Discount Amount (₹)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: Number(e.target.value) })}
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    min="0"
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="userUsageLimit">Per User Limit</Label>
                  <Input
                    id="userUsageLimit"
                    type="number"
                    value={formData.userUsageLimit}
                    onChange={(e) => setFormData({ ...formData, userUsageLimit: Number(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Valid From *</Label>
                  <Input
                    id="validFrom"
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validTo">Valid To *</Label>
                  <Input
                    id="validTo"
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-lightGreen hover:bg-lightGreen/90 text-darkGreen">
                  {editingCoupon ? "Update Coupon" : "Create Coupon"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: "all" | "active" | "inactive") => setStatusFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(value: "all" | "percentage" | "fixed_amount") => setTypeFilter(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coupons ({filteredCoupons.length})</CardTitle>
          <CardDescription>
            Manage all discount coupons in your system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                No coupons found
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-lightGreen hover:bg-lightGreen/90 text-darkGreen"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Coupon
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(coupon.code)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{coupon.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {coupon.type === "percentage" ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <IndianRupee className="h-3 w-3" />
                        )}
                        {coupon.type === "percentage" ? "Percentage" : "Fixed"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.type === "percentage" 
                        ? `${coupon.value}%` 
                        : `₹${coupon.value}`
                      }
                      {coupon.maxDiscountAmount && (
                        <div className="text-xs text-muted-foreground">
                          Max: ₹{coupon.maxDiscountAmount}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Per user: {coupon.userUsageLimit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={coupon.isActive ? "default" : "secondary"}
                        className={coupon.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(coupon.validTo), "MMM dd, yyyy")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(coupon.validTo), "HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(coupon)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleCopyCode(coupon.code)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(coupon._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 