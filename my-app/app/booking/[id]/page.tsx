"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ReportButton } from '@/components/ui/report-button';
import { ReportTargetType } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, User, Home, CreditCard, Mail, CheckCircle, MapPin, Phone, Clock, Shield, Wifi, Car, Utensils, Tv, Waves, Snowflake, Coffee, Zap, Users } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Suspense, lazy } from 'react';
import { toast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { DynamicPricePreview } from '@/components/property/DynamicPricePreview';

// Define booking type
interface Booking {
  _id: string;
  bookingCode: string;
  propertyId?: {
    _id: string;
    title: string;
    address: {
      city: string;
      state: string;
      street: string;
      country: string;
    };
    images: string[];
    categorizedImages?: Array<{
      category: string;
      files: Array<{
        url: string;
        public_id: string;
      }>;
    }>;
    legacyGeneralImages?: Array<{
      url: string;
      public_id: string;
    }>;
    generalAmenities?: {
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
    };
    otherAmenities?: string;
    propertyType?: string;
    price?: {
      base: number;
    };
  };
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  dateFrom: string;
  dateTo: string;
  guests: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  totalPrice?: number; // Primary field from booking model
  totalAmount?: number; // Alternative field name (legacy/admin)
  createdAt: string;
}

// Define amenity interface
interface Amenity {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

// Loading placeholder component
const LoadingState = () => (
  <div className="container mx-auto py-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
    <Loader2 className="h-12 w-12 animate-spin mb-4 text-lightGreen" />
    <h2 className="text-xl font-medium">Loading booking details...</h2>
  </div>
);

// Error component
const ErrorState = ({ error, onBack }: { error: string, onBack: () => void }) => (
  <div className="container mx-auto py-24 px-4 text-center">
    <h1 className="text-3xl font-bold mb-4">Error Loading Booking</h1>
    <p className="text-muted-foreground mb-8">{error}</p>
    <Button 
      className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
      onClick={onBack}
    >
      Go Back
    </Button>
  </div>
);

// Not found component
const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="container mx-auto py-24 px-4 text-center">
    <h1 className="text-3xl font-bold mb-4">Booking Not Found</h1>
    <p className="text-muted-foreground mb-8">
      The booking you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <Button 
      className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
      onClick={onBack}
    >
      Go Back
    </Button>
  </div>
);

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'confirmed':
      return <Badge className="bg-green-500">Confirmed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-500">Cancelled</Badge>;
    case 'completed':
      return <Badge className="bg-blue-500">Completed</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

// BookingInfo component
const BookingInfo = ({ booking }: { booking: Booking }) => {
  const nights = useMemo(() => {
    if (!booking.dateFrom || !booking.dateTo) return 1;
    return Math.max(1, differenceInDays(new Date(booking.dateTo), new Date(booking.dateFrom)));
  }, [booking.dateFrom, booking.dateTo]);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Booking Details</CardTitle>
          <StatusBadge status={booking.status} />
        </div>
        <CardDescription>
          {booking.createdAt ? `Created on ${format(new Date(booking.createdAt), "MMMM d, yyyy")}` : 'Recent booking'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Home className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Property</h3>
              <p className="text-lg">{booking.propertyId?.title || 'Property'}</p>
              <p className="text-sm text-gray-500">
                {booking.propertyId?.address?.city || 'City'}, {booking.propertyId?.address?.state || 'State'}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Stay Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-gray-500">Check-in</p>
                  <p className="font-medium">
                    {booking.dateFrom ? format(new Date(booking.dateFrom), "EEE, MMM d, yyyy") : 'Date not available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">
                    {booking.dateTo ? format(new Date(booking.dateTo), "EEE, MMM d, yyyy") : 'Date not available'}
                  </p>
                </div>
              </div>
              <p className="mt-2">{nights} nights · {booking.guests || 1} guests</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Payment</h3>
              <p className="text-lg font-bold">₹{(booking.totalPrice || booking.totalAmount || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// GuestInfo component 
const GuestInfo = ({ user }: { user: Booking['userId'] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Guest Information</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium">{user?.name || 'Guest'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <div>
            <p>{user?.email || 'No email provided'}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// PropertyDetails component with real property data
const PropertyDetails = ({ booking }: { booking: Booking }) => {
  const property = booking.propertyId;
  
  // Get property image
  const getPropertyImage = () => {
    if (!property) return '/placeholder.svg';
    
    // Try categorizedImages first
    if (property.categorizedImages && property.categorizedImages.length > 0) {
      for (const category of property.categorizedImages) {
        if (category.files && category.files.length > 0) {
          return category.files[0].url;
        }
      }
    }
    
    // Try legacyGeneralImages
    if (property.legacyGeneralImages && property.legacyGeneralImages.length > 0) {
      return property.legacyGeneralImages[0].url;
    }
    
    // Try regular images array
    if (property.images && property.images.length > 0) {
      return typeof property.images[0] === 'string' ? property.images[0] : property.images[0];
    }
    
    return '/placeholder.svg';
  };
  
  // Get amenities from property data
  const getAmenities = (): Amenity[] => {
    if (!property?.generalAmenities) return [];
    
    const amenities: Amenity[] = [];
    const amenityMap = {
      wifi: { icon: Wifi, label: 'Free WiFi' },
      parking: { icon: Car, label: 'Free Parking' },
      ac: { icon: Snowflake, label: 'Air Conditioning' },
      tv: { icon: Tv, label: 'Smart TV' },
      kitchen: { icon: Utensils, label: 'Kitchen' },
      pool: { icon: Waves, label: 'Swimming Pool' },
      geyser: { icon: Zap, label: 'Hot Water' },
      reception24x7: { icon: Clock, label: '24/7 Reception' }
    };
    
    Object.entries(property.generalAmenities).forEach(([key, value]) => {
      if (value && amenityMap[key as keyof typeof amenityMap]) {
        amenities.push(amenityMap[key as keyof typeof amenityMap]);
      }
    });
    
    return amenities.slice(0, 8); // Show max 8 amenities
  };
  
  const amenities = getAmenities();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          Property Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Image */}
        <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100">
          <Image
            src={getPropertyImage()}
            alt={property?.title || 'Property'}
            className="w-full h-full object-cover"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        
        {/* Property Details */}
        <div>
          <h3 className="text-lg font-semibold mb-2">{property?.title || 'Property Name'}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{property?.address?.city || 'City'}, {property?.address?.state || 'State'}</span>
          </div>
          
          {property?.propertyType && (
            <div className="flex items-center text-sm text-gray-600 mb-3">
              <Home className="h-4 w-4 mr-1" />
              <span>{property.propertyType}</span>
            </div>
          )}
          
          {/* Real Amenities */}
          <div>
            <h4 className="font-medium mb-2">Available Amenities</h4>
            {amenities.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <amenity.icon className="h-4 w-4 text-blue-500" />
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Amenity information not available</p>
            )}
            
            {property?.otherAmenities && (
              <div className="mt-3">
                <h5 className="font-medium text-sm mb-1">Additional Amenities:</h5>
                <p className="text-sm text-gray-600">{property.otherAmenities}</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Check-in Instructions component
const CheckInInstructions = ({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Clock className="h-5 w-5" />
        Check-in Information
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-800 mb-1">Check-in Time</h4>
          <p className="text-sm text-green-700">After 2:00 PM</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <h4 className="font-medium text-red-800 mb-1">Check-out Time</h4>
          <p className="text-sm text-red-700">Before 11:00 AM</p>
        </div>
      </div>
      
      <div className="border-l-4 border-blue-500 pl-4">
        <h4 className="font-medium mb-2">Check-in Instructions</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• You'll receive detailed check-in instructions 24 hours before arrival</li>
          <li>• Please carry a valid government-issued photo ID</li>
          <li>• Contact the property if you'll arrive after 8:00 PM</li>
          <li>• Early check-in may be available upon request</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);

// Important Information component
const ImportantInfo = ({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        Important Information
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Cancellation Policy</h4>
        <p className="text-sm text-gray-600">
          Free cancellation until 24 hours before check-in. Cancellations made within 24 hours of check-in will incur a charge of one night's stay.
        </p>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">House Rules</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• No smoking inside the property</li>
          <li>• Pets are not allowed</li>
          <li>• No parties or events</li>
          <li>• Quiet hours: 10:00 PM - 7:00 AM</li>
        </ul>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">Additional Fees</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• All taxes included in booking price</li>
          <li>• Security deposit may be required at check-in</li>
          <li>• Extra guest charges may apply</li>
        </ul>
      </div>
    </CardContent>
  </Card>
);

// Contact Information component
const ContactInfo = ({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle>Contact Information</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <h4 className="font-medium mb-2">Property Contact</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>property@example.com</span>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium mb-2">24/7 Support</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>+91 9356547176</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-500" />
            <span>+91 9936712614</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <span>support@baithaka.com</span>
          </div>
        </div>
      </div>
      
      <div className="p-3 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Emergency:</strong> Call our 24/7 helpline for any urgent assistance during your stay.
        </p>
      </div>
    </CardContent>
  </Card>
);

// Booking Actions component
const BookingActions = ({ booking }: { booking: Booking }) => (
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <Button 
        className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
        onClick={() => {
          window.open(`/api/bookings/${booking._id}/invoice`, '_blank');
        }}
      >
        Download Invoice
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          // Navigate to user bookings page
          window.location.href = '/bookings';
        }}
      >
        View All Bookings
      </Button>
      
      <Button 
        variant="outline" 
        className="w-full"
        onClick={() => {
          const subject = encodeURIComponent(`Booking Inquiry - ${booking.bookingCode}`);
          const body = encodeURIComponent(`Hello,\n\nI have a question about my booking:\nBooking ID: ${booking._id}\nProperty: ${booking.propertyId?.title}\n\nThank you!`);
          window.open(`mailto:support@baithaka.com?subject=${subject}&body=${body}`);
        }}
      >
        Contact Support
      </Button>
      
      {booking.status === 'confirmed' && (
        <Button 
          variant="destructive"
          className="w-full"
          onClick={() => {
            if (confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
              // Handle cancellation
              console.log('Cancelling booking:', booking._id);
              // TODO: Implement cancellation API call
            }
          }}
        >
          Cancel Booking
        </Button>
      )}
    </CardContent>
  </Card>
);

// Function to normalize booking data structure
const normalizeBookingData = (rawData: any): Booking => {
  console.log("[normalizeBookingData] Input raw data:", rawData);
  console.log("[normalizeBookingData] Raw data totalPrice:", rawData.totalPrice);
  console.log("[normalizeBookingData] Raw data totalAmount:", rawData.totalAmount);
  
  const normalizedData = {
    ...rawData,
    totalPrice: rawData.totalPrice || rawData.totalAmount || 0,
    totalAmount: rawData.totalAmount || rawData.totalPrice || 0,
    propertyId: rawData.propertyId || rawData.property || undefined,
    userId: rawData.userId || rawData.user || undefined,
    bookingCode: rawData.bookingCode || (rawData._id ? `BK-${rawData._id.slice(-6).toUpperCase()}` : 'UNKNOWN'),
    guests: rawData.guests || 1,
    status: rawData.status || 'confirmed',
    dateFrom: rawData.dateFrom || rawData.checkIn,
    dateTo: rawData.dateTo || rawData.checkOut
  };
  
  console.log("[normalizeBookingData] Normalized totalPrice:", normalizedData.totalPrice);
  console.log("[normalizeBookingData] Normalized totalAmount:", normalizedData.totalAmount);
  console.log("[normalizeBookingData] Final normalized data:", normalizedData);
  return normalizedData;
};

// Create a custom hook for fetching booking
const useBooking = (id: string | string[] | undefined) => {
  console.log("[BookingDetailsPage_useBooking] Hook initiated with id:", id);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("[BookingDetailsPage_useBooking] useEffect triggered. Current id:", id);
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchBookingDetails = async () => {
      console.log("[BookingDetailsPage_useBooking] fetchBookingDetails called.");
      try {
        setLoading(true);
        if (!id || (Array.isArray(id) && id.length === 0)) {
          console.error("[BookingDetailsPage_useBooking] Booking ID is missing or empty array.");
          setError('Booking ID is missing');
          setLoading(false);
          return;
        }
        
        const currentBookingId = Array.isArray(id) ? id[0] : id;
        console.log("[BookingDetailsPage_useBooking] Effective bookingId for fetching:", currentBookingId);
        
        // Try sessionStorage first (data passed from booking form)
        try {
          const sessionData = sessionStorage.getItem(`booking_${currentBookingId}`);
          if (sessionData) {
            const parsedSessionData = JSON.parse(sessionData);
            console.log("[BookingDetailsPage_useBooking] Found booking data in sessionStorage:", parsedSessionData);
            const normalizedBooking = normalizeBookingData(parsedSessionData);
            console.log("[BookingDetailsPage_useBooking] Normalized booking data:", normalizedBooking);
            setBooking(normalizedBooking);
            setLoading(false);
            return; // Data found in session, no need to fetch from API or localStorage
          }
          console.log("[BookingDetailsPage_useBooking] No data in sessionStorage for key:", `booking_${currentBookingId}`);
        } catch (sessionError) {
          console.warn("[BookingDetailsPage_useBooking] Error accessing sessionStorage:", sessionError);
        }

        // Try API next
        try {
          console.log("[BookingDetailsPage_useBooking] Attempting to fetch from API for id:", currentBookingId);
          const response = await fetch(`/api/bookings/${currentBookingId}`, { signal, headers: { 'Cache-Control': 'max-age=300' } });
          if (response.ok) {
            const data = await response.json();
            console.log("[BookingDetailsPage_useBooking] API returned booking data:", data);
            if (data.booking) { // Assuming API wraps booking in a 'booking' field
              const normalizedBooking = normalizeBookingData(data.booking);
              setBooking(normalizedBooking);
            } else if (Object.keys(data).length > 0) { // If API returns booking directly
              const normalizedBooking = normalizeBookingData(data);
              setBooking(normalizedBooking);
            } else {
              console.warn("[BookingDetailsPage_useBooking] API response OK but no booking data found.");
              // Proceed to check localStorage if API data is insufficient
            }
            if (data.booking || Object.keys(data).length > 0) {
             setLoading(false);
             return; // Data found via API
            }
          } else {
            const errorText = await response.text();
            console.warn("[BookingDetailsPage_useBooking] API request failed. Status:", response.status, "Response:", errorText);
          }
        } catch (apiError: any) {
          if (apiError.name !== 'AbortError') {
            console.warn("[BookingDetailsPage_useBooking] API fetch error:", apiError);
          }
        }
        
        // Fallback to localStorage (debug_last_booking)
        try {
          const localBookingData = localStorage.getItem('debug_last_booking');
          if (localBookingData) {
            const parsedData = JSON.parse(localBookingData);
            // Important: Check if the localStorage data matches the current bookingId
            if (parsedData._id === currentBookingId || parsedData.bookingId === currentBookingId) {
              console.log("[BookingDetailsPage_useBooking] Using local debug booking data from localStorage:", parsedData);
              const normalizedBooking = normalizeBookingData(parsedData);
              setBooking(normalizedBooking);
              setLoading(false);
              return;
            }
            console.log("[BookingDetailsPage_useBooking] localStorage data did not match current bookingId.");
          }
        } catch (localError) {
          console.warn("[BookingDetailsPage_useBooking] Error accessing localStorage:", localError);
        }
        
        console.error("[BookingDetailsPage_useBooking] Booking not found after trying sessionStorage, API, and localStorage.");
        setError('Booking not found. Please try again or contact support.');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("[BookingDetailsPage_useBooking] General error in fetchBookingDetails:", err);
          setError(err.message || 'An error occurred while fetching booking details');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();

    return () => {
      console.log("[BookingDetailsPage_useBooking] useEffect cleanup. Aborting fetch.");
      controller.abort();
    };
  }, [id]);

  return { booking, loading, error };
};

export default function BookingDetailsPage() {
  console.log('RENDERING BOOKINGDETAILSPAGE TOP');
  const params = useParams();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    console.log("[BookingDetailsPage] Component mounted with params:", params);
    console.log("[BookingDetailsPage] Search params:", searchParams?.toString());
  }, [params, searchParams]);
  
  const { booking, loading, error } = useBooking(params?.id);

  // Get values from URL params for dynamic price preview with null checks
  const propertyIdParam = searchParams?.get('propertyId') || undefined;
  const checkInParam = searchParams?.get('checkIn') || undefined;
  const checkOutParam = searchParams?.get('checkOut') || undefined;
  const guestsParam = searchParams?.get('guests') || undefined;

  // Debug logging for dynamic pricing parameters
  console.log('[BookingDetailsPage] Dynamic pricing params:', {
    propertyIdParam,
    checkInParam,
    checkOutParam,
    guestsParam,
    hasAllParams: !!(propertyIdParam && checkInParam && checkOutParam)
  });
  
  const handleGoBack = useCallback(() => {
    console.log("[BookingDetailsPage] handleGoBack called.");
    window.history.back();
  }, []);
  
  if (loading) {
    console.log("[BookingDetailsPage] Render: LoadingState");
    return <LoadingState />;
  }
  
  if (error) {
    console.log("[BookingDetailsPage] Render: ErrorState with error:", error);
    return <ErrorState error={error} onBack={handleGoBack} />;
  }
  
  if (!booking) {
    console.log("[BookingDetailsPage] Render: NotFoundState (booking is null)");
    return <NotFoundState onBack={handleGoBack} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Booking #{booking.bookingCode || booking._id?.slice(-6).toUpperCase() || 'Unknown'}</h1>
        <ReportButton 
          targetType={ReportTargetType.BOOKING}
          targetId={booking._id || 'unknown'}
          targetName={`Booking #${booking.bookingCode || 'Unknown'}`}
          variant="outline"
          size="sm"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <BookingInfo booking={booking} />
          
          {/* Dynamic Price Preview - Only show if we have the required params */}
          {propertyIdParam && checkInParam && checkOutParam ? (
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Price Preview</CardTitle>
                <CardDescription>
                  Interactive pricing for this property based on your booking parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DynamicPricePreview
                  propertyId={propertyIdParam}
                  defaultStartDate={checkInParam}
                  defaultEndDate={checkOutParam}
                  guests={guestsParam ? parseInt(guestsParam, 10) : 1}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Price Preview</CardTitle>
                <CardDescription>
                  Missing parameters for dynamic pricing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-500">
                  <p>Required URL parameters:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>propertyId: {propertyIdParam || 'missing'}</li>
                    <li>checkIn: {checkInParam || 'missing'}</li>
                    <li>checkOut: {checkOutParam || 'missing'}</li>
                    <li>guests: {guestsParam || '1'}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
          
          <PropertyDetails booking={booking} />
          <CheckInInstructions booking={booking} />
          <ImportantInfo booking={booking} />
        </div>
        <div className="space-y-6">
          {booking.userId && <GuestInfo user={booking.userId} />}
          <ContactInfo booking={booking} />
          <BookingActions booking={booking} />
        </div>
      </div>
      
      <div className="mt-8">
        <Button variant="outline" onClick={handleGoBack}>
          ← Back to Previous Page
        </Button>
      </div>
    </div>
  );
}
