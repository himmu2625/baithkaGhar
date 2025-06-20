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
  DollarSign,
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
} from "lucide-react";
import Image from "next/image";
import { STAY_TYPE_OPTIONS } from "@/lib/constants/stay-types";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RoomCategoryDetail {
  name: string;
  count: string;
}

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

interface CategoryPriceDetail {
  categoryName: string;
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
  pricing?: {
    perNight: string;
  };
}

export default function ListPropertyPage() {
  // 1. All useState hooks first
  const [activeTab, setActiveTab] = useState("basic");
  const [propertyType, setPropertyType] = useState("");
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
      propertyType: propertyType,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zipCode: formData.zipCode,
      contactNo: formData.contactNo,
      email: formData.email,
      description: formData.description,
      stayTypes: formData.stayTypes,
      bedrooms: formData.bedrooms,
      bathrooms: formData.bathrooms,
      price: formData.price,
      categorizedImages: categorizedImages.length,
      selectedCategories: selectedCategories.length
    });

    // Tab 1: Basic Info
    if (!formData.name.trim()) {
      newErrors.name = "Property Name is required.";
      console.log("❌ Property name is missing");
    }
    if (!propertyType) {
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
    if (!formData.description.trim()) {
      newErrors.description = "Description is required.";
      console.log("❌ Description is missing");
    }
    if (formData.stayTypes.length === 0) {
      newErrors.stayTypes = "Please select at least one stay type for your property.";
      console.log("❌ No stay types selected");
    }

    // Tab 2: Details & Amenities
    if (selectedCategories.length === 0) {
      if (propertyType === 'hotel' || propertyType === 'resort') {
        newErrors.selectedCategories = `Please select at least one ${propertyType === 'hotel' || propertyType === 'resort' ? 'Room Category' : 'Property Unit Type'}.`;
        console.log("❌ No room categories selected for hotel/resort");
      } else {
        if (!formData.bedrooms) {
          newErrors.bedrooms = "Number of Bedrooms is required if no specific units are selected.";
          console.log("❌ Bedrooms not specified");
        }
        if (!formData.bathrooms) {
          newErrors.bathrooms = "Number of Bathrooms is required if no specific units are selected.";
          console.log("❌ Bathrooms not specified");
        }
      }
    }
    selectedCategories.forEach(sc => {
      if (!sc.count || parseInt(sc.count, 10) <= 0) {
        const categoryLabel = currentCategoryOptions.find(opt => opt.value === sc.name)?.label || sc.name;
        newErrors[`${sc.name}_count`] = `Number of rooms for ${categoryLabel} must be greater than 0.`;
        console.log(`❌ Invalid room count for ${categoryLabel}`);
      }
    });

    if (categorizedImages.length === 0) {
      newErrors.categorizedImages = "At least one Exterior or Interior photo is required.";
      console.log("❌ No images uploaded");
    } else {
      const exteriorPhotos = categorizedImages.find(ci => ci.category === 'exterior')?.files ?? [];
      const interiorPhotos = categorizedImages.find(ci => ci.category === 'interior')?.files ?? [];
      if (exteriorPhotos.length === 0) {
        newErrors.exteriorPhotos = "At least one Exterior photo is required.";
        console.log("❌ No exterior photos");
      }
      if (interiorPhotos.length === 0) {
        newErrors.interiorPhotos = "At least one Interior photo is required.";
        console.log("❌ No interior photos");
      }
    }

    if (selectedCategories.length > 0) {
      // Make sure each category has a price
      selectedCategories.forEach(sc => {
        const catPrice = categoryPrices.find(cp => cp.categoryName === sc.name);
        const categoryLabel = currentCategoryOptions.find(opt => opt.value === sc.name)?.label || sc.name;
        
        if (!catPrice) {
          newErrors[`${sc.name}_price`] = `Price not set for ${categoryLabel}.`;
          console.log(`❌ No price set for ${categoryLabel}`);
        } else if (!catPrice.price || catPrice.price.trim() === '' || parseFloat(catPrice.price) <= 0) {
          newErrors[`${sc.name}_price_per_night`] = `Price per night for ${categoryLabel} must be a positive number.`;
          console.log(`❌ Invalid price for ${categoryLabel}:`, catPrice.price);
        }
      });
    } else {
      if (!formData.price || formData.price.trim() === '' || parseFloat(formData.price) <= 0) {
        newErrors.price = "General Price per night must be a positive number.";
        console.log("❌ Invalid general price:", formData.price);
      }
    }

    console.log("Validation errors found:", Object.keys(newErrors));
    console.log("=== END VALIDATION DEBUG ===");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
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
        propertyType,
        currentCategoryOptions
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

  let currentCategoryOptions: Array<{ value: string; label: string }> = [];
  if (propertyType === "hotel" || propertyType === "resort") {
    currentCategoryOptions = hotelRoomTypes;
  } else if (["villa", "house", "apartment"].includes(propertyType)) {
    currentCategoryOptions = residentialUnitTypes;
  }

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.name === categoryName);
      if (isSelected) {
        return prev.filter(c => c.name !== categoryName);
      } else {
        return [...prev, { name: categoryName, count: "1" }];
      }
    });
  };

  const handleCategoryRoomCountChange = (categoryName: string, count: string) => {
    setSelectedCategories(prev => 
      prev.map(c => c.name === categoryName ? { ...c, count } : c)
    );
    setCategoryPrices(prevPrices => {
      const existingPriceIndex = prevPrices.findIndex(p => p.categoryName === categoryName);
      if (existingPriceIndex > -1) {
        return prevPrices;
      } else {
        if (selectedCategories.find(sc => sc.name === categoryName)) {
           return [...prevPrices, { categoryName, price: "" }];
        }
        return prevPrices; 
      }
    });
  };

  const handleCategoryPriceChange = (categoryName: string, field: keyof Omit<CategoryPriceDetail, 'categoryName'>, value: string) => {
    setCategoryPrices(prev => 
      prev.map(cp => 
        cp.categoryName === categoryName ? { ...cp, [field]: value } : cp
      )
    );
  };

  // Handler for stay types selection
  const handleStayTypeToggle = (stayTypeId: string) => {
    setFormData(prev => ({
      ...prev,
      stayTypes: prev.stayTypes.includes(stayTypeId)
        ? prev.stayTypes.filter(id => id !== stayTypeId)
        : [...prev.stayTypes, stayTypeId]
    }));
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
                      {Object.entries(errors).map(([field, message]) => (
                        <li key={field} className="text-sm text-red-700">
                          <strong>{field}:</strong> {message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid grid-cols-3 mb-6 sm:mb-8">
                      <TabsTrigger
                        value="basic"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Basic Info
                      </TabsTrigger>
                      <TabsTrigger
                        value="details"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Details & Amenities
                      </TabsTrigger>
                      <TabsTrigger
                        value="photos"
                        className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen text-xs sm:text-sm py-1.5"
                      >
                        Photos & Pricing
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm">
                          Property Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Enter property name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="border-lightGreen focus:border-lightGreen text-sm"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contactNo" className="text-sm">
                            Contact No.
                          </Label>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-mediumGreen mr-2" />
                            <Input
                              id="contactNo"
                              name="contactNo"
                              type="tel"
                              placeholder="Enter contact number"
                              value={formData.contactNo}
                              onChange={handleInputChange}
                              className="border-lightGreen focus:border-lightGreen text-sm"
                            />
                          </div>
                          {errors.contactNo && (
                            <p className="text-sm text-red-500 mt-1">{errors.contactNo}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm">
                            Email ID
                          </Label>
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-mediumGreen mr-2" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              placeholder="Enter email address"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="border-lightGreen focus:border-lightGreen text-sm"
                            />
                          </div>
                          {errors.email && (
                            <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Property Type</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                          {propertyTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <div
                                key={type.value}
                                className={`border rounded-lg p-2 sm:p-3 text-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                                  propertyType === type.value
                                    ? "border-lightGreen bg-lightGreen/20"
                                    : "border-gray-200"
                                }`}
                                onClick={() => setPropertyType(type.value)}
                              >
                                <Icon className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-1 sm:mb-2 text-mediumGreen" />
                                <span className="text-xs sm:text-sm font-medium text-darkGreen">
                                  {type.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address" className="text-sm">
                          Address
                        </Label>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-mediumGreen mr-2" />
                          <Input
                            id="address"
                            name="address"
                            placeholder="Street address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                        </div>
                        {errors.address && (
                          <p className="text-sm text-red-500 mt-1">{errors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="state" className="text-sm">
                            State
                          </Label>
                          <Input
                            id="state"
                            name="state"
                            placeholder="State"
                            value={formData.state}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                          {errors.state && (
                            <p className="text-sm text-red-500 mt-1">{errors.state}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-sm">
                            City
                          </Label>
                          <Input
                            id="city"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                          {errors.city && (
                            <p className="text-sm text-red-500 mt-1">{errors.city}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode" className="text-sm">
                            Zip Code
                          </Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            placeholder="Zip code"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className="border-lightGreen focus:border-lightGreen text-sm"
                          />
                          {errors.zipCode && (
                            <p className="text-sm text-red-500 mt-1">{errors.zipCode}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder="Describe your property"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="min-h-[100px] sm:min-h-[120px] border-lightGreen focus:border-lightGreen text-sm"
                        />
                        {errors.description && (
                          <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={() => handleTabChange("details")}
                          className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow text-sm"
                        >
                          Next: Details & Amenities
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="details" className="space-y-4">
                      {/* Stay Types Section - Now Required */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium">
                            Stay Types <span className="text-red-500">*</span>
                          </Label>
                          <p className="text-sm text-gray-600 mb-3">
                            Select the types of stays your property is suitable for (required)
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {STAY_TYPE_OPTIONS.map((stayType) => {
                            const IconComponent = stayType.icon;
                            return (
                              <div key={stayType.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                                <Checkbox
                                  id={`stay-type-${stayType.id}`}
                                  checked={formData.stayTypes.includes(stayType.id)}
                                  onCheckedChange={() => handleStayTypeToggle(stayType.id)}
                                  className="h-4 w-4"
                                />
                                <Label 
                                  htmlFor={`stay-type-${stayType.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                >
                                  <div className="flex items-center space-x-2">
                                    {React.createElement(IconComponent, { className: "h-5 w-5 text-mediumGreen" })}
                                    <span>{stayType.label}</span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {stayType.description}
                                  </p>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                        
                        {errors.stayTypes && (
                          <p className="text-sm text-red-500">{errors.stayTypes}</p>
                        )}
                        
                        {formData.stayTypes.length === 0 && (
                          <Alert>
                            <AlertDescription>
                              <strong>Required:</strong> Please select at least one stay type to help guests find your property.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {currentCategoryOptions.length > 0 && (
                        <div className="space-y-4 mt-2 mb-6 p-4 border border-lightGreen/30 rounded-lg bg-lightGreen/5">
                          <Label className="text-md font-semibold text-darkGreen">
                            {propertyType === "hotel" || propertyType === "resort"
                              ? "Room Categories & Counts"
                              : "Property Unit Types & Counts"}
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {currentCategoryOptions.map((cat) => (
                              <div
                                key={cat.value}
                                className={`border rounded-lg p-3 text-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                                  selectedCategories.some(sc => sc.name === cat.value)
                                    ? "border-lightGreen bg-lightGreen/20 shadow-md"
                                    : "border-gray-200"
                                }`}
                                onClick={() => handleCategorySelect(cat.value)}
                              >
                                <span className="text-xs sm:text-sm font-medium text-darkGreen">
                                  {cat.label}
                                </span>
                                {selectedCategories.some(sc => sc.name === cat.value) && (
                                  <Check className="h-4 w-4 text-mediumGreen mx-auto mt-1" />
                                )}
                              </div>
                            ))}
                          </div>

                          {selectedCategories.length > 0 && <hr className="my-4 border-lightGreen/20" />} 

                          {selectedCategories.map((category) => (
                            <div key={category.name} className="mt-3 p-3 border border-lightGreen/50 rounded-md bg-white shadow-sm">
                              <Label className="text-sm text-darkGreen font-medium">
                                Number of{" "}
                                <span className="text-mediumGreen">
                                  {currentCategoryOptions.find(opt => opt.value === category.name)?.label || category.name}
                                </span>
                                (s)
                              </Label>
                              <Input
                                type="number"
                                value={category.count}
                                onChange={(e) => handleCategoryRoomCountChange(category.name, e.target.value)}
                                placeholder={`Number of ${currentCategoryOptions.find(opt => opt.value === category.name)?.label || category.name}s`}
                                className="w-full mt-1 border-lightGreen focus:border-lightGreen text-sm"
                                min="1"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {propertyType === "hotel" && (
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

                      {!(propertyType === "hotel" || propertyType === "resort") && 
                       !((["villa", "house", "apartment"].includes(propertyType)) && selectedCategories.length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="bedrooms">Bedrooms (General)</Label>
                            <div className="flex items-center">
                              <Bed className="h-5 w-5 text-mediumGreen mr-2" />
                              <Select
                                value={formData.bedrooms}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    bedrooms: value,
                                  }))
                                }
                                disabled={(["villa", "house", "apartment"].includes(propertyType)) && selectedCategories.length > 0}
                              >
                                <SelectTrigger className="border-lightGreen">
                                  <SelectValue placeholder="Select number of bedrooms" />
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
                            <Label htmlFor="bathrooms">Bathrooms (General)</Label>
                            <div className="flex items-center">
                              <Bath className="h-5 w-5 text-mediumGreen mr-2" />
                              <Select
                                value={formData.bathrooms}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    bathrooms: value,
                                  }))
                                }
                                disabled={(["villa", "house", "apartment"].includes(propertyType)) && selectedCategories.length > 0}
                              >
                                <SelectTrigger className="border-lightGreen">
                                  <SelectValue placeholder="Select number of bathrooms" />
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
                      )}

                      <div className="space-y-2">
                        <Label>Amenities</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.wifi
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("wifi")}
                          >
                            <Wifi className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              WiFi
                            </span>
                            {amenities.wifi && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.tv
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("tv")}
                          >
                            <Tv className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              TV
                            </span>
                            {amenities.tv && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.kitchen
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("kitchen")}
                          >
                            <Kitchen className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              Kitchen
                            </span>
                            {amenities.kitchen && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.parking
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("parking")}
                          >
                            <Car className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              Parking
                            </span>
                            {amenities.parking && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.ac
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("ac")}
                          >
                            <Wind className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              AC
                            </span>
                            {amenities.ac && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
                            )}
                          </div>

                          <div
                            className={`border rounded-lg p-3 flex items-center cursor-pointer transition-all hover:border-lightGreen hover:bg-lightGreen/10 ${
                              amenities.pool
                                ? "border-lightGreen bg-lightGreen/20"
                                : "border-gray-200"
                            }`}
                            onClick={() => handleAmenityToggle("pool")}
                          >
                            <Waves className="h-5 w-5 text-mediumGreen mr-2" />
                            <span className="text-sm font-medium text-darkGreen">
                              Pool
                            </span>
                            {amenities.pool && (
                              <Check className="h-4 w-4 text-mediumGreen ml-auto" />
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
                                        <Image src={image.url || "/placeholder.svg"} alt={`${photoCat.label} ${index + 1}`} fill style={{ objectFit: "cover" }} />
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
                                        <Image src={image.url || "/placeholder.svg"} alt={`${categoryLabel} ${index + 1}`} fill style={{ objectFit: "cover" }} />
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
                      </div>

                      <div className="mt-8 pt-6 border-t border-lightGreen/30">
                        <Label className="text-lg font-semibold text-darkGreen mb-4 block">Pricing</Label>

                        {selectedCategories.length > 0 && (
                          <div className="space-y-6 mb-8">
                            {selectedCategories.map(selCat => {
                              const categoryLabel = currentCategoryOptions.find(opt => opt.value === selCat.name)?.label || selCat.name;
                              const currentPrice = categoryPrices.find(p => p.categoryName === selCat.name) || { price: "" };
                              return (
                                <div key={selCat.name} className="p-4 border border-lightGreen/70 rounded-lg bg-lightGreen/5 shadow">
                                  <h3 className="text-md font-semibold text-mediumGreen mb-3">Pricing for: {categoryLabel} (x{selCat.count})</h3>
                                  <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1">
                                      <Label htmlFor={`price-${selCat.name}`} className="text-sm">Price per Night</Label>
                                      <div className="flex items-center">
                                        <DollarSign className="h-4 w-4 text-mediumGreen mr-2" />
                                        <Input
                                          id={`price-${selCat.name}`}
                                          name={`price-${selCat.name}`}
                                          type="number"
                                          placeholder="e.g., 120"
                                          value={currentPrice.price}
                                          onChange={(e) => handleCategoryPriceChange(selCat.name, 'price', e.target.value)}
                                          className="border-lightGreen focus:border-lightGreen text-sm"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {(selectedCategories.length === 0) && (
                          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                             <h3 className="text-md font-semibold text-darkGreen mb-3">General Property Pricing</h3>
                              <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="price">Price per Night</Label>
                                <div className="flex items-center">
                                  <DollarSign className="h-5 w-5 text-mediumGreen mr-2" />
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
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
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
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow"
                  disabled={isSubmitting || !!isUploading}
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