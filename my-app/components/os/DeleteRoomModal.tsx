'use client';

import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DeleteRoomModalProps {
  room: any;
  propertyId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DeleteRoomModal({
  room,
  propertyId,
  onClose,
  onSuccess,
}: DeleteRoomModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/os/rooms/${propertyId}/${room._id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete room');
      }

      // Success
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error deleting room:', err);
      setError(err.message || 'Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Delete Room</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <p className="text-gray-700">
              Are you sure you want to delete this room? This action cannot be undone.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600">Room Number:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">
                  {room.roomNumber}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Room Type:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {room.roomTypeId?.name || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Floor:</span>
                <span className="ml-2 text-sm text-gray-900">Floor {room.floor}</span>
              </div>
              {room.wing && (
                <div>
                  <span className="text-sm font-medium text-gray-600">Wing:</span>
                  <span className="ml-2 text-sm text-gray-900">{room.wing}</span>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> If this room has active bookings, the deletion will
                fail. Make sure all bookings are completed or cancelled before deleting.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5" />
                Delete Room
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
