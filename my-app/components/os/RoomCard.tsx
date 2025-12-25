'use client';

import {
  Bed,
  Users,
  Maximize,
  Edit,
  Trash2,
  CheckCircle,
  DoorOpen,
  Wrench,
  Sparkles,
  AlertCircle,
  Home,
  IndianRupee,
  Wifi,
  Tv,
  Wind,
  Coffee,
  UtensilsCrossed,
} from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import RoomModal from './RoomModal';
import DeleteRoomModal from './DeleteRoomModal';

interface RoomCardProps {
  room: any;
  propertyId: string;
}

function getStatusConfig(status: string) {
  const configs: Record<string, { className: string; icon: any; label: string }> = {
    available: {
      className: 'bg-green-100 text-green-700 border-green-200',
      icon: CheckCircle,
      label: 'Available',
    },
    occupied: {
      className: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: DoorOpen,
      label: 'Occupied',
    },
    maintenance: {
      className: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: Wrench,
      label: 'Maintenance',
    },
    cleaning: {
      className: 'bg-purple-100 text-purple-700 border-purple-200',
      icon: Sparkles,
      label: 'Cleaning',
    },
    out_of_order: {
      className: 'bg-red-100 text-red-700 border-red-200',
      icon: AlertCircle,
      label: 'Out of Order',
    },
    reserved: {
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: Home,
      label: 'Reserved',
    },
  };

  return configs[status] || configs.available;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function RoomCard({ room, propertyId }: RoomCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const statusConfig = getStatusConfig(room.status);
  const StatusIcon = statusConfig.icon;

  const roomImage = room.roomTypeId?.images?.[0]?.url || room.roomTypeId?.images?.[0] || null;

  const totalBeds =
    (room.actualBeds?.singleBeds || 0) +
    (room.actualBeds?.doubleBeds || 0) +
    (room.actualBeds?.queenBeds || 0) +
    (room.actualBeds?.kingBeds || 0) +
    (room.actualBeds?.sofaBeds || 0) +
    (room.actualBeds?.bunkBeds || 0);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Room Image */}
        {roomImage && (
          <div className="relative h-40 w-full">
            <Image
              src={roomImage}
              alt={`Room ${room.roomNumber}`}
              fill
              className="object-cover"
            />
            {/* Status Badge Overlay */}
            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusConfig.label}
              </span>
            </div>
          </div>
        )}

        {/* Room Details */}
        <div className="p-4">
          {/* Room Number and Type */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-gray-900">Room {room.roomNumber}</h3>
              {!room.isBookable && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  Not Bookable
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">{room.roomTypeId?.name || 'Standard Room'}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              {room.floor !== undefined && <span>Floor {room.floor}</span>}
              {room.wing && <span>• {room.wing}</span>}
              {room.block && <span>• {room.block}</span>}
            </div>
          </div>

          {/* Room Stats */}
          <div className="grid grid-cols-3 gap-3 mb-3 pb-3 border-b border-gray-200">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Bed className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500">
                {totalBeds} {totalBeds === 1 ? 'Bed' : 'Beds'}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500">
                {room.roomTypeId?.maxGuests || 2} Guests
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                <Maximize className="w-4 h-4" />
              </div>
              <p className="text-xs text-gray-500">
                {room.actualSize?.area || 0} {room.actualSize?.unit || 'sqft'}
              </p>
            </div>
          </div>

          {/* Amenities */}
          {room.specificAmenities && (
            <div className="flex flex-wrap gap-2 mb-3">
              {room.specificAmenities.hasAC && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Wind className="w-3 h-3" />
                  AC
                </span>
              )}
              {room.specificAmenities.hasSmartTV && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Tv className="w-3 h-3" />
                  TV
                </span>
              )}
              {room.specificAmenities.hasKitchen && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <UtensilsCrossed className="w-3 h-3" />
                  Kitchen
                </span>
              )}
              {room.specificAmenities.hasMinibar && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                  <Coffee className="w-3 h-3" />
                  Minibar
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-center gap-1 text-gray-600 mb-1">
              <IndianRupee className="w-4 h-4" />
              <span className="text-sm font-medium">Base Rate</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(room.pricing?.baseRate || 0)}
              <span className="text-sm font-normal text-gray-500">/night</span>
            </p>
          </div>

          {/* Current Booking Info */}
          {room.currentBooking && room.currentBooking.bookingId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-3">
              <p className="text-xs font-medium text-blue-900 mb-1">Current Guest</p>
              <p className="text-xs text-blue-700">{room.currentBooking.guestName}</p>
              <p className="text-xs text-blue-600">
                {new Date(room.currentBooking.checkIn).toLocaleDateString()} -{' '}
                {new Date(room.currentBooking.checkOut).toLocaleDateString()}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showEditModal && (
        <RoomModal
          propertyId={propertyId}
          room={room}
          roomTypes={[]} // Will be fetched inside modal or passed from parent
          onClose={() => setShowEditModal(false)}
          onSuccess={() => setShowEditModal(false)}
        />
      )}

      {showDeleteModal && (
        <DeleteRoomModal
          room={room}
          propertyId={propertyId}
          onClose={() => setShowDeleteModal(false)}
          onSuccess={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
