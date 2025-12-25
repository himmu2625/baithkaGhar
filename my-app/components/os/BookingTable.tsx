"use client";

import { Calendar, Clock, User, MapPin, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface Booking {
  _id: string;
  userId: {
    name: string;
    email: string;
    phone?: string;
  };
  propertyId: {
    title: string;
    location: string;
  };
  dateFrom: string;
  dateTo: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  isPartialPayment: boolean;
  onlinePaymentAmount?: number;
  hotelPaymentAmount?: number;
  hotelPaymentStatus?: string;
  createdAt: string;
}

interface BookingTableProps {
  bookings: Booking[];
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

function getStatusBadge(status: string) {
  const statusConfig = {
    confirmed: {
      icon: CheckCircle,
      className: 'bg-green-100 text-green-700',
      label: 'Confirmed'
    },
    pending: {
      icon: AlertCircle,
      className: 'bg-yellow-100 text-yellow-700',
      label: 'Pending'
    },
    completed: {
      icon: CheckCircle,
      className: 'bg-blue-100 text-blue-700',
      label: 'Completed'
    },
    cancelled: {
      icon: XCircle,
      className: 'bg-red-100 text-red-700',
      label: 'Cancelled'
    },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export default function BookingTable({ bookings }: BookingTableProps) {
  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Bookings Found</h3>
        <p className="text-gray-600">
          There are no bookings matching the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest & Property
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Check-in / Check-out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payment
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{booking.userId.name}</p>
                    </div>
                    <p className="text-sm text-gray-500">{booking.userId.email}</p>
                    {booking.userId.phone && (
                      <p className="text-sm text-gray-500">{booking.userId.phone}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                      <MapPin className="w-3 h-3" />
                      {booking.propertyId.title}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.dateFrom)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(booking.dateTo)}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(booking.totalAmount)}
                    </p>
                    {booking.isPartialPayment && (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-600">
                          Online: {formatCurrency(booking.onlinePaymentAmount || 0)}
                        </p>
                        <p className="text-xs text-orange-600 font-medium">
                          At Hotel: {formatCurrency(booking.hotelPaymentAmount || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(booking.status)}
                </td>
                <td className="px-6 py-4">
                  {booking.isPartialPayment ? (
                    <div>
                      <span className="text-xs text-orange-600 font-medium">Partial</span>
                      {booking.hotelPaymentStatus === 'pending' && (
                        <p className="text-xs text-gray-500 mt-1">Pending collection</p>
                      )}
                      {booking.hotelPaymentStatus === 'collected' && (
                        <p className="text-xs text-green-600 mt-1">Collected</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">Full Payment</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/os/bookings/${booking._id}`}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-gray-200">
        {bookings.map((booking) => (
          <div key={booking._id} className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="font-medium text-gray-900">{booking.userId.name}</p>
                <p className="text-sm text-gray-500">{booking.userId.email}</p>
              </div>
              {getStatusBadge(booking.status)}
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {booking.propertyId.title}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                {formatDate(booking.dateFrom)} - {formatDate(booking.dateTo)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </p>
                {booking.isPartialPayment && booking.hotelPaymentAmount && (
                  <p className="text-xs text-orange-600 mt-1">
                    {formatCurrency(booking.hotelPaymentAmount)} pending
                  </p>
                )}
              </div>
              <Link
                href={`/os/bookings/${booking._id}`}
                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
