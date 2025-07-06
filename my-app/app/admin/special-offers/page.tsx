"use client"

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { DataTable } from "@/components/ui/data-table";
import { columns, SpecialOfferColumn } from "@/components/admin/special-offers/columns";
import { SpecialOfferForm } from "@/components/admin/special-offers/SpecialOfferForm";
import { ISpecialOffer } from "@/models/SpecialOffer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminSpecialOffersPage() {
  const [offers, setOffers] = useState<ISpecialOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Partial<ISpecialOffer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/special-offers');
      if (!response.ok) {
        throw new Error("Failed to fetch offers.");
      }
      const data = await response.json();
      setOffers(data.data);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch special offers.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleCreateNew = () => {
    setSelectedOffer(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (offer: SpecialOfferColumn) => {
    setSelectedOffer(offers.find(o => o._id === offer._id) || null);
    setIsFormOpen(true);
  };
  
  const openDeleteDialog = (offerId: string) => {
      setOfferToDelete(offerId);
      setIsDeleteDialogOpen(true);
  }

  const handleDelete = async () => {
    if (!offerToDelete) return;
    try {
        const response = await fetch(`/api/special-offers/${offerToDelete}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to delete offer.");
        toast({ title: "Success", description: "Special offer deleted successfully." });
        fetchOffers(); // Refresh list
    } catch (error) {
        toast({ title: "Error", description: "Could not delete the offer.", variant: "destructive" });
    } finally {
        setIsDeleteDialogOpen(false);
        setOfferToDelete(null);
    }
  };

  const handleSave = async (data: Partial<ISpecialOffer>) => {
    setIsSaving(true);
    try {
      const isUpdating = !!data._id;
      const url = isUpdating ? `/api/special-offers/${data._id}` : '/api/special-offers';
      const method = isUpdating ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${isUpdating ? 'update' : 'create'} offer.`);
      }

      toast({ title: "Success", description: `Special offer ${isUpdating ? 'updated' : 'created'} successfully.` });
      setIsFormOpen(false);
      fetchOffers(); // Refresh list
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };
  
  const tableData: SpecialOfferColumn[] = offers.map(offer => ({
      ...offer,
      isExpired: new Date(offer.validUntil) < new Date(),
  }));

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Special Offers</h1>
          <p className="text-gray-500">Manage your promotional offers and deals.</p>
        </div>
        <Button onClick={handleCreateNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Offer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
          <CardDescription>View, edit, or delete your special offers.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns(handleEdit, openDeleteDialog)}
            data={tableData}
            isLoading={loading}
          />
        </CardContent>
      </Card>

      <SpecialOfferForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        offer={selectedOffer}
        isLoading={isSaving}
      />
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the special offer
                and its associated image from the server.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 