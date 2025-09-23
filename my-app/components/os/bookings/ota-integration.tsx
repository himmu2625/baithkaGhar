'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Link,
  Unlink,
  Upload,
  Download,
  Sync,
  Clock,
  Star,
  Building,
  Eye,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Filter,
  Search,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface OTAChannel {
  id: string;
  name: string;
  type: 'booking_com' | 'expedia' | 'airbnb' | 'agoda' | 'makemytrip' | 'goibibo' | 'cleartrip' | 'trivago';
  logo: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  connectionDate: string;
  lastSync: string;
  isActive: boolean;
  commissionRate: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  reviewCount: number;
  connectionConfig: {
    propertyId?: string;
    apiKey?: string;
    username?: string;
    password?: string;
    endpoint?: string;
  };
  syncSettings: {
    autoSync: boolean;
    syncInterval: number; // minutes
    syncRates: boolean;
    syncInventory: boolean;
    syncBookings: boolean;
    syncReviews: boolean;
  };
}

interface RateMapping {
  id: string;
  otaChannelId: string;
  roomTypeId: string;
  roomTypeName: string;
  otaRoomTypeId: string;
  otaRoomTypeName: string;
  baseRate: number;
  markupPercentage: number;
  minRate: number;
  maxRate: number;
  isActive: boolean;
}

interface InventorySync {
  id: string;
  date: string;
  roomTypeId: string;
  roomTypeName: string;
  totalRooms: number;
  availableRooms: number;
  allocations: {
    channelId: string;
    channelName: string;
    allocated: number;
    sold: number;
    remaining: number;
  }[];
}

interface OTAIntegrationProps {
  propertyId: string;
}

const otaChannelTypes = {
  booking_com: { name: 'Booking.com', color: 'bg-blue-600', icon: '🏨' },
  expedia: { name: 'Expedia', color: 'bg-yellow-600', icon: '✈️' },
  airbnb: { name: 'Airbnb', color: 'bg-red-500', icon: '🏠' },
  agoda: { name: 'Agoda', color: 'bg-red-600', icon: '🌟' },
  makemytrip: { name: 'MakeMyTrip', color: 'bg-red-500', icon: '🚀' },
  goibibo: { name: 'Goibibo', color: 'bg-orange-500', icon: '🚗' },
  cleartrip: { name: 'Cleartrip', color: 'bg-green-600', icon: '🌍' },
  trivago: { name: 'Trivago', color: 'bg-purple-600', icon: '🔍' }
};

const statusConfig = {
  connected: { color: 'bg-green-500', label: 'Connected', textColor: 'text-green-700', bgColor: 'bg-green-50' },
  disconnected: { color: 'bg-gray-500', label: 'Disconnected', textColor: 'text-gray-700', bgColor: 'bg-gray-50' },
  error: { color: 'bg-red-500', label: 'Error', textColor: 'text-red-700', bgColor: 'bg-red-50' },
  syncing: { color: 'bg-blue-500', label: 'Syncing', textColor: 'text-blue-700', bgColor: 'bg-blue-50' }
};

export default function OTAIntegration({ propertyId }: OTAIntegrationProps) {
  const [activeTab, setActiveTab] = useState('channels');
  const [otaChannels, setOtaChannels] = useState<OTAChannel[]>([]);
  const [rateMappings, setRateMappings] = useState<RateMapping[]>([]);
  const [inventorySync, setInventorySync] = useState<InventorySync[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showRateMappingDialog, setShowRateMappingDialog] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<OTAChannel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOTAData();
  }, [propertyId]);

  const fetchOTAData = async () => {
    try {
      setLoading(true);

      // Mock data - replace with actual API calls
      const mockChannels: OTAChannel[] = [
        {
          id: 'ota_1',
          name: 'Booking.com',
          type: 'booking_com',
          logo: '🏨',
          status: 'connected',
          connectionDate: '2025-01-15T10:00:00Z',
          lastSync: '2025-09-21T08:30:00Z',
          isActive: true,
          commissionRate: 15,
          totalBookings: 1247,
          totalRevenue: 2850000,
          monthlyBookings: 89,
          monthlyRevenue: 245000,
          averageRating: 8.7,
          reviewCount: 342,
          connectionConfig: {
            propertyId: 'BG_PROP_123',
            username: 'baithaka_ghar',
            endpoint: 'https://supply-xml.booking.com/hotels/xml/reservations'
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 30,
            syncRates: true,
            syncInventory: true,
            syncBookings: true,
            syncReviews: true
          }
        },
        {
          id: 'ota_2',
          name: 'Expedia',
          type: 'expedia',
          logo: '✈️',
          status: 'connected',
          connectionDate: '2025-02-01T14:00:00Z',
          lastSync: '2025-09-21T07:45:00Z',
          isActive: true,
          commissionRate: 18,
          totalBookings: 856,
          totalRevenue: 1950000,
          monthlyBookings: 67,
          monthlyRevenue: 185000,
          averageRating: 4.3,
          reviewCount: 178,
          connectionConfig: {
            propertyId: 'EXP_456789',
            apiKey: 'exp_api_key_masked',
            endpoint: 'https://services.expediaquickconnect.com/eqc/ar'
          },
          syncSettings: {
            autoSync: true,
            syncInterval: 60,
            syncRates: true,
            syncInventory: true,
            syncBookings: true,
            syncReviews: false
          }
        },
        {
          id: 'ota_3',
          name: 'Airbnb',
          type: 'airbnb',
          logo: '🏠',
          status: 'error',
          connectionDate: '2025-03-10T09:00:00Z',
          lastSync: '2025-09-20T15:20:00Z',
          isActive: false,
          commissionRate: 3,
          totalBookings: 234,
          totalRevenue: 650000,
          monthlyBookings: 12,
          monthlyRevenue: 45000,
          averageRating: 4.8,
          reviewCount: 89,
          connectionConfig: {
            propertyId: 'ABB_789123',
            apiKey: 'airbnb_api_key_masked'
          },
          syncSettings: {
            autoSync: false,
            syncInterval: 120,
            syncRates: true,
            syncInventory: true,
            syncBookings: true,
            syncReviews: true
          }
        },
        {
          id: 'ota_4',
          name: 'MakeMyTrip',
          type: 'makemytrip',
          logo: '🚀',
          status: 'disconnected',
          connectionDate: '2024-12-20T11:00:00Z',
          lastSync: '2025-09-15T10:00:00Z',
          isActive: false,
          commissionRate: 20,
          totalBookings: 445,
          totalRevenue: 980000,
          monthlyBookings: 0,
          monthlyRevenue: 0,
          averageRating: 4.1,
          reviewCount: 156,
          connectionConfig: {
            username: 'baithaka_mmt',
            endpoint: 'https://affiliate.api.makemytrip.com'
          },
          syncSettings: {
            autoSync: false,
            syncInterval: 60,
            syncRates: true,
            syncInventory: true,
            syncBookings: true,
            syncReviews: false
          }
        }
      ];

      const mockRateMappings: RateMapping[] = [
        {
          id: 'rate_1',
          otaChannelId: 'ota_1',
          roomTypeId: 'room_1',
          roomTypeName: 'Deluxe Suite',
          otaRoomTypeId: 'BCM_DELUXE_001',
          otaRoomTypeName: 'Deluxe Sea View Suite',
          baseRate: 4500,
          markupPercentage: 10,
          minRate: 3500,
          maxRate: 8500,
          isActive: true
        },
        {
          id: 'rate_2',
          otaChannelId: 'ota_1',
          roomTypeId: 'room_2',
          roomTypeName: 'Standard Room',
          otaRoomTypeId: 'BCM_STD_001',
          otaRoomTypeName: 'Standard Double Room',
          baseRate: 2800,
          markupPercentage: 15,
          minRate: 2200,
          maxRate: 4500,
          isActive: true
        },
        {
          id: 'rate_3',
          otaChannelId: 'ota_2',
          roomTypeId: 'room_1',
          roomTypeName: 'Deluxe Suite',
          otaRoomTypeId: 'EXP_DLX_789',
          otaRoomTypeName: 'Deluxe Ocean Suite',
          baseRate: 4500,
          markupPercentage: 12,
          minRate: 3800,
          maxRate: 9000,
          isActive: true
        }
      ];

      const mockInventorySync: InventorySync[] = [
        {
          id: 'inv_1',
          date: '2025-09-21',
          roomTypeId: 'room_1',
          roomTypeName: 'Deluxe Suite',
          totalRooms: 15,
          availableRooms: 8,
          allocations: [
            { channelId: 'ota_1', channelName: 'Booking.com', allocated: 6, sold: 3, remaining: 3 },
            { channelId: 'ota_2', channelName: 'Expedia', allocated: 4, sold: 2, remaining: 2 },
            { channelId: 'direct', channelName: 'Direct', allocated: 5, sold: 2, remaining: 3 }
          ]
        },
        {
          id: 'inv_2',
          date: '2025-09-21',
          roomTypeId: 'room_2',
          roomTypeName: 'Standard Room',
          totalRooms: 25,
          availableRooms: 12,
          allocations: [
            { channelId: 'ota_1', channelName: 'Booking.com', allocated: 10, sold: 6, remaining: 4 },
            { channelId: 'ota_2', channelName: 'Expedia', allocated: 8, sold: 3, remaining: 5 },
            { channelId: 'direct', channelName: 'Direct', allocated: 7, sold: 4, remaining: 3 }
          ]
        }
      ];

      setOtaChannels(mockChannels);
      setRateMappings(mockRateMappings);
      setInventorySync(mockInventorySync);
    } catch (error) {
      console.error('Error fetching OTA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSync = async (channelId: string) => {
    try {
      setSyncing(channelId);

      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 3000));

      setOtaChannels(prev => prev.map(channel =>
        channel.id === channelId
          ? { ...channel, lastSync: new Date().toISOString(), status: 'connected' }
          : channel
      ));

      alert('Channel synced successfully!');
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(null);
    }
  };

  const toggleChannelStatus = async (channelId: string) => {
    try {
      setOtaChannels(prev => prev.map(channel =>
        channel.id === channelId
          ? { ...channel, isActive: !channel.isActive }
          : channel
      ));
    } catch (error) {
      console.error('Error toggling channel status:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading OTA integrations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Connected Channels</p>
                <p className="text-2xl font-bold text-blue-900">
                  {otaChannels.filter(ch => ch.status === 'connected').length}
                </p>
              </div>
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Total OTA Revenue</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(otaChannels.reduce((sum, ch) => sum + ch.totalRevenue, 0))}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Monthly Bookings</p>
                <p className="text-2xl font-bold text-purple-900">
                  {otaChannels.reduce((sum, ch) => sum + ch.monthlyBookings, 0)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Avg Commission</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {(otaChannels.reduce((sum, ch) => sum + ch.commissionRate, 0) / otaChannels.length).toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-green-100 p-1 rounded-lg">
          <TabsTrigger value="channels" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            OTA Channels
          </TabsTrigger>
          <TabsTrigger value="rates" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Rate Mapping
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Inventory Sync
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* OTA Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">OTA Channel Management</h3>
              <p className="text-gray-600">Manage your online travel agency connections</p>
            </div>
            <Button
              onClick={() => setShowConnectionDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Connect New OTA
            </Button>
          </div>

          <div className="grid gap-6">
            {otaChannels.map((channel) => {
              const typeConfig = otaChannelTypes[channel.type];
              const statusConf = statusConfig[channel.status];

              return (
                <Card key={channel.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${statusConf.bgColor}`}>
                          <span className="text-2xl">{typeConfig.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{channel.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Commission: {channel.commissionRate}%</span>
                            <span>Last Sync: {formatDate(channel.lastSync)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={`${statusConf.color} text-white`}>
                              {statusConf.label}
                            </Badge>
                            {channel.averageRating && (
                              <Badge variant="outline">
                                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                                {channel.averageRating}/10 ({channel.reviewCount} reviews)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-semibold">{channel.monthlyBookings}</div>
                            <div className="text-gray-500">Monthly Bookings</div>
                          </div>
                          <div>
                            <div className="font-semibold">{formatCurrency(channel.monthlyRevenue)}</div>
                            <div className="text-gray-500">Monthly Revenue</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Switch
                            checked={channel.isActive}
                            onCheckedChange={() => toggleChannelStatus(channel.id)}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleChannelSync(channel.id)}
                            disabled={syncing === channel.id}
                          >
                            {syncing === channel.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sync className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedChannel(channel);
                              setShowConnectionDialog(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {channel.status === 'error' && (
                      <Alert className="mt-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Connection error detected. Please check your API credentials and try reconnecting.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{channel.totalBookings}</div>
                        <div className="text-gray-600">Total Bookings</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{formatCurrency(channel.totalRevenue)}</div>
                        <div className="text-gray-600">Total Revenue</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{channel.commissionRate}%</div>
                        <div className="text-gray-600">Commission Rate</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">
                          {channel.syncSettings.autoSync ? 'Auto' : 'Manual'}
                        </div>
                        <div className="text-gray-600">Sync Mode</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Rate Mapping Tab */}
        <TabsContent value="rates" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Rate Mapping</h3>
              <p className="text-gray-600">Configure room type and rate mappings for each OTA</p>
            </div>
            <Button
              onClick={() => setShowRateMappingDialog(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rate Mapping
            </Button>
          </div>

          <div className="grid gap-4">
            {rateMappings.map((mapping) => {
              const channel = otaChannels.find(ch => ch.id === mapping.otaChannelId);
              const typeConfig = channel ? otaChannelTypes[channel.type] : null;

              return (
                <Card key={mapping.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {typeConfig && (
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <span className="text-xl">{typeConfig.icon}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-lg">{mapping.roomTypeName}</h4>
                          <p className="text-sm text-gray-600">
                            {channel?.name} → {mapping.otaRoomTypeName}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span>Base Rate: {formatCurrency(mapping.baseRate)}</span>
                            <span>Markup: {mapping.markupPercentage}%</span>
                            <span>Range: {formatCurrency(mapping.minRate)} - {formatCurrency(mapping.maxRate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch checked={mapping.isActive} />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Inventory Sync Tab */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Inventory Synchronization</h3>
              <p className="text-gray-600">Monitor room allocation across all channels</p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700">
              <Sync className="h-4 w-4 mr-2" />
              Sync All Channels
            </Button>
          </div>

          <div className="grid gap-6">
            {inventorySync.map((sync) => (
              <Card key={sync.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{sync.roomTypeName}</span>
                    <Badge variant="outline">{sync.date}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Total Rooms: {sync.totalRooms}</span>
                      <span>Available: {sync.availableRooms}</span>
                      <span>Sold: {sync.totalRooms - sync.availableRooms}</span>
                    </div>
                    <Progress
                      value={((sync.totalRooms - sync.availableRooms) / sync.totalRooms) * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {sync.allocations.map((allocation) => (
                      <div key={allocation.channelId} className="p-4 border rounded-lg">
                        <h5 className="font-medium mb-2">{allocation.channelName}</h5>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Allocated:</span>
                            <span className="font-medium">{allocation.allocated}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Sold:</span>
                            <span className="font-medium">{allocation.sold}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Remaining:</span>
                            <span className="font-medium text-green-600">{allocation.remaining}</span>
                          </div>
                        </div>
                        <Progress
                          value={(allocation.sold / allocation.allocated) * 100}
                          className="h-1 mt-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Channel Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {otaChannels.map((channel) => {
                    const typeConfig = otaChannelTypes[channel.type];
                    const revenuePercentage = (channel.monthlyRevenue / otaChannels.reduce((sum, ch) => sum + ch.monthlyRevenue, 0)) * 100;

                    return (
                      <div key={channel.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{typeConfig.icon}</span>
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${typeConfig.color} h-2 rounded-full`}
                              style={{ width: `${revenuePercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {formatCurrency(channel.monthlyRevenue)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Booking Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {otaChannels.map((channel) => {
                    const typeConfig = otaChannelTypes[channel.type];
                    const bookingPercentage = (channel.monthlyBookings / otaChannels.reduce((sum, ch) => sum + ch.monthlyBookings, 0)) * 100;

                    return (
                      <div key={channel.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{typeConfig.icon}</span>
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`${typeConfig.color} h-2 rounded-full`}
                              style={{ width: `${bookingPercentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {channel.monthlyBookings}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Commission Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {otaChannels.map((channel) => {
                  const commissionAmount = (channel.monthlyRevenue * channel.commissionRate) / 100;
                  const typeConfig = otaChannelTypes[channel.type];

                  return (
                    <div key={channel.id} className="text-center p-4 border rounded-lg">
                      <div className="text-2xl mb-2">{typeConfig.icon}</div>
                      <div className="font-medium">{channel.name}</div>
                      <div className="text-lg font-bold text-red-600 mt-2">
                        {formatCurrency(commissionAmount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {channel.commissionRate}% commission
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connection Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={setShowConnectionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedChannel ? `Configure ${selectedChannel.name}` : 'Connect New OTA'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {!selectedChannel && (
              <div>
                <Label>Select OTA Platform</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose OTA platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(otaChannelTypes).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          {config.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="property-id">Property ID</Label>
                <Input
                  id="property-id"
                  placeholder="Enter property ID"
                  defaultValue={selectedChannel?.connectionConfig.propertyId}
                />
              </div>
              <div>
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Enter API key"
                  defaultValue={selectedChannel?.connectionConfig.apiKey}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter username"
                  defaultValue={selectedChannel?.connectionConfig.username}
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  defaultValue={selectedChannel?.connectionConfig.password}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="endpoint">API Endpoint</Label>
              <Input
                id="endpoint"
                placeholder="Enter API endpoint URL"
                defaultValue={selectedChannel?.connectionConfig.endpoint}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-medium">Sync Settings</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-sync" defaultChecked={selectedChannel?.syncSettings.autoSync} />
                  <Label htmlFor="auto-sync">Auto Sync</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-rates" defaultChecked={selectedChannel?.syncSettings.syncRates} />
                  <Label htmlFor="sync-rates">Sync Rates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-inventory" defaultChecked={selectedChannel?.syncSettings.syncInventory} />
                  <Label htmlFor="sync-inventory">Sync Inventory</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="sync-bookings" defaultChecked={selectedChannel?.syncSettings.syncBookings} />
                  <Label htmlFor="sync-bookings">Sync Bookings</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1 bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                {selectedChannel ? 'Update Configuration' : 'Connect OTA'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConnectionDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}