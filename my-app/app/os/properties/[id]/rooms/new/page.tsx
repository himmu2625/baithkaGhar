'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import RoomModal from '@/components/os/RoomModal';

export default function NewRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch room types for this property
    const fetchRoomTypes = async () => {
      try {
        const response = await fetch(`/api/os/properties/${params.id}/room-types`);
        if (response.ok) {
          const data = await response.json();
          setRoomTypes(data.roomTypes || []);
        }
      } catch (error) {
        console.error('Error fetching room types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomTypes();
  }, [params.id]);

  const handleClose = () => {
    router.push(`/os/properties/${params.id}/rooms`);
  };

  const handleSuccess = () => {
    router.push(`/os/properties/${params.id}/rooms`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={handleClose}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Rooms
        </button>

        <RoomModal
          propertyId={params.id}
          roomTypes={roomTypes}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
