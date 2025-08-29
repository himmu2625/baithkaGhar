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
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  Sparkles,
  Eye,
  Edit,
  Trash2,
  Settings,
  BedDouble,
  Bath,
  Wind,
  Tv,
  Wifi,
  Car,
  Coffee,
  Shield,
  MapPin,
  Activity,
  DollarSign,
  TrendingUp,
  XCircle
} from 'lucide-react';

interface Room {
  _id: string;
  roomNumber: string;
  floor: number;
  wing?: string;
  roomTypeId: {
    _id: string;
    name: string;
    basePrice: number;
  };
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'out_of_order' | 'reserved';
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_renovation';
  actualSize: {
    area: number;
    unit: 'sqft' | 'sqm';
  };
  actualBeds: {
    singleBeds: number;
    doubleBeds: number;
    queenBeds: number;
    kingBeds: number;
    sofaBeds: number;
    bunkBeds: number;
  };
  specificAmenities: {
    hasBalcony: boolean;
    hasTerrace: boolean;
    hasGarden: boolean;
    hasKitchen: boolean;
    hasWorkDesk: boolean;
    hasSmartTV: boolean;
    hasAC: boolean;
    hasMinibar: boolean;
    hasSafe: boolean;
    hasJacuzzi: boolean;
  };
  currentBooking?: {
    guestName: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
  };
  housekeeping: {
    lastCleaned: string;
    cleaningStatus: 'dirty' | 'cleaning_in_progress' | 'clean' | 'inspected' | 'maintenance_required';
    nextCleaningScheduled?: string;
  };
  maintenance: {
    lastMaintenance: string;
    currentIssues: Array<{
      issueType: string;
      description: string;
      severity: 'minor' | 'moderate' | 'major' | 'critical';
      status: 'reported' | 'assigned' | 'in_progress' | 'resolved';
    }>;
  };
  pricing: {
    baseRate: number;
    currentRate: number;
    lastUpdated: string;
  };
  revenue: {
    monthlyRevenue: number;
    averageDailyRate: number;
  };
  isActive: boolean;
  isBookable: boolean;
  lastModifiedBy: string;
  updatedAt: string;
}

interface RoomStats {
  totalRooms: number;
  available: number;
  occupied: number;
  maintenance: number;
  cleaning: number;
  outOfOrder: number;
  occupancyRate: number;
  averageDailyRate: number;
  totalRevenue: number;
}

export default function RoomManagementPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<RoomStats>({
    totalRooms: 0,
    available: 0,
    occupied: 0,
    maintenance: 0,
    cleaning: 0,
    outOfOrder: 0,
    occupancyRate: 0,
    averageDailyRate: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  useEffect(() => {
    if (propertyId) {
      fetchRooms();
      fetchStats();
    }
  }, [propertyId]);

  const fetchRooms = async () => {
    try {
      // Mock room data - replace with actual API call
      const mockRooms: Room[] = Array.from({ length: 50 }, (_, index) => {
        const roomNumber = `${Math.floor(index / 10) + 1}${String(index % 10).padStart(2, '0')}`;
        const floor = Math.floor(index / 10) + 1;
        const statuses: Room['status'][] = ['available', 'occupied', 'maintenance', 'cleaning', 'out_of_order', 'reserved'];
        const conditions: Room['condition'][] = ['excellent', 'good', 'fair', 'poor'];
        
        return {
          _id: `room_${index + 1}`,
          roomNumber,
          floor,
          wing: floor <= 2 ? 'East Wing' : 'West Wing',
          roomTypeId: {
            _id: `type_${index % 3 + 1}`,
            name: ['Standard Room', 'Deluxe Room', 'Suite'][index % 3],
            basePrice: [4000, 6000, 10000][index % 3]
          },
          status: statuses[Math.floor(Math.random() * statuses.length)],
          condition: conditions[Math.floor(Math.random() * conditions.length)],
          actualSize: {
            area: 200 + Math.floor(Math.random() * 300),
            unit: 'sqft'
          },
          actualBeds: {
            singleBeds: index % 3 === 0 ? 2 : 0,
            doubleBeds: index % 3 === 1 ? 1 : 0,
            queenBeds: index % 3 === 2 ? 1 : 0,
            kingBeds: 0,
            sofaBeds: 0,
            bunkBeds: 0
          },
          specificAmenities: {
            hasBalcony: Math.random() > 0.5,
            hasTerrace: false,
            hasGarden: Math.random() > 0.8,
            hasKitchen: index % 3 === 2,
            hasWorkDesk: true,
            hasSmartTV: true,
            hasAC: true,
            hasMinibar: Math.random() > 0.3,
            hasSafe: true,
            hasJacuzzi: index % 3 === 2
          },
          currentBooking: statuses[Math.floor(Math.random() * statuses.length)] === 'occupied' ? {
            guestName: 'John Doe',
            checkIn: '2024-08-28T14:00:00.000Z',
            checkOut: '2024-08-30T11:00:00.000Z',
            guestCount: 2
          } : undefined,
          housekeeping: {
            lastCleaned: '2024-08-28T10:00:00.000Z',
            cleaningStatus: 'clean',
            nextCleaningScheduled: '2024-08-29T10:00:00.000Z'
          },
          maintenance: {
            lastMaintenance: '2024-08-20T00:00:00.000Z',
            currentIssues: Math.random() > 0.8 ? [{
              issueType: 'electrical',
              description: 'AC not cooling properly',
              severity: 'moderate',
              status: 'reported'
            }] : []
          },
          pricing: {
            baseRate: [4000, 6000, 10000][index % 3],
            currentRate: [4000, 6000, 10000][index % 3] * (1 + Math.random() * 0.3),
            lastUpdated: '2024-08-28T00:00:00.000Z'
          },
          revenue: {
            monthlyRevenue: Math.floor(Math.random() * 50000) + 20000,
            averageDailyRate: [4000, 6000, 10000][index % 3] * 1.1
          },
          isActive: true,
          isBookable: Math.random() > 0.1,
          lastModifiedBy: 'Admin',
          updatedAt: '2024-08-28T00:00:00.000Z'
        };
      });
      
      setRooms(mockRooms);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from rooms data
      const totalRooms = rooms.length;
      const available = rooms.filter(r => r.status === 'available').length;
      const occupied = rooms.filter(r => r.status === 'occupied').length;
      const maintenance = rooms.filter(r => r.status === 'maintenance').length;
      const cleaning = rooms.filter(r => r.status === 'cleaning').length;
      const outOfOrder = rooms.filter(r => r.status === 'out_of_order').length;
      const occupancyRate = totalRooms > 0 ? (occupied / totalRooms) * 100 : 0;
      const totalRevenue = rooms.reduce((sum, room) => sum + room.revenue.monthlyRevenue, 0);
      const averageDailyRate = rooms.reduce((sum, room) => sum + room.revenue.averageDailyRate, 0) / totalRooms;

      setStats({
        totalRooms,
        available,
        occupied,
        maintenance,
        cleaning,
        outOfOrder,
        occupancyRate,
        averageDailyRate,
        totalRevenue
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.roomTypeId.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || room.floor.toString() === floorFilter;
    const matchesCondition = conditionFilter === 'all' || room.condition === conditionFilter;
    
    return matchesSearch && matchesStatus && matchesFloor && matchesCondition;
  });

  const getStatusBadge = (status: Room['status']) => {
    const statusClasses = {
      available: 'bg-green-100 text-green-800',
      occupied: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      cleaning: 'bg-blue-100 text-blue-800',
      out_of_order: 'bg-gray-100 text-gray-800',
      reserved: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status]}`}>
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const getConditionBadge = (condition: Room['condition']) => {
    const conditionClasses = {
      excellent: 'bg-green-100 text-green-800',
      good: 'bg-blue-100 text-blue-800',
      fair: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-red-100 text-red-800',
      needs_renovation: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${conditionClasses[condition]}`}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)}
      </span>
    );
  };

  const getTotalBeds = (beds: Room['actualBeds']) => {
    return beds.singleBeds + beds.doubleBeds + beds.queenBeds + beds.kingBeds + beds.sofaBeds + beds.bunkBeds;
  };

  const handleRoomAction = (room: Room, action: string) => {
    console.log(`Action: ${action} on room:`, room.roomNumber);
    // Implement actions: view, edit, delete, settings
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on rooms:`, selectedRooms);
    // Implement bulk actions
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
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
            <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
            <p className="text-gray-600">Manage individual rooms, status, and maintenance</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {selectedRooms.length > 0 && (
            <div className="flex gap-2 mr-4">
              <button
                onClick={() => handleBulkAction('maintenance')}
                className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700 px-3 py-2 rounded-lg text-sm"
              >
                Mark for Maintenance ({selectedRooms.length})
              </button>
              <button
                onClick={() => handleBulkAction('cleaning')}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm"
              >
                Schedule Cleaning ({selectedRooms.length})
              </button>
            </div>
          )}
          
          <button
            onClick={() => router.push(`/os/properties/${propertyId}/rooms/add`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Room
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Total Rooms</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalRooms}</p>
            </div>
            <Bed className="h-6 w-6 text-gray-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Available</p>
              <p className="text-xl font-bold text-green-600">{stats.available}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Occupied</p>
              <p className="text-xl font-bold text-red-600">{stats.occupied}</p>
            </div>
            <Users className="h-6 w-6 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Maintenance</p>
              <p className="text-xl font-bold text-yellow-600">{stats.maintenance}</p>
            </div>
            <Wrench className="h-6 w-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Occupancy Rate</p>
              <p className="text-xl font-bold text-blue-600">{stats.occupancyRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">Avg Daily Rate</p>
              <p className="text-xl font-bold text-purple-600">₹{Math.round(stats.averageDailyRate)}</p>
            </div>
            <DollarSign className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
              <option value="cleaning">Cleaning</option>
              <option value="out_of_order">Out of Order</option>
              <option value="reserved">Reserved</option>
            </select>

            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Floors</option>
              {Array.from(new Set(rooms.map(r => r.floor))).sort().map(floor => (
                <option key={floor} value={floor.toString()}>Floor {floor}</option>
              ))}
            </select>

            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Conditions</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="needs_renovation">Needs Renovation</option>
            </select>

            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => (
            <div key={room._id} className="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRooms.includes(room._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRooms([...selectedRooms, room._id]);
                        } else {
                          setSelectedRooms(selectedRooms.filter(id => id !== room._id));
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-blue-500"
                    />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Room {room.roomNumber}
                    </h3>
                  </div>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex justify-between items-center">
                    {getStatusBadge(room.status)}
                    {getConditionBadge(room.condition)}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" />
                      Floor {room.floor} - {room.wing}
                    </div>
                    <div className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      {room.roomTypeId.name} - {getTotalBeds(room.actualBeds)} bed(s)
                    </div>
                  </div>
                </div>

                {room.currentBooking && (
                  <div className="bg-red-50 p-2 rounded text-xs mb-3">
                    <div className="flex items-center gap-1 text-red-700 font-medium">
                      <Users className="h-3 w-3" />
                      {room.currentBooking.guestName}
                    </div>
                    <div className="text-red-600">
                      {new Date(room.currentBooking.checkIn).toLocaleDateString()} - 
                      {new Date(room.currentBooking.checkOut).toLocaleDateString()}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="ml-1 font-medium">{room.actualSize.area} {room.actualSize.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span>
                    <span className="ml-1 font-medium">₹{Math.round(room.pricing.currentRate)}</span>
                  </div>
                </div>

                {room.maintenance.currentIssues.length > 0 && (
                  <div className="bg-yellow-50 p-2 rounded text-xs mb-3">
                    <div className="flex items-center gap-1 text-yellow-700 font-medium">
                      <AlertCircle className="h-3 w-3" />
                      {room.maintenance.currentIssues.length} issue(s)
                    </div>
                    <div className="text-yellow-600">
                      {room.maintenance.currentIssues[0].description}
                    </div>
                  </div>
                )}

                <div className="flex gap-1">
                  <button
                    onClick={() => handleRoomAction(room, 'view')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                  >
                    <Eye className="h-3 w-3 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleRoomAction(room, 'edit')}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded text-xs"
                  >
                    <Edit className="h-3 w-3 mx-auto" />
                  </button>
                  <button
                    onClick={() => handleRoomAction(room, 'settings')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs"
                  >
                    <Settings className="h-3 w-3 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedRooms.length === filteredRooms.length && filteredRooms.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRooms(filteredRooms.map(r => r._id));
                        } else {
                          setSelectedRooms([]);
                        }
                      }}
                      className="rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condition
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRooms.includes(room._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRooms([...selectedRooms, room._id]);
                          } else {
                            setSelectedRooms(selectedRooms.filter(id => id !== room._id));
                          }
                        }}
                        className="rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        Room {room.roomNumber}
                      </div>
                      <div className="text-xs text-gray-500">
                        Floor {room.floor} - {room.wing}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{room.roomTypeId.name}</div>
                      <div className="text-xs text-gray-500">
                        {getTotalBeds(room.actualBeds)} bed(s) • {room.actualSize.area} {room.actualSize.unit}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(room.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getConditionBadge(room.condition)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {room.currentBooking ? (
                        <div className="text-sm">
                          <div className="text-gray-900">{room.currentBooking.guestName}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(room.currentBooking.checkOut).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">₹{Math.round(room.pricing.currentRate)}</div>
                      <div className="text-xs text-gray-500">per night</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {room.maintenance.currentIssues.length > 0 ? (
                        <div className="flex items-center text-sm text-red-600">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {room.maintenance.currentIssues.length}
                        </div>
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleRoomAction(room, 'view')}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRoomAction(room, 'edit')}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRoomAction(room, 'settings')}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Settings className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search filters or add new rooms</p>
          <button
            onClick={() => router.push(`/os/properties/${propertyId}/rooms/add`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Add Room
          </button>
        </div>
      )}
    </div>
  );
}