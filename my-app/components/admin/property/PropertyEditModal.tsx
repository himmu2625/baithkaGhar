"use client"

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { 
  Loader2, 
  Save, 
  X, 
  Upload, 
  Trash2, 
  Home, 
  Hotel, 
  Building, 
  Palmtree,
  Check,
  AlertCircle,
  ImageIcon,
  Plus
} from "lucide-react";

// Enhanced image categories matching the List Property form
const IMAGE_CATEGORIES = [
  { value: 'exterior', label: 'Exterior', required: true },
  { value: 'interior', label: 'Interior', required: true },
  { value: 'kitchen', label: 'Kitchen', required: false },
  { value: 'bathroom', label: 'Bathroom(s)', required: false },
  { value: 'bedroom', label: 'Bedroom(s)', required: false },
  { value: 'living_room', label: 'Living Room', required: false },
  { value: 'dining_room', label: 'Dining Room', required: false },
  { value: 'balcony', label: 'Balcony/Terrace', required: false },
  { value: 'garden', label: 'Garden/Lawn', required: false },
  { value: 'pool', label: 'Swimming Pool', required: false },
  { value: 'restaurant', label: 'Restaurant', required: false },
  { value: 'pub', label: 'Pub/Bar', required: false },
  { value: 'gym', label: 'Gym/Fitness Center', required: false },
  { value: 'spa', label: 'Spa/Wellness', required: false },
  { value: 'reception', label: 'Reception/Lobby', required: false },
  { value: 'parking', label: 'Parking Area', required: false },
  { value: 'conference', label: 'Conference/Meeting Room', required: false },
  { value: 'rooftop', label: 'Rooftop', required: false },
  { value: 'common_areas', label: 'Common Areas', required: false },
  { value: 'amenities', label: 'Other Amenities', required: false },
];

const PROPERTY_TYPES = [
  { value: "apartment", label: "Apartment", icon: Building },
  { value: "house", label: "House", icon: Home },
  { value: "hotel", label: "Hotel", icon: Hotel },
  { value: "villa", label: "Villa", icon: Home },
  { value: "resort", label: "Resort", icon: Palmtree },
];

const AMENITIES_LIST = [
  'wifi', 'tv', 'kitchen', 'parking', 'ac', 'pool', 'geyser', 'shower', 
  'bathTub', 'reception24x7', 'roomService', 'restaurant', 'bar', 'pub', 'fridge'
];

interface PropertyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onPropertyUpdated: () => void;
}

interface PropertyFormData {
  // Basic Information
  title: string;
  description: string;
  propertyType: string;
  
  // Location
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Property Details
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  propertySize: string;
  totalHotelRooms: string;
  
  // Pricing
  price: number;
  
  // Contact
  hotelEmail: string;
  
  // Policies
  minStay: string;
  maxStay: string;
  policyDetails: string;
  otherAmenities: string;
  
  // Status and Publishing
  status: string;
  verificationStatus: string;
  featured: boolean;
  availability: string;
  isPublished: boolean;
  isAvailable: boolean;
}

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

export function PropertyEditModal({
  isOpen,
  onClose,
  property,
  onPropertyUpdated,
}: PropertyEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    propertyType: "apartment",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "India",
    },
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    propertySize: "",
    totalHotelRooms: "0",
    price: 0,
    hotelEmail: "",
    minStay: "1",
    maxStay: "30",
    policyDetails: "",
    otherAmenities: "",
    status: "active",
    verificationStatus: "pending",
    featured: false,
    availability: "available",
    isPublished: false,
    isAvailable: true,
  });
  
  // Amenities state
  const [amenities, setAmenities] = useState<Record<string, boolean>>(
    AMENITIES_LIST.reduce((acc, amenity) => ({ ...acc, [amenity]: false }), {})
  );
  
  // Images state
  const [categorizedImages, setCategorizedImages] = useState<CategorizedImage[]>([]);
  const [legacyImages, setLegacyImages] = useState<Array<{ url: string; public_id: string }>>([]);
  
  // Stay types state
  const [stayTypes, setStayTypes] = useState<string[]>([]);
  
  // Load property data when modal opens
  useEffect(() => {
    if (property && isOpen) {
      loadPropertyData();
    }
  }, [property, isOpen]);

  const loadPropertyData = () => {
    console.log("Loading property data for editing:", property);
    
    // Map all fields with comprehensive fallbacks based on actual Property model
    setFormData({
      title: property.title || property.name || "",
      description: property.description || "",
      propertyType: property.propertyType || property.type || "apartment",
      address: {
        street: property.address?.street || "",
        city: property.address?.city || property.location || "",
        state: property.address?.state || "",
        zipCode: property.address?.zipCode || "",
        country: property.address?.country || "India",
      },
      bedrooms: Number(property.bedrooms) || 1,
      bathrooms: Number(property.bathrooms) || 1,
      maxGuests: Number(property.maxGuests) || 2,
      propertySize: String(property.propertySize || ""),
      totalHotelRooms: String(property.totalHotelRooms || "0"),
      price: Number(property.price?.base) || Number(property.pricing?.perNight) || 0,
      hotelEmail: property.hotelEmail || "",
      minStay: String(property.minStay || "1"),
      maxStay: String(property.maxStay || "30"),
      policyDetails: property.policyDetails || "",
      otherAmenities: property.otherAmenities || "",
      status: property.status === "available" ? "active" : (property.status === "unavailable" ? "inactive" : property.status || "active"),
      verificationStatus: property.verificationStatus || "pending",
      featured: Boolean(property.featured),
      availability: property.availability || (property.isAvailable ? "available" : "unavailable"),
      isPublished: Boolean(property.isPublished),
      isAvailable: Boolean(property.isAvailable),
    });
    
    // Load amenities from generalAmenities object
    const propertyAmenities = property.generalAmenities || {};
    const newAmenities = { ...amenities };
    AMENITIES_LIST.forEach(amenity => {
      newAmenities[amenity] = Boolean(propertyAmenities[amenity]);
    });
    setAmenities(newAmenities);
    
    // Load categorized images
    const propCategorizedImages = property.categorizedImages || [];
    setCategorizedImages(Array.isArray(propCategorizedImages) ? propCategorizedImages : []);
    
    // Load legacy images from multiple possible sources
    let propLegacyImages = [];
    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages)) {
      propLegacyImages = property.legacyGeneralImages;
    } else if (property.images && Array.isArray(property.images)) {
      // Convert string URLs to objects if needed
      propLegacyImages = property.images.map((img: any) => 
        typeof img === 'string' ? { url: img, public_id: '' } : img
      );
    }
    setLegacyImages(propLegacyImages);
    
    // Load stay types
    setStayTypes(Array.isArray(property.stayTypes) ? property.stayTypes : []);
    
    console.log("Property data loaded successfully");
    console.log("Form data:", {
      title: property.title,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      maxGuests: property.maxGuests,
      price: property.price,
      amenities: property.generalAmenities,
      images: property.categorizedImages,
      legacyImages: property.legacyGeneralImages
    });
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof PropertyFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setAmenities(prev => ({
      ...prev,
      [amenity]: !prev[amenity],
    }));
  };

  const getPropertyId = () => {
    return property?._id || property?.id;
  };

  // Image management functions
  const handleImageUpload = async (category: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingImage(category);
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "baithaka");
      
      console.log(`Uploading image to category: ${category}`);
      
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dswainylz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }

      const data = await response.json();
      console.log("Image uploaded successfully:", data);
      
      // Add image to the appropriate category
      setCategorizedImages(prev => {
        const updated = [...prev];
        const categoryIndex = updated.findIndex(cat => cat.category === category);
        
        if (categoryIndex >= 0) {
          updated[categoryIndex].files.push({
            url: data.secure_url,
            public_id: data.public_id
          });
        } else {
          updated.push({
            category: category,
            files: [{
              url: data.secure_url,
              public_id: data.public_id
            }]
          });
        }
        
        return updated;
      });
      
      toast({
        title: "Success",
        description: `Image uploaded to ${IMAGE_CATEGORIES.find(cat => cat.value === category)?.label}`,
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleImageDelete = (category: string, imageIndex: number) => {
    setCategorizedImages(prev => {
      return prev.map(cat => {
        if (cat.category === category) {
          return {
            ...cat,
            files: cat.files.filter((_, index) => index !== imageIndex)
          };
        }
        return cat;
      }).filter(cat => cat.files.length > 0);
    });
    
    toast({
      title: "Success",
      description: "Image removed successfully",
      variant: "default",
    });
  };

  const handleLegacyImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingImage('legacy');
    
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "baithaka");
      
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/dswainylz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.status}`);
      }

      const data = await response.json();
      
      setLegacyImages(prev => [...prev, {
        url: data.secure_url,
        public_id: data.public_id
      }]);
      
      toast({
        title: "Success",
        description: "Legacy image uploaded successfully",
        variant: "default",
      });
      
    } catch (error) {
      console.error("Error uploading legacy image:", error);
      toast({
        title: "Error",
        description: `Failed to upload image: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleLegacyImageDelete = (imageIndex: number) => {
    setLegacyImages(prev => prev.filter((_, index) => index !== imageIndex));
    
    toast({
      title: "Success",
      description: "Legacy image removed successfully",
      variant: "default",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const propertyId = getPropertyId();
      if (!propertyId) {
        throw new Error("Property ID is missing");
      }

      const updateData = {
        title: formData.title,
        description: formData.description,
        propertyType: formData.propertyType,
        address: formData.address,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        maxGuests: formData.maxGuests,
        propertySize: formData.propertySize,
        totalHotelRooms: formData.totalHotelRooms,
        price: {
          base: formData.price,
        },
        pricing: {
          perNight: String(formData.price),
        },
        hotelEmail: formData.hotelEmail,
        minStay: formData.minStay,
        maxStay: formData.maxStay,
        policyDetails: formData.policyDetails,
        otherAmenities: formData.otherAmenities,
        status: formData.status,
        verificationStatus: formData.verificationStatus,
        featured: formData.featured,
        availability: formData.availability,
        isPublished: formData.isPublished,
        isAvailable: formData.isAvailable,
        generalAmenities: amenities,
        categorizedImages: categorizedImages,
        legacyGeneralImages: legacyImages,
        stayTypes: stayTypes,
      };

      console.log("Saving property with data:", updateData);

      const response = await fetch(`/api/properties/${propertyId}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update property');
      }

      const result = await response.json();
      console.log("Property updated successfully:", result);

      toast({
        title: "Success",
        description: "Property updated successfully",
        variant: "default",
      });

      onPropertyUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating property:", error);
      toast({
        title: "Error",
        description: `Failed to update property: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Edit Property: {formData.title || "Unnamed Property"}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details & Pricing</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          {/* Basic Information Tab */}
          <TabsContent value="basic" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label htmlFor="title">Property Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter property title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your property"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Property Type *</Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
                  {PROPERTY_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div
                        key={type.value}
                        className={`border rounded-lg p-3 text-center cursor-pointer transition-all ${
                          formData.propertyType === type.value
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-green-300"
                        }`}
                        onClick={() => handleInputChange('propertyType', type.value)}
                      >
                        <Icon className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Address Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                      onChange={(e) => handleInputChange('address.street', e.target.value)}
                      placeholder="Enter street address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                      onChange={(e) => handleInputChange('address.city', e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                      onChange={(e) => handleInputChange('address.state', e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                      onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <Label htmlFor="hotelEmail">Hotel Email (Optional)</Label>
                <Input
                  id="hotelEmail"
                  type="email"
                  value={formData.hotelEmail}
                  onChange={(e) => handleInputChange('hotelEmail', e.target.value)}
                  placeholder="hotel@example.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Official hotel email for booking confirmations
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Details & Pricing Tab */}
          <TabsContent value="details" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price">Price per Night (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', Number(e.target.value))}
                  placeholder="Enter price per night"
                />
              </div>
              
              <div>
                <Label htmlFor="bedrooms">Bedrooms *</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div>
                <Label htmlFor="bathrooms">Bathrooms *</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                  min="0"
                />
              </div>
              
              <div>
                <Label htmlFor="maxGuests">Maximum Guests *</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  value={formData.maxGuests}
                  onChange={(e) => handleInputChange('maxGuests', Number(e.target.value))}
                  min="1"
                />
              </div>
              
              <div>
                <Label htmlFor="propertySize">Property Size (sq ft)</Label>
                <Input
                  id="propertySize"
                  value={formData.propertySize}
                  onChange={(e) => handleInputChange('propertySize', e.target.value)}
                  placeholder="Enter property size"
                />
              </div>
              
              <div>
                <Label htmlFor="totalHotelRooms">Total Rooms (for Hotels/Resorts)</Label>
                <Input
                  id="totalHotelRooms"
                  value={formData.totalHotelRooms}
                  onChange={(e) => handleInputChange('totalHotelRooms', e.target.value)}
                  placeholder="Total number of rooms"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="minStay">Minimum Stay (nights)</Label>
                <Input
                  id="minStay"
                  value={formData.minStay}
                  onChange={(e) => handleInputChange('minStay', e.target.value)}
                  placeholder="1"
                />
              </div>
              
              <div>
                <Label htmlFor="maxStay">Maximum Stay (nights)</Label>
                <Input
                  id="maxStay"
                  value={formData.maxStay}
                  onChange={(e) => handleInputChange('maxStay', e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="policyDetails">Policy Details</Label>
              <Textarea
                id="policyDetails"
                value={formData.policyDetails}
                onChange={(e) => handleInputChange('policyDetails', e.target.value)}
                placeholder="Check-in/out times, cancellation policy, house rules, etc."
                rows={4}
              />
            </div>

            {/* Property Status */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Property Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="verificationStatus">Verification Status</Label>
                  <Select value={formData.verificationStatus} onValueChange={(value) => handleInputChange('verificationStatus', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured}
                    onCheckedChange={(checked) => handleInputChange('featured', checked)}
                  />
                  <Label htmlFor="featured">Featured Property</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => handleInputChange('isPublished', checked)}
                  />
                  <Label htmlFor="isPublished">Published (Visible to Users)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAvailable"
                    checked={formData.isAvailable}
                    onCheckedChange={(checked) => handleInputChange('isAvailable', checked)}
                  />
                  <Label htmlFor="isAvailable">Available for Booking</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Amenities Tab */}
          <TabsContent value="amenities" className="space-y-6 mt-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Property Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {AMENITIES_LIST.map((amenity) => (
                  <div
                    key={amenity}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      amenities[amenity]
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                    onClick={() => handleAmenityToggle(amenity)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={amenities[amenity]}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="pointer-events-none"
                      />
                      <span className="text-sm font-medium capitalize">
                        {amenity.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="otherAmenities">Other Amenities</Label>
              <Textarea
                id="otherAmenities"
                value={formData.otherAmenities}
                onChange={(e) => handleInputChange('otherAmenities', e.target.value)}
                placeholder="List any additional amenities not mentioned above"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6 mt-6">
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Upload high-quality images for better property presentation. 
                  <strong> Exterior and Interior images are required.</strong>
                </AlertDescription>
              </Alert>

              {/* Categorized Images Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Categorized Images
                </h3>
                
                <div className="grid gap-4">
                  {IMAGE_CATEGORIES.map((category) => {
                    const categoryImages = categorizedImages.find(cat => cat.category === category.value)?.files || [];
                    const isRequired = category.required;
                    const hasImages = categoryImages.length > 0;
                    
                    return (
                      <div 
                        key={category.value}
                        className={`border rounded-lg p-4 ${
                          isRequired && !hasImages 
                            ? 'border-red-300 bg-red-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {category.label}
                              {isRequired && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </h4>
                            {hasImages && (
                              <Badge variant="secondary" className="text-xs">
                                {categoryImages.length} image{categoryImages.length !== 1 ? 's' : ''}
                              </Badge>
                            )}
                            {isRequired && hasImages && (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files) {
                                  handleImageUpload(category.value, e.target.files);
                                }
                              }}
                              className="hidden"
                              id={`upload-${category.value}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                document.getElementById(`upload-${category.value}`)?.click();
                              }}
                              disabled={uploadingImage === category.value}
                              className="text-xs"
                            >
                              {uploadingImage === category.value ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Image
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {isRequired && !hasImages && (
                          <p className="text-red-600 text-sm mb-3">
                            This image category is required for property listing.
                          </p>
                        )}
                        
                        {categoryImages.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {categoryImages.map((image, index) => (
                              <div key={index} className="relative group">
                                <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                                  <Image
                                    src={image.url}
                                    alt={`${category.label} ${index + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                      onClick={() => handleImageDelete(category.value, index)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                            onClick={() => {
                              document.getElementById(`upload-${category.value}`)?.click();
                            }}
                          >
                            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Click to upload {category.label.toLowerCase()} images
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Legacy Images Section */}
              {legacyImages.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Legacy Images
                    <Badge variant="outline" className="text-xs">
                      {legacyImages.length} image{legacyImages.length !== 1 ? 's' : ''}
                    </Badge>
                  </h3>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600">
                        These are images uploaded before the categorization system was implemented.
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files) {
                              handleLegacyImageUpload(e.target.files);
                            }
                          }}
                          className="hidden"
                          id="upload-legacy"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            document.getElementById('upload-legacy')?.click();
                          }}
                          disabled={uploadingImage === 'legacy'}
                          className="text-xs"
                        >
                          {uploadingImage === 'legacy' ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Add Legacy Image
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {legacyImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative w-full h-24 rounded-lg overflow-hidden border">
                            <Image
                              src={image.url}
                              alt={`Legacy image ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                onClick={() => handleLegacyImageDelete(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Image Upload Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Image Upload Guidelines</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Upload high-resolution images (minimum 1024x768 pixels)</li>
                  <li>• Ensure good lighting and clear view of the areas</li>
                  <li>• Exterior and Interior images are mandatory</li>
                  <li>• Use relevant categories to help guests find what they're looking for</li>
                  <li>• Maximum file size: 10MB per image</li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 