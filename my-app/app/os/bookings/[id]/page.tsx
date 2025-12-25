import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  Calendar,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Banknote
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import CollectPaymentButton from '@/components/os/CollectPaymentButton';
import PaymentTimeline from '@/components/os/PaymentTimeline';

async function getBookingDetails(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/bookings/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch booking:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.booking;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

function formatDateTime(dateString: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function getStatusBadge(status: string) {
  const statusConfig = {
    confirmed: { className: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Confirmed' },
    pending: { className: 'bg-yellow-100 text-yellow-700', icon: AlertCircle, label: 'Pending' },
    completed: { className: 'bg-blue-100 text-blue-700', icon: CheckCircle, label: 'Completed' },
    cancelled: { className: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Cancelled' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${config.className}`}>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  await requireOwnerAuth();
  const booking = await getBookingDetails(params.id);

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Not Found</h3>
          <p className="text-gray-600 mb-6">
            The booking you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/os/bookings"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const propertyImage = booking.propertyId?.images?.[0]?.url || booking.propertyId?.images?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/os/bookings"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Bookings
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
          <p className="text-sm text-gray-600 mt-1">
            Booking ID: {booking._id}
          </p>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Property Details
              </h2>
            </div>
            <div className="p-6">
              <div className="flex gap-4">
                {propertyImage && (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={propertyImage}
                      alt={booking.propertyId.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                    {booking.propertyId.title}
                  </h3>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {booking.propertyId.address?.street && `${booking.propertyId.address.street}, `}
                      {booking.propertyId.address?.city && `${booking.propertyId.address.city}, `}
                      {booking.propertyId.address?.state}
                    </span>
                  </div>
                  <div className="mt-3">
                    <Link
                      href={`/property/${booking.propertyId.slug}`}
                      target="_blank"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View Property Page →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5" />
                Guest Information
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Full Name</p>
                <p className="font-medium text-gray-900">{booking.userId.name}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </p>
                  <p className="text-sm text-gray-900">{booking.userId.email}</p>
                </div>
                {booking.userId.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone
                    </p>
                    <p className="text-sm text-gray-900">{booking.userId.phone}</p>
                  </div>
                )}
              </div>
              {booking.specialRequests && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Special Requests</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Dates */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Stay Details
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Check-in</p>
                  <p className="font-semibold text-gray-900">{formatDate(booking.dateFrom)}</p>
                  <p className="text-xs text-gray-500 mt-1">After 2:00 PM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Check-out</p>
                  <p className="font-semibold text-gray-900">{formatDate(booking.dateTo)}</p>
                  <p className="text-xs text-gray-500 mt-1">Before 11:00 AM</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {booking.nights} {booking.nights === 1 ? 'Night' : 'Nights'}
                  </p>
                  {booking.daysUntilCheckIn >= 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {booking.daysUntilCheckIn === 0
                        ? 'Checking in today'
                        : `${booking.daysUntilCheckIn} days until check-in`}
                    </p>
                  )}
                </div>
              </div>
              {booking.numberOfGuests && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">Number of Guests</p>
                  <p className="font-medium text-gray-900">{booking.numberOfGuests}</p>
                </div>
              )}
            </div>
          </div>

          {/* Payment Timeline */}
          {booking.paymentHistory && booking.paymentHistory.length > 0 && (
            <PaymentTimeline paymentHistory={booking.paymentHistory} />
          )}
        </div>

        {/* Right Column - Payment Summary */}
        <div className="space-y-6">
          {/* Payment Summary Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Summary
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {/* Total Amount */}
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(booking.totalAmount || 0)}
                </p>
              </div>

              {/* Payment Breakdown */}
              {booking.isPartialPayment ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">Online Payment</p>
                      <p className="text-xs text-green-700">Completed</p>
                    </div>
                    <p className="font-semibold text-green-900">
                      {formatCurrency(booking.onlinePaymentAmount || 0)}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    booking.hotelPaymentStatus === 'collected'
                      ? 'bg-green-50'
                      : 'bg-orange-50'
                  }`}>
                    <div>
                      <p className={`text-sm font-medium ${
                        booking.hotelPaymentStatus === 'collected'
                          ? 'text-green-900'
                          : 'text-orange-900'
                      }`}>
                        At Property Payment
                      </p>
                      <p className={`text-xs ${
                        booking.hotelPaymentStatus === 'collected'
                          ? 'text-green-700'
                          : 'text-orange-700'
                      }`}>
                        {booking.hotelPaymentStatus === 'collected'
                          ? `Collected on ${formatDate(booking.hotelPaymentDate)}`
                          : 'Pending Collection'}
                      </p>
                    </div>
                    <p className={`font-semibold ${
                      booking.hotelPaymentStatus === 'collected'
                        ? 'text-green-900'
                        : 'text-orange-900'
                    }`}>
                      {formatCurrency(booking.hotelPaymentAmount || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-900">Full Payment</p>
                    <p className="text-xs text-green-700">Paid Online</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              )}

              {/* Collect Payment Button */}
              {booking.canCollectPayment && (
                <div className="pt-4">
                  <CollectPaymentButton
                    bookingId={booking._id}
                    amount={booking.hotelPaymentAmount || 0}
                    guestName={booking.userId.name}
                  />
                </div>
              )}

              {/* Download Receipt Button */}
              {booking.hotelPaymentStatus === 'collected' && (
                <div className="pt-4">
                  <a
                    href={`/api/os/bookings/${booking._id}/receipt`}
                    download
                    className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Banknote className="w-5 h-5" />
                    Download Receipt
                  </a>
                </div>
              )}

              {/* Booking Metadata */}
              <div className="pt-4 border-t border-gray-200 space-y-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Booked on {formatDateTime(booking.createdAt)}</span>
                </div>
                {booking.paymentMethod && (
                  <div className="flex items-center gap-2">
                    <Banknote className="w-3 h-3" />
                    <span className="capitalize">Payment via {booking.paymentMethod}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
