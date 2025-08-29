'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Building2, 
  MapPin,
  Star,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Edit,
  Settings,
  Bed,
  DollarSign,
  Phone,
  Mail,
  Globe,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves,
  Wind,
  Tv,
  Bath,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3
} from 'lucide-react';

interface Property {
  _id: string;
  name: string;
  title: string;
  description: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactNo: string;
  email: string;
  hotelEmail?: string;
  propertyType: string;
  status: 'available' | 'unavailable' | 'maintenance' | 'deleted';
  totalHotelRooms: string;
  rating: number;
  reviewCount: number;
  pricing: {
    perNight: string;
    perWeek: string;
    perMonth: string;
  };
  generalAmenities: {
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
  propertyUnits: Array<{
    unitTypeName: string;
    unitTypeCode: string;
    count: number;
    pricing: {
      price: string;
      pricePerWeek: string;
      pricePerMonth: string;
    };
  }>;
  isPublished: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  occupancyRate?: number;
  revenue?: number;
  createdAt: string;
  updatedAt: string;
}

interface RoomStatus {
  available: number;
  occupied: number;
  maintenance: number;
  cleaning: number;
  total: number;
}

interface RecentActivity {
  id: string;
  type: 'booking' | 'maintenance' | 'cleaning' | 'status';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'success' | 'error';
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [property, setProperty] = useState<Property | null>(null);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>({
    available: 0,
    occupied: 0,
    maintenance: 0,
    cleaning: 0,
    total: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (propertyId) {
      fetchPropertyDetails();
      fetchRoomStatus();
      fetchRecentActivity();
    }
  }, [propertyId]);

  const fetchPropertyDetails = async () => {
    try {
      // Mock property data - replace with actual API call
      const mockProperty: Property = {
        _id: propertyId,
        name: 'Grand Plaza Hotel',
        title: 'Luxury Hotel in Downtown',
        description: 'A premier luxury hotel offering world-class amenities and exceptional service in the heart of the city. Perfect for business travelers and leisure guests alike.',
        address: {
          street: '123 Main Street',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          country: 'India'
        },
        contactNo: '+91-11-12345678',
        email: 'info@grandplaza.com',
        hotelEmail: 'reservations@grandplaza.com',
        propertyType: 'hotel',
        status: 'available',
        totalHotelRooms: '50',
        rating: 4.5,
        reviewCount: 247,
        pricing: {
          perNight: '5000',
          perWeek: '30000',
          perMonth: '120000'
        },
        generalAmenities: {
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
        propertyUnits: [
          {
            unitTypeName: 'Standard Room',
            unitTypeCode: 'STD',
            count: 25,
            pricing: {
              price: '4000',
              pricePerWeek: '25000',
              pricePerMonth: '100000'
            }
          },
          {
            unitTypeName: 'Deluxe Room',
            unitTypeCode: 'DLX',
            count: 15,
            pricing: {
              price: '6000',
              pricePerWeek: '35000',
              pricePerMonth: '140000'
            }
          },
          {
            unitTypeName: 'Suite',
            unitTypeCode: 'STE',
            count: 10,
            pricing: {
              price: '10000',
              pricePerWeek: '60000',
              pricePerMonth: '240000'
            }
          }
        ],
        isPublished: true,
        verificationStatus: 'approved',
        occupancyRate: 85,
        revenue: 450000,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-08-25T00:00:00.000Z'
      };
      
      setProperty(mockProperty);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch property details:', error);
      setLoading(false);
    }
  };

  const fetchRoomStatus = async () => {
    try {
      // Mock room status data
      setRoomStatus({
        available: 42,
        occupied: 35,
        maintenance: 2,
        cleaning: 1,
        total: 50
      });
    } catch (error) {
      console.error('Failed to fetch room status:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Mock recent activity data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'booking',
          message: 'New booking received for Suite 301 - Check-in: Dec 15, 2024',
          timestamp: '2 hours ago',
          severity: 'success'
        },
        {
          id: '2',
          type: 'maintenance',
          message: 'AC repair completed in Room 205',
          timestamp: '4 hours ago',
          severity: 'info'
        },
        {
          id: '3',
          type: 'cleaning',
          message: 'Housekeeping completed for Floor 2 - 10 rooms cleaned',
          timestamp: '6 hours ago',
          severity: 'info'
        },
        {
          id: '4',
          type: 'status',
          message: 'Room 102 marked as out of service - plumbing issue',
          timestamp: '1 day ago',
          severity: 'warning'
        }
      ];
      
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
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

  const getActivityIcon = (type: string, severity: string) => {
    const baseClass = "h-4 w-4";
    switch (type) {
      case 'booking':
        return <Calendar className={`${baseClass} text-green-600`} />;
      case 'maintenance':
        return <Settings className={`${baseClass} text-orange-600`} />;
      case 'cleaning':
        return <Shield className={`${baseClass} text-blue-600`} />;
      case 'status':
        return severity === 'warning' ? 
          <AlertCircle className={`${baseClass} text-red-600`} /> : 
          <Activity className={`${baseClass} text-gray-600`} />;
      default:
        return <Activity className={`${baseClass} text-gray-600`} />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Property not found</h3>
          <button
            onClick={() => router.push('/os/properties')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Properties
          </button>
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
            onClick={() => router.push('/os/properties')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{property.name}</h1>
            <p className="text-gray-600">{property.title}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/os/properties/${propertyId}/edit`)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </button>
          <button
            onClick={() => router.push(`/os/properties/${propertyId}/settings`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: Building2 },
            { id: 'rooms', name: 'Rooms', icon: Bed },
            { id: 'analytics', name: 'Analytics', icon: BarChart3 },
            { id: 'activity', name: 'Activity', icon: Activity }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Property Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-900">
                      <div>{property.address.street}</div>
                      <div>{property.address.city}, {property.address.state} {property.address.zipCode}</div>
                      <div>{property.address.country}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600">Contact Information</label>
                  <div className="space-y-2 mt-1">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {property.contactNo}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {property.email}
                    </div>
                    {property.hotelEmail && (
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Globe className="h-4 w-4 text-gray-400" />
                        {property.hotelEmail}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-sm text-gray-900 mt-1">{property.description}</p>
              </div>
            </div>

            {/* Room Types */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Room Types & Pricing</h3>
              <div className="space-y-4">
                {property.propertyUnits.map((unit, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">{unit.unitTypeName}</h4>
                        <p className="text-sm text-gray-600">Code: {unit.unitTypeCode}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {unit.count} rooms
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Per Night:</span>
                        <span className="ml-1 font-medium">₹{unit.pricing.price}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Per Week:</span>
                        <span className="ml-1 font-medium">₹{unit.pricing.pricePerWeek}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Per Month:</span>
                        <span className="ml-1 font-medium">₹{unit.pricing.pricePerMonth}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Amenities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(property.generalAmenities).map(([amenity, available]) => (
                  <div key={amenity} className={`flex items-center gap-2 ${available ? 'text-green-600' : 'text-gray-400'}`}>
                    {available ? getAmenityIcon(amenity) : <XCircle className="h-5 w-5" />}
                    <span className="text-sm capitalize">{amenity.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Property Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.status === 'available' ? 'bg-green-100 text-green-800' :
                    property.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {property.status.charAt(0).toUpperCase() + property.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Published</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {property.isPublished ? 'Yes' : 'No'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verification</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    property.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    property.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {property.verificationStatus.charAt(0).toUpperCase() + property.verificationStatus.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span className="text-sm font-medium">{property.rating}</span>
                    <span className="text-xs text-gray-500">({property.reviewCount})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Rooms</span>
                  <span className="font-medium">{property.totalHotelRooms}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Occupancy Rate</span>
                  <span className="font-medium text-green-600">{property.occupancyRate}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-medium text-green-600">₹{property.revenue?.toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Property Type</span>
                  <span className="font-medium capitalize">{property.propertyType}</span>
                </div>
              </div>
            </div>

            {/* Room Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Room Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    Available
                  </span>
                  <span className="font-medium">{roomStatus.available}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    Occupied
                  </span>
                  <span className="font-medium">{roomStatus.occupied}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    Maintenance
                  </span>
                  <span className="font-medium">{roomStatus.maintenance}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                    Cleaning
                  </span>
                  <span className="font-medium">{roomStatus.cleaning}</span>
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-900">Total</span>
                    <span className="font-medium">{roomStatus.total}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => router.push(`/os/properties/${propertyId}/rooms`)}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Manage Rooms
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-12">
            <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Room Management</h3>
            <p className="text-gray-600 mb-4">Detailed room management interface will be implemented here</p>
            <button
              onClick={() => router.push(`/os/properties/${propertyId}/rooms`)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Go to Room Management
            </button>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">Property analytics and reporting will be implemented here</p>
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                {getActivityIcon(activity.type, activity.severity)}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}