"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { ListPropertyClientWrapper } from "./client-wrapper";
import { toast } from "react-hot-toast";
import axios from "axios";
import { submitToFixedApi } from "./try-fixed-api";

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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
  Clock,
  Warehouse,
  Waves,
  Utensils,
  Video,
  Coffee,
  Thermometer,
  Refrigerator,
  Phone,
  Mail,
  BellRing,
  Beer,
  Snowflake,
  Wind,
  Droplets,
  TrendingUp,
  Plus,
  Minus,
  Info,
  AlertTriangle,
  Sparkles,
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
  // NEW FIELDS for room capacity management
  maxCapacityPerRoom?: number; // Maximum guests per room (1-20)
  freeExtraPersonLimit?: number; // Number of extra persons free (0-10)
  extraPersonCharge?: number; // Charge per extra person per night
}

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

interface CategoryPriceDetail {
  categoryName: string;
  planType: 'EP' | 'CP' | 'MAP' | 'AP';
  occupancyType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  price: string;
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

  // NEW FIELDS for enhanced property information
  aboutProperty?: string;
  checkInTime?: string;
  checkOutTime?: string;
  quietHours?: string;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  partiesAllowed?: boolean;
}

export default function ListPropertyPage() {
  // 1. All useState hooks first
  const [activeTab, setActiveTab] = useState("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);
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
  const [roomCategories, setRoomCategories] = useState({
    classic: false,
    deluxe: false,
  });
  const [numBedrooms, setNumBedrooms] = useState("");
  const [images, setImages] = useState<Array<{ url: string; public_id: string }>>([]);
  const [selectedCategories, setSelectedCategories] = useState<RoomCategoryDetail[]>([]);
  const [categorizedImages, setCategorizedImages] = useState<CategorizedImage[]>([]);
  const [categoryPrices, setCategoryPrices] = useState<CategoryPriceDetail[]>([]);
  const [stayTypes, setStayTypes] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // NEW STATE VARIABLES for enhanced property information
  const [mealPricing, setMealPricing] = useState({
    breakfast: { enabled: false, pricePerPerson: 0, description: '' },
    lunchDinner: { enabled: false, pricePerPerson: 0, description: '' },
    allMeals: { enabled: false, pricePerPerson: 0, description: '' }
  });
  const [propertyHighlights, setPropertyHighlights] = useState<string[]>([]);
  const [nearbyLocations, setNearbyLocations] = useState<Array<{ name: string; type: string; distance: string }>>([]);
  const [additionalRules, setAdditionalRules] = useState<string[]>([]);

  // 2. All other hooks (useSession, useRouter, etc.)
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // 3. All useEffect hooks
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 4. Loading state check
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    );
  }

  // 5. Authentication check
  if (status === "unauthenticated") {
    return null;
  }

  // Helper for email validation
  const isValidEmail = (email: string) => {
    // Basic email regex
    return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation errors for this field when user starts typing
    if (value.trim()) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        
        // Special handling for email validation
        if (name === 'email' && !isValidEmail(value)) {
          return newErrors; // Keep email error if format is still invalid
        }
        
        // Special handling for price validation
        if (name === 'price' && (parseFloat(value) <= 0 || isNaN(parseFloat(value)))) {
          return newErrors; // Keep price error if value is invalid
        }
        
        return newErrors;
      });
    }
  };

  const handleAmenityToggle = (amenity: keyof typeof amenities) => {
    setAmenities((prev) => ({ ...prev, [amenity]: !prev[amenity] }));
    // Also update formData.amenities array
    setFormData(prev => {
      const newAmenities = [...prev.amenities];
      if (!amenities[amenity]) {
        // If amenity is being turned on, add it to the array
        if (!newAmenities.includes(amenity)) {
          newAmenities.push(amenity);
        }
      } else {
        // If amenity is being turned off, remove it from the array
        const index = newAmenities.indexOf(amenity);
        if (index !== -1) {
          newAmenities.splice(index, 1);
        }
      }
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleRoomCategoryToggle = (category: keyof typeof roomCategories) => {
    setRoomCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleImageUpload = () => {
    // Create a file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";

    // When files are selected
    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setIsUploading('general'); // Indicate general upload is in progress

      try {
        // Process each selected file
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Create FormData for Cloudinary upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('upload_preset', 'baithaka_hotels'); // Set your Cloudinary upload preset here
          formData.append('folder', 'property_images/general'); // Explicitly set folder

          // Upload to Cloudinary
          const response = await axios.post(
            'https://api.cloudinary.com/v1_1/dkfrxlezi/image/upload', // Replace with your Cloudinary cloud name
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
        if (axios.isAxiosError(error)) {
          console.error('Cloudinary error response:', error.response?.data);
          toast.error(`Failed to upload images: ${error.response?.data?.error?.message || 'Please try again.'}`);
        } else {
          toast.error('Failed to upload images. Please try again.');
        }
      } finally {
        setIsUploading(null); // Reset uploading state
      }
    };

    // Trigger the file selection dialog
    fileInput.click();
  };

  const handleCategorizedImageUpload = (category: string) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.multiple = true;
    fileInput.accept = "image/*";

    fileInput.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) return;

      setIsUploading(category); // Set current uploading category
      const uploadedFilesForCategory: Array<{ url: string; public_id: string }> = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const cloudinaryFormData = new FormData();
          cloudinaryFormData.append('file', file);
          cloudinaryFormData.append('upload_preset', 'baithaka_hotels');
          cloudinaryFormData.append('folder', `property_images/${category}`); // Explicitly set folder based on category

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
            // Add to existing category
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
            // Add new category
            return [...prev, { category, files: uploadedFilesForCategory }];
          }
        });

        toast.success(`Images uploaded for ${category}!`);
      } catch (error) {
        console.error(`Error uploading images for ${category}:`, error);
        if (axios.isAxiosError(error)) {
          console.error(`Cloudinary error response for ${category}:`, error.response?.data);
          toast.error(`Failed to upload for ${category}: ${error.response?.data?.error?.message || 'Try again.'}`);
        } else {
          toast.error(`Failed to upload images for ${category}.`);
        }
      } finally {
        setIsUploading(null); // Reset uploading state
      }
    };
    fileInput.click();
  };

  const handleRemoveCategorizedImage = async (category: string, index: number) => {
    setIsSubmitting(true); // or a new state like setIsDeletingImage
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
        }).filter(ci => ci.files.length > 0) // Optional: remove category if no images left
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

  const handleRemoveImage = async (index: number) => {
    try {
      const imageToRemove = images[index];
      
      // If the image has a Cloudinary public_id, delete it from Cloudinary
      if (imageToRemove.public_id) {
        await axios.post('/api/cloudinary/delete', {
          public_id: imageToRemove.public_id
        });
      }
      
      // Remove from state
      setImages(images.filter((_, i) => i !== index));
      toast.success('Image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      toast.error('Failed to remove image');
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    console.log("=== FORM VALIDATION DEBUG ===");
    console.log("Current form data:", {
      name: formData.name,
      propertyType: formData.propertyType,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      contactNo: formData.contactNo,
      email: formData.email,
      description: formData.description,
      stayTypes: formData.stayTypes,
      stayTypesLength: formData.stayTypes.length,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      price: formData.price,
      categorizedImages: categorizedImages.length,
      selectedCategories: selectedCategories.length,
      categoryPrices: categoryPrices.length
    });

    // Tab 1: Basic Info - ALL REQUIRED
    if (!formData.name.trim()) {
      newErrors.name = "Property Name is required.";
      console.log("❌ Property name is missing");
    }
    if (!formData.propertyType) {
      newErrors.propertyType = "Property Type is required.";
      console.log("❌ Property type is missing");
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required.";
      console.log("❌ Address is missing");
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required.";
      console.log("❌ City is missing");
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required.";
      console.log("❌ State is missing");
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = "Zip Code is required.";
      console.log("❌ Zip code is missing");
    }
    if (!formData.contactNo.trim()) {
      newErrors.contactNo = "Contact No. is required.";
      console.log("❌ Contact number is missing");
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email ID is required.";
      console.log("❌ Email is missing");
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Invalid Email ID format.";
      console.log("❌ Email format is invalid:", formData.email);
    }
    
    // Optional hotel email validation - only validate if provided
    if (formData.hotelEmail && formData.hotelEmail.trim() && !isValidEmail(formData.hotelEmail)) {
      newErrors.hotelEmail = "Invalid Hotel Email format.";
      console.log("❌ Hotel email format is invalid:", formData.hotelEmail);
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
      console.log("❌ Description is missing");
    }

    // Tab 2: Details & Amenities - STAY TYPE REQUIRED
    if (!formData.stayTypes || formData.stayTypes.length === 0) {
      newErrors.stayTypes = "Please select at least one stay type for your property.";
      console.log("❌ No stay types selected, current stayTypes:", formData.stayTypes);
    } else {
      console.log("✅ Stay types selected:", formData.stayTypes);
    }

    // Category validation based on property type
    if (formData.propertyType === 'hotel' || formData.propertyType === 'resort') {
      // For hotels/resorts, categories are required
      if (selectedCategories.length === 0) {
        newErrors.selectedCategories = `Please select at least one room category for your ${formData.propertyType}.`;
        console.log("❌ No room categories selected for hotel/resort");
      } else {
        console.log("✅ Room categories selected for hotel/resort:", selectedCategories);
      }
    } else {
      // For other property types, either categories OR bedrooms/bathrooms are required
      if (selectedCategories.length === 0) {
        if (!formData.bedrooms) {
          newErrors.bedrooms = "Number of Bedrooms is required (or select specific unit types above).";
          console.log("❌ Bedrooms not specified");
        }
        if (!formData.bathrooms) {
          newErrors.bathrooms = "Number of Bathrooms is required (or select specific unit types above).";
          console.log("❌ Bathrooms not specified");
        }
      }
    }

    // Validate room counts for selected categories
    selectedCategories.forEach(sc => {
      if (!sc.count || parseInt(sc.count, 10) <= 0) {
        const categoryLabel = currentCategoryOptions.find(opt => opt.value === sc.name)?.label || sc.name;
        newErrors[`${sc.name}_count`] = `Number of rooms for ${categoryLabel} must be greater than 0.`;
        console.log(`❌ Invalid room count for ${categoryLabel}`);
      }
    });

    // Tab 3: Photos & Pricing - EXTERIOR & INTERIOR REQUIRED, PRICING REQUIRED

    // Photo validation - check for exterior and interior specifically
    const exteriorPhotos = categorizedImages.find(ci => ci.category === 'exterior')?.files ?? [];
    const interiorPhotos = categorizedImages.find(ci => ci.category === 'interior')?.files ?? [];
    
    console.log("Photo validation:", {
      exteriorPhotos: exteriorPhotos.length,
      interiorPhotos: interiorPhotos.length,
      totalCategorizedImages: categorizedImages.length
    });

    if (exteriorPhotos.length === 0) {
      newErrors.exteriorPhotos = "At least one Exterior photo is required.";
      console.log("❌ No exterior photos");
    }
    if (interiorPhotos.length === 0) {
      newErrors.interiorPhotos = "At least one Interior photo is required.";
      console.log("❌ No interior photos");
    }

    // Pricing validation
    if (selectedCategories.length > 0) {
      // Validate pricing for hotels/resorts
      if (formData.propertyType === "hotel" || formData.propertyType === "resort") {
        // Validate category-based pricing
        selectedCategories.forEach(sc => {
          const categoryLabel = currentCategoryOptions.find((opt: any) => opt.value === sc.name)?.label || sc.name;

          const priceEntry = categoryPrices.find(cp => cp.categoryName === sc.name);

          if (!priceEntry || !priceEntry.price || priceEntry.price.trim() === '' || parseFloat(priceEntry.price) <= 0) {
            newErrors[`${sc.name}_price`] = `Price required for ${categoryLabel}`;
            console.log(`❌ Missing/invalid price for ${categoryLabel}`);
          } else {
            console.log(`✅ Valid price for ${categoryLabel}:`, priceEntry.price);
          }
        });
      }
    } else {
      // General pricing validation for non-categorized properties
      if (!formData.price || formData.price.trim() === '' || parseFloat(formData.price) <= 0) {
        newErrors.price = "General Price per night must be a positive number.";
        console.log("❌ Invalid general price:", formData.price);
      }
    }

    console.log("Validation errors found:", Object.keys(newErrors));
    console.log("Errors detail:", newErrors);
    console.log("=== END VALIDATION DEBUG ===");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("=== FORM SUBMISSION ATTEMPT ===");
    console.log("Form data at submission:", formData);
    console.log("Selected categories:", selectedCategories);
    console.log("Category prices:", categoryPrices);
    console.log("Categorized images:", categorizedImages);
    
    const isValid = validateForm();
    console.log("Form validation result:", isValid);
    
    if (!isValid) {
      toast.error('Please fix the errors in the form');
      console.log("Validation failed, aborting submission");
      return;
    }

    if (!session) {
      toast.error("Please log in to submit a property");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the fixed API implementation directly
      toast("Submitting your property...");
      // Use fixed API implementation to submit the property
      const result = await submitToFixedApi(
        formData,
        amenities,
        selectedCategories,
        categoryPrices,
        categorizedImages,
        images,
        formData.propertyType,
        currentCategoryOptions,
        mealPricing,
        propertyHighlights,
        nearbyLocations,
        additionalRules
      );
      
      // After successful submission, update user profile completion status
      try {
        console.log("Property saved successfully. Now updating profile status...");
        
        // Manual update of profileComplete status to prevent redirection
        const profileResponse = await fetch('/api/user/profile/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (profileResponse.ok) {
          console.log("Profile completion response OK");
        } else {
          console.error("Profile completion API returned error:", await profileResponse.text());
        }
      } catch (profileError) {
        console.error("Error updating profile status:", profileError);
        // Continue even if this fails
      }
      
      toast.success("Property listed successfully!");
      
      // Store property submission success flag in storage
      sessionStorage.setItem('propertySubmitted', 'true');
      
      // Redirect without triggering a full page reload or session changes
      router.push('/admin/properties');
      
    } catch (error) {
      console.error("Error submitting property:", error);
      
      // Parse error message to provide specific feedback
      let errorMessage = "Failed to submit property. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("Validation failed")) {
          errorMessage = "Validation failed. Please ensure all required fields are filled correctly and you have selected at least one stay type.";
        } else if (error.message.includes("stayTypes")) {
          errorMessage = "Please select at least one valid stay type for your property.";
        } else if (error.message.includes("property type")) {
          errorMessage = "Please select a valid property type.";
        } else if (error.message.includes("pricing")) {
          errorMessage = "Please provide valid pricing information.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced helper function for session reloading
  const refreshSession = async () => {
    try {
      console.log("Starting advanced session refresh procedure...");
      
      // Method 1: Visibility change event
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
      console.log("Visibility change event dispatched");
      
      // Method 2: Direct getSession call
      const beforeSession = await getSession();
      console.log("Before refresh - profileComplete:", beforeSession?.user?.profileComplete);
      
      // Method 3: Call force-update endpoint
      try {
        const forceResponse = await fetch('/api/auth/session/force-update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          credentials: 'include',
          cache: 'no-store'
        });
        
        if (forceResponse.ok) {
          console.log("Force session update successful");
        } else {
          console.error("Force session update failed:", await forceResponse.text());
        }
      } catch (forceError) {
        console.error("Error calling force-update:", forceError);
      }
      
      // Method 4: Force reload by signing in again with the same session
      if (beforeSession?.user?.email) {
        // This is an aggressive approach but can work in some cases
        try {
          // We're not actually signing out/in but triggering the auth flow to refresh
          await signOut({ redirect: false });
          await signIn('credentials', { 
            redirect: false,
            email: beforeSession.user.email,
            callbackUrl: '/admin/properties'
          });
          console.log("Auth flow triggered for session refresh");
        } catch (authError) {
          console.error("Auth refresh error:", authError);
        }
      }
      
      // Method 5: Advanced cookie manipulation via browser APIs
      try {
        // Try to "touch" the cookie to force renewal
        document.cookie = document.cookie;
        console.log("Browser cookies touched");
      } catch (cookieError) {
        console.error("Cookie manipulation error:", cookieError);
      }
      
      // Final check
      const afterSession = await getSession();
      console.log("After refresh - profileComplete:", afterSession?.user?.profileComplete);
      
      return true;
    } catch (e) {
      console.error("Session refresh error:", e);
      return false;
    }
  };

  const propertyTypes = [
    { value: "apartment", label: "Apartment", icon: Building },
    { value: "house", label: "House", icon: Home },
    { value: "hotel", label: "Hotel", icon: Hotel },
    { value: "villa", label: "Villa", icon: Home },
    { value: "resort", label: "Resort", icon: Hotel },
  ];

  // Use ALL_ROOM_CATEGORIES for all property types (no restrictions)
  const currentCategoryOptions = ALL_ROOM_CATEGORIES;

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.name === categoryName);
      if (isSelected) {
        // Remove category and its prices (all plan-based combinations)
        setCategoryPrices(prevPrices => prevPrices.filter(p => p.categoryName !== categoryName));
        return prev.filter(c => c.name !== categoryName);
      } else {
        // Add category (prices will be added when user fills them in)
        return [...prev, { name: categoryName, count: "1" }];
      }
    });

    // Clear errors related to categories when user selects one
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.selectedCategories;
      delete newErrors[`${categoryName}_count`];

      // Clear pricing error for this category
      delete newErrors[`${categoryName}_price`];

      return newErrors;
    });
  };

  // Handler for adding new room categories to database
  const handleAddNewCategory = async (label: string): Promise<{ value: string; label: string; description?: string; category?: string } | null> => {
    try {
      console.log('Adding new category:', label);

      const response = await fetch('/api/room-categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          label,
          description: `${label} accommodation`,
          category: 'specialty', // Default category type
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success && data.category) {
        // Show success message
        alert(`Successfully added "${data.category.label}" to room categories!`);

        // Return the new category option
        return {
          value: data.category.value,
          label: data.category.label,
          description: data.category.description,
          category: data.category.category,
        };
      } else {
        // Show detailed error message
        let errorMsg = data.error || 'Failed to add category. Please try again.';

        // Special handling for duplicate categories
        if (data.existingLabel) {
          errorMsg = `Category already exists as "${data.existingLabel}"`;
        } else if (data.details) {
          errorMsg = `${data.error}: ${data.details}`;
        }

        console.error('Failed to add category:', errorMsg);
        alert(errorMsg);
        return null;
      }
    } catch (error: any) {
      console.error('Error adding new category:', error);
      alert(`Network error: ${error?.message || 'Failed to connect to server. Please try again.'}`);
      return null;
    }
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

    // Clear count-related errors when user enters a valid count
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

  const handleCategoryPriceChange = (
    categoryName: string,
    planType: 'EP' | 'CP' | 'MAP' | 'AP',
    occupancyType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD',
    value: string
  ) => {
    setCategoryPrices(prev => {
      // Find existing price entry for this combination
      const existingIndex = prev.findIndex(cp =>
        cp.categoryName === categoryName &&
        cp.planType === planType &&
        cp.occupancyType === occupancyType
      );

      if (existingIndex > -1) {
        // Update existing entry
        return prev.map((cp, idx) =>
          idx === existingIndex ? { ...cp, price: value } : cp
        );
      } else {
        // Add new entry
        return [...prev, { categoryName, planType, occupancyType, price: value }];
      }
    });

    // Clear price-related errors when user enters a valid price
    if (value && parseFloat(value) > 0) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`${categoryName}_${planType}_${occupancyType}_price`];
        return newErrors;
      });
    }
  };

  // Handler for stay types selection
  const handleStayTypeToggle = (stayTypeId: string) => {
    setFormData(prev => {
      const newStayTypes = prev.stayTypes.includes(stayTypeId)
        ? prev.stayTypes.filter(id => id !== stayTypeId)
        : [...prev.stayTypes, stayTypeId];
      
      console.log("Stay type toggled:", stayTypeId, "New stay types:", newStayTypes);
      
      return {
        ...prev,
        stayTypes: newStayTypes
      };
    });
    
    // Clear stay type error when user selects at least one
    setTimeout(() => {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (formData.stayTypes.length > 0) {
          delete newErrors.stayTypes;
          console.log("Cleared stay type error");
        }
        return newErrors;
      });
    }, 100); // Small delay to ensure state is updated
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Enhanced tab change handler with scroll to top
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    scrollToTop();
  };

  return (
    <ListPropertyClientWrapper>
      <main className="pt-24 pb-16">
        {navigationError ? (
          <div className="container mx-auto px-4 py-16">
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
              role="alert"
            >
              <strong className="font-bold">Navigation Error: </strong>
              <span className="block sm:inline">{navigationError}</span>
              <div className="mt-4">
                <Button
                  onClick={() => (window.location.href = "/")}
                  className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow mr-2"
                >
                  Go to Home Page
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="border-lightGreen text-darkGreen"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        ) : isPageLoading ? (
          <div className="container mx-auto px-4 py-16 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-12 w-12 border-4 border-lightGreen border-t-transparent rounded-full animate-spin"></div>
              <p className="text-mediumGreen mt-4">
                Loading property listing page...
              </p>
            </div>
          </div>
        ) : (
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-darkGreen mb-2">
                  List Your Property
                </h1>
                <p className="text-mediumGreen">
                  Share your space and start earning
                </p>
              </div>

              <Card className="w-full max-w-4xl mx-auto bg-white shadow-lg border-lightGreen">
                <CardHeader className="pb-4">
                  <h1 className="text-2xl font-bold text-darkGreen">Property Details</h1>
                  <p className="text-gray-600">Fill in the details about your property</p>
                </CardHeader>

                {/* Validation Error Summary */}
                {Object.keys(errors).length > 0 && (
                  <div className="mx-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      ❌ Please fix the following errors:
                    </h3>
                    <ul className="list-disc list-inside space-y-1">
                      {Object.entries(errors).map(([field, message]) => {
                        // Make field names more user-friendly
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

                    <TabsContent value="basic" className="space-y-6">
                      {/* Basic Information Section - Indigo Gradient */}
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

                      {/* Property Type Section - Teal Gradient */}
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
                                  // Clear selected categories and prices when property type changes
                                  setSelectedCategories([]);
                                  setCategoryPrices([]);
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

                      {/* Basic Info Validation Summary */}
                      <div className="mt-6 p-3 bg-gray-50 rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Required for Basic Info:</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className={`flex items-center ${formData.name ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.name ? '✓' : '✗'} Property Name
                          </div>
                          <div className={`flex items-center ${formData.propertyType ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.propertyType ? '✓' : '✗'} Property Type
                          </div>
                          <div className={`flex items-center ${formData.address ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.address ? '✓' : '✗'} Address
                          </div>
                          <div className={`flex items-center ${formData.city ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.city ? '✓' : '✗'} City
                          </div>
                          <div className={`flex items-center ${formData.state ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.state ? '✓' : '✗'} State
                          </div>
                          <div className={`flex items-center ${formData.zipCode ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.zipCode ? '✓' : '✗'} Zip Code
                          </div>
                          <div className={`flex items-center ${formData.contactNo ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.contactNo ? '✓' : '✗'} Contact Number
                          </div>
                          <div className={`flex items-center ${formData.email && isValidEmail(formData.email) ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.email && isValidEmail(formData.email) ? '✓' : '✗'} Valid Email
                          </div>
                          <div className={`flex items-center ${!formData.hotelEmail || (formData.hotelEmail && isValidEmail(formData.hotelEmail)) ? 'text-green-600' : 'text-red-600'}`}>
                            {!formData.hotelEmail || (formData.hotelEmail && isValidEmail(formData.hotelEmail)) ? '✓' : '✗'} Hotel Email (Optional)
                          </div>
                          <div className={`flex items-center ${formData.description ? 'text-green-600' : 'text-red-600'}`}>
                            {formData.description ? '✓' : '✗'} Description
                          </div>
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
                            <div>Category Prices: {categoryPrices.length}</div>
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
                              const priceEntry = categoryPrices.find(p => p.categoryName === selCat.name);

                              return (
                                <div key={selCat.name} className="p-6 border-2 border-lightGreen/70 rounded-lg bg-gradient-to-br from-lightGreen/5 to-white shadow-lg">
                                  <h3 className="text-lg font-bold text-mediumGreen mb-4 flex items-center gap-2">
                                    <Bed className="h-5 w-5" />
                                    {categoryLabel} (x{selCat.count})
                                  </h3>

                                  {/* Simple category-based pricing */}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">
                                      Price per Night
                                    </Label>
                                    <div className="flex items-center">
                                      <IndianRupee className="h-4 w-4 text-mediumGreen mr-1 flex-shrink-0" />
                                      <Input
                                        type="number"
                                        placeholder="Price per night"
                                        value={priceEntry?.price || ''}
                                        onChange={(e) => handleCategoryPriceChange(
                                          selCat.name,
                                          undefined,
                                          undefined,
                                          e.target.value
                                        )}
                                        className="border-gray-300 focus:border-lightGreen text-sm"
                                      />
                                    </div>
                                    {errors[`${selCat.name}_price`] && (
                                      <p className="text-xs text-red-500 mt-1">
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
                                  ? (categoryPrices[0]?.price ? parseFloat(categoryPrices[0].price).toLocaleString() : '5,000')
                                  : (formData.price ? parseFloat(formData.price).toLocaleString() : '5,000')
                                }/night
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-green-600">• Low Demand:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0 
                                    ? (categoryPrices[0]?.price ? Math.round(parseFloat(categoryPrices[0].price) * 0.85).toLocaleString() : '4,250')
                                    : (formData.price ? Math.round(parseFloat(formData.price) * 0.85).toLocaleString() : '4,250')
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-blue-600">• Peak Season:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0 
                                    ? (categoryPrices[0]?.price ? Math.round(parseFloat(categoryPrices[0].price) * 1.4).toLocaleString() : '7,000')
                                    : (formData.price ? Math.round(parseFloat(formData.price) * 1.4).toLocaleString() : '7,000')
                                  }</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-purple-600">• Festival/Events:</span>
                                  <span className="font-medium">₹{selectedCategories.length > 0 
                                    ? (categoryPrices[0]?.price ? Math.round(parseFloat(categoryPrices[0].price) * 1.6).toLocaleString() : '8,000')
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
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>

            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => handleTabChange("details")}
                className="border-lightGreen text-darkGreen"
              >
                Back
              </Button>
              <div className="flex flex-col gap-2">
                {Object.keys(errors).length > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Cannot submit:</strong> {Object.keys(errors).length} error(s) found
                  </div>
                )}
                <Button
                  onClick={handleSubmit}
                  className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow disabled:opacity-50"
                  disabled={isSubmitting || !!isUploading || Object.keys(errors).length > 0}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      Submitting...
                    </span>
                  ) : (
                    "Submit Property"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ListPropertyClientWrapper>
  );
}