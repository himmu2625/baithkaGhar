"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, 
  RefreshCw, 
  Tag, 
  Gift, 
  CheckCircle,
  AlertCircle,
  Info
} from "lucide-react";

export default function MigrationPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const [migrating, setMigrating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check admin permissions
  useEffect(() => {
    if (session && !["admin", "super_admin"].includes(session.user?.role || "")) {
      router.push("/admin/login");
    }
  }, [session, router]);

  const fetchMigrationStatus = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/migrate-to-promotions');
      const data = await response.json();
      if (data.success) {
        setMigrationStatus(data.status);
      }
    } catch (error) {
      console.error('Error fetching migration status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch migration status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  useEffect(() => {
    fetchMigrationStatus();
  }, [fetchMigrationStatus]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const allMigrated = migrationStatus && 
    migrationStatus.coupons.remaining === 0 && 
    migrationStatus.specialOffers.remaining === 0;

  return (
    <div className="container mx-auto py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Data Migration Center</h1>
        <p className="text-muted-foreground">
          Migrate your existing coupons and special offers to the unified promotion system
        </p>
      </div>

      {/* Status Overview */}
      {allMigrated ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">Migration Complete!</h3>
                <p className="text-green-800">
                  All your coupons and special offers have been successfully migrated to the unified promotion system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Migration Required</h3>
                <p className="text-yellow-800">
                  You have existing coupons or special offers that need to be migrated to the new system.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Migration Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Migration Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Safe - Original data preserved</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Repeatable - Run multiple times safely</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Smart - Only migrates new items</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">What happens during migration?</h4>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Existing coupons become promotions with coupon codes</li>
              <li>• Special offers become promotions with display settings</li>
              <li>• All original functionality is preserved</li>
              <li>• You can manage everything from the unified promotions panel</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Migration Status */}
      {migrationStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" />
                Coupons Migration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Coupons:</span>
                  <span className="font-medium">{migrationStatus.coupons.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Already Migrated:</span>
                  <span className="text-green-600 font-medium">{migrationStatus.coupons.migrated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Migration:</span>
                  <span className="text-orange-600 font-medium">{migrationStatus.coupons.remaining}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => executeMigration('coupons')}
                disabled={migrating || migrationStatus.coupons.remaining === 0}
                className="w-full"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : migrationStatus.coupons.remaining === 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    All Migrated
                  </>
                ) : (
                  <>
                    <Tag className="h-4 w-4 mr-2" />
                    Migrate Coupons ({migrationStatus.coupons.remaining})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Special Offers Migration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Special Offers:</span>
                  <span className="font-medium">{migrationStatus.specialOffers.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Already Migrated:</span>
                  <span className="text-green-600 font-medium">{migrationStatus.specialOffers.migrated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Migration:</span>
                  <span className="text-orange-600 font-medium">{migrationStatus.specialOffers.remaining}</span>
                </div>
              </div>
              
              <Button 
                onClick={() => executeMigration('special_offers')}
                disabled={migrating || migrationStatus.specialOffers.remaining === 0}
                className="w-full"
                variant="outline"
              >
                {migrating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : migrationStatus.specialOffers.remaining === 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    All Migrated
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Migrate Special Offers ({migrationStatus.specialOffers.remaining})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Migration */}
      {migrationStatus && (migrationStatus.coupons.remaining > 0 || migrationStatus.specialOffers.remaining > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => executeMigration('all')}
              disabled={migrating}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {migrating ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Migrating All Items...
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 mr-2" />
                  Migrate All Remaining Items ({(migrationStatus.coupons.remaining || 0) + (migrationStatus.specialOffers.remaining || 0)})
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={fetchMigrationStatus} disabled={migrating}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
        <Button 
          variant="outline" 
          onClick={() => router.push('/admin/promotions')}
        >
          Go to Promotions
        </Button>
      </div>
    </div>
  );
} 