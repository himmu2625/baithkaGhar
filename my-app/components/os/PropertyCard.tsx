"use client";

import { Building2, MapPin, Calendar, TrendingUp, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface PropertyCardProps {
  property: {
    _id: string;
    title: string;
    slug: string;
    location: string;
    address?: {
      city?: string;
      state?: string;
    };
    propertyImage?: string;
    price?: number;
    status: string;
    activeBookings: number;
    totalBookings: number;
    monthlyRevenue: number;
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    deleted: 'bg-red-100 text-red-700',
  };

  const statusColor = statusColors[property.status as keyof typeof statusColors] || statusColors.active;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Property Image */}
      <div className="relative h-48 bg-gray-200">
        {property.propertyImage ? (
          <Image
            src={property.propertyImage}
            alt={property.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Property Details */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
          {property.title}
        </h3>

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">
            {property.address?.city && property.address?.state
              ? `${property.address.city}, ${property.address.state}`
              : property.location}
          </span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-1">Active</p>
            <p className="text-sm font-semibold text-gray-900">{property.activeBookings}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total</p>
            <p className="text-sm font-semibold text-gray-900">{property.totalBookings}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Revenue</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(property.monthlyRevenue)}
            </p>
          </div>
        </div>

        {/* Price */}
        {property.price && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Starting Price</p>
            <p className="text-xl font-bold text-indigo-600">
              {formatCurrency(property.price)}
              <span className="text-sm text-gray-500 font-normal">/night</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/os/properties/${property._id}`}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors text-center"
          >
            Manage Property
          </Link>
          <Link
            href={`/property/${property.slug}`}
            target="_blank"
            className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
