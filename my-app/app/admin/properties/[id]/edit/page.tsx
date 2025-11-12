"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

export const dynamic = "force-dynamic";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  Building,
  Home,
  Hotel,
  Bed,
  Bath,
  Wifi,
  Tv,
  CookingPotIcon as Kitchen,
  Car,
  Upload,
  Check,
  MapPin,
  IndianRupee,
  Waves,
  Utensils,
  Thermometer,
  Refrigerator,
  Phone,
  Mail,
  BellRing,
  Beer,
  Droplets,
  Plus,
  Minus,
  Info,
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Wind,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import { STAY_TYPE_OPTIONS } from "@/lib/constants/stay-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ModernMultiSelect } from "@/components/ui/modern-multi-select";
import { ALL_ROOM_CATEGORIES } from "@/lib/constants/room-categories";

interface RoomCategoryDetail {
  name: string;
  count: string;
  roomNumbers?: string[];
  maxCapacityPerRoom?: number;
  freeExtraPersonLimit?: number;
  extraPersonCharge?: number;
  price?: string; // SIMPLIFIED: Just one price per category
}

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

interface FormData {
  propertyType: 'apartment' | 'house' | 'hotel' | 'villa' | 'resort';
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  price: string;
  contactNo: string;
  email: string;
  hotelEmail: string;
  amenities: string[];
  otherAmenities: string;
  status: 'available' | 'unavailable' | 'maintenance' | 'deleted';
  policyDetails: string;
  minStay: string;
  maxStay: string;
  propertySize: string;
  availability: string;
  maxGuests: number;
  beds: number;
  totalHotelRooms: string;
  stayTypes: string[];
  googleMapLink?: string;
  lat?: string;
  lng?: string;
  pricing?: {
    perNight: string;
  };
  aboutProperty?: string;
  checkInTime?: string;
  checkOutTime?: string;
  quietHours?: string;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  partiesAllowed?: boolean;
}

export default function EditPropertyPage() {
  const params = useParams();
  const propertyId = params?.id as string;

  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProperty, setIsLoadingProperty] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false); // For photo editing mode
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    propertyType: "apartment",
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    description: "",
    bedrooms: "",
    bathrooms: "",
    price: "",
    contactNo: "",
    email: "",
    hotelEmail: "",
    amenities: [],
    otherAmenities: "",
    status: "available",
    policyDetails: "",
    minStay: "",
    maxStay: "",
    propertySize: "",
    availability: "",
    maxGuests: 2,
    beds: 1,
    totalHotelRooms: "",
    stayTypes: [],
    googleMapLink: '',
    lat: '',
    lng: '',
  });

  const [numBedrooms, setNumBedrooms] = useState("");
  const [amenities, setAmenities] = useState({
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
    fridge: false,
  });

  const [images, setImages] = useState<Array<{ url: string; public_id: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<RoomCategoryDetail[]>([]);
  const [categorizedImages, setCategorizedImages] = useState<CategorizedImage[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const [mealPricing, setMealPricing] = useState({
    breakfast: { enabled: false, pricePerPerson: 0, description: '' },
    lunchDinner: { enabled: false, pricePerPerson: 0, description: '' },
    allMeals: { enabled: false, pricePerPerson: 0, description: '' }
  });
  const [propertyHighlights, setPropertyHighlights] = useState<string[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<Array<{ name: string; type: string; distance: string }>>([]);
  const [additionalRules, setAdditionalRules] = useState<string[]>([]);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Fetch property data on mount
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (propertyId && status === "authenticated") {
      fetchPropertyData();
    }
  }, [propertyId, status, router]);

  const fetchPropertyData = async () => {
    setIsLoadingProperty(true);
    try {
      const response = await axios.get(`/api/properties/${propertyId}`);
      const property = response.data.property; // API returns {success: true, property: {...}}

      console.log("Fetched property data:", property);

      // Map database fields to form data
      setFormData({
        propertyType: property.propertyType || 'apartment',
        name: property.title || property.name || '',
        address: property.address?.street || '',
        city: property.address?.city || '',
        state: property.address?.state || '',
        zipCode: property.address?.zipCode || '',
        country: property.address?.country || 'India',
        description: property.description || '',
        bedrooms: property.bedrooms?.toString() || '',
        bathrooms: property.bathrooms?.toString() || '',
        price: property.price?.base?.toString() || property.pricing?.perNight || '',
        contactNo: property.contactNo || '',
        email: property.email || '',
        hotelEmail: property.hotelEmail || '',
        amenities: property.amenities || [],
        otherAmenities: property.otherAmenities || '',
        status: property.status || 'available',
        policyDetails: property.policyDetails || '',
        minStay: property.minStay || '',
        maxStay: property.maxStay || '',
        propertySize: property.propertySize || '',
        availability: property.availability || '',
        maxGuests: property.maxGuests || 2,
        beds: property.beds || 1,
        totalHotelRooms: property.totalHotelRooms || '',
        stayTypes: property.stayTypes || [],
        googleMapLink: property.googleMapLink || '',
        lat: property.address?.coordinates?.lat?.toString() || property.locationCoords?.lat?.toString() || '',
        lng: property.address?.coordinates?.lng?.toString() || property.locationCoords?.lng?.toString() || '',
        aboutProperty: property.aboutProperty || '',
        checkInTime: property.houseRules?.checkInTime || '2:00 PM',
        checkOutTime: property.houseRules?.checkOutTime || '11:00 AM',
        quietHours: property.houseRules?.quietHours || '10:00 PM - 7:00 AM',
        smokingAllowed: property.houseRules?.smokingAllowed || false,
        petsAllowed: property.houseRules?.petsAllowed || false,
        partiesAllowed: property.houseRules?.partiesAllowed || false,
      });

      // Map amenities
      if (property.generalAmenities) {
        setAmenities({
          wifi: property.generalAmenities.wifi || false,
          tv: property.generalAmenities.tv || false,
          kitchen: property.generalAmenities.kitchen || false,
          parking: property.generalAmenities.parking || false,
          ac: property.generalAmenities.ac || false,
          pool: property.generalAmenities.pool || false,
          geyser: property.generalAmenities.geyser || false,
          shower: property.generalAmenities.shower || false,
          bathTub: property.generalAmenities.bathTub || false,
          reception24x7: property.generalAmenities.reception24x7 || false,
          roomService: property.generalAmenities.roomService || false,
          restaurant: property.generalAmenities.restaurant || false,
          bar: property.generalAmenities.bar || false,
          pub: property.generalAmenities.pub || false,
          fridge: property.generalAmenities.fridge || false,
        });
      }

      // Map property units (room categories) - SIMPLIFIED pricing
      if (property.propertyUnits && property.propertyUnits.length > 0) {
        const mappedCategories = property.propertyUnits.map((unit: any) => ({
          name: unit.unitTypeName || unit.unitTypeCode,
          count: unit.count?.toString() || '1',
          roomNumbers: unit.roomNumbers?.map((rn: any) => rn.number || '') || [],
          maxCapacityPerRoom: unit.maxCapacityPerRoom,
          freeExtraPersonLimit: unit.freeExtraPersonLimit,
          extraPersonCharge: unit.extraPersonCharge,
          price: unit.pricing?.price || '', // SIMPLIFIED: single price
        }));
        setSelectedCategories(mappedCategories);
      }

      // Map categorized images
      if (property.categorizedImages && property.categorizedImages.length > 0) {
        setCategorizedImages(property.categorizedImages);
      }

      // Map legacy general images
      if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
        setImages(property.legacyGeneralImages);
      }

      // Map meal pricing
      if (property.mealPricing) {
        setMealPricing({
          breakfast: property.mealPricing.breakfast || { enabled: false, pricePerPerson: 0, description: '' },
          lunchDinner: property.mealPricing.lunchDinner || { enabled: false, pricePerPerson: 0, description: '' },
          allMeals: property.mealPricing.allMeals || { enabled: false, pricePerPerson: 0, description: '' },
        });
      }

      // Map property highlights
      if (property.propertyHighlights && property.propertyHighlights.length > 0) {
        setPropertyHighlights(property.propertyHighlights);
      }

      // Map nearby locations
      if (property.nearbyLocations && property.nearbyLocations.length > 0) {
        setNearbyLocations(property.nearbyLocations);
      }

      // Map house rules additional rules
      if (property.houseRules?.additionalRules && property.houseRules.additionalRules.length > 0) {
        setAdditionalRules(property.houseRules.additionalRules);
      }

      toast.success("Property data loaded successfully!");
    } catch (error) {
      console.error("Error fetching property:", error);
      toast.error("Failed to load property data");
      router.push("/admin/properties");
    } finally {
      setIsLoadingProperty(false);
    }
  };

  if (status === "loading" || isLoadingProperty) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
          <p className="text-mediumGreen mt-4">Loading property data...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  const isValidEmail = (email: string) => {
    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];

        if (name === 'email' && !isValidEmail(value)) {
          return newErrors;
        }

        if (name === 'price' && (parseFloat(value) <= 0 || isNaN(parseFloat(value)))) {
          return newErrors;
        }

        return newErrors;
      });
    }
  };

  const handleAmenityToggle = (amenity: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
    setFormData(prev => {
      const newAmenities = [...prev.amenities];
      if (!amenities[amenity]) {
        if (!newAmenities.includes(amenity)) {
          newAmenities.push(amenity);
        }
      } else {
        const index = newAmenities.indexOf(amenity);
        if (index !== -1) {
          newAmenities.splice(index, 1);
        }
      }
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleCategorizedImageUpload = (category: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setIsUploading(category);
      const uploadedFilesForCategory: Array<{ url: string; public_id: string }> = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append('file', file);
          cloudinaryFormData.append('upload_preset', 'baithaka_hotels');
          cloudinaryFormData.append('folder', `property_images/${category}`);

          const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dkfrxlezi/image/upload',
            cloudinaryFormData
          );

          if (response.data?.secure_url) {
            uploadedFilesForCategory.push({
              url: response.data.secure_url,
              public_id: response.data.public_id
            });
          }
        }

        setCategorizedImages(prev => {
          const existingCategoryIndex = prev.findIndex(ci => ci.category === category);
          if (existingCategoryIndex > -1) {
            const updatedCategory = {
              ...prev[existingCategoryIndex],
              files: [...prev[existingCategoryIndex].files, ...uploadedFilesForCategory]
            };
            return [
              ...prev.slice(0, existingCategoryIndex),
              updatedCategory,
              ...prev.slice(existingCategoryIndex + 1)
            ];
          } else {
            return [...prev, { category, files: uploadedFilesForCategory }];
          }
        });

        toast.success(`Images uploaded for ${category}!`);
      } catch (error) {
        console.error(`Error uploading images for ${category}:`, error);
        toast.error(`Failed to upload images for ${category}.`);
      } finally {
        setIsUploading(null);
      }
    };
    fileInput.click();
  };

  const handleRemoveCategorizedImage = async (category: string, index: number) => {
    setIsSubmitting(true);
    try {
      let imageToRemove: { url: string; public_id: string } | undefined;

      setCategorizedImages(prev =>
        prev.map(ci => {
          if (ci.category === category) {
            imageToRemove = ci.files[index];
            return {
              ...ci,
              files: ci.files.filter((_, i) => i !== index)
            };
          }
          return ci;
        }).filter(ci => ci.files.length > 0)
      );

      if (imageToRemove?.public_id) {
        await axios.post('/api/cloudinary/delete', {
          public_id: imageToRemove.public_id
        });
      }
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setIsUploading('general');

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'baithaka_hotels');
          formData.append('folder', 'property_images/general');

          const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dkfrxlezi/image/upload',
            formData
          );

          if (response.data?.secure_url) {
            setImages((prev) => [...prev, {
              url: response.data.secure_url,
              public_id: response.data.public_id
            }]);
          }
        }
        toast.success('Images uploaded successfully!');
      } catch (error) {
        console.error('Error uploading images:', error);
        toast.error('Failed to upload images. Please try again.');
      } finally {
        setIsUploading(null);
      }
    };

    fileInput.click();
  };

  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = images[index];

      if (imageToRemove.public_id) {
        await axios.post('/api/cloudinary/delete', {
          public_id: imageToRemove.public_id
        });
      }

      setImages(images.filter((_, i) => i !== index));
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Basic Info validation
    if (!formData.name.trim()) {
      newErrors.name = "Property Name is required.";
    }
    if (!formData.propertyType) {
      newErrors.propertyType = "Property Type is required.";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip Code is required.";
    }
    if (!formData.contactNo.trim()) {
      newErrors.contactNo = "Contact No. is required.";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email ID is required.";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid Email ID format.";
    }

    if (formData.hotelEmail && formData.hotelEmail.trim() && !isValidEmail(formData.hotelEmail)) {
      newErrors.hotelEmail = "Invalid Hotel Email format.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
    }

    // Stay Type validation
    if (!formData.stayTypes || formData.stayTypes.length === 0) {
      newErrors.stayTypes = "Please select at least one stay type for your property.";
    }

    // Category validation based on property type
    if (formData.propertyType === 'hotel' || formData.propertyType === 'resort') {
      if (selectedCategories.length === 0) {
        newErrors.selectedCategories = `Please select at least one room category for your ${formData.propertyType}.`;
      }
    } else {
      if (selectedCategories.length === 0) {
        if (!formData.bedrooms) {
          newErrors.bedrooms = "Number of Bedrooms is required (or select specific unit types above).";
        }
        if (!formData.bathrooms) {
          newErrors.bathrooms = "Number of Bathrooms is required (or select specific unit types above).";
        }
      }
    }

    // Validate room counts for selected categories
    const currentCategoryOptions = ALL_ROOM_CATEGORIES;
    selectedCategories.forEach(sc => {
      if (!sc.count || parseInt(sc.count, 10) <= 0) {
        const categoryLabel = currentCategoryOptions.find(opt => opt.value === sc.name)?.label || sc.name;
        newErrors[`${sc.name}_count`] = `Number of rooms for ${categoryLabel} must be greater than 0.`;
      }
    });

    // Photo validation
    const exteriorPhotos = categorizedImages.find(ci => ci.category === 'exterior')?.files ?? [];
    const interiorPhotos = categorizedImages.find(ci => ci.category === 'interior')?.files ?? [];

    if (exteriorPhotos.length === 0) {
      newErrors.exteriorPhotos = "At least one Exterior photo is required.";
    }
    if (interiorPhotos.length === 0) {
      newErrors.interiorPhotos = "At least one Interior photo is required.";
    }

    // Pricing validation - SIMPLIFIED (no plan-based pricing)
    if (selectedCategories.length > 0) {
      selectedCategories.forEach(sc => {
        if (!sc.price || sc.price.trim() === '' || parseFloat(sc.price) <= 0) {
          const categoryLabel = currentCategoryOptions.find((opt: any) => opt.value === sc.name)?.label || sc.name;
          newErrors[`${sc.name}_price`] = `Price required for ${categoryLabel}`;
        }
      });
    } else {
      if (!formData.price || formData.price.trim() === '' || parseFloat(formData.price) <= 0) {
        newErrors.price = "General Price per night must be a positive number.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!session) {
      toast.error("Please log in to update a property");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      toast("Updating your property...");

      // Build the update payload
      const updatePayload: any = {
        title: formData.name,
        name: formData.name,
        description: formData.description,
        propertyType: formData.propertyType,
        address: {
          street: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        contactNo: formData.contactNo,
        email: formData.email,
        hotelEmail: formData.hotelEmail,
        googleMapLink: formData.googleMapLink,
        location: `${formData.city}, ${formData.state}`,
        stayTypes: formData.stayTypes,
        status: formData.status,
        generalAmenities: amenities,
        otherAmenities: formData.otherAmenities,
        policyDetails: formData.policyDetails,
        minStay: formData.minStay,
        maxStay: formData.maxStay,
        propertySize: formData.propertySize,
        availability: formData.availability,
        maxGuests: formData.maxGuests,
        beds: formData.beds,
        totalHotelRooms: formData.totalHotelRooms,
        categorizedImages: categorizedImages,
        legacyGeneralImages: images,
        aboutProperty: formData.aboutProperty,
        houseRules: {
          checkInTime: formData.checkInTime,
          checkOutTime: formData.checkOutTime,
          quietHours: formData.quietHours,
          smokingAllowed: formData.smokingAllowed,
          petsAllowed: formData.petsAllowed,
          partiesAllowed: formData.partiesAllowed,
          additionalRules: additionalRules.filter(r => r.trim() !== ''),
        },
        mealPricing: mealPricing,
        propertyHighlights: propertyHighlights.filter(h => h.trim() !== ''),
        nearbyLocations: nearbyLocations.filter(loc => loc.name.trim() !== ''),
      };

      // Add coordinates if provided
      if (formData.lat && formData.lng) {
        updatePayload.locationCoords = {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        };
        updatePayload.address.coordinates = {
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
        };
      }

      // Add pricing
      if (selectedCategories.length > 0) {
        // Map categories with SIMPLIFIED pricing
        updatePayload.propertyUnits = selectedCategories.map(cat => ({
          unitTypeName: cat.name,
          unitTypeCode: cat.name.toLowerCase().replace(/\s+/g, '_'),
          count: parseInt(cat.count, 10),
          maxCapacityPerRoom: cat.maxCapacityPerRoom,
          freeExtraPersonLimit: cat.freeExtraPersonLimit,
          extraPersonCharge: cat.extraPersonCharge,
          roomNumbers: cat.roomNumbers?.map(num => ({ number: num, status: 'available' })) || [],
          pricing: {
            price: cat.price,
            pricePerWeek: (parseFloat(cat.price || '0') * 7).toString(),
            pricePerMonth: (parseFloat(cat.price || '0') * 30).toString(),
          },
        }));
      } else {
        // General pricing for non-categorized properties
        updatePayload.bedrooms = parseInt(formData.bedrooms, 10) || 0;
        updatePayload.bathrooms = parseInt(formData.bathrooms, 10) || 0;
        updatePayload.price = {
          base: parseFloat(formData.price),
        };
        updatePayload.pricing = {
          perNight: formData.price,
          perWeek: (parseFloat(formData.price) * 7).toString(),
          perMonth: (parseFloat(formData.price) * 30).toString(),
        };
      }

      console.log("Update payload:", updatePayload);

      // Submit update request
      const response = await axios.post(`/api/properties/${propertyId}/update`, updatePayload);

      if (response.data.success) {
        toast.success("Property updated successfully!");
        router.push('/admin/properties');
      } else {
        throw new Error(response.data.message || "Update failed");
      }

    } catch (error) {
      console.error("Error updating property:", error);

      let errorMessage = "Failed to update property. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyTypes = [
    { value: "apartment", label: "Apartment", icon: Building },
    { value: "house", label: "House", icon: Home },
    { value: "hotel", label: "Hotel", icon: Hotel },
    { value: "villa", label: "Villa", icon: Home },
    { value: "resort", label: "Resort", icon: Hotel },
  ];

  const currentCategoryOptions = ALL_ROOM_CATEGORIES;

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.name === categoryName);
      if (isSelected) {
        return prev.filter(c => c.name !== categoryName);
      } else {
        return [...prev, { name: categoryName, count: "1", price: "" }];
      }
    });

    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.selectedCategories;
      delete newErrors[`${categoryName}_count`];
      delete newErrors[`${categoryName}_price`];
      return newErrors;
    });
  };

  const handleAddNewCategory = async (label: string): Promise<{ value: string; label: string; description?: string; category?: string } | null> => {
    try {
      const response = await fetch('/api/room-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          description: `${label} accommodation`,
          category: 'specialty',
        }),
      });

      const data = await response.json();

      if (data.success && data.category) {
        alert(`Successfully added "${data.category.label}" to room categories!`);
        return {
          value: data.category.value,
          label: data.category.label,
          description: data.category.description,
          category: data.category.category,
        };
      } else {
        let errorMsg = data.error || 'Failed to add category. Please try again.';
        if (data.existingLabel) {
          errorMsg = `Category already exists as "${data.existingLabel}"`;
        } else if (data.details) {
          errorMsg = `${data.error}: ${data.details}`;
        }
        alert(errorMsg);
        return null;
      }
    } catch (error: any) {
      alert(`Network error: ${error?.message || 'Failed to connect to server. Please try again.'}`);
      return null;
    }
  };

  const handleCategoryRoomCountChange = (categoryName: string, count: string) => {
    setSelectedCategories(prev =>
      prev.map(c => {
        if (c.name === categoryName) {
          const roomCount = parseInt(count, 10) || 0;
          const existingRoomNumbers = c.roomNumbers || [];
          let newRoomNumbers = [...existingRoomNumbers];

          if (roomCount > existingRoomNumbers.length) {
            for (let i = existingRoomNumbers.length; i < roomCount; i++) {
              newRoomNumbers.push('');
            }
          } else if (roomCount < existingRoomNumbers.length) {
            newRoomNumbers = newRoomNumbers.slice(0, roomCount);
          }

          return { ...c, count, roomNumbers: newRoomNumbers };
        }
        return c;
      })
    );

    if (count && parseInt(count, 10) > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${categoryName}_count`];
        return newErrors;
      });
    }
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

  // SIMPLIFIED: Single price per category
  const handleCategoryPriceChange = (categoryName: string, value: string) => {
    setSelectedCategories(prev =>
      prev.map(c => {
        if (c.name === categoryName) {
          return { ...c, price: value };
        }
        return c;
      })
    );

    if (value && parseFloat(value) > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${categoryName}_price`];
        return newErrors;
      });
    }
  };

  const handleStayTypeToggle = (stayTypeId: string) => {
    setFormData(prev => {
      const newStayTypes = prev.stayTypes.includes(stayTypeId)
        ? prev.stayTypes.filter(id => id !== stayTypeId)
        : [...prev.stayTypes, stayTypeId];

      return {
        ...prev,
        stayTypes: newStayTypes
      };
    });

    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (formData.stayTypes.length > 0) {
          delete newErrors.stayTypes;
        }
        return newErrors;
      });
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    scrollToTop();
  };

  // Show loading screen while fetching property data
  if (isLoadingProperty) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-darkGreen border-t-transparent rounded-full animate-spin"></div>
          <p className="text-mediumGreen mt-4">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-darkGreen mb-2">
              Edit Property
            </h1>
            <p className="text-mediumGreen">
              Update your property details
            </p>
          </div>

          {/* Back Button */}
          <div className="mb-4">
            <Button
              onClick={() => router.push('/admin/properties')}
              variant="outline"
              className="border-mediumGreen text-mediumGreen hover:bg-mediumGreen/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </div>

          <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg border-lightGreen">
            <CardHeader className="pb-4">
              <h1 className="text-2xl font-bold text-darkGreen">Property Details</h1>
              <p className="text-gray-600">Update the details about your property</p>
            </CardHeader>

            {/* Validation Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Please fix the following errors:
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {Object.entries(errors).map(([field, message]) => {
                    const friendlyFieldNames: { [key: string]: string } = {
                      'name': 'Property Name',
                      'propertyType': 'Property Type',
                      'address': 'Address',
                      'city': 'City',
                      'state': 'State',
                      'zipCode': 'Zip Code',
                      'contactNo': 'Contact Number',
                      'email': 'Email Address',
                      'description': 'Description',
                      'stayTypes': 'Stay Types',
                      'bedrooms': 'Bedrooms',
                      'bathrooms': 'Bathrooms',
                      'price': 'Price',
                      'selectedCategories': 'Room Categories',
                      'categorizedImages': 'Property Images',
                      'exteriorPhotos': 'Exterior Photos',
                      'interiorPhotos': 'Interior Photos'
                    };

                    const displayName = friendlyFieldNames[field] || field;

                    return (
                      <li key={field} className="text-sm text-red-700">
                        <strong>{displayName}:</strong> {message}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <CardContent className="p-6">
              <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList className="grid grid-cols-3 mb-6 sm:mb-8 bg-gray-100 p-1">
                  <TabsTrigger
                    value="basic"
                    className="data-[state=active]:bg-mediumGreen data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-gray-600 text-xs sm:text-sm py-2.5 transition-all duration-200"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="data-[state=active]:bg-mediumGreen data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-gray-600 text-xs sm:text-sm py-2.5 transition-all duration-200"
                  >
                    Details & Amenities
                  </TabsTrigger>
                  <TabsTrigger
                    value="photos"
                    className="data-[state=active]:bg-mediumGreen data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:font-semibold text-gray-600 text-xs sm:text-sm py-2.5 transition-all duration-200"
                  >
                    Photos & Pricing
                  </TabsTrigger>
                </TabsList>

                {/* BASIC INFO TAB - CONTINUING IN NEXT SECTION DUE TO LENGTH */}
                <TabsContent value="basic" className="space-y-6">
                  {/* This section contains: Basic Information, Property Type, Location, Description */}
                  {/* Due to length limitations, only the key structural elements are shown */}
                  {/* The full implementation matches the List Property Form exactly */}

                  <div className="space-y-4 p-6 border-2 border-indigo-300/60 rounded-lg bg-gradient-to-br from-indigo-50/80 to-blue-50/40 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-indigo-600" />
                      <Label className="text-lg font-semibold text-indigo-900">
                        Basic Information
                      </Label>
                    </div>
                    <p className="text-sm text-indigo-700/80">
                      Enter your property's essential details and contact information
                    </p>

                    <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-indigo-200">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium text-indigo-900">
                          Property Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="e.g., Grand Plaza Hotel, Sunset Villa, etc."
                          value={formData.name}
                          onChange={handleInputChange}
                          className="border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
                        />
                        {errors.name && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{errors.name}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactNo" className="text-sm font-medium text-indigo-900">
                            Contact Number <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                            <Input
                              id="contactNo"
                              name="contactNo"
                              type="tel"
                              placeholder="+91 XXXXX XXXXX"
                              value={formData.contactNo}
                              onChange={handleInputChange}
                              className="pl-10 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
                            />
                          </div>
                          {errors.contactNo && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{errors.contactNo}</p>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium text-indigo-900">
                            Email Address <span className="text-red-500">*</span>
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="your@email.com"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="pl-10 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
                            />
                          </div>
                          {errors.email && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{errors.email}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hotelEmail" className="text-sm font-medium text-indigo-900">
                          Hotel/Property Email <span className="text-xs text-gray-500">(Optional)</span>
                        </Label>
                        <p className="text-xs text-indigo-600/70 mb-2">
                          Official hotel email for booking confirmations (if different from your personal email)
                        </p>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500" />
                          <Input
                            id="hotelEmail"
                            name="hotelEmail"
                            type="email"
                            placeholder="bookings@hotel.com"
                            value={formData.hotelEmail}
                            onChange={handleInputChange}
                            className="pl-10 border-indigo-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
                          />
                        </div>
                        {errors.hotelEmail && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{errors.hotelEmail}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Property Type Section */}
                  <div className="space-y-4 p-6 border-2 border-teal-300/60 rounded-lg bg-gradient-to-br from-teal-50/80 to-cyan-50/40 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-teal-600" />
                      <Label className="text-lg font-semibold text-teal-900">
                        Property Type <span className="text-red-500">*</span>
                      </Label>
                    </div>
                    <p className="text-sm text-teal-700/80">
                      Select the type of property you want to list
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {propertyTypes.map((type) => {
                        const Icon = type.icon;
                        const isSelected = formData.propertyType === type.value;
                        return (
                          <div
                            key={type.value}
                            className={`relative border-2 rounded-xl p-4 text-center cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${
                              isSelected
                                ? "border-teal-500 bg-gradient-to-br from-teal-100 to-cyan-100 shadow-md"
                                : "border-teal-200/60 bg-white/80 hover:border-teal-400"
                            }`}
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                propertyType: type.value as 'apartment' | 'house' | 'hotel' | 'villa' | 'resort'
                              }));
                              setSelectedCategories([]);
                            }}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-teal-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                            <Icon className={`h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 ${
                              isSelected ? "text-teal-600" : "text-teal-500"
                            }`} />
                            <span className={`text-sm font-medium ${
                              isSelected ? "text-teal-900" : "text-gray-700"
                            }`}>
                              {type.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {errors.propertyType && (
                      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-sm text-red-600">{errors.propertyType}</p>
                      </div>
                    )}
                  </div>

                  {/* Location Section - Rose Gradient */}
                  <div className="space-y-4 p-6 border-2 border-rose-300/60 rounded-lg bg-gradient-to-br from-rose-50/80 to-pink-50/40 shadow-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-rose-600" />
                      <Label className="text-lg font-semibold text-rose-900">
                        Property Location
                      </Label>
                    </div>
                    <p className="text-sm text-rose-700/80">
                      Provide the complete address of your property
                    </p>

                    <div className="space-y-4 bg-white/80 p-4 rounded-lg border border-rose-200">
                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm font-medium text-rose-900">
                          Street Address <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-rose-500" />
                          <Input
                            id="address"
                            name="address"
                            placeholder="Enter complete street address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="pl-10 border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                        </div>
                        {errors.address && (
                          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-600">{errors.address}</p>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm font-medium text-rose-900">
                            State <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="state"
                            name="state"
                            placeholder="e.g., Maharashtra"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                          {errors.state && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{errors.state}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm font-medium text-rose-900">
                            City <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            placeholder="e.g., Mumbai"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                          {errors.city && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{errors.city}</p>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm font-medium text-rose-900">
                            Zip Code <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="e.g., 400001"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                          {errors.zipCode && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <p className="text-sm text-red-600">{errors.zipCode}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="googleMapLink" className="text-sm font-medium text-rose-900">
                          Google Maps Link <span className="text-xs text-gray-500">(Optional)</span>
                        </Label>
                        <Input
                          id="googleMapLink"
                          name="googleMapLink"
                          placeholder="https://goo.gl/maps/..."
                          value={formData.googleMapLink}
                          onChange={handleInputChange}
                          className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="lat" className="text-sm font-medium text-rose-900">
                            Latitude <span className="text-xs text-gray-500">(Optional)</span>
                          </Label>
                          <Input
                            id="lat"
                            name="lat"
                            type="number"
                            step="any"
                            placeholder="e.g., 19.0760"
                            value={formData.lat}
                            onChange={handleInputChange}
                            className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lng" className="text-sm font-medium text-rose-900">
                            Longitude <span className="text-xs text-gray-500">(Optional)</span>
                          </Label>
                          <Input
                            id="lng"
                            name="lng"
                            type="number"
                            step="any"
                            placeholder="e.g., 72.8777"
                            value={formData.lng}
                            onChange={handleInputChange}
                            className="border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Description Section - Violet Gradient */}
                  <div className="space-y-4 p-6 border-2 border-violet-300/60 rounded-lg bg-gradient-to-br from-violet-50/80 to-purple-50/40 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-violet-600" />
                      <Label className="text-lg font-semibold text-violet-900">
                        Property Description
                      </Label>
                    </div>
                    <p className="text-sm text-violet-700/80">
                      Provide a brief yet compelling description of your property
                    </p>

                    <div className="space-y-2 bg-white/80 p-4 rounded-lg border border-violet-200">
                      <Label htmlFor="description" className="text-sm font-medium text-violet-900">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe the key features, ambiance, and what makes your property stand out..."
                        value={formData.description}
                        onChange={handleInputChange}
                        className="min-h-[120px] border-violet-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 text-sm"
                      />
                      {errors.description && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <p className="text-sm text-red-600">{errors.description}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => handleTabChange("details")}
                      className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow text-sm"
                    >
                      Next: Details & Amenities
                    </Button>
                  </div>
                </TabsContent>

                {/* NOTE: DETAILS and PHOTOS tabs continue with similar comprehensive structure */}
                {/* Due to character limits, this represents the complete architectural pattern */}
                {/* The full file is over 3000+ lines matching the List Property Form exactly */}

                                    <TabsContent value="details" className="space-y-6">
                      {/* Stay Types Section - Emerald Gradient */}
                      <div className="space-y-4 p-6 border-2 border-emerald-300/60 rounded-lg bg-gradient-to-br from-emerald-50/80 to-green-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Hotel className="h-5 w-5 text-emerald-600" />
                          <Label className="text-lg font-semibold text-emerald-900">
                            Stay Types <span className="text-red-500">*</span>
                          </Label>
                        </div>
                        <p className="text-sm text-emerald-700/80">
                          Select all the types of stays your property is suitable for (required for better visibility)
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {STAY_TYPE_OPTIONS.map((stayType) => {
                            const IconComponent = stayType.icon;
                            const isSelected = formData.stayTypes.includes(stayType.id);
                            return (
                              <div
                                key={stayType.id}
                                className={`relative flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? "border-emerald-500 bg-gradient-to-br from-emerald-100/80 to-green-100/60 shadow-md"
                                    : "border-emerald-200/60 bg-white/80 hover:border-emerald-400 hover:shadow"
                                }`}
                                onClick={() => handleStayTypeToggle(stayType.id)}
                              >
                                <Checkbox
                                  id={`stay-type-${stayType.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => handleStayTypeToggle(stayType.id)}
                                  className={`mt-1 ${isSelected ? "border-emerald-600" : "border-emerald-400"}`}
                                />
                                <Label
                                  htmlFor={`stay-type-${stayType.id}`}
                                  className="cursor-pointer flex-1"
                                >
                                  <div className="flex items-center space-x-2 mb-1">
                                    {React.createElement(IconComponent, {
                                      className: `h-5 w-5 ${isSelected ? "text-emerald-600" : "text-emerald-500"}`
                                    })}
                                    <span className={`font-medium ${isSelected ? "text-emerald-900" : "text-gray-700"}`}>
                                      {stayType.label}
                                    </span>
                                  </div>
                                  <p className={`text-xs ${isSelected ? "text-emerald-700/80" : "text-gray-500"}`}>
                                    {stayType.description}
                                  </p>
                                </Label>
                                {isSelected && (
                                  <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {errors.stayTypes && (
                          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            <p className="text-sm text-red-600">{errors.stayTypes}</p>
                          </div>
                        )}

                        {formData.stayTypes.length === 0 && (
                          <Alert className="border-amber-300 bg-amber-50/80">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              <strong>Required:</strong> Please select at least one stay type to help guests find your property.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {currentCategoryOptions.length > 0 && (
                        <div className="space-y-4 p-6 border-2 border-fuchsia-300/60 rounded-lg bg-gradient-to-br from-fuchsia-50/80 to-pink-50/40 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Bed className="h-5 w-5 text-fuchsia-600" />
                            <Label className="text-lg font-semibold text-fuchsia-900">
                              {formData.propertyType === "hotel"
                                ? "Hotel Room Categories & Counts"
                                : formData.propertyType === "resort"
                                ? "Room/Unit Categories & Counts"
                                : "Property Unit Types & Counts"}
                            </Label>
                          </div>
                          {formData.propertyType === "resort" && (
                            <p className="text-sm text-fuchsia-700/80 mb-3">
                              Choose from both hotel-style rooms (Classic, Deluxe, Suite, etc.) and apartment-style units (1BHK, 2BHK, etc.) that your resort offers.
                            </p>
                          )}
                          {formData.propertyType === "hotel" && (
                            <p className="text-sm text-fuchsia-700/80 mb-3">
                              Select the room categories available at your hotel
                            </p>
                          )}
                          {!["hotel", "resort"].includes(formData.propertyType) && (
                            <p className="text-sm text-fuchsia-700/80 mb-3">
                              Select the unit types available at your property
                            </p>
                          )}

                          <ModernMultiSelect
                            options={ALL_ROOM_CATEGORIES}
                            value={selectedCategories.map(sc => sc.name)}
                            onChange={(values) => {
                              // Add newly selected categories
                              values.forEach(value => {
                                if (!selectedCategories.some(sc => sc.name === value)) {
                                  handleCategorySelect(value);
                                }
                              });
                              // Remove deselected categories
                              selectedCategories.forEach(sc => {
                                if (!values.includes(sc.name)) {
                                  handleCategorySelect(sc.name);
                                }
                              });
                            }}
                            placeholder="Search & select room categories..."
                            searchPlaceholder="Type to search (e.g., Classic, Deluxe, 2BHK, Suite...)"
                            allowAddNew={true}
                            onAddNew={handleAddNewCategory}
                          />

                          {selectedCategories.length > 0 && <hr className="my-4 border-fuchsia-300/40" />} 

                          {selectedCategories.map((category) => {
                            const categoryInfo = ALL_ROOM_CATEGORIES.find(cat => cat.value === category.name);
                            return (
                              <div key={category.name} className="mt-4 p-6 border-2 border-fuchsia-200 rounded-lg bg-white/90 shadow-sm">
                                {/* Category Header */}
                                <div className="mb-4">
                                  <h4 className="text-lg font-bold text-fuchsia-900">
                                    {categoryInfo?.label || category.name}
                                  </h4>
                                  {categoryInfo?.description && (
                                    <p className="text-sm text-gray-600 mt-1">{categoryInfo.description}</p>
                                  )}
                                </div>

                                {/* 4-Column Grid for Main Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                  {/* Number of Rooms */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-fuchsia-900">
                                      Number of Rooms <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                      type="number"
                                      value={category.count}
                                      onChange={(e) => handleCategoryRoomCountChange(category.name, e.target.value)}
                                      placeholder="e.g., 5"
                                      className="border-fuchsia-300 focus:border-fuchsia-500 text-sm"
                                      min="1"
                                    />
                                    <p className="text-xs text-gray-500">Total rooms of this type</p>
                                    {errors[`${category.name}_count`] && (
                                      <p className="text-xs text-red-500">{errors[`${category.name}_count`]}</p>
                                    )}
                                  </div>

                                  {/* Max Capacity Per Room */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-fuchsia-900">
                                      Max Capacity/Room
                                    </Label>
                                    <Input
                                      type="number"
                                      value={category.maxCapacityPerRoom || ''}
                                      onChange={(e) => {
                                        const newCategories = selectedCategories.map(sc =>
                                          sc.name === category.name
                                            ? { ...sc, maxCapacityPerRoom: parseInt(e.target.value) || undefined }
                                            : sc
                                        );
                                        setSelectedCategories(newCategories);
                                      }}
                                      placeholder="e.g., 4"
                                      className="border-fuchsia-300 focus:border-fuchsia-500 text-sm"
                                      min="1"
                                      max="20"
                                    />
                                    <p className="text-xs text-gray-500">Max guests allowed (1-20)</p>
                                  </div>

                                  {/* Free Extra Person Limit */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-fuchsia-900">
                                      Free Extra Persons
                                    </Label>
                                    <Input
                                      type="number"
                                      value={category.freeExtraPersonLimit !== undefined ? category.freeExtraPersonLimit : ''}
                                      onChange={(e) => {
                                        const newCategories = selectedCategories.map(sc =>
                                          sc.name === category.name
                                            ? { ...sc, freeExtraPersonLimit: parseInt(e.target.value) || 0 }
                                            : sc
                                        );
                                        setSelectedCategories(newCategories);
                                      }}
                                      placeholder="e.g., 1"
                                      className="border-fuchsia-300 focus:border-fuchsia-500 text-sm"
                                      min="0"
                                      max="10"
                                    />
                                    <p className="text-xs text-gray-500">Extra persons free (0-10)</p>
                                  </div>

                                  {/* Extra Person Charge */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-fuchsia-900">
                                      Extra Person Charge
                                    </Label>
                                    <div className="flex items-center">
                                      <IndianRupee className="h-4 w-4 text-fuchsia-500 mr-1 flex-shrink-0" />
                                      <Input
                                        type="number"
                                        value={category.extraPersonCharge !== undefined ? category.extraPersonCharge : ''}
                                        onChange={(e) => {
                                          const newCategories = selectedCategories.map(sc =>
                                            sc.name === category.name
                                              ? { ...sc, extraPersonCharge: parseInt(e.target.value) || 0 }
                                              : sc
                                          );
                                          setSelectedCategories(newCategories);
                                        }}
                                        placeholder="e.g., 500"
                                        className="border-fuchsia-300 focus:border-fuchsia-500 text-sm"
                                        min="0"
                                      />
                                    </div>
                                    <p className="text-xs text-gray-500">₹/person/night</p>
                                  </div>
                                </div>

                                {/* Room Numbers Section */}
                                {category.count && parseInt(category.count, 10) > 0 && (
                                  <div className="mt-4 pt-4 border-t border-fuchsia-200">
                                    <Label className="text-sm font-medium text-fuchsia-900 mb-3 block">
                                      Room Numbers <span className="text-xs text-gray-500">(Optional)</span>
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                      {Array.from({ length: parseInt(category.count, 10) }).map((_, index) => (
                                        <div key={index} className="flex flex-col">
                                          <Label className="text-xs text-gray-500 mb-1">
                                            Room {index + 1}
                                          </Label>
                                          <Input
                                            type="text"
                                            value={category.roomNumbers?.[index] || ''}
                                            onChange={(e) => handleRoomNumberChange(category.name, index, e.target.value)}
                                            placeholder={`e.g., ${index + 101}`}
                                            className="border-fuchsia-300 focus:border-fuchsia-500 text-xs h-8"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {errors.selectedCategories && (
                            <Alert className="mt-4">
                              <AlertDescription className="text-red-600">
                                {errors.selectedCategories}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}


                      {formData.propertyType === "hotel" && (
                        <>
                          {selectedCategories.length === 0 && (
                              <div className="space-y-2 mt-4 p-3 border border-dashed border-lightGreen/50 rounded-md">
                                <Label htmlFor="numBedrooms">Total Hotel Rooms <span className="text-xs text-gray-500">(if not using detailed room categories above)</span></Label>
                                <div className="flex items-center">
                                  <Bed className="h-5 w-5 text-mediumGreen mr-2" />
                                  <Select
                                    value={numBedrooms}
                                    onValueChange={(value) => setNumBedrooms(value)}
                                  >
                                    <SelectTrigger className="border-lightGreen">
                                      <SelectValue placeholder="Select total rooms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 30, 50, 75, 100].map((num) => (
                                        <SelectItem key={num} value={num.toString()}>
                                          {num} {num === 1 ? "Room" : "Rooms"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                          )}
                        </>
                      )}

                      {/* Only show general Property Details when NO categories are selected */}
                      {selectedCategories.length === 0 &&
                       !(formData.propertyType === "hotel" || formData.propertyType === "resort") && (
                        <div className="space-y-4 p-6 border-2 border-sky-300/60 rounded-lg bg-gradient-to-br from-sky-50/80 to-blue-50/40 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Bed className="h-5 w-5 text-sky-600" />
                            <Label className="text-lg font-semibold text-sky-900">
                              Property Details
                            </Label>
                          </div>
                          <p className="text-sm text-sky-700/80">
                            Specify the bedroom and bathroom configuration
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/80 p-4 rounded-lg border border-sky-200">
                            <div className="space-y-2">
                              <Label htmlFor="bedrooms" className="text-sm font-medium text-sky-900">
                                Number of Bedrooms
                              </Label>
                              <div className="relative">
                                <Bed className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500 z-10 pointer-events-none" />
                                <Select
                                  value={formData.bedrooms}
                                  onValueChange={(value) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      bedrooms: value,
                                    }))
                                  }
                                  disabled={(["villa", "house", "apartment"].includes(formData.propertyType)) && selectedCategories.length > 0}
                                >
                                  <SelectTrigger className="pl-10 border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                                    <SelectValue placeholder="Select bedrooms" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                      <SelectItem key={num} value={num.toString()}>
                                        {num} {num === 1 ? "Bedroom" : "Bedrooms"}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bathrooms" className="text-sm font-medium text-sky-900">
                                Number of Bathrooms
                              </Label>
                              <div className="relative">
                                <Bath className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-sky-500 z-10 pointer-events-none" />
                                <Select
                                  value={formData.bathrooms}
                                  onValueChange={(value) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      bathrooms: value,
                                    }))
                                  }
                                  disabled={(["villa", "house", "apartment"].includes(formData.propertyType)) && selectedCategories.length > 0}
                                >
                                  <SelectTrigger className="pl-10 border-sky-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200">
                                    <SelectValue placeholder="Select bathrooms" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(
                                      (num) => (
                                        <SelectItem
                                          key={num}
                                          value={num.toString()}
                                        >
                                          {num}{" "}
                                          {num === 1 ? "Bathroom" : "Bathrooms"}
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Amenities Section - Slate Gradient */}
                      <div className="space-y-4 p-6 border-2 border-slate-300/60 rounded-lg bg-gradient-to-br from-slate-50/80 to-gray-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-slate-600" />
                          <Label className="text-lg font-semibold text-slate-900">
                            Property Amenities
                          </Label>
                        </div>
                        <p className="text-sm text-slate-700/80">
                          Select all amenities available at your property
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.wifi
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("wifi")}
                          >
                            <Wifi className={`h-5 w-5 mr-2 ${amenities.wifi ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.wifi ? "text-slate-900" : "text-gray-700"}`}>
                              WiFi
                            </span>
                            {amenities.wifi && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.tv
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("tv")}
                          >
                            <Tv className={`h-5 w-5 mr-2 ${amenities.tv ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.tv ? "text-slate-900" : "text-gray-700"}`}>
                              TV
                            </span>
                            {amenities.tv && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.kitchen
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("kitchen")}
                          >
                            <Kitchen className={`h-5 w-5 mr-2 ${amenities.kitchen ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.kitchen ? "text-slate-900" : "text-gray-700"}`}>
                              Kitchen
                            </span>
                            {amenities.kitchen && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.parking
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("parking")}
                          >
                            <Car className={`h-5 w-5 mr-2 ${amenities.parking ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.parking ? "text-slate-900" : "text-gray-700"}`}>
                              Parking
                            </span>
                            {amenities.parking && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.ac
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("ac")}
                          >
                            <Wind className={`h-5 w-5 mr-2 ${amenities.ac ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.ac ? "text-slate-900" : "text-gray-700"}`}>
                              AC
                            </span>
                            {amenities.ac && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`relative border-2 rounded-xl p-3 flex items-center cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                              amenities.pool
                                ? "border-slate-500 bg-gradient-to-br from-slate-100 to-gray-100 shadow-md"
                                : "border-slate-200/60 bg-white/80 hover:border-slate-400"
                            }`}
                            onClick={() => handleAmenityToggle("pool")}
                          >
                            <Waves className={`h-5 w-5 mr-2 ${amenities.pool ? "text-slate-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${amenities.pool ? "text-slate-900" : "text-gray-700"}`}>
                              Pool
                            </span>
                            {amenities.pool && (
                              <div className="absolute -top-2 -right-2 bg-slate-500 rounded-full p-1">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.geyser
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("geyser")}
                          >
                            <Thermometer className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">Geyser</span>
                            {amenities.geyser && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.shower
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("shower")}
                          >
                            <Droplets className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">Shower</span>
                            {amenities.shower && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.bathTub
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("bathTub")}
                          >
                            <Bath className="h-5 w-5 text-mediumGreen mr-2" /> 
                            <span className="text-sm font-medium text-darkGreen">Bath Tub</span>
                            {amenities.bathTub && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.reception24x7
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("reception24x7")}
                          >
                            <BellRing className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">Reception 24x7</span>
                            {amenities.reception24x7 && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>
                          
                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.roomService
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("roomService")}
                          >
                            <BellRing className="h-5 w-5 text-mediumGreen mr-2" /> 
                            <span className="text-sm font-medium text-darkGreen">Room Service</span>
                            {amenities.roomService && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.restaurant
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("restaurant")}
                          >
                            <Utensils className="h-5 w-5 text-mediumGreen mr-2" /> 
                            <span className="text-sm font-medium text-darkGreen">Restaurant</span>
                            {amenities.restaurant && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.bar
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("bar")}
                          >
                             <Beer className="h-5 w-5 text-mediumGreen mr-2" /> 
                            <span className="text-sm font-medium text-darkGreen">Bar</span>
                            {amenities.bar && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>
                           <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.fridge 
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("fridge")}
                          >
                            <Refrigerator className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">Fridge</span>
                            {amenities.fridge && <Check className="h-4 w-4 text-mediumGreen ml-auto" />}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4">
                        <Label htmlFor="otherAmenities" className="text-sm">
                          Other Amenities (Optional)
                        </Label>
                        <Textarea
                          id="otherAmenities"
                          name="otherAmenities" 
                          placeholder="List any other amenities separated by commas (e.g., Fireplace, Board Games, Iron)"
                          value={formData.otherAmenities}
                          onChange={handleInputChange}
                          className="min-h-[80px] border-lightGreen focus:border-lightGreen text-sm"
                        />
                      </div>

                      {/* About This Place Section - Blue Gradient */}
                      <div className="space-y-4 mt-6 p-6 border-2 border-blue-300/60 rounded-lg bg-gradient-to-br from-blue-50/80 to-cyan-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-600" />
                          <Label className="text-lg font-semibold text-blue-900">
                            About This Place
                          </Label>
                        </div>
                        <p className="text-sm text-blue-700/80">
                          Share what makes your property special. Describe the ambiance, unique features, and what guests can expect during their stay.
                        </p>
                        <Textarea
                          id="aboutProperty"
                          name="aboutProperty"
                          placeholder="e.g., Our boutique hotel combines modern luxury with traditional charm. Located in the heart of the city, each room features handpicked artwork and premium amenities..."
                          value={formData.aboutProperty || ''}
                          onChange={handleInputChange}
                          className="min-h-[120px] border-blue-300 focus:border-blue-500 bg-white/80 text-sm"
                        />
                      </div>

                      {/* Property Highlights Section - Purple Gradient */}
                      <div className="space-y-4 mt-6 p-6 border-2 border-purple-300/60 rounded-lg bg-gradient-to-br from-purple-50/80 to-pink-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <Label className="text-lg font-semibold text-purple-900">
                            Property Highlights
                          </Label>
                        </div>
                        <p className="text-sm text-purple-700/80">
                          List the key features and selling points of your property (max 6 highlights)
                        </p>

                        <div className="space-y-3">
                          {propertyHighlights.map((highlight, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                type="text"
                                placeholder={`Highlight ${index + 1} (e.g., "Rooftop restaurant with city views")`}
                                value={highlight}
                                onChange={(e) => {
                                  const newHighlights = [...propertyHighlights];
                                  newHighlights[index] = e.target.value;
                                  setPropertyHighlights(newHighlights);
                                }}
                                className="flex-1 border-purple-300 focus:border-purple-500 bg-white/80 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newHighlights = propertyHighlights.filter((_, i) => i !== index);
                                  setPropertyHighlights(newHighlights);
                                }}
                                className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          {propertyHighlights.length < 6 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setPropertyHighlights([...propertyHighlights, ''])}
                              className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Highlight
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Nearby Locations Section - Green Gradient */}
                      <div className="space-y-4 mt-6 p-6 border-2 border-green-300/60 rounded-lg bg-gradient-to-br from-green-50/80 to-emerald-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-green-600" />
                          <Label className="text-lg font-semibold text-green-900">
                            Nearby Locations
                          </Label>
                        </div>
                        <p className="text-sm text-green-700/80">
                          List important places near your property (restaurants, attractions, transport hubs, etc.)
                        </p>

                        <div className="space-y-3">
                          {nearbyLocations.map((location, index) => (
                            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-white/80 rounded-lg border border-green-200">
                              <Input
                                type="text"
                                placeholder="Location name"
                                value={location.name}
                                onChange={(e) => {
                                  const newLocations = [...nearbyLocations];
                                  newLocations[index].name = e.target.value;
                                  setNearbyLocations(newLocations);
                                }}
                                className="border-green-300 focus:border-green-500 text-sm"
                              />
                              <Input
                                type="text"
                                placeholder="Type (e.g., Restaurant, Airport)"
                                value={location.type}
                                onChange={(e) => {
                                  const newLocations = [...nearbyLocations];
                                  newLocations[index].type = e.target.value;
                                  setNearbyLocations(newLocations);
                                }}
                                className="border-green-300 focus:border-green-500 text-sm"
                              />
                              <div className="flex gap-2">
                                <Input
                                  type="text"
                                  placeholder="Distance (e.g., 2 km)"
                                  value={location.distance}
                                  onChange={(e) => {
                                    const newLocations = [...nearbyLocations];
                                    newLocations[index].distance = e.target.value;
                                    setNearbyLocations(newLocations);
                                  }}
                                  className="flex-1 border-green-300 focus:border-green-500 text-sm"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newLocations = nearbyLocations.filter((_, i) => i !== index);
                                    setNearbyLocations(newLocations);
                                  }}
                                  className="text-green-600 hover:text-green-800 hover:bg-green-100"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setNearbyLocations([...nearbyLocations, { name: '', type: '', distance: '' }])}
                            className="w-full border-green-300 text-green-700 hover:bg-green-100"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Nearby Location
                          </Button>
                        </div>
                      </div>

                      {/* House Rules Section - Amber Gradient */}
                      <div className="space-y-4 mt-6 p-6 border-2 border-amber-300/60 rounded-lg bg-gradient-to-br from-amber-50/80 to-yellow-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-600" />
                          <Label className="text-lg font-semibold text-amber-900">
                            House Rules
                          </Label>
                        </div>
                        <p className="text-sm text-amber-700/80">
                          Set clear expectations for your guests
                        </p>

                        {/* Check-in/Check-out Times */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-white/80 rounded-lg border border-amber-200">
                          <div className="space-y-2">
                            <Label htmlFor="checkInTime" className="text-sm font-medium text-amber-900">
                              Check-in Time
                            </Label>
                            <Input
                              id="checkInTime"
                              name="checkInTime"
                              type="text"
                              placeholder="e.g., 2:00 PM"
                              value={formData.checkInTime || '2:00 PM'}
                              onChange={handleInputChange}
                              className="border-amber-300 focus:border-amber-500 text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="checkOutTime" className="text-sm font-medium text-amber-900">
                              Check-out Time
                            </Label>
                            <Input
                              id="checkOutTime"
                              name="checkOutTime"
                              type="text"
                              placeholder="e.g., 11:00 AM"
                              value={formData.checkOutTime || '11:00 AM'}
                              onChange={handleInputChange}
                              className="border-amber-300 focus:border-amber-500 text-sm"
                            />
                          </div>
                        </div>

                        {/* Policy Checkboxes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/80 rounded-lg border border-amber-200">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="smokingAllowed"
                              checked={formData.smokingAllowed || false}
                              onCheckedChange={(checked) =>
                                setFormData(prev => ({ ...prev, smokingAllowed: checked as boolean }))
                              }
                              className="border-amber-400"
                            />
                            <Label htmlFor="smokingAllowed" className="text-sm font-medium cursor-pointer">
                              Smoking Allowed
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="petsAllowed"
                              checked={formData.petsAllowed || false}
                              onCheckedChange={(checked) =>
                                setFormData(prev => ({ ...prev, petsAllowed: checked as boolean }))
                              }
                              className="border-amber-400"
                            />
                            <Label htmlFor="petsAllowed" className="text-sm font-medium cursor-pointer">
                              Pets Allowed
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="partiesAllowed"
                              checked={formData.partiesAllowed || false}
                              onCheckedChange={(checked) =>
                                setFormData(prev => ({ ...prev, partiesAllowed: checked as boolean }))
                              }
                              className="border-amber-400"
                            />
                            <Label htmlFor="partiesAllowed" className="text-sm font-medium cursor-pointer">
                              Parties/Events Allowed
                            </Label>
                          </div>
                        </div>

                        {/* Quiet Hours */}
                        <div className="space-y-2 p-4 bg-white/80 rounded-lg border border-amber-200">
                          <Label htmlFor="quietHours" className="text-sm font-medium text-amber-900">
                            Quiet Hours
                          </Label>
                          <Input
                            id="quietHours"
                            name="quietHours"
                            type="text"
                            placeholder="e.g., 10:00 PM - 7:00 AM"
                            value={formData.quietHours || '10:00 PM - 7:00 AM'}
                            onChange={handleInputChange}
                            className="border-amber-300 focus:border-amber-500 text-sm"
                          />
                        </div>

                        {/* Additional Rules */}
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-amber-900">
                            Additional Rules (Optional)
                          </Label>
                          {additionalRules.map((rule, index) => (
                            <div key={index} className="flex gap-2">
                              <Input
                                type="text"
                                placeholder={`Rule ${index + 1} (e.g., "No shoes inside the property")`}
                                value={rule}
                                onChange={(e) => {
                                  const newRules = [...additionalRules];
                                  newRules[index] = e.target.value;
                                  setAdditionalRules(newRules);
                                }}
                                className="flex-1 border-amber-300 focus:border-amber-500 bg-white/80 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const newRules = additionalRules.filter((_, i) => i !== index);
                                  setAdditionalRules(newRules);
                                }}
                                className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAdditionalRules([...additionalRules, ''])}
                            className="w-full border-amber-300 text-amber-700 hover:bg-amber-100"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rule
                          </Button>
                        </div>
                      </div>

                      {/* Meal Pricing Section - Orange Gradient */}
                      <div className="space-y-4 mt-6 p-6 border-2 border-orange-300/60 rounded-lg bg-gradient-to-br from-orange-50/80 to-amber-50/40 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Utensils className="h-5 w-5 text-orange-600" />
                          <Label className="text-lg font-semibold text-orange-900">
                            Meal Options & Pricing
                          </Label>
                        </div>
                        <p className="text-sm text-orange-700/80">
                          Enable meal options and set prices per person per day (optional)
                        </p>

                        {/* Breakfast */}
                        <div className="flex items-start gap-3 p-4 border-2 border-orange-200/60 rounded-lg bg-white/80">
                          <Checkbox
                            id="breakfast-enabled"
                            checked={mealPricing.breakfast.enabled}
                            onCheckedChange={(checked) => {
                              setMealPricing(prev => ({
                                ...prev,
                                breakfast: { ...prev.breakfast, enabled: checked as boolean }
                              }));
                            }}
                            className="mt-1 border-orange-400"
                          />
                          <div className="flex-1">
                            <Label htmlFor="breakfast-enabled" className="font-medium text-orange-900 cursor-pointer">
                              Breakfast
                            </Label>
                            {mealPricing.breakfast.enabled && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Price per person</Label>
                                  <Input
                                    type="number"
                                    placeholder="₹ per person"
                                    value={mealPricing.breakfast.pricePerPerson || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        breakfast: { ...prev.breakfast, pricePerPerson: parseInt(e.target.value) || 0 }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Description (optional)</Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g., Continental buffet"
                                    value={mealPricing.breakfast.description || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        breakfast: { ...prev.breakfast, description: e.target.value }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Lunch/Dinner */}
                        <div className="flex items-start gap-3 p-4 border-2 border-orange-200/60 rounded-lg bg-white/80">
                          <Checkbox
                            id="lunchDinner-enabled"
                            checked={mealPricing.lunchDinner.enabled}
                            onCheckedChange={(checked) => {
                              setMealPricing(prev => ({
                                ...prev,
                                lunchDinner: { ...prev.lunchDinner, enabled: checked as boolean }
                              }));
                            }}
                            className="mt-1 border-orange-400"
                          />
                          <div className="flex-1">
                            <Label htmlFor="lunchDinner-enabled" className="font-medium text-orange-900 cursor-pointer">
                              Lunch/Dinner
                            </Label>
                            {mealPricing.lunchDinner.enabled && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Price per person</Label>
                                  <Input
                                    type="number"
                                    placeholder="₹ per person"
                                    value={mealPricing.lunchDinner.pricePerPerson || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        lunchDinner: { ...prev.lunchDinner, pricePerPerson: parseInt(e.target.value) || 0 }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Description (optional)</Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g., A la carte menu"
                                    value={mealPricing.lunchDinner.description || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        lunchDinner: { ...prev.lunchDinner, description: e.target.value }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* All Meals */}
                        <div className="flex items-start gap-3 p-4 border-2 border-orange-200/60 rounded-lg bg-white/80">
                          <Checkbox
                            id="allMeals-enabled"
                            checked={mealPricing.allMeals.enabled}
                            onCheckedChange={(checked) => {
                              setMealPricing(prev => ({
                                ...prev,
                                allMeals: { ...prev.allMeals, enabled: checked as boolean }
                              }));
                            }}
                            className="mt-1 border-orange-400"
                          />
                          <div className="flex-1">
                            <Label htmlFor="allMeals-enabled" className="font-medium text-orange-900 cursor-pointer">
                              All Meals (Breakfast + Lunch + Dinner)
                            </Label>
                            {mealPricing.allMeals.enabled && (
                              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Price per person</Label>
                                  <Input
                                    type="number"
                                    placeholder="₹ per person"
                                    value={mealPricing.allMeals.pricePerPerson || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        allMeals: { ...prev.allMeals, pricePerPerson: parseInt(e.target.value) || 0 }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-gray-600">Description (optional)</Label>
                                  <Input
                                    type="text"
                                    placeholder="e.g., Full board package"
                                    value={mealPricing.allMeals.description || ''}
                                    onChange={(e) => {
                                      setMealPricing(prev => ({
                                        ...prev,
                                        allMeals: { ...prev.allMeals, description: e.target.value }
                                      }));
                                    }}
                                    className="border-orange-300 focus:border-orange-500 text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={() => handleTabChange("details")}
                          className="border-lightGreen text-darkGreen"
                        >
                          Back
                        </Button>
                        <Button
                          onClick={() => handleTabChange("photos")}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                        >
                          Next: Photos & Pricing
                        </Button>
                      </div>
                    </TabsContent>

                                    <TabsContent value="photos" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-lg font-semibold text-darkGreen">Property Photos</Label>
                          <Button 
                            variant={isEditMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`text-xs ${isEditMode ? "bg-mediumGreen hover:bg-mediumGreen/90 text-lightYellow" : "border-lightGreen text-darkGreen"}`}
                          >
                            {isEditMode ? "Done Editing Photos" : "Edit Photos"}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                          Upload high-quality photos. <span className="font-semibold">Exterior and Interior photos are compulsory.</span>
                        </p>

                        {[ 
                          { label: "Exterior", value: "exterior", compulsory: true },
                          { label: "Interior", value: "interior", compulsory: true },
                          { label: "Kitchen", value: "kitchen", compulsory: false },
                          { label: "Bathroom(s)", value: "bathroom", compulsory: false },
                          { label: "Bedroom(s)", value: "bedroom", compulsory: false },
                          { label: "Living Room", value: "living_room", compulsory: false },
                          { label: "Dining Room", value: "dining_room", compulsory: false },
                          { label: "Balcony/Terrace", value: "balcony", compulsory: false },
                          { label: "Garden/Lawn", value: "garden", compulsory: false },
                          { label: "Swimming Pool", value: "pool", compulsory: false },
                          { label: "Restaurant", value: "restaurant", compulsory: false },
                          { label: "Pub/Bar", value: "pub", compulsory: false },
                          { label: "Gym/Fitness Center", value: "gym", compulsory: false },
                          { label: "Spa/Wellness", value: "spa", compulsory: false },
                          { label: "Reception/Lobby", value: "reception", compulsory: false },
                          { label: "Parking Area", value: "parking", compulsory: false },
                          { label: "Conference/Meeting Room", value: "conference", compulsory: false },
                          { label: "Rooftop", value: "rooftop", compulsory: false },
                          { label: "Common Areas", value: "common_areas", compulsory: false },
                          { label: "Other Amenities", value: "amenities", compulsory: false },
                        ].map(photoCat => {
                          const currentFiles = categorizedImages.find(ci => ci.category === photoCat.value)?.files ?? [];
                          const hasFiles = currentFiles.length > 0;
                          return (
                            <div key={photoCat.value} className={`p-4 border rounded-lg mb-4 bg-white shadow-sm ${photoCat.compulsory && !hasFiles && !isEditMode ? 'border-red-500 ring-1 ring-red-500' : 'border-lightGreen/50'}`}>
                              <Label className="text-md font-medium text-darkGreen flex items-center">
                                {photoCat.label} 
                                {photoCat.compulsory && <span className={`text-red-500 ml-1 ${hasFiles ? 'hidden' : ''}`}>*</span>}
                                {photoCat.compulsory && hasFiles && <Check className="h-4 w-4 text-green-500 ml-1" />}
                                <span className="text-xs text-gray-500 ml-2">({currentFiles.length} photo{currentFiles.length === 1 ? '' : 's'})</span>
                              </Label>
                              {photoCat.compulsory && !hasFiles && !isEditMode && <p className="text-xs text-red-600 mt-1">This category is compulsory.</p>}
                              {errors.exteriorPhotos && photoCat.value === 'exterior' && (
                                <p className="text-sm text-red-500 mt-2">{errors.exteriorPhotos}</p>
                              )}
                              {errors.interiorPhotos && photoCat.value === 'interior' && (
                                <p className="text-sm text-red-500 mt-2">{errors.interiorPhotos}</p>
                              )}
                              <div className="border-2 border-dashed border-lightGreen rounded-lg p-4 mt-2 text-center">
                                <Upload className="h-6 w-6 mx-auto mb-2 text-mediumGreen" />
                                <p className="text-sm text-darkGreen mb-2">
                                  {isUploading === photoCat.value ? `Uploading for ${photoCat.label}...` : `Drag 'n' drop or click to upload ${photoCat.label} photos`}
                                </p>
                                <Button
                                  variant="outline"
                                  onClick={() => handleCategorizedImageUpload(photoCat.value)}
                                  disabled={!!isUploading}
                                  className="border-lightGreen text-darkGreen text-xs"
                                >
                                  {isUploading === photoCat.value ? (
                                    <span className="flex items-center gap-1">
                                      Loading...
                                    </span>
                                  ) : (
                                    `Upload ${photoCat.label}`
                                  )}
                                </Button>
                              </div>
                              {(categorizedImages.find(ci => ci.category === photoCat.value)?.files ?? []).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                  {(categorizedImages.find(ci => ci.category === photoCat.value)?.files ?? []).map((image, index) => {
                                    return (
                                      <div key={index} className="relative rounded-lg overflow-hidden h-28">
                                        <Image src={image.url || "/placeholder.svg"} alt={`${photoCat.label} ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                                        {(isEditMode || !image.public_id) && (
                                          <button
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            onClick={() => handleRemoveCategorizedImage(photoCat.value, index)}
                                            aria-label={`Remove ${photoCat.label} image`}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}

                        {selectedCategories.map(roomOrUnitCat => {
                          const categoryLabel = currentCategoryOptions.find(opt => opt.value === roomOrUnitCat.name)?.label || roomOrUnitCat.name;
                          const categoryValue = roomOrUnitCat.name; 
                          const currentFiles = categorizedImages.find(ci => ci.category === categoryValue)?.files ?? [];
                          return (
                            <div key={categoryValue} className="p-4 border border-lightGreen/50 rounded-lg mb-4 bg-white shadow-sm">
                              <Label className="text-md font-medium text-darkGreen flex items-center">
                                Photos for {categoryLabel}
                                <span className="text-xs text-gray-500 ml-2">({currentFiles.length} photo{currentFiles.length === 1 ? '' : 's'})</span>
                              </Label>
                              <div className="border-2 border-dashed border-lightGreen rounded-lg p-4 mt-2 text-center">
                                <Upload className="h-6 w-6 mx-auto mb-2 text-mediumGreen" />
                                <p className="text-sm text-darkGreen mb-2">
                                  {isUploading === categoryValue ? `Uploading for ${categoryLabel}...` : `Upload photos for ${categoryLabel}`}
                                </p>
                                <Button
                                  variant="outline"
                                  onClick={() => handleCategorizedImageUpload(categoryValue)}
                                  disabled={!!isUploading}
                                  className="border-lightGreen text-darkGreen text-xs"
                                >
                                  {isUploading === categoryValue ? (
                                    <span className="flex items-center gap-1">
                                      Loading... 
                                    </span>
                                  ) : (
                                    `Upload for ${categoryLabel}`
                                  )}
                                </Button>
                              </div>
                              {(categorizedImages.find(ci => ci.category === categoryValue)?.files ?? []).length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                  {(categorizedImages.find(ci => ci.category === categoryValue)?.files ?? []).map((image, index) => {
                                    return (
                                      <div key={index} className="relative rounded-lg overflow-hidden h-28">
                                        <Image src={image.url || "/placeholder.svg"} alt={`${categoryLabel} ${index + 1}`} fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: "cover" }} />
                                        {(isEditMode || !image.public_id) && (
                                          <button
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                                            onClick={() => handleRemoveCategorizedImage(categoryValue, index)}
                                            aria-label={`Remove ${categoryLabel} image`}
                                          >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}

                        {(selectedCategories.length === 0 || images.length > 0) && (
                          <div className="p-4 border border-gray-200 rounded-lg mt-4 bg-gray-50">
                            <Label className="text-md font-medium text-darkGreen flex items-center">
                              General Property Photos (Legacy)
                              <span className="text-xs text-gray-500 ml-2">({images.length} photo{images.length === 1 ? '' : 's'})</span>
                            </Label>
                            <div className="border-2 border-dashed border-lightGreen rounded-lg p-6 text-center mt-2">
                              <Upload className="h-8 w-8 mx-auto mb-2 text-mediumGreen" />
                              <p className="text-sm text-darkGreen mb-2">
                                {isUploading === 'general' ? "Uploading images to Cloudinary..." : "Upload any other general photos"}
                              </p>
                              <Button
                                variant="outline"
                                onClick={handleImageUpload} 
                                disabled={!!isUploading}
                                className="border-lightGreen text-darkGreen"
                              >
                                {isUploading === 'general' ? (
                                  <span className="flex items-center gap-2">
                                    Loading...
                                  </span>
                                ) : (
                                  "Upload General Photos"
                                )}
                              </Button>
                            </div>
                            {images.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                {images.map((image, index) => (
                                  <div
                                    key={index}
                                    className="relative rounded-lg overflow-hidden h-32"
                                  >
                                    <Image
                                      src={image.url || "/placeholder.svg"}
                                      alt={`Property ${index + 1}`}
                                      fill
                                      style={{ objectFit: "cover" }}
                                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                                    />
                                    {isEditMode && (
                                      <button
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                        onClick={() => handleRemoveImage(index)} 
                                        aria-label="Remove image"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {errors.categorizedImages && (
                          <Alert className="mt-4">
                            <AlertDescription className="text-red-600">
                              {errors.categorizedImages}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Debug Information - Remove in production */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                          <h4 className="font-semibold text-blue-800 mb-2">Debug Info (Current State):</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-blue-700">
                            <div>Stay Types: {formData.stayTypes.length > 0 ? formData.stayTypes.join(', ') : 'None selected'}</div>
                            <div>Selected Categories: {selectedCategories.length}</div>
                            <div>Categories with Pricing: {selectedCategories.filter(c => c.price).length}</div>
                            <div>Exterior Photos: {categorizedImages.find(ci => ci.category === 'exterior')?.files?.length || 0}</div>
                            <div>Interior Photos: {categorizedImages.find(ci => ci.category === 'interior')?.files?.length || 0}</div>
                            <div>Property Type: {formData.propertyType}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-lightGreen/30">
                        <Label className="text-lg font-semibold text-darkGreen mb-4 block">Pricing</Label>

                        {selectedCategories.length > 0 ? (
                          <div className="space-y-6 mb-8">
                            {selectedCategories.map(selCat => {
                              const categoryLabel = currentCategoryOptions.find((opt: any) => opt.value === selCat.name)?.label || selCat.name;

                              return (
                                <div key={selCat.name} className="p-6 border-2 border-lightGreen/70 rounded-lg bg-gradient-to-br from-lightGreen/5 to-white shadow-lg">
                                  <h3 className="text-lg font-bold text-mediumGreen mb-4 flex items-center gap-2">
                                    <Bed className="h-5 w-5" />
                                    {categoryLabel} (x{selCat.count})
                                  </h3>

                                  {/* Simple category-based pricing */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">
                                      Price per Night (₹) <span className="text-red-500">*</span>
                                    </Label>
                                    <div className="flex items-center">
                                      <IndianRupee className="h-4 w-4 text-mediumGreen mr-1 flex-shrink-0" />
                                      <Input
                                        type="number"
                                        placeholder="e.g., 2000"
                                        value={selCat.price || ''}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setSelectedCategories(prev =>
                                            prev.map(c =>
                                              c.name === selCat.name ? { ...c, price: value } : c
                                            )
                                          );
                                          // Clear errors
                                          if (value && parseFloat(value) > 0) {
                                            setErrors(prev => {
                                              const newErrors = { ...prev };
                                              delete newErrors[`${selCat.name}_price`];
                                              return newErrors;
                                            });
                                          }
                                        }}
                                        className="border-gray-300 focus:border-lightGreen text-sm"
                                        min="0"
                                        step="100"
                                      />
                                    </div>
                                    {errors[`${selCat.name}_price`] && (
                                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {errors[`${selCat.name}_price`]}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}

                        {(selectedCategories.length === 0) && (
                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                             <h3 className="text-md font-semibold text-darkGreen mb-3">General Property Pricing</h3>
                              <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="price">Price per Night</Label>
                                <div className="flex items-center">
                                  <IndianRupee className="h-5 w-5 text-mediumGreen mr-2" />
                                  <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    placeholder="e.g., 100"
                                    value={formData.price}
                                    onChange={handleInputChange} 
                                    className="border-lightGreen focus:border-lightGreen"
                                  />
                                </div>
                                {errors.price && (
                                  <p className="text-sm text-red-500 mt-1">{errors.price}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Dynamic Pricing Information Section */}
                      <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold text-blue-800">Dynamic Pricing Benefits</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-medium text-blue-700">Why Enable Dynamic Pricing?</h4>
                            <ul className="space-y-2 text-sm text-blue-600">
                              <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span><strong>Maximize Revenue:</strong> Automatically adjust prices based on demand, seasonality, and local events</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span><strong>Competitive Edge:</strong> Stay competitive with real-time market pricing</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span><strong>Automated Management:</strong> No manual price adjustments needed</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span><strong>Increased Bookings:</strong> Optimal pricing attracts more guests</span>
                              </li>
                            </ul>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-blue-700">Preview: Your Property with Dynamic Pricing</h4>
                            <div className="bg-white p-4 rounded-lg border border-blue-200 shadow-sm">
                              <div className="text-sm text-gray-600 mb-2">Base Price (Your Input)</div>
                              <div className="text-xl font-bold text-gray-900 mb-3">
                                ₹{selectedCategories.length > 0
                                  ? (selectedCategories[0]?.price ? parseFloat(selectedCategories[0].price).toLocaleString() : '5,000')
                                  : (formData.price ? parseFloat(formData.price).toLocaleString() : '5,000')
                                }/night
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-green-600">• Low Demand:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0
                                    ? (selectedCategories[0]?.price ? Math.round(parseFloat(selectedCategories[0].price) * 0.85).toLocaleString() : '4,250')
                                    : (formData.price ? Math.round(parseFloat(formData.price) * 0.85).toLocaleString() : '4,250')
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-blue-600">• Peak Season:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0
                                    ? (selectedCategories[0]?.price ? Math.round(parseFloat(selectedCategories[0].price) * 1.4).toLocaleString() : '7,000')
                                    : (formData.price ? Math.round(parseFloat(formData.price) * 1.4).toLocaleString() : '7,000')
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-purple-600">• Festival/Events:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0
                                    ? (selectedCategories[0]?.price ? Math.round(parseFloat(selectedCategories[0].price) * 1.6).toLocaleString() : '8,000')
                                    : (formData.price ? Math.round(parseFloat(formData.price) * 1.6).toLocaleString() : '8,000')
                                  }</span>
                                </div>
                              </div>

                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500">Potential Revenue Increase</div>
                                <div className="text-lg font-bold text-green-600">+25-40% annually</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                            <div className="text-sm">
                              <div className="font-medium text-yellow-800 mb-1">Note about Dynamic Pricing</div>
                              <div className="text-yellow-700">
                                Dynamic pricing will be available after your property is approved and goes live. You can enable/disable it anytime from your property management dashboard. Your base price above will serve as the foundation for all dynamic adjustments.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meal Pricing Summary Section - Orange Gradient */}
                      {(mealPricing.breakfast.enabled || mealPricing.lunchDinner.enabled || mealPricing.allMeals.enabled) && (
                        <div className="mt-8 p-6 bg-gradient-to-br from-orange-50/80 to-amber-50/40 border-2 border-orange-300/60 rounded-lg shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <Utensils className="h-5 w-5 text-orange-600" />
                            <h3 className="text-lg font-semibold text-orange-900">Meal Options Summary</h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {mealPricing.breakfast.enabled && (
                              <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
                                <div className="font-medium text-orange-900 mb-2">Breakfast</div>
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                  ₹{mealPricing.breakfast.pricePerPerson}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">per person per day</div>
                                {mealPricing.breakfast.description && (
                                  <div className="text-sm text-gray-700 italic">
                                    {mealPricing.breakfast.description}
                                  </div>
                                )}
                              </div>
                            )}

                            {mealPricing.lunchDinner.enabled && (
                              <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
                                <div className="font-medium text-orange-900 mb-2">Lunch/Dinner</div>
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                  ₹{mealPricing.lunchDinner.pricePerPerson}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">per person per day</div>
                                {mealPricing.lunchDinner.description && (
                                  <div className="text-sm text-gray-700 italic">
                                    {mealPricing.lunchDinner.description}
                                  </div>
                                )}
                              </div>
                            )}

                            {mealPricing.allMeals.enabled && (
                              <div className="bg-white/80 p-4 rounded-lg border border-orange-200">
                                <div className="font-medium text-orange-900 mb-2">All Meals Package</div>
                                <div className="text-2xl font-bold text-orange-600 mb-1">
                                  ₹{mealPricing.allMeals.pricePerPerson}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">per person per day</div>
                                {mealPricing.allMeals.description && (
                                  <div className="text-sm text-gray-700 italic">
                                    {mealPricing.allMeals.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 p-3 bg-orange-100/50 rounded-lg border border-orange-200">
                            <div className="text-sm text-orange-800">
                              <strong>Note:</strong> These meal prices are per person per day and will be added to the room charges during booking.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Navigation and Submit Buttons */}
                      <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                        <Button
                          type="button"
                          onClick={() => handleTabChange("details")}
                          variant="outline"
                          className="border-mediumGreen text-mediumGreen hover:bg-mediumGreen/10"
                        >
                          Previous: Details & Amenities
                        </Button>

                        <Button
                          type="button"
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-white px-8"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Updating...
                            </>
                          ) : (
                            'Update Property'
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
