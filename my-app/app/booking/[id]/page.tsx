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
  checkInDate: string;
  checkOutDate: string;
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
    differenceInDays(new Date(booking.checkOutDate), new Date(booking.checkInDate)),
    [booking.checkInDate, booking.checkOutDate]
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
                    {format(new Date(booking.checkInDate), "EEE, MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Check-out</p>
                  <p className="font-medium">
                    {format(new Date(booking.checkOutDate), "EEE, MMM d, yyyy")}
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
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create an AbortController for canceling fetch requests
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError('Booking ID is missing');
          setLoading(false);
          return;
        }
        
        const response = await fetch(`/api/bookings/${id}`, { 
          signal,
          // Add cache control headers
          headers: {
            'Cache-Control': 'max-age=300', // Cache for 5 minutes
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch booking details');
        }
        
        const data = await response.json();
        setBooking(data);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'An error occurred while fetching booking details');
          console.error('Error fetching booking:', err);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingDetails();

    // Cleanup function to abort fetch on unmount
    return () => {
      controller.abort();
    };
  }, [id]);

  return { booking, loading, error };
};

export default function BookingDetailsPage() {
  const params = useParams();
  const { booking, loading, error } = useBooking(params?.id);
  
  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);
  
  if (loading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} onBack={handleGoBack} />;
  }
  
  if (!booking) {
    return <NotFoundState onBack={handleGoBack} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Booking #{booking.bookingCode}</h1>
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
        <GuestInfo user={booking.userId} />
      </div>
      
      <div className="mt-8 flex justify-end gap-4">
        <Button variant="outline" onClick={handleGoBack}>
          Back
        </Button>
        {booking.status === 'confirmed' && (
          <Button variant="destructive">
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
  );
}