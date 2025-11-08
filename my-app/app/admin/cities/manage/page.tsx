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
  Eye,
  EyeOff,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Upload,
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
import { Switch } from "@/components/ui/switch";
import { CityData } from "@/services/cityService";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CityImageUploader from "@/components/admin/CityImageUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManageCityCardsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [cities, setCities] = useState<CityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [formData, setFormData] = useState<Partial<CityData>>({
    name: "",
    image: "",
  });

  // Fetch cities
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/cities?timestamp=${Date.now()}`, {
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cities");
      }

      const citiesData = await response.json();
      setCities(citiesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching cities:", err);
      setError("Failed to load cities. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle visibility toggle
  const handleToggleVisibility = async (city: CityData) => {
    const updatedCities = cities.map((c) =>
      c.id === city.id ? { ...c, isVisible: !c.isVisible } : c
    );
    setCities(updatedCities);
  };

  // Handle move up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newCities = [...cities];
    const temp = newCities[index];
    newCities[index] = newCities[index - 1];
    newCities[index - 1] = temp;

    // Update display orders
    newCities.forEach((city, idx) => {
      city.displayOrder = idx;
    });

    setCities(newCities);
  };

  // Handle move down
  const handleMoveDown = (index: number) => {
    if (index === cities.length - 1) return;

    const newCities = [...cities];
    const temp = newCities[index];
    newCities[index] = newCities[index + 1];
    newCities[index + 1] = temp;

    // Update display orders
    newCities.forEach((city, idx) => {
      city.displayOrder = idx;
    });

    setCities(newCities);
  };

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Prepare updates
      const updates = cities.map((city, index) => ({
        id: city.id,
        isVisible: city.isVisible ?? true,
        displayOrder: index,
      }));

      console.log("Saving city updates:", updates);

      const response = await fetch("/api/cities/bulk-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      const result = await response.json();
      console.log("Save response:", result);

      if (!response.ok) {
        console.error("Save failed:", result);
        throw new Error(result.error || "Failed to save changes");
      }

      toast({
        title: "Success",
        description: result.message || "City settings saved successfully",
      });

      // Refresh to get updated data
      await fetchCities();
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Update property counts
  const handleUpdateCounts = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/update-city-counts");

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update property counts");
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: result.message || "Property counts updated successfully",
      });

      // Refresh cities
      await fetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update property counts",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle edit city image
  const handleEditClick = (city: CityData) => {
    setSelectedCity(city);
    setFormData({
      name: city.name,
      image: city.image || "",
    });
    setIsEditDialogOpen(true);
  };

  // Handle update city
  const handleUpdateCity = async () => {
    if (!selectedCity) return;

    try {
      setIsSaving(true);
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
        description: "City image updated successfully",
      });

      setIsEditDialogOpen(false);
      await fetchCities();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update city",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        <Button onClick={() => fetchCities()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-darkGreen flex items-center mb-2">
          <MapPin className="mr-2 h-8 w-8 text-mediumGreen" />
          Manage City Cards
        </h1>
        <p className="text-gray-600">
          Control which cities appear on the homepage, their order, and images
        </p>
      </div>

      {/* Info Card */}
      <Card className="mb-6 border-lightGreen">
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
          <CardDescription>
            Manage your city cards with these features:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <Eye className="h-4 w-4 mr-2 mt-0.5 text-mediumGreen flex-shrink-0" />
              <span>
                <strong>Visibility:</strong> Toggle cities on/off to hide cities
                with zero properties
              </span>
            </li>
            <li className="flex items-start">
              <GripVertical className="h-4 w-4 mr-2 mt-0.5 text-mediumGreen flex-shrink-0" />
              <span>
                <strong>Order:</strong> Use arrows to reorder how cities appear
                on the homepage
              </span>
            </li>
            <li className="flex items-start">
              <ImageIcon className="h-4 w-4 mr-2 mt-0.5 text-mediumGreen flex-shrink-0" />
              <span>
                <strong>Images:</strong> Click edit to change the city image URL
              </span>
            </li>
            <li className="flex items-start">
              <RefreshCw className="h-4 w-4 mr-2 mt-0.5 text-mediumGreen flex-shrink-0" />
              <span>
                <strong>Property Counts:</strong> Refresh counts to sync with
                actual properties in database
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Button
          onClick={handleSaveChanges}
          disabled={isSaving}
          className="bg-mediumGreen hover:bg-darkGreen text-white"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          onClick={handleUpdateCounts}
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Property Counts
            </>
          )}
        </Button>
        <Button
          onClick={async () => {
            try {
              const response = await fetch("/api/clear-cache");
              const data = await response.json();
              if (data.success) {
                toast({
                  title: "Success",
                  description: "Cache cleared! Please refresh your homepage to see changes.",
                });
              } else {
                throw new Error(data.error || "Failed to clear cache");
              }
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message || "Failed to clear cache",
                variant: "destructive",
              });
            }
          }}
          variant="outline"
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          🗑️ Clear Cache
        </Button>
      </div>

      {/* Cities Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Order</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Properties</TableHead>
              <TableHead>Image Preview</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
                  No cities found
                </TableCell>
              </TableRow>
            ) : (
              cities.map((city, index) => (
                <TableRow
                  key={city.id}
                  className={!city.isVisible ? "opacity-50" : ""}
                >
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === cities.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <MapPin className="mr-2 h-4 w-4 text-mediumGreen" />
                      {city.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Building className="mr-1 h-4 w-4 text-mediumGreen" />
                      <span
                        className={
                          city.properties === 0 ? "text-red-500 font-medium" : ""
                        }
                      >
                        {city.properties || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {city.image ? (
                      <div className="relative h-12 w-20 overflow-hidden rounded border">
                        <Image
                          src={city.image}
                          alt={city.name}
                          className="h-full w-full object-cover"
                          fill
                          sizes="80px"
                        />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={city.isVisible ?? true}
                      onCheckedChange={() => handleToggleVisibility(city)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(city)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit Image
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit City Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit City Image - {selectedCity?.name}</DialogTitle>
            <DialogDescription>
              Upload a new image to Cloudinary or use a direct URL
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload to Cloudinary</TabsTrigger>
              <TabsTrigger value="url">Use URL</TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4">
              {selectedCity && (
                <CityImageUploader
                  cityId={selectedCity.id!}
                  cityName={selectedCity.name}
                  currentImage={formData.image}
                  onUploadSuccess={(imageUrl) => {
                    setFormData((prev) => ({ ...prev, image: imageUrl }));
                    setIsEditDialogOpen(false);
                    fetchCities(); // Refresh the list
                    toast({
                      title: "Success",
                      description: `Image for ${selectedCity.name} updated successfully!`,
                    });
                  }}
                />
              )}
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-image">Image URL</Label>
                <Input
                  id="edit-image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-sm text-gray-500">
                  Enter a direct URL to an image file (or upload via Cloudinary tab)
                </p>
              </div>
              {formData.image && (
                <div className="grid gap-2">
                  <Label>Preview</Label>
                  <div className="relative h-48 w-full overflow-hidden rounded border">
                    <Image
                      src={formData.image}
                      alt="Preview"
                      className="h-full w-full object-cover"
                      fill
                      sizes="600px"
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateCity}
                  className="bg-mediumGreen hover:bg-darkGreen text-white"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Update URL
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
