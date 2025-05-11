"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Building,
  Image as ImageIcon,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCities } from "@/provider/cities-provider";
import { CityData } from "@/services/cityService";
import { useToast } from "@/components/ui/use-toast";

export default function AdminCitiesPage() {
  const router = useRouter();
  const { cities, isLoading, error, refreshCities } = useCities();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [formData, setFormData] = useState<Partial<CityData>>({
    name: "",
    image: "",
  });

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Open add city dialog
  const handleAddClick = () => {
    setFormData({ name: "", image: "" });
    setIsAddDialogOpen(true);
  };

  // Open edit city dialog
  const handleEditClick = (city: CityData) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      image: city.image || "",
    });
    setIsEditDialogOpen(true);
  };

  // Open delete city dialog
  const handleDeleteClick = (city: CityData) => {
    setSelectedCity(city);
    setIsDeleteDialogOpen(true);
  };

  // Add new city
  const handleAddCity = async () => {
    if (!formData.name) {
      toast({
        title: "Error",
        description: "City name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionInProgress(true);
      const response = await fetch("/api/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add city");
      }

      toast({
        title: "Success",
        description: "City added successfully",
      });
      setIsAddDialogOpen(false);
      refreshCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add city",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Update existing city
  const handleUpdateCity = async () => {
    if (!selectedCity || !formData.name) {
      toast({
        title: "Error",
        description: "City name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/cities/${selectedCity.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update city");
      }

      toast({
        title: "Success",
        description: "City updated successfully",
      });
      setIsEditDialogOpen(false);
      refreshCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update city",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete city
  const handleDeleteCity = async () => {
    if (!selectedCity) return;

    try {
      setActionInProgress(true);
      const response = await fetch(`/api/cities/${selectedCity.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete city");
      }

      toast({
        title: "Success",
        description: "City deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      refreshCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete city",
        variant: "destructive",
      });
    } finally {
      setActionInProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-mediumGreen" />
        <span className="ml-2">Loading cities...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => refreshCities()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-darkGreen flex items-center">
          <MapPin className="mr-2 h-6 w-6 text-mediumGreen" />
          City Management
        </h1>
        <Button
          onClick={handleAddClick}
          className="bg-mediumGreen hover:bg-darkGreen text-white"
        >
          <Plus className="mr-1 h-4 w-4" /> Add City
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Image</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  No cities found. Add your first city!
                </TableCell>
              </TableRow>
            ) : (
              cities.map((city) => (
                <TableRow key={city.id}>
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="mr-1 h-4 w-4 text-mediumGreen" />
                      {city.properties || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    {city.image ? (
                      <div className="relative h-10 w-16 overflow-hidden rounded">
                        <img
                          src={city.image}
                          alt={city.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400">No image</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(city)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteClick(city)}
                        disabled={city.properties && city.properties > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add City Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
            <DialogDescription>
              Create a new city for property listings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">City Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter city name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="Enter image URL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCity}
              className="bg-mediumGreen hover:bg-darkGreen text-white"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Add City
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>Update city information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">City Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter city name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-image">Image URL</Label>
              <Input
                id="edit-image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="Enter image URL"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCity}
              className="bg-mediumGreen hover:bg-darkGreen text-white"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Update City
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete City Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete City</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCity?.name}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionInProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteCity}
              variant="destructive"
              disabled={actionInProgress}
            >
              {actionInProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete City
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
