"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, differenceInDays } from "date-fns"
import { MapPin, Calendar, Users, Info, CreditCard, ArrowRight, Edit2, Shield, Clock, TrendingUp } from "lucide-react"
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
import { DynamicPricePreview } from '@/components/property/DynamicPricePreview';
import RealTimePriceDisplay from '@/components/booking/RealTimePriceDisplay';
import BookingPromotionBadges from '@/components/booking/BookingPromotionBadges';
import SavingsHighlight from '@/components/booking/SavingsHighlight';

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
  const [dynamicPricing, setDynamicPricing] = useState<any>(null)
  const [pricingLoading, setPricingLoading] = useState(false)
  const [categoryChanging, setCategoryChanging] = useState(false)
  const [bookingDetails, setBookingDetails] = useState({
    name: "",
    email: "",
    phone: "",
    specialRequests: "",
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  
  console.log("[BookingPage] Initial Params: propertyId:", propertyId, "checkInStr:", checkInStr, "checkOutStr:", checkOutStr, "guestsStr:", guestsStr, "roomsStr:", roomsStr, "categoryStr:", categoryStr, "priceStr:", priceStr, "propertyNameStr:", propertyNameStr);
  
  // Parse dates with validation
  const checkIn = useMemo(() => checkInStr ? new Date(checkInStr) : null, [checkInStr])
  const checkOut = useMemo(() => checkOutStr ? new Date(checkOutStr) : null, [checkOutStr])
  
  // Validate dates are not Invalid Date objects
  const isValidCheckIn = useMemo(() => checkIn && !isNaN(checkIn.getTime()), [checkIn])
  const isValidCheckOut = useMemo(() => checkOut && !isNaN(checkOut.getTime()), [checkOut])
  
  const guests = parseInt(guestsStr) || 1
  const rooms = parseInt(roomsStr) || 1
  const selectedCategory = categoryStr;
  
  // Parse and validate price with proper fallbacks
  const parsedPriceFromUrl = parseFloat(priceStr)
  const pricePerNight = !isNaN(parsedPriceFromUrl) && parsedPriceFromUrl > 0 ? parsedPriceFromUrl : 0
  
  // Function to handle category change
  const handleCategoryChange = (newCategoryId: string) => {
    console.log("[BookingPage] Changing category to:", newCategoryId);
    
    // Set loading state
    setCategoryChanging(true);
    
    // Update the URL parameters
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('category', newCategoryId);
    
    // Use router.push for smooth navigation without full page reload
    router.push(currentUrl.pathname + currentUrl.search);
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setCategoryChanging(false);
    }, 500);
  };
  
  // Fetch dynamic pricing when dates and property are available
  useEffect(() => {
    if (!propertyId || !isValidCheckIn || !isValidCheckOut || !guests) {
      setDynamicPricing(null);
      return;
    }

    const fetchDynamicPricing = async () => {
      setPricingLoading(true);
      try {
        const startDate = checkIn!.toISOString().split('T')[0];
        const endDate = checkOut!.toISOString().split('T')[0];
        
        // Include category in the API call
        let url = `/api/properties/${propertyId}/pricing?startDate=${startDate}&endDate=${endDate}&guests=${guests}`;
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (response.ok) {
          setDynamicPricing(data);
          console.log("[BookingPage] Dynamic pricing fetched:", data);
        } else {
          console.warn("[BookingPage] Failed to fetch dynamic pricing:", data.error);
          setDynamicPricing(null);
        }
      } catch (error) {
        console.error("[BookingPage] Error fetching dynamic pricing:", error);
        setDynamicPricing(null);
      } finally {
        setPricingLoading(false);
      }
    };

    fetchDynamicPricing();
  }, [propertyId, isValidCheckIn, isValidCheckOut, guests, checkIn, checkOut, selectedCategory]);
  
  // Helper to check if a date is blocked - using same logic as calendar
  const isDateBlocked = (date: Date, blockedDates: any[]) => {
    if (!blockedDates || !Array.isArray(blockedDates) || blockedDates.length === 0) {
      return false;
    }
    
    return blockedDates.some((blocked: any) => {
      if (!blocked || blocked.isActive === false) return false;
      
      try {
        // Convert to Date objects for comparison
        const startDate = new Date(blocked.startDate);
        const endDate = new Date(blocked.endDate);
        
        // Normalize all dates to midnight UTC for accurate comparison
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
        const normalizedEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        // Check if date falls within the blocked range (inclusive)
        return normalizedDate >= normalizedStart && normalizedDate <= normalizedEnd;
      } catch (error) {
        console.error('Error processing blocked date:', blocked, error);
        return false;
      }
    });
  };

  // Enhanced booking validation to check blocked dates  
  const validateBookingDates = useCallback(() => {
    if (!checkIn || !checkOut || !selectedCategory || !dynamicPricing?.availabilityControl?.blockedDates) {
      return { isValid: true, errors: [] };
    }

    const errors: string[] = [];
    const categoryBlockedDates = dynamicPricing.availabilityControl.blockedDates.filter((blocked: any) => 
      blocked.isActive && (!blocked.categoryId || blocked.categoryId === selectedCategory)
    );

    // Check each date in the booking range for blocked dates
    const currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    console.log('Validating booking dates for blocked dates:', {
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      selectedCategory,
      categoryBlockedDates
    });

    while (currentDate < endDate) {
      if (isDateBlocked(currentDate, categoryBlockedDates)) {
        const blockedDateStr = format(currentDate, 'MMM dd, yyyy');
        errors.push(`${blockedDateStr} is blocked and not available for booking`);
        console.log(`❌ Booking validation failed: ${blockedDateStr} is blocked`);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [checkIn, checkOut, selectedCategory, dynamicPricing?.availabilityControl?.blockedDates]);

  // Add blocked dates validation to calculatePricing
  const calculatePricing = useCallback(() => {
    if (!property || !checkIn || !checkOut) return;

    const validation = validateBookingDates();
    if (!validation.isValid) {
      toast({
        title: "Booking Not Available",
        description: validation.errors.join('. '),
        variant: "destructive"
      });
      return;
    }
    
    console.log("[BookingPage] calculatePricing - START");
    console.log("[BookingPage] calculatePricing - Input data:", {
      property: property?.name,
      checkIn: checkIn?.toISOString(),
      checkOut: checkOut?.toISOString(),
      guests,
      rooms,
      pricePerNight,
      selectedCategory
    });
    
    if (!isValidCheckIn || !isValidCheckOut) {
      console.log("[BookingPage] calculatePricing - Invalid dates");
      return;
    }

    const nights = differenceInDays(checkOut, checkIn);
    console.log("[BookingPage] calculatePricing - nights:", nights);
    
    if (nights <= 0) {
      console.log("[BookingPage] calculatePricing - Invalid nights count");
      return;
    }

    // Determine base price based on selected category or fallback to property price
    let basePrice = pricePerNight;
    
    if (dynamicPricing?.selectedCategory?.price) {
      basePrice = dynamicPricing.selectedCategory.price;
      console.log("[BookingPage] Using category price from dynamic pricing:", basePrice);
    } else if (property.propertyUnits && selectedCategory) {
      const selectedUnit = property.propertyUnits.find((unit: any) => unit.unitTypeCode === selectedCategory);
      if (selectedUnit?.pricing?.price) {
        basePrice = parseFloat(selectedUnit.pricing.price);
        console.log("[BookingPage] Using propertyUnits price:", basePrice);
      }
    } else if (property.categories && selectedCategory) {
      const selectedCat = property.categories.find((cat: any) => cat.id === selectedCategory);
      if (selectedCat?.price) {
        basePrice = selectedCat.price;
        console.log("[BookingPage] Using categories price:", basePrice);
      }
    }
    
    console.log("[BookingPage] Final basePrice:", basePrice);
    
    const baseRoomTotal = basePrice * nights * rooms;
    console.log("[BookingPage] baseRoomTotal calculation:", `${basePrice} * ${nights} * ${rooms} = ${baseRoomTotal}`);
    
    // Calculate extra guest charges (third guest onwards in each room costs extra)
    const baseGuestCapacity = rooms * 2; // 2 guests per room baseline
    const extraGuests = Math.max(0, guests - baseGuestCapacity);
    const extraGuestCharge = extraGuests * 1000 * nights; // ₹1000 per extra guest per night
    
    console.log("[BookingPage] Guest calculation:", {
      totalGuests: guests,
      baseGuestCapacity, 
      extraGuests, 
      extraGuestCharge: `${extraGuests} * 1000 * ${nights} = ${extraGuestCharge}`
    });
    
    const totalPrice = baseRoomTotal + extraGuestCharge;
    
    // Calculate taxes (18% GST)
    const taxes = Math.round(totalPrice * 0.18);
    const finalTotal = totalPrice + taxes;
    
    console.log("[BookingPage] Price breakdown:", {
      baseRoomTotal,
      extraGuestCharge,
      totalPrice,
      taxes: `${totalPrice} * 0.18 = ${taxes}`,
      finalTotal
    });
    
    const result = {
      nights,
      basePrice,
      baseRoomTotal,
      extraGuests,
      extraGuestCharge,
      totalPrice,
      taxes,
      finalTotal,
      isValid: true,
      isDynamicPricing: !!dynamicPricing?.activePricingFactors?.length
    };
    
    console.log("[BookingPage] calculatePricing - Final result:", result);
    return result;
  }, [property, checkIn, checkOut, guests, rooms, pricePerNight, selectedCategory, dynamicPricing, isValidCheckIn, isValidCheckOut, validateBookingDates, toast]);
  
  // Get pricing calculations
  const pricing = calculatePricing() || {
    nights: 0,
    basePrice: 0,
    baseRoomTotal: 0,
    extraGuests: 0,
    extraGuestCharge: 0,
    totalPrice: 0,
    taxes: 0,
    finalTotal: 0,
    isValid: false,
    isDynamicPricing: false
  };
  const { nights, basePrice, baseRoomTotal, extraGuests, extraGuestCharge, totalPrice, taxes, finalTotal, isDynamicPricing } = pricing;
  
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
    isValidFinalTotal: pricing?.isValid,
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
  }, [propertyId, checkInStr, checkOutStr, router, toast, session, checkIn, checkOut, isValidCheckIn, isValidCheckOut, status, property, guests, rooms, pricePerNight, selectedCategory, dynamicPricing]);
  
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
      
      console.log("[BookingPage] Opening Razorpay payment gateway directly");
      
      try {
        // Import the Razorpay function dynamically
        const { createAndOpenRazorpayCheckout } = await import('@/lib/razorpay-client');
        
        toast({
          title: "Opening Payment Gateway",
          description: "Please complete the payment in the popup window.",
          variant: "default"
        });
        
        // Directly open Razorpay payment gateway
        const result = await createAndOpenRazorpayCheckout({
          bookingId: bookingId,
          propertyId: propertyId,
          returnUrl: window.location.origin + "/booking"
        });
        
        if (result.success) {
          toast({
            title: "Payment Successful",
            description: "Your payment has been processed successfully.",
            variant: "default"
          });
          
          // Redirect to booking confirmation page
          setTimeout(() => {
            window.location.href = `/booking/confirmation?bookingId=${bookingId}`;
          }, 2000);
        } else {
          toast({
            title: "Payment Failed",
            description: result.error || "There was an error processing your payment.",
            variant: "destructive"
          });
        }
      } catch (paymentError: any) {
        console.error("[BookingPage] Payment error:", paymentError);
        toast({
          title: "Payment Error",
          description: paymentError.message || "There was an error processing your payment. Please try again.",
          variant: "destructive"
        });
      }
      
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
                  <div className="flex items-center gap-2">
                    {isDynamicPricing && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Dynamic
                      </Badge>
                    )}
                  <Badge {...({ variant: "secondary" } as any)} className="bg-lightGreen/10 text-darkGreen">
                    ₹{basePrice}/night
                  </Badge>
                  </div>
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
            
            {/* Real Dynamic Pricing Information - Only show if enabled */}
            {isValidCheckIn && isValidCheckOut && propertyId && dynamicPricing && (
              <Card className="mb-8 border-2 border-blue-200 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="flex items-center text-blue-800">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    {dynamicPricing.selectedCategory ? `${dynamicPricing.selectedCategory.name} Pricing` : 'Dynamic Pricing'}
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    {dynamicPricing.selectedCategory 
                      ? `Real-time pricing for ${dynamicPricing.selectedCategory.name} category`
                      : "Real-time pricing based on admin configuration"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {pricingLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-blue-600">Calculating pricing...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Real Pricing Factors - Only show admin-enabled ones */}
                      {dynamicPricing.activePricingFactors && dynamicPricing.activePricingFactors.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Active Pricing Factors:</h4>
                          {dynamicPricing.activePricingFactors.map((factor: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="font-medium">{factor.name}</span>
                                <span className="text-sm text-gray-600">{factor.description}</span>
                              </div>
                              <Badge variant="outline" className={factor.impact > 0 ? "text-red-600" : "text-green-600"}>
                                {factor.impact > 0 ? '+' : ''}₹{Math.abs(factor.impact).toLocaleString()}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Category Information */}
                      {dynamicPricing.selectedCategory && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-900">{dynamicPricing.selectedCategory.name}</div>
                              <div className="text-sm text-blue-700">{dynamicPricing.selectedCategory.count} rooms available</div>
                            </div>
                            <div className="text-lg font-bold text-blue-800">
                              ₹{dynamicPricing.selectedCategory.price.toLocaleString()}/night
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Available Categories */}
                      {dynamicPricing.availableCategories && dynamicPricing.availableCategories.length > 1 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            Available Room Categories:
                            {categoryChanging && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {dynamicPricing.availableCategories.map((category: any) => {
                              const isSelected = category.id === (dynamicPricing.selectedCategory?.id || selectedCategory);
                              return (
                                <div 
                                  key={category.id} 
                                  className={`p-3 border-2 rounded-lg transition-all duration-200 ${
                                    categoryChanging 
                                      ? 'cursor-not-allowed opacity-60' 
                                      : isSelected 
                                        ? 'border-blue-500 bg-blue-50 shadow-md cursor-default' 
                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 cursor-pointer'
                                  }`}
                                  onClick={() => !isSelected && !categoryChanging && handleCategoryChange(category.id)}
                                >
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                        {category.name}
                                        {isSelected && (
                                          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                      <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                        {category.count} rooms available
                                      </div>
                                    </div>
                                    <div className={`font-bold ${isSelected ? 'text-blue-800' : 'text-gray-900'}`}>
                                      ₹{category.price.toLocaleString()}
                                    </div>
                                  </div>
                                  {!isSelected && !categoryChanging && (
                                    <div className="mt-2 text-xs text-blue-600">
                                      Click to switch to this category
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Enhanced Mobile Price Summary (visible on small screens) */}
            <div className="lg:hidden mb-8 space-y-6">
              {/* Mobile Savings Highlight */}
              {isValidCheckIn && isValidCheckOut && (
                <SavingsHighlight
                  propertyId={propertyId}
                  checkIn={checkIn!}
                  checkOut={checkOut!}
                  guests={guests}
                  rooms={rooms}
                  basePrice={basePrice}
                  finalPrice={finalTotal}
                  appliedPromotions={[]}
                />
              )}

              {/* Mobile Promotions */}
              {isValidCheckIn && isValidCheckOut && (
                <BookingPromotionBadges
                  propertyId={propertyId}
                  checkIn={checkIn!}
                  checkOut={checkOut!}
                  guests={guests}
                  rooms={rooms}
                />
              )}

              {/* Mobile Real-Time Price Display */}
              <RealTimePriceDisplay
                priceData={{
                  basePrice,
                  nights,
                  rooms,
                  guests,
                  extraGuestCharge,
                  taxes,
                  finalTotal,
                  isDynamicPricing,
                  savings: undefined, // Only show real savings
                  promotions: [] // Only show real promotions from admin
                }}
                isLoading={pricingLoading}
              />

              {/* Mobile Action Button */}
              <div className="space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90 shadow-lg"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="bg-lightGreen/10 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center text-darkGreen mb-2">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Payment Information
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Clicking "Pay Now" will open the secure Razorpay payment gateway to complete your booking.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground mb-4 lg:hidden">
              By proceeding, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-lightGreen">
                Terms and Conditions
              </Link>
            </p>
          </form>
        </div>
        
        {/* Enhanced Price Summary Sidebar (desktop) */}
        <div className="hidden lg:block">
          <div
            className="sticky top-24 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-scroll scrollbar scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-gray-300 hover:scrollbar-thumb-green-400 pr-2 px-2 touch-pan-y bg-white shadow-sm"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollbarColor: '#a7f3d0 #f3f4f6', // green-200 thumb, gray-100 track
              scrollbarWidth: 'thin'
            }}
          >
            {/* Savings Highlight */}
            {isValidCheckIn && isValidCheckOut && (
              <SavingsHighlight
                propertyId={propertyId}
                checkIn={checkIn!}
                checkOut={checkOut!}
                guests={guests}
                rooms={rooms}
                basePrice={basePrice}
                finalPrice={finalTotal}
                appliedPromotions={[]} // Would be populated from state
              />
            )}

            {/* Active Promotions */}
            {isValidCheckIn && isValidCheckOut && (
              <BookingPromotionBadges
                propertyId={propertyId}
                checkIn={checkIn!}
                checkOut={checkOut!}
                guests={guests}
                rooms={rooms}
              />
            )}

            {/* Real-Time Price Display */}
            <RealTimePriceDisplay
              priceData={{
                basePrice,
                nights,
                rooms,
                guests,
                extraGuestCharge,
                taxes,
                finalTotal,
                isDynamicPricing,
                savings: undefined, // Only show real savings
                promotions: [] // Only show real promotions from admin
              }}
              isLoading={pricingLoading}
              onPriceChange={(newPrice) => {
                console.log('Price changed to:', newPrice);
              }}
            />

            {/* Action Button */}
            <div className="space-y-4">
              <Button 
                form="booking-form"
                type="submit" 
                className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen font-medium text-lg py-6 hover:opacity-90 shadow-lg"
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Now <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="bg-lightGreen/10 p-4 rounded-lg">
                <h4 className="font-medium flex items-center text-darkGreen mb-2">
                  <Shield className="mr-2 h-4 w-4" />
                  Payment Information
                </h4>
                <p className="text-sm text-muted-foreground">
                  Clicking "Pay Now" will open the secure Razorpay payment gateway to complete your booking.
                </p>
              </div>
              
              <p className="text-center text-xs text-muted-foreground">
                By proceeding, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-lightGreen">
                  Terms and Conditions
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 