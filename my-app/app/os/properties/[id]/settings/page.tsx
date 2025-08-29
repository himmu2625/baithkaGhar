'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Save,
  Settings,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves,
  Wind,
  Tv,
  Bath,
  Users,
  Star,
  Image,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface PropertySettings {
  basicInfo: {
    name: string;
    title: string;
    description: string;
    propertyType: string;
    totalHotelRooms: string;
  };
  contactInfo: {
    contactNo: string;
    email: string;
    hotelEmail: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  pricing: {
    perNight: string;
    perWeek: string;
    perMonth: string;
  };
  amenities: {
    wifi: boolean;
    tv: boolean;
    kitchen: boolean;
    parking: boolean;
    ac: boolean;
    pool: boolean;
    geyser: boolean;
    shower: boolean;
    bathTub: boolean;
    reception24x7: boolean;
    roomService: boolean;
    restaurant: boolean;
    bar: boolean;
    pub: boolean;
    fridge: boolean;
  };
  policies: {
    policyDetails: string;
    minStay: string;
    maxStay: string;
  };
  status: {
    status: 'available' | 'unavailable' | 'maintenance' | 'deleted';
    isPublished: boolean;
    verificationStatus: 'pending' | 'approved' | 'rejected';
  };
}

export default function PropertySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [settings, setSettings] = useState<PropertySettings>({
    basicInfo: {
      name: '',
      title: '',
      description: '',
      propertyType: 'hotel',
      totalHotelRooms: '0'
    },
    contactInfo: {
      contactNo: '',
      email: '',
      hotelEmail: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India'
    },
    pricing: {
      perNight: '',
      perWeek: '',
      perMonth: ''
    },
    amenities: {
      wifi: false,
      tv: false,
      kitchen: false,
      parking: false,
      ac: false,
      pool: false,
      geyser: false,
      shower: false,
      bathTub: false,
      reception24x7: false,
      roomService: false,
      restaurant: false,
      bar: false,
      pub: false,
      fridge: false
    },
    policies: {
      policyDetails: '',
      minStay: '1',
      maxStay: '30'
    },
    status: {
      status: 'available',
      isPublished: false,
      verificationStatus: 'pending'
    }
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (propertyId) {
      fetchPropertySettings();
    }
  }, [propertyId]);

  const fetchPropertySettings = async () => {
    try {
      // Mock data - replace with actual API call
      const mockSettings: PropertySettings = {
        basicInfo: {
          name: 'Grand Plaza Hotel',
          title: 'Luxury Hotel in Downtown',
          description: 'A premier luxury hotel offering world-class amenities and exceptional service in the heart of the city. Perfect for business travelers and leisure guests alike.',
          propertyType: 'hotel',
          totalHotelRooms: '50'
        },
        contactInfo: {
          contactNo: '+91-11-12345678',
          email: 'info@grandplaza.com',
          hotelEmail: 'reservations@grandplaza.com'
        },
        address: {
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        pricing: {
          perNight: '5000',
          perWeek: '30000',
          perMonth: '120000'
        },
        amenities: {
          wifi: true,
          tv: true,
          kitchen: false,
          parking: true,
          ac: true,
          pool: true,
          geyser: true,
          shower: true,
          bathTub: true,
          reception24x7: true,
          roomService: true,
          restaurant: true,
          bar: true,
          pub: false,
          fridge: true
        },
        policies: {
          policyDetails: 'Check-in: 2:00 PM, Check-out: 11:00 AM. No smoking in rooms. Pets allowed with prior notice.',
          minStay: '1',
          maxStay: '30'
        },
        status: {
          status: 'available',
          isPublished: true,
          verificationStatus: 'approved'
        }
      };
      
      setSettings(mockSettings);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch property settings:', error);
      setLoading(false);
    }
  };

  const handleInputChange = (section: keyof PropertySettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving property settings:', settings);
      setHasChanges(false);
      
      // Show success message
      alert('Property settings saved successfully!');
    } catch (error) {
      console.error('Failed to save property settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    const icons: Record<string, React.ReactNode> = {
      wifi: <Wifi className="h-5 w-5" />,
      tv: <Tv className="h-5 w-5" />,
      kitchen: <Utensils className="h-5 w-5" />,
      parking: <Car className="h-5 w-5" />,
      ac: <Wind className="h-5 w-5" />,
      pool: <Waves className="h-5 w-5" />,
      geyser: <Bath className="h-5 w-5" />,
      shower: <Bath className="h-5 w-5" />,
      bathTub: <Bath className="h-5 w-5" />,
      reception24x7: <Clock className="h-5 w-5" />,
      roomService: <Shield className="h-5 w-5" />,
      restaurant: <Utensils className="h-5 w-5" />,
      bar: <Coffee className="h-5 w-5" />,
      pub: <Coffee className="h-5 w-5" />,
      fridge: <DollarSign className="h-5 w-5" />
    };
    return icons[amenity] || <CheckCircle className="h-5 w-5" />;
  };

  const formatAmenityName = (amenity: string) => {
    return amenity
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('24x7', '24/7');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/os/properties/${propertyId}`)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Property Settings</h1>
            <p className="text-gray-600">Configure your property details and preferences</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/os/properties/${propertyId}`)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">You have unsaved changes</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Make sure to save your changes before leaving this page.
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'basic', name: 'Basic Info', icon: Building2 },
              { id: 'contact', name: 'Contact', icon: Phone },
              { id: 'pricing', name: 'Pricing', icon: DollarSign },
              { id: 'amenities', name: 'Amenities', icon: Star },
              { id: 'policies', name: 'Policies', icon: FileText },
              { id: 'status', name: 'Status', icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Name *
                  </label>
                  <input
                    type="text"
                    value={settings.basicInfo.name}
                    onChange={(e) => handleInputChange('basicInfo', 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter property name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={settings.basicInfo.propertyType}
                    onChange={(e) => handleInputChange('basicInfo', 'propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hotel">Hotel</option>
                    <option value="apartment">Apartment</option>
                    <option value="villa">Villa</option>
                    <option value="resort">Resort</option>
                    <option value="house">House</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title/Tagline *
                </label>
                <input
                  type="text"
                  value={settings.basicInfo.title}
                  onChange={(e) => handleInputChange('basicInfo', 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter a catchy title for your property"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  rows={4}
                  value={settings.basicInfo.description}
                  onChange={(e) => handleInputChange('basicInfo', 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your property in detail"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Rooms *
                  </label>
                  <input
                    type="number"
                    value={settings.basicInfo.totalHotelRooms}
                    onChange={(e) => handleInputChange('basicInfo', 'totalHotelRooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Number of rooms"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={settings.address.street}
                    onChange={(e) => handleInputChange('address', 'street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Street address"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={settings.address.city}
                    onChange={(e) => handleInputChange('address', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="City"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={settings.address.state}
                    onChange={(e) => handleInputChange('address', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="State"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    value={settings.address.zipCode}
                    onChange={(e) => handleInputChange('address', 'zipCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ZIP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <select
                    value={settings.address.country}
                    onChange={(e) => handleInputChange('address', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="India">India</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={settings.contactInfo.contactNo}
                    onChange={(e) => handleInputChange('contactInfo', 'contactNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91-11-12345678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Primary Email *
                  </label>
                  <input
                    type="email"
                    value={settings.contactInfo.email}
                    onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="info@property.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Hotel/Reservation Email
                </label>
                <input
                  type="email"
                  value={settings.contactInfo.hotelEmail}
                  onChange={(e) => handleInputChange('contactInfo', 'hotelEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="reservations@property.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Separate email for booking confirmations and guest communications
                </p>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <DollarSign className="h-5 w-5" />
                  <span className="font-medium">Base Pricing Configuration</span>
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  Set your base rates. Individual room rates can be configured separately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Per Night Rate (₹) *
                  </label>
                  <input
                    type="number"
                    value={settings.pricing.perNight}
                    onChange={(e) => handleInputChange('pricing', 'perNight', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weekly Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.pricing.perWeek}
                    onChange={(e) => handleInputChange('pricing', 'perWeek', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="30000"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Rate (₹)
                  </label>
                  <input
                    type="number"
                    value={settings.pricing.perMonth}
                    onChange={(e) => handleInputChange('pricing', 'perMonth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="120000"
                    min="0"
                  />
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Pricing Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Weekly rates should offer 10-15% discount compared to nightly rate × 7</li>
                  <li>• Monthly rates should offer 20-25% discount compared to nightly rate × 30</li>
                  <li>• Consider seasonal pricing adjustments in your room management</li>
                  <li>• Review competitor pricing regularly to stay competitive</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'amenities' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <Star className="h-5 w-5" />
                  <span className="font-medium">Property Amenities</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  Select all amenities available at your property to help guests make informed decisions.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(settings.amenities).map(([amenity, enabled]) => (
                  <div key={amenity} className="flex items-center gap-3">
                    <button
                      onClick={() => handleInputChange('amenities', amenity, !enabled)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                        enabled 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {getAmenityIcon(amenity)}
                      <span className="text-sm font-medium">
                        {formatAmenityName(amenity)}
                      </span>
                      {enabled ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Policies & Rules *
                </label>
                <textarea
                  rows={6}
                  value={settings.policies.policyDetails}
                  onChange={(e) => handleInputChange('policies', 'policyDetails', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter check-in/check-out times, smoking policy, pet policy, etc."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include check-in/out times, smoking policy, pet policy, and any other important rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Minimum Stay (nights) *
                  </label>
                  <input
                    type="number"
                    value={settings.policies.minStay}
                    onChange={(e) => handleInputChange('policies', 'minStay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Stay (nights) *
                  </label>
                  <input
                    type="number"
                    value={settings.policies.maxStay}
                    onChange={(e) => handleInputChange('policies', 'maxStay', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max="365"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Status
                  </label>
                  <select
                    value={settings.status.status}
                    onChange={(e) => handleInputChange('status', 'status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="maintenance">Under Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Published Status
                  </label>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => handleInputChange('status', 'isPublished', !settings.status.isPublished)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        settings.status.isPublished 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {settings.status.isPublished ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                      {settings.status.isPublished ? 'Published' : 'Draft'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Status
                  </label>
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                    settings.status.verificationStatus === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : settings.status.verificationStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {settings.status.verificationStatus === 'approved' && <CheckCircle className="h-4 w-4 mr-1" />}
                    {settings.status.verificationStatus === 'pending' && <Clock className="h-4 w-4 mr-1" />}
                    {settings.status.verificationStatus === 'rejected' && <AlertCircle className="h-4 w-4 mr-1" />}
                    {settings.status.verificationStatus.charAt(0).toUpperCase() + settings.status.verificationStatus.slice(1)}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Status Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Available:</strong> Property is ready for bookings</li>
                  <li>• <strong>Unavailable:</strong> Temporarily not accepting bookings</li>
                  <li>• <strong>Maintenance:</strong> Under renovation or repair</li>
                  <li>• <strong>Published:</strong> Visible to guests on booking platforms</li>
                  <li>• <strong>Verification:</strong> Admin approval status for your property</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}