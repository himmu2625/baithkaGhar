import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  Building2,
  MapPin,
  Users,
  Bed,
  Bath,
  TrendingUp,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Star
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

async function getPropertyDetails(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/properties/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch property:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.property;
  } catch (error) {
    console.error('Error fetching property:', error);
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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  await requireOwnerAuth();
  const property = await getPropertyDetails(params.id);

  if (!property) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property Not Found</h3>
          <p className="text-gray-600 mb-6">
            The property you're looking for doesn't exist or you don't have access to it.
          </p>
          <Link
            href="/os/properties"
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Properties
          </Link>
        </div>
      </div>
    );
  }

  const propertyImage = property.images?.[0] || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/os/properties"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Properties
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{property.title}</h1>
          <div className="flex items-center gap-2 mt-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{property.location}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/property/${property.slug}`}
            target="_blank"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            View Public Page
          </Link>
          <Link
            href={`/os/properties/${property._id}/edit`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Edit Property
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Bookings</p>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {property.stats.totalBookings}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Active Bookings</p>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {property.stats.activeBookings}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(property.stats.totalRevenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Occupancy Rate</p>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {property.stats.occupancyRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Avg Rating</p>
            <Star className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {property.stats.averageRating.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{property.reviewCount} reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Property Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Image and Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {propertyImage && (
              <div className="relative h-64 bg-gray-200">
                <Image
                  src={propertyImage}
                  alt={property.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{property.description}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Guests</p>
                    </div>
                    <p className="font-medium text-gray-900">{property.maxGuests}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Bedrooms</p>
                    </div>
                    <p className="font-medium text-gray-900">{property.bedrooms}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bed className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Beds</p>
                    </div>
                    <p className="font-medium text-gray-900">{property.beds}</p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bath className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600">Bathrooms</p>
                    </div>
                    <p className="font-medium text-gray-900">{property.bathrooms}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Address
            </h2>
            <div className="space-y-2 text-gray-900">
              {property.address?.street && <p>{property.address.street}</p>}
              <p>
                {property.address?.city && `${property.address.city}, `}
                {property.address?.state && `${property.address.state} `}
                {property.address?.zipCode}
              </p>
              {property.address?.country && <p>{property.address.country}</p>}
            </div>
            {property.googleMapLink && (
              <a
                href={property.googleMapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View on Google Maps →
              </a>
            )}
          </div>

          {/* Amenities */}
          {property.amenities && property.amenities.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Bookings */}
          {property.recentBookings && property.recentBookings.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {property.recentBookings.map((booking: any) => (
                  <Link
                    key={booking._id}
                    href={`/os/bookings/${booking._id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {booking.userId?.name || 'Guest'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatDate(booking.dateFrom)} - {formatDate(booking.dateTo)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(booking.totalAmount || 0)}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Price</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(property.price?.base || property.price || 0)}/night
                </span>
              </div>
              {property.price?.cleaning && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Cleaning Fee</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(property.price.cleaning)}
                  </span>
                </div>
              )}
              {property.price?.service && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Service Fee</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(property.price.service)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Property Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Published</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    property.isPublished
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {property.isPublished ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Available</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    property.isAvailable
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {property.isAvailable ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Verification</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    property.verificationStatus === 'approved'
                      ? 'bg-green-100 text-green-700'
                      : property.verificationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {property.verificationStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              {property.name && (
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{property.name}</p>
                </div>
              )}
              {property.contactNo && (
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{property.contactNo}</p>
                </div>
              )}
              {property.email && (
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{property.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-6 border border-indigo-100">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/os/properties/${property._id}/edit`}
                className="block w-full px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm font-medium"
              >
                Edit Property
              </Link>
              <Link
                href={`/os/bookings?propertyId=${property._id}`}
                className="block w-full px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm font-medium"
              >
                View All Bookings
              </Link>
              <Link
                href={`/os/reports?propertyId=${property._id}`}
                className="block w-full px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm font-medium"
              >
                View Reports
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
