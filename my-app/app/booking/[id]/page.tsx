"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { ReportButton } from '@/components/ui/report-button';
import { ReportTargetType } from '@/models/Report';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, User, Home, CreditCard, Mail } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Suspense, lazy } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define booking type
interface Booking {
  _id: string;
  bookingCode: string;
  propertyId: {
    _id: string;
    title: string;
    location: {
      city: string;
      state: string;
    };
    images: string[];
  };
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  dateFrom: string;
  dateTo: string;
  guests: number;
  status: 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  createdAt: string;
}

// Loading placeholder component
const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin mr-2" />
    <p>Loading booking details...</p>
  </div>
);

// Error component
const ErrorState = ({ error, onBack }: { error: string, onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
    <p className="text-gray-700">{error}</p>
    <Button className="mt-4" onClick={onBack}>
      Go Back
    </Button>
  </div>
);

// Not found component
const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen">
    <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
    <p className="text-gray-700">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
    <Button className="mt-4" onClick={onBack}>
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
  const nights = useMemo(() => 
    differenceInDays(new Date(booking.dateTo), new Date(booking.dateFrom)),
    [booking.dateFrom, booking.dateTo]
  );

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Booking Details</CardTitle>
          <StatusBadge status={booking.status} />
        </div>
        <CardDescription>
          Created on {format(new Date(booking.createdAt), "MMMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Home className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Property</h3>
              <p className="text-lg">{booking.propertyId.title}</p>
              <p className="text-sm text-gray-500">
                {booking.propertyId.location.city}, {booking.propertyId.location.state}
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
                    {format(new Date(booking.dateFrom), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(booking.dateTo), "EEE, MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <p className="mt-2">{nights} nights · {booking.guests} guests</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <CreditCard className="h-5 w-5 text-gray-500 mt-0.5" />
            <div>
              <h3 className="font-medium">Payment</h3>
              <p className="text-lg font-bold">₹{booking.totalAmount.toLocaleString()}</p>
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
            <p className="font-medium">{user.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-gray-500" />
          <div>
            <p>{user.email}</p>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

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
            setBooking(parsedSessionData);
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
              setBooking(data.booking);
            } else if (Object.keys(data).length > 0) { // If API returns booking directly
              setBooking(data);
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
              setBooking(parsedData);
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
  const params = useParams();
  useEffect(() => {
    console.log("[BookingDetailsPage] Component mounted with params:", params);
  }, [params]);
  const { booking, loading, error } = useBooking(params?.id);
  
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

  console.log("[BookingDetailsPage] Render: Displaying booking details for:", booking);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Booking #{booking.bookingCode || booking._id.slice(-6).toUpperCase()}</h1>
        <ReportButton 
          targetType={ReportTargetType.BOOKING}
          targetId={booking._id}
          targetName={`Booking #${booking.bookingCode}`}
          variant="outline"
          size="sm"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <BookingInfo booking={booking} />
        {booking.userId && <GuestInfo user={booking.userId} />}
      </div>
      
      <div className="mt-8 flex justify-between gap-4">
        <Button variant="outline" onClick={handleGoBack}>
          Back
        </Button>
        
        <div className="flex gap-4">
          {booking.status === 'confirmed' && (
            <Button variant="destructive">
              Cancel Booking
            </Button>
          )}
          
          <Button 
            className="bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen hover:opacity-90"
            onClick={async () => {
              console.log("[BookingDetailsPage] 'Proceed to Payment' clicked for bookingId:", booking._id, "propertyId:", booking.propertyId?._id);
              const propertyIdForCheckout = booking.propertyId?._id || (typeof booking.propertyId === 'string' ? booking.propertyId : null);
              if (!propertyIdForCheckout) {
                console.error("[BookingDetailsPage] Cannot proceed to payment: propertyId is missing from booking data.");
                toast({ title: "Error", description: "Cannot proceed: Property details missing.", variant: "destructive" });
                return;
              }
              
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
                  bookingId: booking._id,
                  propertyId: propertyIdForCheckout,
                  returnUrl: window.location.origin + "/booking"
                });
                
                if (result.success) {
                  toast({
                    title: "Payment Successful",
                    description: "Your payment has been processed successfully.",
                    variant: "default"
                  });
                  
                  // Redirect to booking details page
                  setTimeout(() => {
                    window.location.href = `/booking/${booking._id}`;
                  }, 2000);
                } else {
                  toast({
                    title: "Payment Failed",
                    description: result.error || "There was an error processing your payment.",
                    variant: "destructive"
                  });
                }
              } catch (error: any) {
                console.error("[BookingDetailsPage] Payment error:", error);
                toast({
                  title: "Payment Error",
                  description: error.message || "There was an error processing your payment. Please try again.",
                  variant: "destructive"
                });
              }
            }}
          >
            Pay Now
          </Button>
        </div>
      </div>
    </div>
  );
}