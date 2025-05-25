"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { MapPin, Calendar, Users, Info, CreditCard, ArrowRight, Edit2, Shield, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { getValidImageUrl } from "@/lib/utils/image-utils"

export default function BookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // --- New Log: Log all received search parameters at the start --- 
  useEffect(() => {
    if (searchParams) {
      const paramsObject: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        paramsObject[key] = value;
      });
      console.log("[BookingPage] Loaded with searchParams:", paramsObject);
    } else {
      console.log("[BookingPage] Loaded with no searchParams.");
    }
  }, [searchParams]);
  // --- End New Log ---
  
  const propertyId = searchParams?.get("propertyId") || ""
  const checkInStr = searchParams?.get("checkIn") || ""
  const checkOutStr = searchParams?.get("checkOut") || ""
  const guestsStr = searchParams?.get("guests") || "1"
  const roomsStr = searchParams?.get("rooms") || "1"
  const categoryStr = searchParams?.get("category") || "";
  const priceStr = searchParams?.get("price") || "0";
  const propertyNameStr = searchParams?.get("propertyName") || "";
  
  console.log("[BookingPage] CRITICAL DEBUG - Current URL and params:");
  console.log("[BookingPage] Current URL:", window.location.href);
  console.log("[BookingPage] propertyId:", propertyId);
  console.log("[BookingPage] checkInStr:", checkInStr);
  console.log("[BookingPage] checkOutStr:", checkOutStr);
  console.log("[BookingPage] All search params:", Object.fromEntries(searchParams?.entries() || []));
  
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  
  console.log("[BookingPage] Initial Params: propertyId:", propertyId, "checkInStr:", checkInStr, "checkOutStr:", checkOutStr, "guestsStr:", guestsStr, "roomsStr:", roomsStr, "categoryStr:", categoryStr, "priceStr:", priceStr, "propertyNameStr:", propertyNameStr);
  
  // Parse dates with validation
  const checkIn = checkInStr ? new Date(checkInStr) : null
  const checkOut = checkOutStr ? new Date(checkOutStr) : null
  
  // Validate dates are not Invalid Date objects
  const isValidCheckIn = checkIn && !isNaN(checkIn.getTime())
  const isValidCheckOut = checkOut && !isNaN(checkOut.getTime())
  
  const guests = parseInt(guestsStr) || 1
  const rooms = parseInt(roomsStr) || 1
  const selectedCategory = categoryStr;
  
  // Parse and validate price with proper fallbacks
  const parsedPriceFromUrl = parseFloat(priceStr)
  const pricePerNight = !isNaN(parsedPriceFromUrl) && parsedPriceFromUrl > 0 ? parsedPriceFromUrl : 0
  
  // Function to calculate pricing with proper validation
  const calculatePricing = () => {
    console.log("[BookingPage] calculatePricing - START");
    console.log("[BookingPage] calculatePricing - Input data:", {
      isValidCheckIn,
      isValidCheckOut,
      checkIn,
      checkOut,
      guests,
      rooms,
      pricePerNight,
      property: property ? { title: property.title, price: property.price } : null
    });
    
    // If property hasn't loaded yet, return safe defaults
    if (!property) {
      console.log("[BookingPage] calculatePricing - Property not loaded yet, returning safe defaults");
      return {
        nights: 1,
        basePrice: 1500,
        baseRoomTotal: 1500,
        extraGuests: 0,
        extraGuestCharge: 0,
        totalPrice: 1500,
        taxes: 180,
        finalTotal: 1680,
        isValid: false
      };
    }
    
    // Calculate stay duration with validation
    const nights = (isValidCheckIn && isValidCheckOut) ? Math.max(1, differenceInDays(checkOut!, checkIn!)) : 1
    console.log("[BookingPage] calculatePricing - nights:", nights);
    
    // Get base price with multiple fallbacks and validation
    let basePrice = 0
    if (pricePerNight > 0) {
      basePrice = pricePerNight
      console.log("[BookingPage] calculatePricing - Using pricePerNight:", basePrice);
    } else if (property?.price?.base && !isNaN(property.price.base)) {
      basePrice = parseFloat(property.price.base.toString())
      console.log("[BookingPage] calculatePricing - Using property.price.base:", basePrice);
    } else if (property?.pricing?.perNight && !isNaN(parseFloat(property.pricing.perNight))) {
      basePrice = parseFloat(property.pricing.perNight)
      console.log("[BookingPage] calculatePricing - Using property.pricing.perNight:", basePrice);
    } else if (property?.price && typeof property.price === 'number' && !isNaN(property.price)) {
      basePrice = property.price
      console.log("[BookingPage] calculatePricing - Using property.price:", basePrice);
    } else if (property?.propertyUnits && property.propertyUnits.length > 0) {
      // Try to get price from first property unit
      const firstUnit = property.propertyUnits[0]
      if (firstUnit?.pricing?.price && !isNaN(parseFloat(firstUnit.pricing.price))) {
        basePrice = parseFloat(firstUnit.pricing.price)
        console.log("[BookingPage] calculatePricing - Using propertyUnits price:", basePrice);
      }
    } else {
      console.warn("[BookingPage] No valid price found in property data, using default")
      basePrice = 1500 // Default fallback price
      console.log("[BookingPage] calculatePricing - Using default price:", basePrice);
    }
    
    // Ensure basePrice is a valid positive number
    basePrice = Math.max(0, basePrice) || 1500
    console.log("[BookingPage] calculatePricing - Final basePrice:", basePrice);
    
    // Calculate base room price with validation
    const baseRoomTotal = (basePrice * nights * rooms) || 0
    console.log("[BookingPage] calculatePricing - baseRoomTotal calculation:", { basePrice, nights, rooms, result: baseRoomTotal });
    
    // Calculate extra guest charge with validation
    const baseGuestCapacity = rooms * 2; // 2 guests per room baseline
    const extraGuests = Math.max(0, guests - baseGuestCapacity);
    const extraGuestCharge = (extraGuests * 1000 * nights) || 0;
    console.log("[BookingPage] calculatePricing - extra guest calculation:", { 
      baseGuestCapacity, 
      extraGuests, 
      calculation: extraGuests * 1000 * nights,
      result: extraGuestCharge 
    });
    
    // Total before taxes with validation
    const totalPrice = baseRoomTotal + extraGuestCharge
    console.log("[BookingPage] calculatePricing - totalPrice calculation:", { baseRoomTotal, extraGuestCharge, result: totalPrice });
    
    const taxRate = 0.12 // 12% tax
    const taxes = (totalPrice * taxRate) || 0
    console.log("[BookingPage] calculatePricing - taxes calculation:", { totalPrice, taxRate, result: taxes });
    
    const finalTotal = totalPrice + taxes
    console.log("[BookingPage] calculatePricing - finalTotal calculation:", { totalPrice, taxes, result: finalTotal });
    
    // Check for any NaN values and replace with safe defaults
    const safeNights = isNaN(nights) ? 1 : nights;
    const safeBasePrice = isNaN(basePrice) ? 1500 : basePrice;
    const safeBaseRoomTotal = isNaN(baseRoomTotal) ? safeBasePrice * safeNights * rooms : baseRoomTotal;
    const safeExtraGuests = isNaN(extraGuests) ? 0 : extraGuests;
    const safeExtraGuestCharge = isNaN(extraGuestCharge) ? 0 : extraGuestCharge;
    const safeTotalPrice = isNaN(totalPrice) ? safeBaseRoomTotal + safeExtraGuestCharge : totalPrice;
    const safeTaxes = isNaN(taxes) ? safeTotalPrice * 0.12 : taxes;
    const safeFinalTotal = isNaN(finalTotal) ? safeTotalPrice + safeTaxes : finalTotal;
    
    console.log("[BookingPage] calculatePricing - Safety checks:", {
      original: { nights, basePrice, baseRoomTotal, extraGuests, extraGuestCharge, totalPrice, taxes, finalTotal },
      safe: { safeNights, safeBasePrice, safeBaseRoomTotal, safeExtraGuests, safeExtraGuestCharge, safeTotalPrice, safeTaxes, safeFinalTotal }
    });
    
    // Ensure all values are valid numbers
    const result = {
      nights: safeNights,
      basePrice: safeBasePrice,
      baseRoomTotal: safeBaseRoomTotal,
      extraGuests: safeExtraGuests,
      extraGuestCharge: safeExtraGuestCharge,
      totalPrice: safeTotalPrice,
      taxes: safeTaxes,
      finalTotal: safeFinalTotal,
      isValid: !isNaN(safeFinalTotal) && safeFinalTotal > 0
    };
    
    console.log("[BookingPage] calculatePricing - FINAL RESULT:", result);
    return result;
  }
  
  // Get pricing calculations
  const pricing = calculatePricing()
  const { nights, basePrice, baseRoomTotal, extraGuests, extraGuestCharge, totalPrice, taxes, finalTotal } = pricing
  
  // Debug logging for price calculations
  console.log("[BookingPage] Price Calculation Debug:", {
    priceStr,
    parsedPriceFromUrl,
    pricePerNight,
    propertyPrice: property?.price,
    propertyPricing: property?.pricing,
    basePrice,
    guests,
    rooms,
    nights,
    baseRoomTotal,
    extraGuests,
    extraGuestCharge,
    totalPrice,
    taxes,
    finalTotal,
    isValidFinalTotal: pricing.isValid,
    isValidCheckIn,
    isValidCheckOut
  })
  
  useEffect(() => {
    console.log("[BookingPage] Main useEffect triggered. propertyId:", propertyId);
    console.log("[BookingPage] Main useEffect - checkInStr:", checkInStr, "checkOutStr:", checkOutStr);
    console.log("[BookingPage] Main useEffect - status:", status, "session:", session);
    
    // Redirect if no property ID
    if (!propertyId) {
      console.log("[BookingPage] ❌ REDIRECT REASON: No propertyId found. Redirecting to homepage.");
      toast({
        title: "Missing property information",
        description: "Please select a property first.",
        variant: "destructive"
      })
      router.push("/")
      return
    }
    
    // Check for date validity
    if (!isValidCheckIn || !isValidCheckOut || (isValidCheckIn && isValidCheckOut && checkIn! >= checkOut!)) {
      console.log("[BookingPage] ❌ REDIRECT REASON: Invalid dates. checkIn:", checkIn, "checkOut:", checkOut, "isValidCheckIn:", isValidCheckIn, "isValidCheckOut:", isValidCheckOut);
      console.log("[BookingPage] Redirecting to property page for propertyId:", propertyId);
      toast({
        title: "Invalid dates",
        description: "Please select valid check-in and check-out dates.",
        variant: "destructive"
      })
      router.push(`/property/${propertyId}`)
      return
    }
    
    console.log("[BookingPage] ✅ Initial validation passed. Proceeding to fetch property details.");
    
    // Load property details
    const fetchPropertyDetails = async () => {
      console.log("[BookingPage] fetchPropertyDetails called for propertyId:", propertyId);
      try {
        const response = await fetch(`/api/properties/${propertyId}`)
        console.log("[BookingPage] Property API response status:", response.status);
        
        if (!response.ok) {
          console.error("[BookingPage] ❌ REDIRECT REASON: Failed to fetch property details, status:", response.status);
          throw new Error("Failed to fetch property details")
        }
        
        const data = await response.json()
        console.log("[BookingPage] Property API response data:", data);
        
        if (data.success && data.property) {
          console.log("[BookingPage] ✅ Property details fetched successfully:", data.property.title || "Unknown property");
          setProperty(data.property)
        } else {
          console.error("[BookingPage] ❌ REDIRECT REASON: Property not found in API response or success false. Data:", data);
          throw new Error("Property not found")
        }
      } catch (error) {
        console.error("[BookingPage] ❌ REDIRECT REASON: Error fetching property:", error);
        toast({
          title: "Error",
          description: "Could not load property details. Please try again.",
          variant: "destructive"
        })
        router.push("/") // Fallback redirect to home
      } finally {
        console.log("[BookingPage] Setting loading to false");
        setLoading(false)
      }
    }
    
    fetchPropertyDetails()
    
    // Pre-fill user details if available from session
    if (session?.user) {
      console.log("[BookingPage] User session found, pre-filling details.", session.user);
      setBookingDetails(prev => ({
        ...prev,
        name: session.user.name || prev.name,
        email: session.user.email || prev.email,
      }))
    }
  }, [propertyId, checkInStr, checkOutStr, router, toast, session]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setBookingDetails(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  // Handle booking submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[BookingPage] handleBookingSubmit triggered.");
    console.log("[BookingPage] Session status:", status, "Session data:", session);
    
    // Check if user is logged in with more robust checking
    if (status === "loading") {
      console.log("[BookingPage] Session still loading, please wait...");
      toast({
        title: "Please wait",
        description: "Loading your session...",
        variant: "default"
      });
      return;
    }
    
    if (status !== "authenticated" || !session?.user) {
      console.log("[BookingPage] User not authenticated. Status:", status, "Session:", !!session);
      const returnUrl = `/booking?propertyId=${propertyId}&checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guestsStr}`;
      router.push(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    console.log("[BookingPage] ✅ User is authenticated, proceeding with booking submission.");
    
    // Validate form
    if (!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone) {
      console.log("[BookingPage] Booking form validation failed: Missing required fields.", bookingDetails);
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    
    setBookingLoading(true)
    
    try {
      // Comprehensive validation before creating booking
      if (!isValidCheckIn || !isValidCheckOut) {
        throw new Error("Invalid check-in or check-out dates. Please refresh the page and try again.");
      }
      
      if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
        throw new Error("Invalid base price. Please refresh the page and try again.");
      }
      
      if (!finalTotal || isNaN(finalTotal) || finalTotal <= 0) {
        throw new Error("Invalid total price calculation. Please refresh the page and try again.");
      }
      
      if (!nights || isNaN(nights) || nights <= 0) {
        throw new Error("Invalid stay duration. Please refresh the page and try again.");
      }
      
      if (!guests || isNaN(guests) || guests <= 0) {
        throw new Error("Invalid guest count. Please refresh the page and try again.");
      }
      
      if (!rooms || isNaN(rooms) || rooms <= 0) {
        throw new Error("Invalid room count. Please refresh the page and try again.");
      }
      
      // Ensure we have valid numbers for all pricing components
      const validatedBasePrice = Number(basePrice);
      const validatedFinalTotal = Number(finalTotal);
      const validatedNights = Number(nights);
      const validatedGuests = Number(guests);
      const validatedRooms = Number(rooms);
      
      console.log("[BookingPage] Pre-API validation - Raw values:", {
        basePrice, finalTotal, nights, guests, rooms
      });
      
      console.log("[BookingPage] Pre-API validation - Validated values:", {
        validatedBasePrice, validatedFinalTotal, validatedNights, validatedGuests, validatedRooms
      });
      
      console.log("[BookingPage] Pre-API validation - NaN checks:", {
        basePrice_isNaN: isNaN(validatedBasePrice),
        finalTotal_isNaN: isNaN(validatedFinalTotal),
        nights_isNaN: isNaN(validatedNights),
        guests_isNaN: isNaN(validatedGuests),
        rooms_isNaN: isNaN(validatedRooms)
      });
      
      if (isNaN(validatedBasePrice) || isNaN(validatedFinalTotal) || isNaN(validatedNights) || isNaN(validatedGuests) || isNaN(validatedRooms)) {
        throw new Error("Critical validation error: One or more values is NaN. Please refresh the page and try again.");
      }
      
      // Final safety check - if any value is still NaN, replace with safe defaults
      const safeBasePrice = isNaN(validatedBasePrice) ? 1500 : validatedBasePrice;
      const safeFinalTotal = isNaN(validatedFinalTotal) ? 1680 : validatedFinalTotal;
      const safeNights = isNaN(validatedNights) ? 1 : validatedNights;
      const safeGuests = isNaN(validatedGuests) ? 1 : validatedGuests;
      const safeRooms = isNaN(validatedRooms) ? 1 : validatedRooms;
      
      const bookingData = {
        propertyId,
        propertyName: property?.title || propertyNameStr || "Property",
        dateFrom: checkIn?.toISOString(),
        dateTo: checkOut?.toISOString(),
        guests: safeGuests,
        rooms: safeRooms,
        nights: safeNights,
        pricePerNight: Math.round(safeBasePrice * 100) / 100, // Round to 2 decimal places
        totalPrice: Math.round(safeFinalTotal * 100) / 100, // Round to 2 decimal places
        contactDetails: {
          name: bookingDetails.name,
          email: bookingDetails.email,
          phone: bookingDetails.phone
        },
        specialRequests: bookingDetails.specialRequests,
      }
      
      console.log("[BookingPage] Final booking data to be sent to API:", bookingData);
      
      // ABSOLUTE FINAL CHECK - Scan every property for NaN and replace with safe defaults
      const finalBookingData = {
        propertyId: bookingData.propertyId || "",
        propertyName: bookingData.propertyName || "Property",
        dateFrom: bookingData.dateFrom,
        dateTo: bookingData.dateTo,
        guests: isNaN(bookingData.guests) ? 1 : bookingData.guests,
        rooms: isNaN(bookingData.rooms) ? 1 : bookingData.rooms,
        nights: isNaN(bookingData.nights) ? 1 : bookingData.nights,
        pricePerNight: isNaN(bookingData.pricePerNight) ? 1500 : bookingData.pricePerNight,
        totalPrice: isNaN(bookingData.totalPrice) ? 1680 : bookingData.totalPrice,
        contactDetails: bookingData.contactDetails,
        specialRequests: bookingData.specialRequests,
      };
      
      // Log and alert for debugging
      console.log("[BookingPage] ⚠️ CRITICAL - Final booking data after NaN cleanup:", finalBookingData);
      console.log("[BookingPage] ⚠️ CRITICAL - Final totalPrice check:", {
        originalTotalPrice: bookingData.totalPrice,
        finalTotalPrice: finalBookingData.totalPrice,
        isOriginalNaN: isNaN(bookingData.totalPrice),
        isFinalNaN: isNaN(finalBookingData.totalPrice)
      });
      
      // One more safety check
      if (isNaN(finalBookingData.totalPrice) || finalBookingData.totalPrice <= 0) {
        console.error("[BookingPage] ❌ CRITICAL ERROR - totalPrice is still NaN or invalid after all checks!");
        finalBookingData.totalPrice = 1680; // Force a safe value
      }
      
      let bookingId;
      try {
        // Debug the JSON serialization process
        const jsonString = JSON.stringify(finalBookingData);
        console.log("[BookingPage] ⚠️ CRITICAL - JSON string being sent:", jsonString);
        
        // Parse it back to check if it's valid
        const parsedBack = JSON.parse(jsonString);
        console.log("[BookingPage] ⚠️ CRITICAL - Parsed back data:", parsedBack);
        console.log("[BookingPage] ⚠️ CRITICAL - Parsed back totalPrice:", parsedBack.totalPrice, "isNaN:", isNaN(parsedBack.totalPrice));
        
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: jsonString // Use the pre-computed JSON string
        });
        
        if (response.ok) {
          const data = await response.json();
          bookingId = data._id || data.id;
          console.log("[BookingPage] ✅ BOOKING CREATION SUCCESS!");
          console.log("[BookingPage] Response data:", data);
          console.log("[BookingPage] Extracted booking ID:", bookingId);
          console.log("[BookingPage] Booking ID type:", typeof bookingId);
          console.log("[BookingPage] Booking ID valid:", !!bookingId);
        } else {
          const errorData = await response.text(); 
          console.error("[BookingPage] API call to create booking failed. Status:", response.status, "Error:", errorData);
          throw new Error(`Failed to create booking: ${errorData}`);
        }
      } catch (apiError) {
        console.error("[BookingPage] API call to create booking errored:", apiError);
        throw apiError;
      }
      
      if (!bookingId) {
        throw new Error("No booking ID received from server");
      }
      
      // Store booking data in sessionStorage
      const bookingToStore = {
        ...finalBookingData,
        _id: bookingId,
        bookingId,
        createdAt: new Date().toISOString()
      };
      try {
        sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(bookingToStore));
        console.log("[BookingPage] Booking data stored in sessionStorage for key:", `booking_${bookingId}`, bookingToStore);
      } catch (storageError) {
        console.warn("[BookingPage] Could not store booking data in sessionStorage:", storageError);
      }
      
      // Store booking in localStorage for debugging (remove in production)
      try {
        localStorage.setItem('debug_last_booking', JSON.stringify({
          _id: bookingId,
          bookingCode: bookingId.substring(0, 6).toUpperCase(),
          propertyId: {
            _id: propertyId,
            title: property.title || "Property",
            location: {
              city: property.address?.city || property.city || "Unknown",
              state: property.address?.state || "Unknown"
            },
            images: property.images || []
          },
          userId: {
            _id: session?.user?.id || "user123",
            name: bookingDetails.name,
            email: bookingDetails.email
          },
          dateFrom: checkIn?.toISOString() || new Date().toISOString(),
          dateTo: checkOut?.toISOString() || new Date().toISOString(),
          guests: finalBookingData.guests,
          status: 'confirmed',
          totalAmount: finalBookingData.totalPrice,
          createdAt: new Date().toISOString()
        }));
      } catch (err) {
        console.warn("[BookingPage] Could not store debug booking data", err);
      }
      
      console.log("[BookingPage] Redirecting to booking details confirmation (booking/[id]) page");
      
      // Redirect to checkout page instead of booking details page
      const checkoutUrl = `/checkout?bookingId=${bookingId}&propertyId=${propertyId}`;
      console.log("[BookingPage] 🚀 REDIRECTING TO CHECKOUT:");
      console.log("[BookingPage] Checkout URL:", checkoutUrl);
      console.log("[BookingPage] URL params:", { bookingId, propertyId });
      
      router.push(checkoutUrl);
      
      // Reset loading after navigation starts
      setTimeout(() => {
        setBookingLoading(false);
      }, 500);
    } catch (error: any) {
      console.error("[BookingPage] Error during booking submission process:", error);
      toast({
        title: "Booking failed",
        description: error.message || "There was an error creating your booking. Please try again.",
        variant: "destructive"
      })
      setBookingLoading(false)
    }
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
        <h2 className="text-xl font-medium">Loading booking details...</h2>
      </div>
    )
  }
  
  // Show 404 if property not found
  if (!property) {
    return (
      <div className="container mx-auto py-24 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Property Not Found</h1>
        <p className="text-muted-foreground mb-8">
          We couldn't find the property you're looking for.
        </p>
        <Button 
          className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
          onClick={() => router.push("/")}
        >
          Return Home
        </Button>
      </div>
    )
  }
  
  // Debug logs for state variables related to pricing and display
  console.log("[BookingPage] Render State: property:", property, "basePrice:", basePrice, "nights:", nights, "finalTotal:", finalTotal);
  
  // Function to get the first available image from property
  const getPropertyImage = (property: any): string => {
    console.log("[BookingPage] Getting property image for:", property.title, property._id);
    console.log("[BookingPage] Property image data:", {
      thumbnail: property.thumbnail,
      categorizedImages: property.categorizedImages?.length || 0,
      legacyGeneralImages: property.legacyGeneralImages?.length || 0,
      images: property.images?.length || 0
    });
    
    // Try thumbnail first
    if (property.thumbnail && typeof property.thumbnail === 'string') {
      console.log("[BookingPage] Using thumbnail:", property.thumbnail);
      return getValidImageUrl(property.thumbnail);
    }
    
    // Try categorizedImages (new format)
    if (property.categorizedImages && Array.isArray(property.categorizedImages)) {
      for (const category of property.categorizedImages) {
        if (category?.files && Array.isArray(category.files) && category.files.length > 0) {
          const firstFile = category.files[0];
          if (firstFile && firstFile.url && typeof firstFile.url === 'string') {
            console.log("[BookingPage] Using categorized image:", firstFile.url);
            return getValidImageUrl(firstFile.url);
          }
        }
      }
    }
    
    // Try legacyGeneralImages
    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
      const firstImage = property.legacyGeneralImages[0];
      if (firstImage && firstImage.url && typeof firstImage.url === 'string') {
        console.log("[BookingPage] Using legacy image:", firstImage.url);
        return getValidImageUrl(firstImage.url);
      }
    }
    
    // Try direct images array
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const firstImage = property.images[0];
      if (typeof firstImage === 'string' && firstImage) {
        console.log("[BookingPage] Using direct string image:", firstImage);
        return getValidImageUrl(firstImage);
      } else if (firstImage && firstImage.url && typeof firstImage.url === 'string') {
        console.log("[BookingPage] Using direct object image:", firstImage.url);
        return getValidImageUrl(firstImage.url);
      }
    }
    
    // Fallback to placeholder
    console.log("[BookingPage] No images found, using placeholder");
    return getValidImageUrl(null);
  };

  return (
    <div className="container mx-auto py-24 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form */}
        <div className="lg:col-span-2">
          <h1 className="text-3xl font-bold mb-6">Complete Your Booking</h1>
          
          {/* Property Summary */}
          <Card className="mb-8 border-2 border-lightGreen/20 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold">{property.title}</CardTitle>
                  <CardDescription className="flex items-center mt-2">
                    <MapPin className="h-4 w-4 mr-1 text-lightGreen" />
                    {property.address?.city || property.city || "Unknown location"}
                  </CardDescription>
                </div>
                <Button 
                  {...({ variant: "outline", size: "sm" } as any)}
                  className="text-lightGreen border-lightGreen hover:bg-lightGreen hover:text-darkGreen"
                  onClick={() => router.push(`/property/${propertyId}?checkIn=${checkInStr}&checkOut=${checkOutStr}&guests=${guestsStr}`)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex items-center space-x-6">
              <div className="relative h-24 w-32 overflow-hidden rounded-lg">
                <Image 
                  src={getPropertyImage(property)} 
                  alt={property.title} 
                  fill 
                  className="object-cover" 
                  onError={(e) => {
                    console.log(`Image load error for property ${property._id}, falling back to placeholder`);
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                  unoptimized={getPropertyImage(property)?.includes('cloudinary.com') || getPropertyImage(property)?.includes('unsplash.com')}
                />
              </div>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center text-sm bg-gray-50 p-3 rounded-lg">
                    <Calendar className="h-4 w-4 mr-2 text-lightGreen" />
                    <div>
                      <div className="font-medium">Check-in</div>
                      <div className="text-muted-foreground">{checkIn ? format(checkIn, "MMM dd, yyyy") : "Check-in"}</div>
                    </div>
                  </div>
                  <div className="flex items-center text-sm bg-gray-50 p-3 rounded-lg">
                    <Calendar className="h-4 w-4 mr-2 text-lightGreen" />
                    <div>
                      <div className="font-medium">Check-out</div>
                      <div className="text-muted-foreground">{checkOut ? format(checkOut, "MMM dd, yyyy") : "Check-out"}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-2 text-lightGreen" />
                    <span className="font-medium">{guests} {guests === 1 ? "guest" : "guests"}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium">{rooms} {rooms === 1 ? "room" : "rooms"}</span>
                    <span className="mx-2">•</span>
                    <span className="font-medium">{nights} {nights === 1 ? "night" : "nights"}</span>
                  </div>
                  <Badge {...({ variant: "secondary" } as any)} className="bg-lightGreen/10 text-darkGreen">
                    ₹{basePrice}/night
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Guest Information Form */}
          <form id="booking-form" onSubmit={handleBookingSubmit}>
            <Card className="mb-8 border-2 border-lightGreen/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-lightGreen/5 to-mediumGreen/5">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-lightGreen" />
                  Guest Information
                </CardTitle>
                <CardDescription>
                  Please provide the details of the main guest for this reservation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      placeholder="Enter your full name" 
                      value={bookingDetails.name} 
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-lightGreen focus:ring-lightGreen"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="Enter your email" 
                      value={bookingDetails.email} 
                      onChange={handleInputChange}
                      className="border-gray-200 focus:border-lightGreen focus:ring-lightGreen"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    placeholder="Enter your phone number" 
                    value={bookingDetails.phone} 
                    onChange={handleInputChange}
                    className="border-gray-200 focus:border-lightGreen focus:ring-lightGreen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialRequests" className="text-sm font-medium">Special Requests (Optional)</Label>
                  <Textarea 
                    id="specialRequests" 
                    name="specialRequests" 
                    placeholder="Any special requests or notes for your stay" 
                    value={bookingDetails.specialRequests} 
                    onChange={handleInputChange}
                    className="border-gray-200 focus:border-lightGreen focus:ring-lightGreen resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Policy Summary */}
            <Card className="mb-8 border-2 border-lightGreen/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-lightGreen/5 to-mediumGreen/5">
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-lightGreen" />
                  Policies & Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start space-x-3 p-4 bg-red-50 rounded-lg border border-red-100">
                    <Info className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-700 mb-1">Cancellation Policy</h4>
                      <p className="text-sm text-red-600">
                        Free cancellation up to 48 hours before check-in. 
                        After that, cancellations will incur a fee of one night's stay.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <Clock className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-1">Check-in/Check-out</h4>
                      <div className="text-sm text-blue-600">
                        <div><strong>Check-in:</strong> 3:00 PM - 10:00 PM</div>
                        <div><strong>Check-out:</strong> By 11:00 AM</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-700 mb-1">Secure Booking</h4>
                      <p className="text-sm text-green-600">
                        Your personal information is protected with industry-standard encryption. 
                        We never store your payment details on our servers.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Mobile Price Summary (visible on small screens) */}
            <div className="lg:hidden mb-8">
              <Card className="border-2 border-lightGreen/20 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-lightGreen/5 to-mediumGreen/5">
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-lightGreen" />
                    Price Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex justify-between text-sm">
                    <span>₹{basePrice} × {nights} nights × {rooms} {rooms === 1 ? 'room' : 'rooms'}</span>
                    <span>₹{baseRoomTotal.toLocaleString()}</span>
                  </div>
                  {extraGuestCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <div>
                        <span>Extra guest charge</span>
                        <div className="text-xs text-muted-foreground">
                          ({extraGuests} extra {extraGuests === 1 ? 'guest' : 'guests'} × ₹1,000)
                        </div>
                      </div>
                      <span className="text-orange-600">+₹{extraGuestCharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Taxes (12%)</span>
                    <span>₹{taxes.toFixed(2)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="bg-lightGreen/10 p-4 rounded-lg mt-4">
                    <h4 className="font-medium flex items-center text-darkGreen mb-2">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment Information
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You won't be charged yet. Payment will be collected when you proceed to the payment page.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90 mt-6"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mb-4 lg:hidden">
              By proceeding, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-lightGreen">
                Terms and Conditions
              </Link>
            </p>
          </form>
        </div>
        
        {/* Price Summary Sidebar (desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-24">
            <Card className="border-2 border-lightGreen/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-lightGreen/5 to-mediumGreen/5">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-lightGreen" />
                  Price Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>₹{basePrice} × {nights} nights × {rooms} {rooms === 1 ? 'room' : 'rooms'}</span>
                    <span>₹{baseRoomTotal.toLocaleString()}</span>
                  </div>
                  {extraGuestCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <div>
                        <span>Extra guest charge</span>
                        <div className="text-xs text-muted-foreground">
                          ({extraGuests} extra {extraGuests === 1 ? 'guest' : 'guests'} × ₹1,000)
                        </div>
                      </div>
                      <span className="text-orange-600">+₹{extraGuestCharge.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Taxes (12%)</span>
                    <span>₹{taxes.toFixed(2)}</span>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  form="booking-form"
                  type="submit" 
                  className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="bg-lightGreen/10 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center text-darkGreen mb-2">
                    <Shield className="mr-2 h-4 w-4" />
                    Payment Information
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    You won't be charged yet. Payment will be collected when you proceed to the payment page.
                  </p>
                </div>
                
                <p className="text-center text-xs text-muted-foreground">
                  By proceeding, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-lightGreen">
                    Terms and Conditions
                  </Link>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 