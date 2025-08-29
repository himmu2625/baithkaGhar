'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Bed,
  Users,
  DollarSign,
  Square,
  Star,
  Eye,
  Edit,
  Copy,
  Trash2,
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Image,
  Wifi,
  Tv,
  Car,
  Coffee,
  Wind,
  Bath,
  Shield,
  Calendar,
  Tags,
  Home
} from 'lucide-react';

interface RoomType {
  _id: string;
  name: string;
  code: string;
  description: string;
  category: 'standard' | 'deluxe' | 'suite' | 'presidential' | 'economy' | 'family' | 'accessible';
  maxOccupancy: {
    adults: number;
    children: number;
    total: number;
  };
  bedConfiguration: {
    singleBeds: number;
    doubleBeds: number;
    queenBeds: number;
    kingBeds: number;
    sofaBeds: number;
    bunkBeds: number;
    totalBeds: number;
  };
  roomSize: {
    area: number;
    unit: 'sqft' | 'sqm';
  };
  basePrice: {
    perNight: number;
    perWeek: number;
    perMonth: number;
    currency: string;
  };
  amenities: {
    bathroom: {
      privateBathroom: boolean;
      bathtub: boolean;
      shower: boolean;
      toiletries: boolean;
      hairDryer: boolean;
      slippers: boolean;
      bathrobes: boolean;
    };
    technology: {
      wifi: boolean;
      tv: boolean;
      cableChannels: boolean;
      smartTV: boolean;
      soundSystem: boolean;
      gamingConsole: boolean;
      workDesk: boolean;
      laptop: boolean;
    };
    comfort: {
      airConditioning: boolean;
      heating: boolean;
      fan: boolean;
      blackoutCurtains: boolean;
      soundproofing: boolean;
      balcony: boolean;
      terrace: boolean;
      garden: boolean;
    };
    kitchen: {
      fullKitchen: boolean;
      kitchenette: boolean;
      microwave: boolean;
      refrigerator: boolean;
      coffeemaker: boolean;
      teaKettle: boolean;
      dishwasher: boolean;
      cookingBasics: boolean;
    };
    safety: {
      smokeDector: boolean;
      carbonMonoxideDetector: boolean;
      fireExtinguisher: boolean;
      firstAidKit: boolean;
      safe: boolean;
      securityCamera: boolean;
      keylessEntry: boolean;
    };
  };
  inventory: {
    totalRooms: number;
    availableRooms: number;
    maintenanceRooms: number;
    bookedRooms: number;
  };
  occupancyRate: number;
  availabilityRate: number;
  policies: {
    smokingAllowed: boolean;
    petsAllowed: boolean;
    maxPetWeight?: number;
    petFee?: number;
    eventsAllowed: boolean;
    partiesAllowed: boolean;
    additionalGuestFee?: number;
    maxAdditionalGuests: number;
  };
  isActive: boolean;
  isBookable: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface RoomTypeStats {
  totalTypes: number;
  activeTypes: number;
  totalRooms: number;
  averageOccupancyRate: number;
  totalRevenue: number;
  averagePrice: number;
}

export default function RoomTypeManagementPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [stats, setStats] = useState<RoomTypeStats>({
    totalTypes: 0,
    activeTypes: 0,
    totalRooms: 0,
    averageOccupancyRate: 0,
    totalRevenue: 0,
    averagePrice: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>([]);

  useEffect(() => {
    if (propertyId) {
      fetchRoomTypes();
      fetchStats();
    }
  }, [propertyId]);

  const fetchRoomTypes = async () => {
    try {
      // Mock room type data - replace with actual API call
      const mockRoomTypes: RoomType[] = [
        {
          _id: 'rt1',
          name: 'Standard Room',
          code: 'STD',
          description: 'Comfortable and affordable rooms with all basic amenities for a pleasant stay.',
          category: 'standard',
          maxOccupancy: { adults: 2, children: 1, total: 3 },
          bedConfiguration: {
            singleBeds: 0,
            doubleBeds: 1,
            queenBeds: 0,
            kingBeds: 0,
            sofaBeds: 0,
            bunkBeds: 0,
            totalBeds: 1
          },
          roomSize: { area: 250, unit: 'sqft' },
          basePrice: {
            perNight: 4000,
            perWeek: 25000,
            perMonth: 100000,
            currency: 'INR'
          },
          amenities: {
            bathroom: {
              privateBathroom: true,
              bathtub: false,
              shower: true,
              toiletries: true,
              hairDryer: true,
              slippers: false,
              bathrobes: false
            },
            technology: {
              wifi: true,
              tv: true,
              cableChannels: true,
              smartTV: false,
              soundSystem: false,
              gamingConsole: false,
              workDesk: true,
              laptop: false
            },
            comfort: {
              airConditioning: true,
              heating: false,
              fan: true,
              blackoutCurtains: true,
              soundproofing: false,
              balcony: false,
              terrace: false,
              garden: false
            },
            kitchen: {
              fullKitchen: false,
              kitchenette: false,
              microwave: false,
              refrigerator: true,
              coffeemaker: true,
              teaKettle: true,
              dishwasher: false,
              cookingBasics: false
            },
            safety: {
              smokeDector: true,
              carbonMonoxideDetector: false,
              fireExtinguisher: true,
              firstAidKit: true,
              safe: true,
              securityCamera: false,
              keylessEntry: true
            }
          },
          inventory: {
            totalRooms: 25,
            availableRooms: 18,
            maintenanceRooms: 2,
            bookedRooms: 5
          },
          occupancyRate: 20,
          availabilityRate: 72,
          policies: {
            smokingAllowed: false,
            petsAllowed: false,
            eventsAllowed: false,
            partiesAllowed: false,
            maxAdditionalGuests: 1,
            additionalGuestFee: 500
          },
          isActive: true,
          isBookable: true,
          displayOrder: 1,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-08-25T00:00:00.000Z'
        },
        {
          _id: 'rt2',
          name: 'Deluxe Room',
          code: 'DLX',
          description: 'Spacious rooms with premium amenities and beautiful city views for enhanced comfort.',
          category: 'deluxe',
          maxOccupancy: { adults: 2, children: 2, total: 4 },
          bedConfiguration: {
            singleBeds: 0,
            doubleBeds: 0,
            queenBeds: 1,
            kingBeds: 0,
            sofaBeds: 1,
            bunkBeds: 0,
            totalBeds: 2
          },
          roomSize: { area: 350, unit: 'sqft' },
          basePrice: {
            perNight: 6000,
            perWeek: 35000,
            perMonth: 140000,
            currency: 'INR'
          },
          amenities: {
            bathroom: {
              privateBathroom: true,
              bathtub: true,
              shower: true,
              toiletries: true,
              hairDryer: true,
              slippers: true,
              bathrobes: true
            },
            technology: {
              wifi: true,
              tv: true,
              cableChannels: true,
              smartTV: true,
              soundSystem: true,
              gamingConsole: false,
              workDesk: true,
              laptop: false
            },
            comfort: {
              airConditioning: true,
              heating: false,
              fan: true,
              blackoutCurtains: true,
              soundproofing: true,
              balcony: true,
              terrace: false,
              garden: false
            },
            kitchen: {
              fullKitchen: false,
              kitchenette: true,
              microwave: true,
              refrigerator: true,
              coffeemaker: true,
              teaKettle: true,
              dishwasher: false,
              cookingBasics: true
            },
            safety: {
              smokeDector: true,
              carbonMonoxideDetector: true,
              fireExtinguisher: true,
              firstAidKit: true,
              safe: true,
              securityCamera: false,
              keylessEntry: true
            }
          },
          inventory: {
            totalRooms: 15,
            availableRooms: 10,
            maintenanceRooms: 1,
            bookedRooms: 4
          },
          occupancyRate: 26.7,
          availabilityRate: 66.7,
          policies: {
            smokingAllowed: false,
            petsAllowed: true,
            maxPetWeight: 10,
            petFee: 1000,
            eventsAllowed: false,
            partiesAllowed: false,
            maxAdditionalGuests: 2,
            additionalGuestFee: 750
          },
          isActive: true,
          isBookable: true,
          displayOrder: 2,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-08-25T00:00:00.000Z'
        },
        {
          _id: 'rt3',
          name: 'Executive Suite',
          code: 'STE',
          description: 'Luxury suites with separate living area, premium amenities, and panoramic views.',
          category: 'suite',
          maxOccupancy: { adults: 4, children: 2, total: 6 },
          bedConfiguration: {
            singleBeds: 0,
            doubleBeds: 0,
            queenBeds: 0,
            kingBeds: 1,
            sofaBeds: 1,
            bunkBeds: 0,
            totalBeds: 2
          },
          roomSize: { area: 600, unit: 'sqft' },
          basePrice: {
            perNight: 10000,
            perWeek: 60000,
            perMonth: 240000,
            currency: 'INR'
          },
          amenities: {
            bathroom: {
              privateBathroom: true,
              bathtub: true,
              shower: true,
              toiletries: true,
              hairDryer: true,
              slippers: true,
              bathrobes: true
            },
            technology: {
              wifi: true,
              tv: true,
              cableChannels: true,
              smartTV: true,
              soundSystem: true,
              gamingConsole: true,
              workDesk: true,
              laptop: true
            },
            comfort: {
              airConditioning: true,
              heating: true,
              fan: true,
              blackoutCurtains: true,
              soundproofing: true,
              balcony: true,
              terrace: true,
              garden: false
            },
            kitchen: {
              fullKitchen: true,
              kitchenette: false,
              microwave: true,
              refrigerator: true,
              coffeemaker: true,
              teaKettle: true,
              dishwasher: true,
              cookingBasics: true
            },
            safety: {
              smokeDector: true,
              carbonMonoxideDetector: true,
              fireExtinguisher: true,
              firstAidKit: true,
              safe: true,
              securityCamera: true,
              keylessEntry: true
            }
          },
          inventory: {
            totalRooms: 10,
            availableRooms: 6,
            maintenanceRooms: 1,
            bookedRooms: 3
          },
          occupancyRate: 30,
          availabilityRate: 60,
          policies: {
            smokingAllowed: false,
            petsAllowed: true,
            maxPetWeight: 15,
            petFee: 1500,
            eventsAllowed: true,
            partiesAllowed: false,
            maxAdditionalGuests: 4,
            additionalGuestFee: 1000
          },
          isActive: true,
          isBookable: true,
          displayOrder: 3,
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-08-25T00:00:00.000Z'
        }
      ];
      
      setRoomTypes(mockRoomTypes);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch room types:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from room types
      const totalTypes = roomTypes.length;
      const activeTypes = roomTypes.filter(rt => rt.isActive).length;
      const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.inventory.totalRooms, 0);
      const averageOccupancyRate = totalTypes > 0 
        ? roomTypes.reduce((sum, rt) => sum + rt.occupancyRate, 0) / totalTypes 
        : 0;
      const averagePrice = totalTypes > 0 
        ? roomTypes.reduce((sum, rt) => sum + rt.basePrice.perNight, 0) / totalTypes 
        : 0;
      const totalRevenue = roomTypes.reduce((sum, rt) => 
        sum + (rt.inventory.bookedRooms * rt.basePrice.perNight * 30), 0); // Monthly estimate

      setStats({
        totalTypes,
        activeTypes,
        totalRooms,
        averageOccupancyRate: Math.round(averageOccupancyRate * 10) / 10,
        totalRevenue,
        averagePrice: Math.round(averagePrice)
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const filteredRoomTypes = roomTypes.filter(roomType => {
    const matchesSearch = roomType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         roomType.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || roomType.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && roomType.isActive) ||
                         (statusFilter === 'inactive' && !roomType.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: RoomType['category']) => {
    const categoryClasses = {
      economy: 'bg-gray-100 text-gray-800',
      standard: 'bg-blue-100 text-blue-800',
      deluxe: 'bg-green-100 text-green-800',
      suite: 'bg-purple-100 text-purple-800',
      presidential: 'bg-yellow-100 text-yellow-800',
      family: 'bg-pink-100 text-pink-800',
      accessible: 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryClasses[category]}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const getBedDescription = (bedConfig: RoomType['bedConfiguration']) => {
    const beds = [];
    if (bedConfig.singleBeds > 0) beds.push(`${bedConfig.singleBeds} Single`);
    if (bedConfig.doubleBeds > 0) beds.push(`${bedConfig.doubleBeds} Double`);
    if (bedConfig.queenBeds > 0) beds.push(`${bedConfig.queenBeds} Queen`);
    if (bedConfig.kingBeds > 0) beds.push(`${bedConfig.kingBeds} King`);
    if (bedConfig.sofaBeds > 0) beds.push(`${bedConfig.sofaBeds} Sofa`);
    if (bedConfig.bunkBeds > 0) beds.push(`${bedConfig.bunkBeds} Bunk`);
    
    return beds.length > 0 ? beds.join(', ') : 'No beds configured';
  };

  const getTopAmenities = (amenities: RoomType['amenities']) => {
    const topAmenities = [];
    if (amenities.technology.wifi) topAmenities.push({ name: 'WiFi', icon: <Wifi className="h-3 w-3" /> });
    if (amenities.comfort.airConditioning) topAmenities.push({ name: 'AC', icon: <Wind className="h-3 w-3" /> });
    if (amenities.technology.tv) topAmenities.push({ name: 'TV', icon: <Tv className="h-3 w-3" /> });
    if (amenities.bathroom.bathtub) topAmenities.push({ name: 'Bathtub', icon: <Bath className="h-3 w-3" /> });
    if (amenities.comfort.balcony) topAmenities.push({ name: 'Balcony', icon: <Home className="h-3 w-3" /> });
    
    return topAmenities.slice(0, 4);
  };

  const handleRoomTypeAction = (roomType: RoomType, action: string) => {
    console.log(`Action: ${action} on room type:`, roomType.name);
    // Implement actions: view, edit, duplicate, delete
    switch (action) {
      case 'view':
        router.push(`/os/properties/${propertyId}/room-types/${roomType._id}`);
        break;
      case 'edit':
        router.push(`/os/properties/${propertyId}/room-types/${roomType._id}/edit`);
        break;
      case 'duplicate':
        // Handle duplication
        break;
      case 'delete':
        // Handle deletion
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Room Type Management</h1>
            <p className="text-gray-600">Configure room types, amenities, and pricing</p>
          </div>
        </div>
        
        <button
          onClick={() => router.push(`/os/properties/${propertyId}/room-types/add`)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Room Type
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Types</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTypes}</p>
            </div>
            <Tags className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Types</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeTypes}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Rooms</p>
              <p className="text-2xl font-bold text-purple-600">{stats.totalRooms}</p>
            </div>
            <Bed className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Occupancy</p>
              <p className="text-2xl font-bold text-orange-600">{stats.averageOccupancyRate}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-green-600">₹{Math.round(stats.totalRevenue / 1000)}K</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Price</p>
              <p className="text-2xl font-bold text-blue-600">₹{stats.averagePrice}</p>
            </div>
            <Star className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search room types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Categories</option>
              <option value="economy">Economy</option>
              <option value="standard">Standard</option>
              <option value="deluxe">Deluxe</option>
              <option value="suite">Suite</option>
              <option value="presidential">Presidential</option>
              <option value="family">Family</option>
              <option value="accessible">Accessible</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Types Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRoomTypes.map((roomType) => (
          <div key={roomType._id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{roomType.name}</h3>
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                      {roomType.code}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryBadge(roomType.category)}
                    {roomType.isActive ? (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{roomType.description}</p>
                </div>
                
                <div className="relative">
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Max:</span>
                  <span className="font-medium">{roomType.maxOccupancy.total} guests</span>
                </div>
                <div className="flex items-center gap-1">
                  <Square className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{roomType.roomSize.area} {roomType.roomSize.unit}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Bed className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Beds:</span>
                  <span className="font-medium">{roomType.bedConfiguration.totalBeds}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₹{roomType.basePrice.perNight}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Bed Configuration</div>
                <div className="text-sm text-gray-900">{getBedDescription(roomType.bedConfiguration)}</div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-2">Top Amenities</div>
                <div className="flex gap-1">
                  {getTopAmenities(roomType.amenities).map((amenity, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded text-xs">
                      {amenity.icon}
                      <span>{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{roomType.inventory.totalRooms}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-green-600">{roomType.inventory.availableRooms}</div>
                  <div className="text-xs text-gray-500">Available</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-red-600">{roomType.inventory.bookedRooms}</div>
                  <div className="text-xs text-gray-500">Booked</div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Occupancy Rate</span>
                  <span className="font-medium">{roomType.occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${Math.min(roomType.occupancyRate, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRoomTypeAction(roomType, 'view')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button
                  onClick={() => handleRoomTypeAction(roomType, 'edit')}
                  className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleRoomTypeAction(roomType, 'duplicate')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredRoomTypes.length === 0 && (
        <div className="text-center py-12">
          <Tags className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No room types found</h3>
          <p className="text-gray-600 mb-4">Create your first room type to get started</p>
          <button
            onClick={() => router.push(`/os/properties/${propertyId}/room-types/add`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Room Type
          </button>
        </div>
      )}
    </div>
  );
}