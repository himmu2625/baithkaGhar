import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { QuickStatusTabs } from "./QuickStatusTabs";
import Image from "next/image";
import { STAY_TYPE_OPTIONS, STAY_TYPES, getStayTypeById } from "@/lib/constants/stay-types";
import { 
  Loader2, 
  Home, 
  Hotel, 
  Building, 
  Palmtree, 
  Trash2, 
  Upload, 
  Plus,
  X,
  RefreshCw,
  Check,
  Wifi,
  Tv,
  Car as Parking,
  UtensilsCrossed as Kitchen,
  Wind as AC,
  Waves as Pool,
  Droplets as Geyser,
  Bath as Shower,
  PanelTop as BathTub,
  Clock as Reception24x7,
  UtensilsIcon as RoomService,
  UtensilsIcon as Restaurant,
  Wine as Bar,
  Beer as Pub,
  RefrigeratorIcon as Fridge,
  Edit
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PropertyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onPropertyUpdated: () => void;
}

// Supported property types
const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: Home },
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "villa", label: "Villa", icon: Home },
  { value: "resort", label: "Resort", icon: Palmtree },
];

// Add interface for amenities
interface PropertyAmenities {
  wifi: boolean;
  tv: boolean;
  kitchen: boolean;
  parking: boolean;
  ac: boolean;
  pool: boolean;
  geyser: boolean;
  shower: boolean;
  bathTub: boolean;
  reception24x7: boolean;
  roomService: boolean;
  restaurant: boolean;
  bar: boolean;
  pub: boolean;
  fridge: boolean;
  [key: string]: boolean;
}

export function PropertyEditModal({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
}: PropertyEditModalProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    bedrooms: 0,
    bathrooms: 0,
    maxGuests: 0,
    propertyType: "",
    status: "active" as "active" | "inactive" | "pending" | "available",
    verificationStatus: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
    },
    featured: false,
    otherAmenities: "",
    policyDetails: "",
    minStay: "1",
    maxStay: "30",
    totalHotelRooms: "0",
    propertySize: "",
    availability: "available",
    hotelEmail: ""
  });
  const [amenities, setAmenities] = useState<PropertyAmenities>({
    wifi: false,
    tv: false,
    kitchen: false,
    parking: false,
    ac: false,
    pool: false,
    geyser: false,
    shower: false,
    bathTub: false,
    reception24x7: false,
    roomService: false,
    restaurant: false,
    bar: false,
    pub: false,
    fridge: false
  });
  const [stayTypes, setStayTypes] = useState<string[]>(property?.stayTypes || []);
  const [images, setImages] = useState<Array<{ url: string; public_id: string }>>([]);
  const [reorderMode, setReorderMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load property data when modal opens
  useEffect(() => {
    if (property && isOpen) {
      console.log("Loading property data:", property);
      setFormData({
        title: property.title || "",
        description: property.description || "",
        price: property.price?.base || property.price || 0,
        bedrooms: property.rooms?.bedrooms || property.bedrooms || 0,
        bathrooms: property.rooms?.bathrooms || property.bathrooms || 0,
        maxGuests: property.maxGuests || 2,
        propertyType: property.type || property.propertyType || "apartment",
        status: (property.status || "active") as "active" | "inactive" | "pending" | "available",
        verificationStatus: property.verificationStatus || "pending",
        address: {
          street: property.address?.street || "",
          city: property.address?.city || property.location?.city || "",
          state: property.address?.state || property.location?.state || "",
          zipCode: property.address?.zipCode || "",
          country: property.address?.country || "India",
        },
        featured: property.featured || false,
        otherAmenities: property.otherAmenities || "",
        policyDetails: property.policyDetails || "",
        minStay: property.minStay || "1",
        maxStay: property.maxStay || "30",
        totalHotelRooms: property.totalHotelRooms || "0",
        propertySize: property.propertySize || "",
        availability: property.availability || "available",
        hotelEmail: property.hotelEmail || ""
      });

      // Format images
      const propertyImages = property.images || [];
      const formattedImages = Array.isArray(propertyImages)
        ? propertyImages.map((img: any) => ({
            url: typeof img === "string" ? img : img.url || "",
            public_id: img.public_id || "",
          }))
        : [];
      setImages(formattedImages);
      
      // Load amenities
      const propertyAmenities = property.generalAmenities || property.amenities || {};
      if (typeof propertyAmenities === 'object') {
        setAmenities(prev => {
          const updatedAmenities = { ...prev };
          // Handle different possible formats
          if (Array.isArray(propertyAmenities)) {
            // If it's an array of strings like ["wifi", "tv"]
            propertyAmenities.forEach((amenity: string) => {
              if (amenity in updatedAmenities) {
                updatedAmenities[amenity] = true;
              }
            });
          } else {
            // If it's an object like { wifi: true, tv: false }
            Object.keys(propertyAmenities).forEach(key => {
              if (key in updatedAmenities) {
                updatedAmenities[key] = propertyAmenities[key] === true;
              }
            });
          }
          return updatedAmenities;
        });
      }
      
      // Load stay types
      setStayTypes(property.stayTypes || []);
    }
  }, [property, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any>),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : Number(value),
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log(`Changing select field ${name} to ${value}`);
    if (name === "status") {
      setFormData((prev) => ({
        ...prev,
        [name]: value as "active" | "inactive" | "pending" | "available",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleBooleanChange = (name: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add a handler for amenities toggle
  const handleAmenityToggle = (amenity: keyof PropertyAmenities) => {
    setAmenities(prev => ({
      ...prev,
      [amenity]: !prev[amenity]
    }));
  };

  // Add a handler for stay types toggle
  const handleStayTypeToggle = (stayTypeId: string) => {
    setStayTypes(prev => {
      if (prev.includes(stayTypeId)) {
        return prev.filter(id => id !== stayTypeId);
      } else {
        return [...prev, stayTypeId];
      }
    });
  };
  
  // Add a handler for reordering images
  const handleReorderImages = (dragIndex: number, dropIndex: number) => {
    const updatedImages = [...images];
    const draggedItem = updatedImages[dragIndex];
    
    // Remove the item from its original position
    updatedImages.splice(dragIndex, 1);
    
    // Insert the item at the new position
    updatedImages.splice(dropIndex, 0, draggedItem);
    
    setImages(updatedImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!property) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Validate stay types
      if (stayTypes.length === 0) {
        throw new Error('Please select at least one stay type');
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        price: {
          base: formData.price,
        },
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        propertyType: formData.propertyType || "apartment",
        status: formData.status || 'available',
        address: formData.address,
        featured: formData.featured,
        generalAmenities: amenities,
        otherAmenities: formData.otherAmenities,
        policyDetails: formData.policyDetails,
        minStay: formData.minStay,
        maxStay: formData.maxStay, 
        totalHotelRooms: formData.totalHotelRooms,
        propertySize: formData.propertySize,
        availability: formData.availability,
        hotelEmail: formData.hotelEmail,
        stayTypes: stayTypes
      };

      console.log('Updating property with data:', updateData);

      const response = await fetch(`/api/properties/${property._id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

             if (result.success) {
         toast({
           title: "Success",
           description: "Property updated successfully",
         });
         onPropertyUpdated?.();
         onClose();
       } else {
         throw new Error(result.message || 'Failed to update property');
       }
     } catch (error) {
       console.error('Error updating property:', error);
       setError(error instanceof Error ? error.message : 'An error occurred');
       toast({
         title: "Error",
         description: error instanceof Error ? error.message : 'Failed to update property',
         variant: "destructive",
       });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append("file", files[0]);
      formData.append("upload_preset", "baithaka"); // Your Cloudinary upload preset
      
      // Log upload info
      console.log("Uploading image to Cloudinary...");
      
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/your-cloud-name/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error uploading to Cloudinary:", response.status, errorData);
        throw new Error(`Failed to upload image: ${response.status}`);
      }

      const data = await response.json();
      console.log("Cloudinary upload response:", data);
      
      // Add the new image to the images array
      setImages((prev) => [
        ...prev,
        { url: data.secure_url, public_id: data.public_id },
      ]);
      
      // Update property with new image
      console.log(`Adding image to property ${property.id}:`, { url: data.secure_url, public_id: data.public_id });
      
      const propertyResponse = await fetch(`/api/properties/${property.id}/images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          image: { url: data.secure_url, public_id: data.public_id },
        }),
      });
      
      if (!propertyResponse.ok) {
        const errorData = await propertyResponse.json().catch(() => ({}));
        console.error("Error adding image to property:", propertyResponse.status, errorData);
        throw new Error(`Failed to add image to property: ${propertyResponse.status}`);
      }
      
      const propertyData = await propertyResponse.json();
      console.log("Property image update response:", propertyData);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (index: number) => {
    try {
      const imageToDelete = images[index];
      
      // Remove image from UI first for better UX
      setImages((prev) => prev.filter((_, i) => i !== index));
      
      if (imageToDelete.public_id) {
        // Delete from Cloudinary and update property
        console.log(`Trying to delete image with public_id: ${imageToDelete.public_id}`);
        
        try {
          // First try the DELETE method
          const response = await fetch(`/api/properties/${property.id}/images/${imageToDelete.public_id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Delete image response:", data);
            
            toast({
              title: "Success",
              description: "Image deleted successfully",
            });
            return;
          }
          
          // If DELETE fails with 405, try POST with _method=delete
          if (response.status === 405) {
            console.log("DELETE method not allowed, trying POST method with _method parameter");
            
            const postResponse = await fetch(`/api/properties/${property.id}/images/remove`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                public_id: imageToDelete.public_id,
                _method: "delete"
              })
            });
            
            if (postResponse.ok) {
              const data = await postResponse.json();
              console.log("Delete image (POST fallback) response:", data);
              
              toast({
                title: "Success",
                description: "Image deleted successfully (via fallback)",
              });
              return;
            }
            
            // If fallback also fails
            const errorData = await postResponse.json().catch(() => ({}));
            console.error("All delete methods failed. Final error:", postResponse.status, errorData);
            throw new Error(`Failed to delete image after trying all methods: ${postResponse.status}`);
          }
          
          // If it failed for some other reason
          const errorData = await response.json().catch(() => ({}));
          console.error("Error deleting image:", response.status, errorData);
          throw new Error(`Failed to delete image: ${response.status} ${errorData.message || ""}`);
        } catch (err) {
          console.error("Error during image deletion:", err);
          throw err;
        }
      }

      toast({
        title: "Success",
        description: "Image removed from list",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      
      // Restore images on error (as they were removed optimistically)
      toast({
        title: "Error",
        description: "Failed to delete image. The image may still exist on the server.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProperty = async () => {
    if (!confirm("Are you sure you want to delete this property? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      
      console.log(`Attempting to delete property with ID: ${property.id}`);
      
      // Use our new universal deletion endpoint
      const deleteUrl = `/api/properties/delete-property`;
      console.log("Using universal delete endpoint:", deleteUrl);
      
      const response = await fetch(deleteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          id: property.id
        })
      });
      
      let responseText = "";
      let responseData;
      
      try {
        responseText = await response.text();
        try {
          responseData = JSON.parse(responseText);
          console.log("Response JSON:", responseData);
        } catch (e) {
          console.log("Response is not JSON:", responseText);
          responseData = { rawText: responseText };
        }
      } catch (err) {
        console.error("Error reading response:", err);
        responseData = { error: "Failed to read response" };
      }
      
      // Check if the response was successful
      if (response.ok) {
        console.log("Delete property response:", responseData);
        
        toast({
          title: "Success",
          description: "Property deleted successfully",
        });
        
        onPropertyUpdated();
        onClose();
        return;
      }
      
      // If we got here, it failed
      console.error("Error deleting property:", response.status, responseData);
      throw new Error(`Failed to delete property: ${response.status} - ${responseData?.message || 'Unknown error'}`);
    } catch (error) {
      console.error("Error deleting property:", error);
      toast({
        title: "Error",
        description: `Failed to delete property: ${(error as Error).message}. Check console for details.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit Property
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter property title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter property description"
                  rows={4}
                />
              </div>

              <div>
                <Label className="block mb-2">Property Type</Label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                          formData.propertyType === type.value
                            ? "border-lightGreen bg-lightGreen/20"
                            : "border-gray-200 hover:border-lightGreen hover:bg-lightGreen/10"
                        }`}
                        onClick={() => handleSelectChange("propertyType", type.value)}
                      >
                        <Icon className="h-8 w-8 mx-auto mb-2 text-mediumGreen" />
                        <span className="text-sm font-medium text-darkGreen">
                          {type.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address.street">Street</Label>
                  <Input
                    id="address.street"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleInputChange}
                    placeholder="Street address"
                  />
                </div>

                <div>
                  <Label htmlFor="address.city">City</Label>
                  <Input
                    id="address.city"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>

                <div>
                  <Label htmlFor="address.state">State</Label>
                  <Input
                    id="address.state"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    placeholder="State"
                  />
                </div>

                <div>
                  <Label htmlFor="address.zipCode">Zip Code</Label>
                  <Input
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleInputChange}
                    placeholder="Zip code"
                  />
                </div>

                <div>
                  <Label htmlFor="address.country">Country</Label>
                  <Input
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="hotelEmail">Hotel Email</Label>
                    <Input
                      id="hotelEmail"
                      name="hotelEmail"
                      type="email"
                      value={formData.hotelEmail}
                      onChange={handleInputChange}
                      placeholder="hotel@example.com (Optional)"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Official hotel email for booking confirmations (if different from property owner)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price per Night (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleNumberChange}
                  placeholder="Price per night"
                />
              </div>

              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={handleNumberChange}
                  placeholder="Number of bedrooms"
                />
              </div>

              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={handleNumberChange}
                  placeholder="Number of bathrooms"
                />
              </div>

              <div>
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  name="maxGuests"
                  type="number"
                  value={formData.maxGuests}
                  onChange={handleNumberChange}
                  placeholder="Maximum number of guests"
                />
              </div>
              
              <div>
                <Label htmlFor="propertySize">Property Size (sq ft)</Label>
                <Input
                  id="propertySize"
                  name="propertySize"
                  value={formData.propertySize}
                  onChange={handleInputChange}
                  placeholder="Size of the property"
                />
              </div>
              
              <div>
                <Label htmlFor="totalHotelRooms">Total Rooms (Hotel/Resort)</Label>
                <Input
                  id="totalHotelRooms"
                  name="totalHotelRooms"
                  value={formData.totalHotelRooms}
                  onChange={handleInputChange}
                  placeholder="Total number of rooms"
                />
              </div>
            </div>
            
            <h3 className="text-lg font-medium mt-6">Stay Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minStay">Minimum Stay (Nights)</Label>
                <Input
                  id="minStay"
                  name="minStay"
                  value={formData.minStay}
                  onChange={handleInputChange}
                  placeholder="1"
                />
              </div>
              
              <div>
                <Label htmlFor="maxStay">Maximum Stay (Nights)</Label>
                <Input
                  id="maxStay"
                  name="maxStay"
                  value={formData.maxStay}
                  onChange={handleInputChange}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <Label className="text-lg font-medium">Stay Types</Label>
              <p className="text-sm text-gray-600">Select all applicable stay types for this property</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(STAY_TYPES).map(([id, stayType]) => (
                  <div
                    key={id}
                    className={`flex items-center space-x-3 ${
                      stayTypes.includes(id)
                        ? "border-lightGreen bg-lightGreen/10"
                        : "border-gray-200"
                    }`}
                  >
                    <Checkbox
                      id={`stay-type-${id}`}
                      checked={stayTypes.includes(id)}
                      onCheckedChange={() => handleStayTypeToggle(id)}
                      className="h-4 w-4"
                    />
                    <Label 
                      htmlFor={`stay-type-${id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        {typeof stayType.icon === 'string' ? (
                          <span className="text-lg">{stayType.icon}</span>
                        ) : (
                          <stayType.icon className="h-5 w-5" />
                        )}
                        <span>{stayType.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {stayType.description}
                      </p>
                    </Label>
                  </div>
                ))}
              </div>
              
              <div>
                <Label htmlFor="availability">Availability</Label>
                <Select
                  value={formData.availability}
                  onValueChange={(value) => handleSelectChange("availability", value)}
                >
                  <SelectTrigger id="availability">
                    <SelectValue placeholder="Select availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="booked">Fully Booked</SelectItem>
                    <SelectItem value="maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="amenities" className="space-y-4 mt-4">
            <h3 className="text-lg font-medium">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {Object.entries(amenities).map(([key, value]) => {
                // Dynamic icon selection
                let AmenityIcon;
                switch(key) {
                  case 'wifi': AmenityIcon = Wifi; break;
                  case 'tv': AmenityIcon = Tv; break;
                  case 'kitchen': AmenityIcon = Kitchen; break;
                  case 'parking': AmenityIcon = Parking; break;
                  case 'ac': AmenityIcon = AC; break;
                  case 'pool': AmenityIcon = Pool; break;
                  case 'geyser': AmenityIcon = Geyser; break;
                  case 'shower': AmenityIcon = Shower; break;
                  case 'bathTub': AmenityIcon = BathTub; break;
                  case 'reception24x7': AmenityIcon = Reception24x7; break;
                  case 'roomService': AmenityIcon = RoomService; break;
                  case 'restaurant': AmenityIcon = Restaurant; break;
                  case 'bar': AmenityIcon = Bar; break;
                  case 'pub': AmenityIcon = Pub; break;
                  case 'fridge': AmenityIcon = Fridge; break;
                  default: AmenityIcon = Check; break;
                }
                
                return (
                  <div 
                    key={key} 
                    className={`flex items-center gap-2 p-3 border rounded-md cursor-pointer transition-colors ${
                      value ? 'border-lightGreen bg-lightGreen/10' : 'border-gray-200'
                    }`}
                    onClick={() => handleAmenityToggle(key as keyof PropertyAmenities)}
                  >
                    <AmenityIcon className={`h-5 w-5 ${value ? 'text-mediumGreen' : 'text-gray-400'}`} />
                    <span className={value ? 'font-medium' : ''}>
                      {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6">
              <Label htmlFor="otherAmenities">Other Amenities</Label>
              <Textarea
                id="otherAmenities"
                name="otherAmenities"
                value={formData.otherAmenities}
                onChange={handleInputChange}
                placeholder="Describe any additional amenities not listed above"
                rows={3}
              />
            </div>
            
            <div className="mt-4">
              <Label htmlFor="policyDetails">Policy Details</Label>
              <Textarea
                id="policyDetails"
                name="policyDetails"
                value={formData.policyDetails}
                onChange={handleInputChange}
                placeholder="Describe property policies (check-in/out, cancellation, etc.)"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="images" className="space-y-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Property Images</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setReorderMode(!reorderMode)}
                className={reorderMode ? "bg-lightGreen/20 border-lightGreen text-darkGreen" : ""}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {reorderMode ? "Done Reordering" : "Reorder Images"}
              </Button>
            </div>
            
            {reorderMode && (
              <div className="bg-yellow-50 p-3 rounded-md mb-4 text-sm text-yellow-800">
                Drag and drop images to reorder them. The first image will be used as the property thumbnail.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group" draggable={reorderMode}>
                  <div className="h-48 w-full relative rounded-md overflow-hidden">
                    <Image
                      src={image.url}
                      alt={`Property image ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                    {index === 0 && (
                      <div className="absolute top-2 left-2 bg-lightGreen text-darkGreen text-xs px-2 py-1 rounded-md font-medium">
                        Main Photo
                      </div>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="h-48 w-full border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-mediumGreen hover:text-mediumGreen transition-colors">
                <Label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                  {uploadingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  ) : (
                    <Upload className="h-8 w-8 mb-2" />
                  )}
                  <span>Upload Image</span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="status" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="status">Property Status</Label>
                
                {/* Status Tabs - Local UI Only */}
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-2">
                                         <button
                       type="button"
                       className={`p-2 rounded-md text-sm font-medium transition-colors ${
                         formData.status === 'active' || formData.status === 'available'
                           ? 'bg-green-100 text-green-800 border-2 border-green-300' 
                           : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                       }`}
                       onClick={() => handleSelectChange("status", "active")}
                     >
                       <Check className="h-4 w-4 inline mr-2" />
                       Active
                     </button>
                    <button
                      type="button"
                      className={`p-2 rounded-md text-sm font-medium transition-colors ${
                        formData.status === 'inactive' 
                          ? 'bg-red-100 text-red-800 border-2 border-red-300' 
                          : 'bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200'
                      }`}
                      onClick={() => handleSelectChange("status", "inactive")}
                    >
                      <X className="h-4 w-4 inline mr-2" />
                      Inactive
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  {formData.status === "active" ? "Property is visible in listings" : "Property is hidden from listings"}
                </p>
                
                <div className="mt-6 p-4 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Quick Status Toggle</h4>
                      <p className="text-sm text-gray-500 mt-1">Activate or deactivate the property</p>
                    </div>
                    <Switch 
                      checked={formData.status === "active" || formData.status === "available"}
                      onCheckedChange={(checked) => {
                        handleSelectChange("status", checked ? "active" : "inactive");
                      }}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select
                  value={formData.verificationStatus}
                  onValueChange={(value) => handleSelectChange("verificationStatus", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={formData.featured}
                  onChange={(e) => handleBooleanChange("featured", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-mediumGreen focus:ring-mediumGreen"
                />
                <Label htmlFor="featured">Featured Property</Label>
              </div>

              <Separator className="my-4" />

              <div className="bg-red-50 p-4 rounded-md">
                <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">
                  Permanently delete this property. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProperty}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Property
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || stayTypes.length === 0}
            className="bg-mediumGreen hover:bg-darkGreen text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Property'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 