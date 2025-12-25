'use client';

import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RoomModalProps {
  propertyId: string;
  room?: any; // If provided, we're editing; otherwise, creating new
  roomTypes?: any[]; // Available room types for this property (optional, will fetch if not provided)
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RoomModal({
  propertyId,
  room,
  roomTypes: initialRoomTypes = [],
  onClose,
  onSuccess,
}: RoomModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomTypes, setRoomTypes] = useState(initialRoomTypes);
  const [fetchingRoomTypes, setFetchingRoomTypes] = useState(false);

  // Fetch room types if not provided
  useEffect(() => {
    if (roomTypes.length === 0 && !fetchingRoomTypes) {
      setFetchingRoomTypes(true);
      fetch(`/api/os/properties/${propertyId}/room-types`)
        .then(res => res.json())
        .then(data => {
          if (data.roomTypes) {
            setRoomTypes(data.roomTypes);
          }
        })
        .catch(err => {
          console.error('Error fetching room types:', err);
        })
        .finally(() => {
          setFetchingRoomTypes(false);
        });
    }
  }, [propertyId, roomTypes.length, fetchingRoomTypes]);

  // Form state
  const [formData, setFormData] = useState({
    roomTypeId: room?.roomTypeId?._id || room?.roomTypeId || '',
    roomNumber: room?.roomNumber || '',
    floor: room?.floor || 0,
    wing: room?.wing || '',
    block: room?.block || '',
    status: room?.status || 'available',
    condition: room?.condition || 'good',
    orientation: room?.orientation || '',
    view: room?.view || [],
    isBookable: room?.isBookable !== undefined ? room.isBookable : true,
    notes: room?.notes || '',

    // Size
    'actualSize.area': room?.actualSize?.area || 300,
    'actualSize.unit': room?.actualSize?.unit || 'sqft',

    // Beds
    'actualBeds.singleBeds': room?.actualBeds?.singleBeds || 0,
    'actualBeds.doubleBeds': room?.actualBeds?.doubleBeds || 0,
    'actualBeds.queenBeds': room?.actualBeds?.queenBeds || 0,
    'actualBeds.kingBeds': room?.actualBeds?.kingBeds || 1,
    'actualBeds.sofaBeds': room?.actualBeds?.sofaBeds || 0,
    'actualBeds.bunkBeds': room?.actualBeds?.bunkBeds || 0,

    // Amenities
    'specificAmenities.hasBalcony': room?.specificAmenities?.hasBalcony || false,
    'specificAmenities.hasTerrace': room?.specificAmenities?.hasTerrace || false,
    'specificAmenities.hasGarden': room?.specificAmenities?.hasGarden || false,
    'specificAmenities.hasKitchen': room?.specificAmenities?.hasKitchen || false,
    'specificAmenities.hasWorkDesk': room?.specificAmenities?.hasWorkDesk || false,
    'specificAmenities.hasSmartTV': room?.specificAmenities?.hasSmartTV || false,
    'specificAmenities.hasAC': room?.specificAmenities?.hasAC !== undefined ? room.specificAmenities.hasAC : true,
    'specificAmenities.hasMinibar': room?.specificAmenities?.hasMinibar || false,
    'specificAmenities.hasSafe': room?.specificAmenities?.hasSafe || false,
    'specificAmenities.hasJacuzzi': room?.specificAmenities?.hasJacuzzi || false,

    // Pricing
    baseRate: room?.pricing?.baseRate || 1000,
    seasonalMultiplier: room?.pricing?.seasonalMultiplier || 1,

    // Accessibility
    'accessibility.wheelchairAccessible': room?.accessibility?.wheelchairAccessible || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Transform flat form data into nested structure
      const payload = {
        roomTypeId: formData.roomTypeId,
        roomNumber: formData.roomNumber,
        floor: formData.floor,
        wing: formData.wing || undefined,
        block: formData.block || undefined,
        status: formData.status,
        condition: formData.condition,
        orientation: formData.orientation || undefined,
        view: formData.view,
        isBookable: formData.isBookable,
        notes: formData.notes,

        actualSize: {
          area: formData['actualSize.area'],
          unit: formData['actualSize.unit'],
        },

        actualBeds: {
          singleBeds: formData['actualBeds.singleBeds'],
          doubleBeds: formData['actualBeds.doubleBeds'],
          queenBeds: formData['actualBeds.queenBeds'],
          kingBeds: formData['actualBeds.kingBeds'],
          sofaBeds: formData['actualBeds.sofaBeds'],
          bunkBeds: formData['actualBeds.bunkBeds'],
        },

        specificAmenities: {
          hasBalcony: formData['specificAmenities.hasBalcony'],
          hasTerrace: formData['specificAmenities.hasTerrace'],
          hasGarden: formData['specificAmenities.hasGarden'],
          hasKitchen: formData['specificAmenities.hasKitchen'],
          hasWorkDesk: formData['specificAmenities.hasWorkDesk'],
          hasSmartTV: formData['specificAmenities.hasSmartTV'],
          hasAC: formData['specificAmenities.hasAC'],
          hasMinibar: formData['specificAmenities.hasMinibar'],
          hasSafe: formData['specificAmenities.hasSafe'],
          hasJacuzzi: formData['specificAmenities.hasJacuzzi'],
          customAmenities: [],
        },

        pricing: {
          baseRate: formData.baseRate,
          seasonalMultiplier: formData.seasonalMultiplier,
        },

        accessibility: {
          wheelchairAccessible: formData['accessibility.wheelchairAccessible'],
          features: [],
        },
      };

      const url = room
        ? `/api/os/rooms/${propertyId}/${room._id}`
        : `/api/os/rooms/${propertyId}`;

      const method = room ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save room');
      }

      // Success
      router.refresh();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving room:', err);
      setError(err.message || 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {room ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Type *
                </label>
                <select
                  name="roomTypeId"
                  value={formData.roomTypeId}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Room Type</option>
                  {roomTypes.map((type) => (
                    <option key={type._id} value={type._id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number *
                </label>
                <input
                  type="text"
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 101, A-201"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Floor *
                </label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wing
                </label>
                <input
                  type="text"
                  name="wing"
                  value={formData.wing}
                  onChange={handleChange}
                  placeholder="e.g., East Wing"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Block
                </label>
                <input
                  type="text"
                  name="block"
                  value={formData.block}
                  onChange={handleChange}
                  placeholder="e.g., Block A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="out_of_order">Out of Order</option>
                  <option value="reserved">Reserved</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                  <option value="needs_renovation">Needs Renovation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <select
                  name="orientation"
                  value={formData.orientation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Orientation</option>
                  <option value="north">North</option>
                  <option value="south">South</option>
                  <option value="east">East</option>
                  <option value="west">West</option>
                  <option value="northeast">Northeast</option>
                  <option value="northwest">Northwest</option>
                  <option value="southeast">Southeast</option>
                  <option value="southwest">Southwest</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isBookable"
                  checked={formData.isBookable}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">Room is Bookable</span>
              </label>
            </div>
          </div>

          {/* Size and Beds */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Size & Beds</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Size *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="actualSize.area"
                    value={formData['actualSize.area']}
                    onChange={handleChange}
                    required
                    min="1"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <select
                    name="actualSize.unit"
                    value={formData['actualSize.unit']}
                    onChange={handleChange}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="sqft">sqft</option>
                    <option value="sqm">sqm</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  King Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.kingBeds"
                  value={formData['actualBeds.kingBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Queen Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.queenBeds"
                  value={formData['actualBeds.queenBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Double Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.doubleBeds"
                  value={formData['actualBeds.doubleBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Single Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.singleBeds"
                  value={formData['actualBeds.singleBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sofa Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.sofaBeds"
                  value={formData['actualBeds.sofaBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bunk Beds
                </label>
                <input
                  type="number"
                  name="actualBeds.bunkBeds"
                  value={formData['actualBeds.bunkBeds']}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasAC"
                  checked={formData['specificAmenities.hasAC']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Air Conditioning</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasSmartTV"
                  checked={formData['specificAmenities.hasSmartTV']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Smart TV</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasBalcony"
                  checked={formData['specificAmenities.hasBalcony']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Balcony</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasTerrace"
                  checked={formData['specificAmenities.hasTerrace']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Terrace</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasKitchen"
                  checked={formData['specificAmenities.hasKitchen']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Kitchen</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasWorkDesk"
                  checked={formData['specificAmenities.hasWorkDesk']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Work Desk</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasMinibar"
                  checked={formData['specificAmenities.hasMinibar']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Minibar</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasSafe"
                  checked={formData['specificAmenities.hasSafe']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Safe</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasJacuzzi"
                  checked={formData['specificAmenities.hasJacuzzi']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Jacuzzi</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="specificAmenities.hasGarden"
                  checked={formData['specificAmenities.hasGarden']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Garden Access</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="accessibility.wheelchairAccessible"
                  checked={formData['accessibility.wheelchairAccessible']}
                  onChange={handleChange}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Wheelchair Accessible</span>
              </label>
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Rate (₹/night) *
                </label>
                <input
                  type="number"
                  name="baseRate"
                  value={formData.baseRate}
                  onChange={handleChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seasonal Multiplier
                </label>
                <input
                  type="number"
                  name="seasonalMultiplier"
                  value={formData.seasonalMultiplier}
                  onChange={handleChange}
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Any additional notes about this room..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                room ? 'Update Room' : 'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
