import { requireOwnerAuth } from '@/lib/auth/os-auth';
import {
  Building2,
  Plus,
  Bed,
  MapPin,
  DoorOpen,
  AlertCircle,
  CheckCircle,
  Wrench,
  Sparkles,
  Home,
  IndianRupee,
} from 'lucide-react';
import Link from 'next/link';
import RoomCard from '@/components/os/RoomCard';

async function getPropertyRooms(propertyId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/rooms/${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch rooms:', response.statusText);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return null;
  }
}

async function getPropertyDetails(propertyId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/os/properties/${propertyId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.property;
  } catch (error) {
    console.error('Error fetching property:', error);
    return null;
  }
}

function getStatusConfig(status: string) {
  const configs: Record<string, { className: string; icon: any; label: string }> = {
    available: {
      className: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      label: 'Available',
    },
    occupied: {
      className: 'bg-blue-100 text-blue-700',
      icon: DoorOpen,
      label: 'Occupied',
    },
    maintenance: {
      className: 'bg-orange-100 text-orange-700',
      icon: Wrench,
      label: 'Maintenance',
    },
    cleaning: {
      className: 'bg-purple-100 text-purple-700',
      icon: Sparkles,
      label: 'Cleaning',
    },
    out_of_order: {
      className: 'bg-red-100 text-red-700',
      icon: AlertCircle,
      label: 'Out of Order',
    },
    reserved: {
      className: 'bg-yellow-100 text-yellow-700',
      icon: Home,
      label: 'Reserved',
    },
  };

  return configs[status] || configs.available;
}

export default async function PropertyRoomsPage({ params }: { params: { id: string } }) {
  await requireOwnerAuth();

  const [data, property] = await Promise.all([
    getPropertyRooms(params.id),
    getPropertyDetails(params.id),
  ]);

  if (!data || !property) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Load Data</h3>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { rooms, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href={`/os/properties/${params.id}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Property
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="w-7 h-7" />
            Room Management
          </h1>
          <p className="text-sm text-gray-600 mt-1">{property.title}</p>
        </div>
        <Link
          href={`/os/properties/${params.id}/rooms/new`}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Room
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Total Rooms</p>
            <Building2 className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Available</p>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.byStatus?.available || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Occupied</p>
            <DoorOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.byStatus?.occupied || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Maintenance</p>
            <Wrench className="w-4 h-4 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {stats.byStatus?.maintenance || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Cleaning</p>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats.byStatus?.cleaning || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-600">Reserved</p>
            <Home className="w-4 h-4 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {stats.byStatus?.reserved || 0}
          </p>
        </div>
      </div>

      {/* Rooms Grid */}
      {rooms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room: any) => (
            <RoomCard key={room._id} room={room} propertyId={params.id} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 border border-gray-200 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Rooms Yet</h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first room to this property.
          </p>
          <Link
            href={`/os/properties/${params.id}/rooms/new`}
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add First Room
          </Link>
        </div>
      )}
    </div>
  );
}
