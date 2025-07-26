"use client"

import React, { useState, useEffect, useCallback } from "react";
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

interface ImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: { value: string; label: string } | undefined;
  images: Array<{ url: string; public_id: string }>;
  onDelete: (categoryValue: string, imageIndex: number) => void;
}

const ImageGalleryModal: React.FC<ImageGalleryModalProps> = ({
  isOpen,
  onClose,
  category,
  images,
  onDelete,
}) => {
  if (!isOpen || !category) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Images for: {category.label}</DialogTitle>
          <AlertDescription>
            You have {images.length} image(s) in this category.
          </AlertDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div key={image.public_id || index} className="relative group">
                <Image
                  src={image.url}
                  alt={`${category.label} image ${index + 1}`}
                  layout="responsive"
                  width={250}
                  height={250}
                  objectFit="cover"
                  className="rounded-md border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(category.value, index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


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

// Room type constants
const hotelRoomTypes = [
  { value: "classic", label: "Classic Room" },
  { value: "deluxe", label: "Deluxe Room" },
  { value: "super_deluxe", label: "Super Deluxe Room" },
  { value: "suite", label: "Suite Room" },
  { value: "executive", label: "Executive Room" },
  { value: "honeymoon_suite", label: "Honeymoon Suite" },
  { value: "queen_suite", label: "Queen Suite" },
  { value: "king_suite", label: "King Suite" },
];

const residentialUnitTypes = [
  { value: "1bhk", label: "1BHK" },
  { value: "2bhk", label: "2BHK" },
  { value: "3bhk", label: "3BHK" },
  { value: "4bhk", label: "4BHK" },
  { value: "5bhk", label: "5BHK" },
  { value: "6bhk", label: "6BHK" },
  { value: "wooden_cottage", label: "Wooden Cottage" },
  { value: "penthouse", label: "Penthouse" },
];

// Combined room options for resorts (both hotel-style and apartment-style)
const resortRoomTypes = [
  ...hotelRoomTypes,
  ...residentialUnitTypes,
];

interface PropertyEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onPropertyUpdated: () => void;
}

interface PropertyFormData {
  // Basic Information
  name: string;
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
  contactNo: string;
  email: string;
  
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
  // Google Maps
  googleMapLink?: string;
  lat?: string;
  lng?: string;
}

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

interface RoomCategoryDetail {
  name: string;
  count: string;
  roomNumbers?: string[];
}

interface CategoryPriceDetail {
  categoryName: string;
  price: string;
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
  // Drag & drop state for image reordering
  const [dragInfo, setDragInfo] = useState<{ category: string; index: number } | null>(null);

  // Handlers for drag & drop
  const handleImageDragStart = (category: string, index: number) => {
    setDragInfo({ category, index });
  };

  const handleImageDrop = (category: string, index: number) => {
    if (!dragInfo || dragInfo.category !== category) return;

    setCategorizedImages(prev => prev.map(c => {
      if (c.category !== category) return c;
      const files = [...c.files];
      const [moved] = files.splice(dragInfo.index, 1);
      files.splice(index, 0, moved);
      return { ...c, files };
    }));
    setDragInfo(null);
  };
  
  // Form data state
  const [formData, setFormData] = useState<PropertyFormData>({
    name: "",
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
    contactNo: "",
    email: "",
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
    googleMapLink: '',
    lat: '',
    lng: ''
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
  
  // Room categories state
  const [selectedCategories, setSelectedCategories] = useState<RoomCategoryDetail[]>([]);
  const [categoryPrices, setCategoryPrices] = useState<CategoryPriceDetail[]>([]);

  // Gallery modal state
  const [galleryState, setGalleryState] = useState<{ isOpen: boolean; category: string | null }>({ isOpen: false, category: null });
  
  const loadPropertyData = useCallback(() => {
    
    // Map all fields with comprehensive fallbacks based on actual Property model
    setFormData({
      name: property.name || property.title || "",
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
      contactNo: property.contactNo || "",
      email: property.email || "",
      hotelEmail: property.hotelEmail || "",
      minStay: String(property.minStay || "1"),
      maxStay: String(property.maxStay || "30"),
      policyDetails: property.policyDetails || "",
      otherAmenities: property.otherAmenities || "",
      status: property.status === "available" ? "active" : (property.status === "unavailable" ? "inactive" : "maintenance"),
      verificationStatus: property.verificationStatus || "pending",
      featured: Boolean(property.featured),
      availability: property.availability || (property.isAvailable ? "available" : "unavailable"),
      isPublished: Boolean(property.isPublished),
      isAvailable: Boolean(property.isAvailable),
      googleMapLink: property.googleMapLink || '',
      lat: property.locationCoords?.lat ? String(property.locationCoords.lat) : (property.address?.coordinates?.lat ? String(property.address.coordinates.lat) : ''),
      lng: property.locationCoords?.lng ? String(property.locationCoords.lng) : (property.address?.coordinates?.lng ? String(property.address.coordinates.lng) : ''),
    });
    
    // Load amenities - fix the loading logic
    const loadedAmenities: Record<string, boolean> = AMENITIES_LIST.reduce((acc, amenity) => ({ ...acc, [amenity]: false }), {});
    
    // Check if generalAmenities has any true values
    const hasActiveGeneralAmenities = property.generalAmenities && 
      Object.values(property.generalAmenities).some(value => Boolean(value));
    
    if (hasActiveGeneralAmenities) {
      // Use generalAmenities if it has active amenities
      Object.keys(property.generalAmenities).forEach(amenity => {
        if (amenity in loadedAmenities) {
          loadedAmenities[amenity] = Boolean(property.generalAmenities[amenity]);
        }
    });
    } else if (Array.isArray(property.amenities) && property.amenities.length > 0) {
      // Use amenities array if generalAmenities are all false or don't exist
      property.amenities.forEach((amenity: string) => {
        if (amenity in loadedAmenities) {
          loadedAmenities[amenity] = true;
        }
      });
    }
    
    setAmenities(loadedAmenities);
    
    // Load categorized images
    if (Array.isArray(property.categorizedImages) && property.categorizedImages.length > 0) {
      setCategorizedImages(property.categorizedImages);
    } else {
      setCategorizedImages([]);
    }
    
    // Load legacy images
    if (Array.isArray(property.images) && property.images.length > 0) {
      setLegacyImages(property.images.map((img: any) => ({
        url: typeof img === 'string' ? img : img.url,
        public_id: typeof img === 'string' ? '' : img.public_id || ''
      })));
    } else {
      setLegacyImages([]);
    }
    
    // Load stay types
    if (Array.isArray(property.stayTypes)) {
      setStayTypes(property.stayTypes.map((t: string) => t.replace("_", "-")));
    }
    
    // Load property units - fix the loading logic
    if (Array.isArray(property.propertyUnits) && property.propertyUnits.length > 0) {
      const initialCategories = property.propertyUnits.map((unit: any) => ({
        name: unit.unitTypeCode || unit.unitTypeName,
        count: String(unit.count || 1),
        roomNumbers: unit.roomNumbers && Array.isArray(unit.roomNumbers) 
          ? unit.roomNumbers.map((room: any) => room.number || room) 
          : []
      }));
      setSelectedCategories(initialCategories);
      
      const initialPrices = property.propertyUnits.map((unit: any) => ({
        categoryName: unit.unitTypeCode || unit.unitTypeName,
        price: String(unit.pricing?.price || unit.pricing?.perNight || "0")
      }));
      setCategoryPrices(initialPrices);
    } else {
      setSelectedCategories([]);
      setCategoryPrices([]);
    }
    
  }, [property]);

  // Load property data when modal opens
  useEffect(() => {
    if (property && isOpen) {
      loadPropertyData();
    }
  }, [property, isOpen, loadPropertyData]);

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

  // Get current room category options based on property type
  const getCurrentCategoryOptions = () => {
    if (formData.propertyType === "hotel") {
      return hotelRoomTypes;
    } else if (formData.propertyType === "resort") {
      return resortRoomTypes;
    } else if (["villa", "house", "apartment"].includes(formData.propertyType)) {
      return residentialUnitTypes;
    }
    return [];
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.name === categoryName);
      if (isSelected) {
        // Remove category and its price
        setCategoryPrices(prevPrices => prevPrices.filter(p => p.categoryName !== categoryName));
        return prev.filter(c => c.name !== categoryName);
      } else {
        // Add category and initialize its price
        setCategoryPrices(prevPrices => {
          const existingPrice = prevPrices.find(p => p.categoryName === categoryName);
          if (!existingPrice) {
            return [...prevPrices, { categoryName, price: "" }];
          }
          return prevPrices;
        });
        return [...prev, { name: categoryName, count: "1" }];
      }
    });
  };

  const handleCategoryRoomCountChange = (categoryName: string, count: string) => {
    setSelectedCategories(prev => 
      prev.map(c => {
        if (c.name === categoryName) {
          // Initialize room numbers array based on count
          const roomCount = parseInt(count, 10) || 0;
          const existingRoomNumbers = c.roomNumbers || [];
          let newRoomNumbers = [...existingRoomNumbers];
          
          if (roomCount > existingRoomNumbers.length) {
            // Add new empty room numbers
            for (let i = existingRoomNumbers.length; i < roomCount; i++) {
              newRoomNumbers.push('');
            }
          } else if (roomCount < existingRoomNumbers.length) {
            // Remove excess room numbers
            newRoomNumbers = newRoomNumbers.slice(0, roomCount);
          }
          
          return { ...c, count, roomNumbers: newRoomNumbers };
        }
        return c;
      })
    );
  };

  const handleRoomNumberChange = (categoryName: string, roomIndex: number, roomNumber: string) => {
    setSelectedCategories(prev => 
      prev.map(c => {
        if (c.name === categoryName) {
          const newRoomNumbers = [...(c.roomNumbers || [])];
          newRoomNumbers[roomIndex] = roomNumber;
          return { ...c, roomNumbers: newRoomNumbers };
        }
        return c;
      })
    );
  };

  const handleCategoryPriceChange = (categoryName: string, price: string) => {
    setCategoryPrices(prev => 
      prev.map(cp => 
        cp.categoryName === categoryName ? { ...cp, price } : cp
      )
    );
  };

  // Image management functions
  const handleImageUpload = async (category: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingImage(category);
    
    try {
      // 1. Get signature from the backend
      const signResponse = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: `property_images/${category}` }),
      });

      if (!signResponse.ok) {
        throw new Error('Failed to get upload signature.');
      }

      const signData = await signResponse.json();

      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload image: ${errorData.error.message}`);
      }

      const data = await response.json();
      
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
       // 1. Get signature from the backend
       const signResponse = await fetch('/api/cloudinary/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: 'property_images/legacy' }),
      });

      if (!signResponse.ok) {
        throw new Error('Failed to get upload signature.');
      }

      const signData = await signResponse.json();

      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.apiKey);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to upload image: ${errorData.error.message}`);
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

      // Ensure all required amenities have a boolean value
      const completeAmenities = AMENITIES_LIST.reduce((acc, amenity) => {
        acc[amenity] = !!amenities[amenity];
        return acc;
      }, {} as Record<string, boolean>);

      // Build ordered categorized images (Exterior, Interior, then others)
      const orderedCategorizedImages = [
        ...IMAGE_CATEGORIES.map(cat => categorizedImages.find(c => c.category === cat.value)).filter(Boolean),
        ...categorizedImages.filter(c => !IMAGE_CATEGORIES.some(cat => cat.value === c.category))
      ];

      // Transform the data to match backend schema
      const updateData = {
        name: formData.name || formData.title,
        title: formData.title,
        description: formData.description || "No description provided",
        propertyType: formData.propertyType,
        location: `${formData.address.city}, ${formData.address.state}, ${formData.address.country}`,
        address: {
          street: formData.address.street || "Not specified",
          city: formData.address.city || "",
          state: formData.address.state || "",
          zipCode: formData.address.zipCode || "000000",
          country: formData.address.country || "India",
          coordinates: {
            lat: formData.lat ? parseFloat(formData.lat) : 0,
            lng: formData.lng ? parseFloat(formData.lng) : 0
          }
        },
        contactNo: formData.contactNo || "0000000000",
        email: formData.email || "noemail@example.com",
        price: {
          base: parseFloat(formData.price.toString()) || 0,
        },
        pricing: {
          perNight: formData.price.toString() || "0",
          perWeek: (parseFloat(formData.price.toString()) * 7).toString() || "0",
          perMonth: (parseFloat(formData.price.toString()) * 30).toString() || "0",
        },
        maxGuests: formData.maxGuests || 1,
        bedrooms: formData.bedrooms || 1,
        bathrooms: formData.bathrooms || 1,
        beds: formData.bedrooms || 1,
        // Fix stayTypes conversion: convert underscores to hyphens
        stayTypes: stayTypes.map(type => type.replace(/[-_]/g, "-")),
        generalAmenities: {
          wifi: completeAmenities.wifi || false,
          tv: completeAmenities.tv || false,
          kitchen: completeAmenities.kitchen || false,
          parking: completeAmenities.parking || false,
          ac: completeAmenities.ac || false,
          pool: completeAmenities.pool || false,
          geyser: completeAmenities.geyser || false,
          shower: completeAmenities.shower || false,
          bathTub: completeAmenities.bathTub || false,
          reception24x7: completeAmenities.reception24x7 || false,
          roomService: completeAmenities.roomService || false,
          restaurant: completeAmenities.restaurant || false,
          bar: completeAmenities.bar || false,
          pub: completeAmenities.pub || false,
          fridge: completeAmenities.fridge || false,
        },
        otherAmenities: formData.otherAmenities || "",
        status: formData.status === "active" ? "available" : "unavailable",
        categorizedImages: orderedCategorizedImages,
        propertyUnits: selectedCategories.length > 0 ? selectedCategories.map(category => {
          const categoryPrice = categoryPrices.find(cp => cp.categoryName === category.name);
          const categoryOption = getCurrentCategoryOptions().find(opt => opt.value === category.name);
          return {
            unitTypeName: categoryOption?.label || category.name,
            unitTypeCode: category.name,
            count: parseInt(category.count, 10) || 1,
            pricing: {
              price: categoryPrice?.price || "0",
              pricePerWeek: String((parseFloat(categoryPrice?.price || "0") * 7)),
              pricePerMonth: String((parseFloat(categoryPrice?.price || "0") * 30))
            },
            roomNumbers: category.roomNumbers && category.roomNumbers.length > 0
              ? category.roomNumbers.filter(rn => rn && rn.trim() !== '').map(roomNumber => ({
                  number: roomNumber.trim(),
                  status: 'available'
                }))
              : []
          };
        }) : undefined,
        hostId: property.hostId || property.userId,
        userId: property.userId || property.hostId,
        isPublished: formData.isPublished !== undefined ? formData.isPublished : true,
        isAvailable: formData.isAvailable !== undefined ? formData.isAvailable : true,
        googleMapLink: formData.googleMapLink || '',
        locationCoords: (formData.lat && formData.lng) ? { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } : undefined,
      };

      const response = await fetch(`/api/admin/properties/${propertyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to update property:", errorData);
        throw new Error(errorData.message || 'Failed to update property');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: 'Property updated successfully.',
        variant: 'default',
      });

      onPropertyUpdated();
      onClose();

    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save property: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = () => {
    // Only require title and type for basic validity. Description can be optional.
    return formData.title && formData.propertyType;
  };

  const areRequiredImagesUploaded = () => {
    const requiredCategories = IMAGE_CATEGORIES.filter(c => c.required).map(c => c.value);

    for (const category of requiredCategories) {
      const foundCategory = categorizedImages.find(c => c.category === category);
      if (!foundCategory || foundCategory.files.length === 0) {
        return false;
      }
    }
    return true;
  };

  const getBadgeVariant = (count: number, required: boolean): "default" | "secondary" | "destructive" => {
    if (count > 0) return "default";
    if (required) return "destructive";
    return "secondary";
  };

  if (!isOpen) return null;

  const activeGalleryCategory = IMAGE_CATEGORIES.find(c => c.value === galleryState.category);
  const activeGalleryImages = categorizedImages.find(c => c.category === galleryState.category)?.files || [];

  return (
    <>
      <ImageGalleryModal
        isOpen={galleryState.isOpen}
        onClose={() => setGalleryState({ isOpen: false, category: null })}
        category={activeGalleryCategory}
        images={activeGalleryImages}
        onDelete={handleImageDelete}
      />

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader>
            <DialogTitle>Edit Property: {property?.title || 'Loading...'}</DialogTitle>
        </DialogHeader>

          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin" />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Details & Amenities</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
                <TabsTrigger value="publishing">Publishing</TabsTrigger>
          </TabsList>

              <div className="flex-grow overflow-y-auto p-4 space-y-6">
                <TabsContent value="basic" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>

              <div>
                        <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                          onChange={(e) => handleInputChange("title", e.target.value)}
                          placeholder="e.g., Cozy Downtown Apartment"
                />
              </div>

              <div>
                        <Label htmlFor="name">Display Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="e.g., White Pearl Resort"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your property"
                          rows={6}
                />
              </div>

              <div>
                        <Label htmlFor="propertyType">Property Type</Label>
                        <Select
                          value={formData.propertyType}
                          onValueChange={(value) => handleInputChange("propertyType", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a property type" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center">
                                  <type.icon className="h-4 w-4 mr-2" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Stay Types</Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                          {["corporate-stay", "family-stay", "couple-stay", "banquet-events"].map((type) => (
                            <div
                              key={type}
                        onClick={() => {
                                const newTypes = stayTypes.includes(type)
                                  ? stayTypes.filter((t) => t !== type)
                                  : [...stayTypes, type];
                                setStayTypes(newTypes);
                        }}
                              className={`cursor-pointer px-3 py-1 rounded-full text-sm flex items-center transition-colors ${
                                stayTypes.includes(type)
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              }`}
                            >
                              {stayTypes.includes(type) && <Check className="h-4 w-4 mr-1" />}
                              {type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                          ))}
                </div>
              </div>

                    </div>

                    {/* Location & Contact */}
              <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Location & Contact</h3>
                  <div>
                        <Label htmlFor="street">Street</Label>
                    <Input
                      id="street"
                      value={formData.address.street}
                          onChange={(e) => handleInputChange("address.street", e.target.value)}
                    />
                  </div>
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.address.city}
                            onChange={(e) => handleInputChange("address.city", e.target.value)}
                    />
                  </div>
                  <div>
                          <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.address.state}
                            onChange={(e) => handleInputChange("address.state", e.target.value)}
                    />
                  </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                  <div>
                          <Label htmlFor="zipCode">Zip Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.address.zipCode}
                            onChange={(e) => handleInputChange("address.zipCode", e.target.value)}
                    />
                  </div>
                        <div>
                          <Label htmlFor="country">Country</Label>
                          <Input
                            id="country"
                            value={formData.address.country}
                            onChange={(e) => handleInputChange("address.country", e.target.value)}
                          />
                </div>
              </div>
                      <div className="grid grid-cols-2 gap-4">
              <div>
                          <Label htmlFor="contactNo">Contact Number</Label>
                          <Input
                            id="contactNo"
                            value={formData.contactNo}
                            onChange={(e) => handleInputChange("contactNo", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Primary Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange("email", e.target.value)}
                          />
                        </div>
                      </div>
                       <div>
                          <Label htmlFor="hotelEmail">Secondary/Hotel Email</Label>
                <Input
                  id="hotelEmail"
                  type="email"
                  value={formData.hotelEmail}
                  onChange={(e) => handleInputChange("hotelEmail", e.target.value)}
                />
            </div>

            {/* Directions Fields */}
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="googleMapLink">Google Map Link (optional)</Label>
                <Input
                  id="googleMapLink"
                  placeholder="https://maps.google.com/..."
                  value={formData.googleMapLink}
                  onChange={(e) => handleInputChange("googleMapLink", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lat">Latitude</Label>
                  <Input
                    id="lat"
                    placeholder="27.1751"
                    value={formData.lat}
                    onChange={(e) => handleInputChange("lat", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lng">Longitude</Label>
                  <Input
                    id="lng"
                    placeholder="78.0421"
                    value={formData.lng}
                    onChange={(e) => handleInputChange("lng", e.target.value)}
                  />
                </div>
              </div>
            </div>
              </div>
            </div>
          </TabsContent>

                <TabsContent value="details" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Property Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Property Details</h3>
                      <div className="grid grid-cols-2 gap-4">
              <div>
                          <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                            value={formData.bedrooms}
                            onChange={(e) => handleInputChange("bedrooms", Number(e.target.value))}
                />
              </div>
              <div>
                          <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                            value={formData.bathrooms}
                            onChange={(e) => handleInputChange("bathrooms", Number(e.target.value))}
                />
              </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
              <div>
                          <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  min="1"
                            value={formData.maxGuests}
                            onChange={(e) => handleInputChange("maxGuests", Number(e.target.value))}
                />
              </div>
              <div>
                          <Label htmlFor="propertySize">Property Size (sq. ft.)</Label>
                <Input
                  id="propertySize"
                  value={formData.propertySize}
                            onChange={(e) => handleInputChange("propertySize", e.target.value)}
                />
              </div>
                      </div>
                       <div className="grid grid-cols-2 gap-4">
              <div>
                            <Label htmlFor="totalHotelRooms">Total Hotel Rooms</Label>
                <Input
                  id="totalHotelRooms"
                            type="number"
                            min="0"
                  value={formData.totalHotelRooms}
                            onChange={(e) => handleInputChange("totalHotelRooms", e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="price">Base Price per Night (INR)</Label>
                            <Input
                            id="price"
                            type="number"
                            min="0"
                            value={formData.price}
                            onChange={(e) => handleInputChange("price", Number(e.target.value))}
                            />
                        </div>
              </div>
            </div>

                    {/* Amenities */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">General Amenities</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {AMENITIES_LIST.map(amenity => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity}
                              checked={!!amenities[amenity]}
                              onCheckedChange={() => handleAmenityToggle(amenity)}
                            />
                            <Label htmlFor={amenity} className="capitalize">
                              {amenity.replace(/([A-Z])/g, ' $1')}
                </Label>
                    </div>
                  ))}
                      </div>
                    </div>
                </div>

                  {/* Room Category Management */}
                  <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-semibold">Room Types / Categories</h3>

                    {selectedCategories.map((category, index) => (
                      <div key={index} className="p-4 border rounded-md space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex-grow">
                            <Label>{getCurrentCategoryOptions().find(opt => opt.value === category.name)?.label || 'Select a Category'}</Label>
                          </div>
                          <div className="w-28">
                            <Label>No. of Rooms</Label>
                            <Input
                              type="number"
                              min="1"
                              value={category.count}
                              onChange={(e) => handleCategoryRoomCountChange(category.name, e.target.value)}
                            />
                          </div>
                          <div className="w-32">
                            <Label>Price per Night</Label>
                            <Input
                              type="number"
                              min="0"
                              value={categoryPrices.find(p => p.categoryName === category.name)?.price || "0"}
                              onChange={(e) => handleCategoryPriceChange(category.name, e.target.value)}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCategories(prev => prev.filter(c => c.name !== category.name));
                              setCategoryPrices(prev => prev.filter(p => p.categoryName !== category.name));
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>

                        {/* Room Number Inputs - Show only if count > 0 */}
                        {category.count && parseInt(category.count, 10) > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600 font-medium">
                              Room Numbers for {getCurrentCategoryOptions().find(opt => opt.value === category.name)?.label || category.name}
                            </Label>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                              {Array.from({ length: parseInt(category.count, 10) }).map((_, roomIndex) => (
                                <div key={roomIndex} className="flex flex-col">
                                  <Label className="text-xs text-gray-500 mb-1">
                                    Room {roomIndex + 1}
                                  </Label>
                                  <Input
                                    type="text"
                                    value={category.roomNumbers?.[roomIndex] || ''}
                                    onChange={(e) => handleRoomNumberChange(category.name, roomIndex, e.target.value)}
                                    placeholder={`e.g., ${roomIndex + 101}`}
                                    className="border-gray-300 focus:border-mediumGreen text-xs h-8"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="flex items-center gap-2">
                      <Select onValueChange={handleCategorySelect}>
                    <SelectTrigger>
                          <SelectValue placeholder="Add a room type..." />
                    </SelectTrigger>
                    <SelectContent>
                          {getCurrentCategoryOptions()
                            .filter(opt => !selectedCategories.some(c => c.name === opt.value))
                            .map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))
                          }
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
          </TabsContent>

                <TabsContent value="images" className="mt-0">
            <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Property Images</h3>

                    {!areRequiredImagesUploaded() && (
                      <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                          Please upload at least one image for all required categories (Exterior, Interior).
                </AlertDescription>
              </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {IMAGE_CATEGORIES.map(category => (
                        <div key={category.value} className="p-4 border rounded-lg space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold">{category.label}{category.required && <span className="text-destructive">*</span>}</h4>
                            <Badge
                              variant={getBadgeVariant(categorizedImages.find(c => c.category === category.value)?.files.length || 0, category.required)}
                              className="cursor-pointer"
                              onClick={() => setGalleryState({ isOpen: true, category: category.value })}
                            >
                              {categorizedImages.find(c => c.category === category.value)?.files.length || 0} images
                              </Badge>
                          </div>
                          
                          {(categorizedImages.find(c => c.category === category.value)?.files || []).length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {(categorizedImages.find(c => c.category === category.value)?.files || []).map((image, index) => (
                                <div
                                  key={index}
                                  className="relative group w-24 h-24 cursor-move"
                                  draggable
                                  onDragStart={() => handleImageDragStart(category.value, index)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={() => handleImageDrop(category.value, index)}
                                >
                                  <Image
                                    src={image.url}
                                    alt={`${category.label} image ${index + 1}`}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md border"
                                  />
                                  <div className="absolute top-1 right-1">
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="h-6 w-6 opacity-70 group-hover:opacity-100"
                                      onClick={() => handleImageDelete(category.value, index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                              </div>
                            ))}
                              <label className="w-24 h-24">
                                <div className="flex items-center justify-center h-full border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
                                  {uploadingImage === category.value ? (
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                  ) : (
                                    <Plus className="h-8 w-8 text-gray-400" />
                                  )}
                        <input
                          type="file"
                                    className="sr-only"
                          accept="image/*"
                                    onChange={(e) => handleImageUpload(category.value, e.target.files!)}
                                    disabled={!!uploadingImage}
                        />
                                </div>
                              </label>
                            </div>
                          ) : (
                            <label className="w-full">
                              <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
                                {uploadingImage === category.value ? (
                                  <Loader2 className="h-8 w-8 animate-spin" />
                          ) : (
                            <>
                                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                                    <div className="flex text-sm text-gray-600">
                                      <span className="relative rounded-md font-medium text-primary hover:text-primary-focus">
                                        Upload a file
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
                                <input
                                  id={`file-upload-${category.value}`}
                                  name={`file-upload-${category.value}`}
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(category.value, e.target.files!)}
                                  disabled={!!uploadingImage}
                                />
                      </div>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Legacy Image Upload Section */}
                    <div className="p-4 border rounded-lg space-y-3 mt-6">
                      <h4 className="font-semibold">Legacy General Images</h4>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {legacyImages.map((image, index) => (
                          <div key={index} className="relative group aspect-w-1 aspect-h-1">
                            <Image
                              src={image.url}
                              alt={`Legacy image ${index + 1}`}
                              layout="fill"
                              objectFit="cover"
                              className="rounded-md"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleLegacyImageDelete(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                          </div>
                        </div>
                      ))}
                        <label className="w-full aspect-w-1 aspect-h-1">
                          <div className="flex items-center justify-center h-full border-2 border-dashed rounded-md cursor-pointer hover:border-primary">
                            {uploadingImage === 'legacy' ? (
                              <Loader2 className="h-8 w-8 animate-spin" />
                            ) : (
                              <Plus className="h-8 w-8 text-gray-400" />
                            )}
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => handleLegacyImageUpload(e.target.files!)}
                              disabled={!!uploadingImage}
                            />
                    </div>
                        </label>
                  </div>
                </div>
                  </div>
                </TabsContent>

                <TabsContent value="publishing" className="mt-0">
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold">Policies & Publishing</h3>

                    {/* Policies */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minStay">Min Stay (nights)</Label>
                          <Input
                            id="minStay"
                            value={formData.minStay}
                            onChange={(e) => handleInputChange("minStay", e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxStay">Max Stay (nights)</Label>
                          <Input
                            id="maxStay"
                            value={formData.maxStay}
                            onChange={(e) => handleInputChange("maxStay", e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="policyDetails">Cancellation Policy</Label>
                        <Textarea
                          id="policyDetails"
                          value={formData.policyDetails}
                          onChange={(e) => handleInputChange("policyDetails", e.target.value)}
                          placeholder="Detail your cancellation policy"
                        />
                      </div>
                      <div>
                        <Label htmlFor="otherAmenities">Other Rules/Details</Label>
                        <Textarea
                          id="otherAmenities"
                          value={formData.otherAmenities}
                          onChange={(e) => handleInputChange("otherAmenities", e.target.value)}
                          placeholder="e.g., No smoking, no pets"
                        />
                      </div>
                    </div>

                    {/* Publishing Status */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="isPublished">Publish Property</Label>
                        <Switch
                          id="isPublished"
                          checked={formData.isPublished}
                          onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="isAvailable">Mark as Available</Label>
                        <Switch
                          id="isAvailable"
                          checked={formData.isAvailable}
                          onCheckedChange={(checked) => handleInputChange("isAvailable", checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <Label htmlFor="featured">Feature Property</Label>
                        <Switch
                          id="featured"
                          checked={formData.featured}
                          onCheckedChange={(checked) => handleInputChange("featured", checked)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => handleInputChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Available</SelectItem>
                            <SelectItem value="inactive">Unavailable</SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="verificationStatus">Verification Status</Label>
                         <Select
                          value={formData.verificationStatus}
                          onValueChange={(value) => handleInputChange("verificationStatus", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select verification status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
              </div>
            </div>
          </TabsContent>
              </div>
        </Tabs>
          )}

          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button 
              variant="outline"
              onClick={() => window.open(`/admin/properties/${getPropertyId()}/pricing`, '_blank')}
              disabled={saving}
            >
              Dynamic Pricing
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving || !isFormValid() || !areRequiredImagesUploaded()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
} 