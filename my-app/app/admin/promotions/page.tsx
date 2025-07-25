"use client"

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit,
  Trash2,
  Copy,
  Play,
  Pause,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Percent,
  Gift,
  Tag,
  Eye,
  RefreshCw
} from "lucide-react";
import { PromotionRuleBuilder } from '@/components/admin/promotions/PromotionRuleBuilder';

interface Promotion {
  _id?: string;
  name: string;
  description?: string;
  type: string;
  discountType: string;
  discountValue: number;
  status: string;
  isActive: boolean;
  conditions: {
    validFrom: string;
    validTo: string;
    usageLimit?: number;
    usageLimitPerCustomer?: number;
  };
  displaySettings: {
    title: string;
    badgeText?: string;
    priority: number;
  };
  analytics: {
    usageCount: number;
    totalDiscountGiven: number;
    revenue: number;
    bookingsGenerated: number;
  };
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface PromotionSummary {
  activePromotions: number;
  totalDiscountGiven: number;
}

export default function PromotionsPage() {
  const { toast } = useToast();

  // State management
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [summary, setSummary] = useState<PromotionSummary>({ activePromotions: 0, totalDiscountGiven: 0 });
  const [loading, setLoading] = useState(true);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  
  // Migration state
  const [showMigration, setShowMigration] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  // Fetch promotions
  useEffect(() => {
    fetchPromotions();
  }, [currentPage, searchTerm, statusFilter, typeFilter, activeFilter]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(activeFilter !== 'all' && { active: activeFilter })
      });

      const response = await fetch(`/api/admin/promotions?${params}`);
      const data = await response.json();

      if (data.success) {
        setPromotions(data.promotions);
        setSummary(data.summary);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.error || 'Failed to fetch promotions');
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      toast({
        title: "Error",
        description: "Failed to load promotions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle promotion save
  const handlePromotionSave = async (promotionData: any) => {
    try {
      const url = editingPromotion 
        ? `/api/admin/promotions/${editingPromotion._id}` 
        : '/api/admin/promotions';
      
      const method = editingPromotion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promotionData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Promotion ${editingPromotion ? 'updated' : 'created'} successfully`,
        });
        setShowRuleBuilder(false);
        setEditingPromotion(null);
        fetchPromotions();
      } else {
        throw new Error(data.error || 'Failed to save promotion');
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to save promotion',
        variant: "destructive",
      });
    }
  };

  // Toggle promotion active status
  const togglePromotionStatus = async (promotionId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: `Promotion ${isActive ? 'activated' : 'deactivated'}`,
        });
        fetchPromotions();
      } else {
        throw new Error(data.error || 'Failed to update promotion');
      }
    } catch (error) {
      console.error('Error updating promotion:', error);
      toast({
        title: "Error",
        description: "Failed to update promotion status",
        variant: "destructive",
      });
    }
  };

  // Migration functions
  const fetchMigrationStatus = async () => {
    try {
      const response = await fetch('/api/admin/migrate-to-promotions');
      const data = await response.json();
      if (data.success) {
        setMigrationStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
    }
  };

  const executeMigration = async (migrationType: 'all' | 'coupons' | 'special_offers') => {
    try {
      setMigrating(true);
      const response = await fetch('/api/admin/migrate-to-promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrationType })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Migration Success",
          description: data.message,
        });
        fetchMigrationStatus();
        fetchPromotions();
      } else {
        throw new Error(data.error || 'Migration failed');
      }
    } catch (error) {
      console.error('Migration error:', error);
      toast({
        title: "Migration Error",
        description: error instanceof Error ? error.message : 'Migration failed',
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  // Fetch migration status on component mount
  useEffect(() => {
    fetchMigrationStatus();
  }, []);

  // Delete promotion
  const deletePromotion = async (promotionId: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${promotionId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Promotion deleted successfully",
        });
        fetchPromotions();
      } else {
        throw new Error(data.error || 'Failed to delete promotion');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Error",
        description: "Failed to delete promotion",
        variant: "destructive",
      });
    }
  };

  // Get discount type icon
  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <DollarSign className="h-4 w-4" />;
      case 'buy_x_get_y': return <Gift className="h-4 w-4" />;
      case 'free_nights': return <Calendar className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string, isActive: boolean) => {
    if (!isActive) return 'secondary';
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'outline';
      case 'expired': return 'destructive';
      case 'paused': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promotion Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage automated discount rules and promotional campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {migrationStatus && (migrationStatus.coupons.remaining > 0 || migrationStatus.specialOffers.remaining > 0) && (
            <Button 
              variant="outline" 
              onClick={() => setShowMigration(true)}
              className="bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100"
            >
              <Copy className="h-4 w-4 mr-2" />
              Migrate Data
            </Button>
          )}
          <Button variant="outline" onClick={fetchPromotions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowRuleBuilder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Promotion
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Promotions</p>
                <p className="text-2xl font-bold text-green-600">{summary.activePromotions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Discounts Given</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{summary.totalDiscountGiven.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Promotions</p>
                <p className="text-2xl font-bold text-purple-600">{promotions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-orange-600">
                  {promotions.filter(p => 
                    new Date(p.createdAt).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search promotions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="last_minute">Last Minute</SelectItem>
                <SelectItem value="early_bird">Early Bird</SelectItem>
                <SelectItem value="long_stay">Long Stay</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
                <SelectItem value="volume">Volume</SelectItem>
                <SelectItem value="first_time">First Time</SelectItem>
                <SelectItem value="repeat_customer">Repeat Customer</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Promotions List */}
      <Card>
        <CardHeader>
          <CardTitle>Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No promotions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first promotion'
                }
              </p>
              <Button onClick={() => setShowRuleBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Promotion
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <div
                  key={promotion._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{promotion.name}</h3>
                        <Badge 
                          variant={getStatusBadgeVariant(promotion.status, promotion.isActive)}
                        >
                          {promotion.isActive ? promotion.status : 'inactive'}
                        </Badge>
                        {promotion.displaySettings.badgeText && (
                          <Badge variant="outline">{promotion.displaySettings.badgeText}</Badge>
                        )}
                        {promotion.couponCode && (
                          <Badge variant="secondary" className="font-mono">
                            {promotion.couponCode}
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-3">
                        {promotion.displaySettings.title}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          {getDiscountTypeIcon(promotion.discountType)}
                          <span>
                            {promotion.discountType === 'percentage' 
                              ? `${promotion.discountValue}%` 
                              : `₹${promotion.discountValue}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(promotion.conditions.validFrom), 'MMM dd')} - {' '}
                            {format(new Date(promotion.conditions.validTo), 'MMM dd')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{promotion.analytics.usageCount} uses</span>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="h-4 w-4" />
                          <span>₹{promotion.analytics.totalDiscountGiven.toLocaleString()} saved</span>
                        </div>
                      </div>

                      {promotion.description && (
                        <p className="text-sm text-muted-foreground">
                          {promotion.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={promotion.isActive}
                        onCheckedChange={(checked) => togglePromotionStatus(promotion._id || '', checked)}
                      />
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPromotion(promotion);
                          setShowRuleBuilder(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Copy promotion logic
                          const copyData = {
                            ...promotion,
                            name: `${promotion.name} (Copy)`,
                            isActive: false,
                            status: 'draft'
                          };
                          delete copyData._id;
                          setEditingPromotion(copyData as any);
                          setShowRuleBuilder(true);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deletePromotion(promotion._id || '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rule Builder Dialog */}
      <Dialog open={showRuleBuilder} onOpenChange={setShowRuleBuilder}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-auto p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <PromotionRuleBuilder
              initialRule={editingPromotion as any}
              onSave={handlePromotionSave}
              onCancel={() => {
                setShowRuleBuilder(false);
                setEditingPromotion(null);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Migration Dialog */}
      <Dialog open={showMigration} onOpenChange={setShowMigration}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Migrate Coupons & Special Offers</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Migration Overview</h3>
              <p className="text-blue-800 text-sm">
                This will migrate your existing coupons and special offers into the unified promotion system. 
                Your existing data will remain intact, but you'll manage everything from this promotions interface.
              </p>
            </div>

            {migrationStatus && (
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium">Coupons</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{migrationStatus.coupons.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Migrated:</span>
                        <span className="text-green-600 font-medium">{migrationStatus.coupons.migrated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="text-orange-600 font-medium">{migrationStatus.coupons.remaining}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-purple-600" />
                      <h4 className="font-medium">Special Offers</h4>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span className="font-medium">{migrationStatus.specialOffers.total}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Migrated:</span>
                        <span className="text-green-600 font-medium">{migrationStatus.specialOffers.migrated}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Remaining:</span>
                        <span className="text-orange-600 font-medium">{migrationStatus.specialOffers.remaining}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                onClick={() => executeMigration('coupons')}
                disabled={migrating || !migrationStatus?.coupons.remaining}
                className="w-full"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4 mr-2" />
                    Migrate Coupons ({migrationStatus?.coupons.remaining || 0})
                  </>
                )}
              </Button>

              <Button 
                onClick={() => executeMigration('special_offers')}
                disabled={migrating || !migrationStatus?.specialOffers.remaining}
                className="w-full"
                variant="outline"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Migrate Special Offers ({migrationStatus?.specialOffers.remaining || 0})
                  </>
                )}
              </Button>

              <Button 
                onClick={() => executeMigration('all')}
                disabled={migrating || (!migrationStatus?.coupons.remaining && !migrationStatus?.specialOffers.remaining)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating All...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Migrate All ({(migrationStatus?.coupons.remaining || 0) + (migrationStatus?.specialOffers.remaining || 0)})
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>✓ Migration is safe - original data is preserved</p>
              <p>✓ You can run migration multiple times safely</p>
              <p>✓ Only new/unchanged items will be migrated</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 