'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Save, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  MapPin,
  Activity,
  Clock,
  AlertTriangle,
  Zap,
  Database,
  Link,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface OTACredentials {
  // Booking.com
  apiKey?: string;
  hotelId?: string;
  username?: string;
  partnerId?: string;
  // OYO
  propertyId?: string;
  // MakeMyTrip
  hotelCode?: string;
  // Common
  password?: string;
}

interface RoomTypeMapping {
  localRoomTypeId: string;
  localRoomTypeName: string;
  channelRoomTypeId: string;
  channelRoomTypeName: string;
}

interface RatePlanMapping {
  localRatePlanId: string;
  localRatePlanName: string;
  channelRatePlanId: string;
  channelRatePlanName: string;
}

interface ChannelConfig {
  id?: string;
  propertyId: string;
  channelName: string;
  channelDisplayName: string;
  enabled: boolean;
  credentials: OTACredentials;
  roomTypeMappings: RoomTypeMapping[];
  ratePlanMappings: RatePlanMapping[];
  channelSettings: {
    currencyCode: string;
    defaultMealPlan: string;
    autoSync: boolean;
    syncFrequencyMinutes: number;
  };
  syncStatus: 'active' | 'syncing' | 'error' | 'paused';
  lastSyncAt?: string;
  syncErrorCount: number;
  connectionStatus: 'connected' | 'disconnected' | 'error' | 'testing';
  lastTestAt?: string;
}

interface SyncLog {
  id: string;
  syncId: string;
  propertyId: string;
  channelName: string;
  syncType: 'inventory' | 'rates' | 'bookings';
  startTime: string;
  endTime?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  successfulRecords: number;
  failedRecords: number;
  errors: string[];
}

interface PropertyInfo {
  id: string;
  title: string;
  name?: string;
  ownerEmail: string;
  roomTypes: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  ratePlans: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

export default function OTAConfigPage() {
  const params = useParams();
  const propertyId = params?.id as string;
  
  // State management
  const [property, setProperty] = useState<PropertyInfo | null>(null);
  const [channels, setChannels] = useState<ChannelConfig[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('channels');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const availableChannels = [
    // International OTAs
    { 
      name: 'booking.com', 
      displayName: 'Booking.com',
      category: 'international',
      description: 'Global leader in online travel bookings',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'hotelId', label: 'Hotel ID', type: 'text', required: true },
        { key: 'username', label: 'Username/Email', type: 'email', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: false }
      ],
      logo: '🏨'
    },
    { 
      name: 'expedia', 
      displayName: 'Expedia',
      category: 'international',
      description: 'Leading global travel technology company',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🌍'
    },
    { 
      name: 'agoda', 
      displayName: 'Agoda',
      category: 'international',
      description: 'Asia-Pacific focused online travel platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'userId', label: 'User ID', type: 'text', required: true }
      ],
      logo: '🏝️'
    },
    { 
      name: 'airbnb', 
      displayName: 'Airbnb',
      category: 'international',
      description: 'Global marketplace for vacation rentals',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'listingId', label: 'Listing ID', type: 'text', required: true },
        { key: 'accountId', label: 'Account ID', type: 'text', required: true },
        { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false }
      ],
      logo: '🏡'
    },
    { 
      name: 'tripadvisor', 
      displayName: 'TripAdvisor',
      category: 'international',
      description: 'World\'s largest travel guidance platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'apiSecret', label: 'API Secret', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'webhookUrl', label: 'Webhook URL', type: 'url', required: false }
      ],
      logo: '🦉'
    },

    // Indian OTAs
    { 
      name: 'makemytrip', 
      displayName: 'MakeMyTrip',
      category: 'indian',
      description: 'India\'s leading online travel company',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'hotelCode', label: 'Hotel Code', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true },
        { key: 'username', label: 'Username', type: 'text', required: false },
        { key: 'password', label: 'Password', type: 'password', required: false }
      ],
      logo: '✈️'
    },
    { 
      name: 'goibibo', 
      displayName: 'Goibibo',
      category: 'indian',
      description: 'Popular Indian online travel booking platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'hotelCode', label: 'Hotel Code', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🚌'
    },
    { 
      name: 'cleartrip', 
      displayName: 'Cleartrip',
      category: 'indian',
      description: 'Leading online travel platform in India and Middle East',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🛫'
    },
    { 
      name: 'easemytrip', 
      displayName: 'EaseMyTrip',
      category: 'indian',
      description: 'Fast-growing Indian online travel platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'partnerCode', label: 'Partner Code', type: 'text', required: true }
      ],
      logo: '🎯'
    },
    { 
      name: 'yatra', 
      displayName: 'Yatra',
      category: 'indian',
      description: 'Pioneering Indian online travel company',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🗺️'
    },
    { 
      name: 'ixigo', 
      displayName: 'Ixigo',
      category: 'indian',
      description: 'AI-powered travel planning platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🤖'
    },
    { 
      name: 'via.com', 
      displayName: 'Via.com',
      category: 'indian',
      description: 'Indian online travel portal',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'hotelId', label: 'Hotel ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🛣️'
    },
    { 
      name: 'paytm-travel', 
      displayName: 'Paytm Travel',
      category: 'indian',
      description: 'Travel booking platform by Paytm',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
        { key: 'hotelCode', label: 'Hotel Code', type: 'text', required: true }
      ],
      logo: '💳'
    },
    { 
      name: 'travelguru', 
      displayName: 'TravelGuru',
      category: 'indian',
      description: 'Indian online travel booking platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'Property ID', type: 'text', required: true },
        { key: 'username', label: 'Username', type: 'text', required: true }
      ],
      logo: '🧳'
    },

    // Domestic OTAs
    { 
      name: 'oyo', 
      displayName: 'OYO',
      category: 'domestic',
      description: 'India\'s largest hospitality company',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'propertyId', label: 'OYO Property ID', type: 'text', required: true }
      ],
      logo: '🏠'
    },
    { 
      name: 'trivago', 
      displayName: 'Trivago',
      category: 'international',
      description: 'Global hotel comparison platform',
      fields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'hotelId', label: 'Hotel ID', type: 'text', required: true },
        { key: 'partnerId', label: 'Partner ID', type: 'text', required: true }
      ],
      logo: '🔍'
    }
  ];

  useEffect(() => {
    fetchData();
    // Auto-refresh sync logs every 30 seconds
    const interval = setInterval(fetchSyncLogs, 30000);
    return () => clearInterval(interval);
  }, [propertyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProperty(),
        fetchChannels(),
        fetchSyncLogs()
      ]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration data' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProperty = async () => {
    try {
      const response = await fetch(`/api/os/properties/${propertyId}`);
      if (!response.ok) throw new Error('Property not found');
      const data = await response.json();
      setProperty(data);
    } catch (error) {
      console.error('Failed to fetch property:', error);
      throw error;
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch(`/api/os/ota/channels/${propertyId}`);
      const data = await response.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      setChannels([]);
    }
  };

  const fetchSyncLogs = async () => {
    try {
      const response = await fetch(`/api/os/ota/sync-logs/${propertyId}`);
      const data = await response.json();
      setSyncLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch sync logs:', error);
    }
  };

  const saveChannelConfig = async (channel: ChannelConfig) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/os/ota/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          channelConfig: channel
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: `${channel.channelDisplayName} configuration saved successfully` });
        await fetchChannels(); // Refresh channels
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save channel configuration' });
      }
    } catch (error) {
      console.error('Failed to save channel config:', error);
      setMessage({ type: 'error', text: 'Failed to save channel configuration' });
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async (channelName: string) => {
    setTesting(channelName);
    try {
      const response = await fetch(`/api/os/ota/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, channelName })
      });
      
      const result = await response.json();
      
      if (result.success && result.connected) {
        setMessage({ 
          type: 'success', 
          text: `${channelName} connection successful (${result.responseTime}ms)` 
        });
        updateChannelStatus(channelName, 'connected');
      } else {
        setMessage({ 
          type: 'error', 
          text: `${channelName} connection failed: ${result.error}` 
        });
        updateChannelStatus(channelName, 'error');
      }
    } catch (error) {
      console.error(`Failed to test ${channelName}:`, error);
      setMessage({ type: 'error', text: `Failed to test ${channelName} connection` });
      updateChannelStatus(channelName, 'error');
    } finally {
      setTesting(null);
    }
  };

  const syncInventory = async (channelName: string) => {
    setSyncing(channelName);
    try {
      const response = await fetch(`/api/os/ota/sync-inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, channelName })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          type: 'success', 
          text: `${channelName} inventory sync started successfully` 
        });
        // Refresh sync logs to show new activity
        setTimeout(fetchSyncLogs, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: `${channelName} sync failed: ${result.error}` 
        });
      }
    } catch (error) {
      console.error(`Failed to sync ${channelName}:`, error);
      setMessage({ type: 'error', text: `Failed to sync ${channelName} inventory` });
    } finally {
      setSyncing(null);
    }
  };

  const updateChannelStatus = (channelName: string, connectionStatus: ChannelConfig['connectionStatus']) => {
    setChannels(prev => prev.map(ch => 
      ch.channelName === channelName 
        ? { ...ch, connectionStatus, lastTestAt: new Date().toISOString() }
        : ch
    ));
  };

  const getChannelConfig = (channelName: string): ChannelConfig | undefined => {
    return channels.find(ch => ch.channelName === channelName);
  };

  const createDefaultChannelConfig = (channelName: string): ChannelConfig => {
    const channel = availableChannels.find(ch => ch.name === channelName);
    return {
      propertyId,
      channelName,
      channelDisplayName: channel?.displayName || channelName,
      enabled: false,
      credentials: {},
      roomTypeMappings: [],
      ratePlanMappings: [],
      channelSettings: {
        currencyCode: 'INR',
        defaultMealPlan: 'EP',
        autoSync: true,
        syncFrequencyMinutes: 30
      },
      syncStatus: 'paused',
      syncErrorCount: 0,
      connectionStatus: 'disconnected'
    };
  };

  const toggleCredentialVisibility = (channelName: string) => {
    setShowCredentials(prev => ({
      ...prev,
      [channelName]: !prev[channelName]
    }));
  };

  const getConnectionStatusBadge = (status: ChannelConfig['connectionStatus']) => {
    const statusConfig = {
      connected: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Connected' },
      disconnected: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, text: 'Disconnected' },
      error: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, text: 'Error' },
      testing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2, text: 'Testing...' }
    };

    const { color, icon: Icon, text } = statusConfig[status];
    return (
      <Badge variant="outline" className={color}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'testing' ? 'animate-spin' : ''}`} />
        {text}
      </Badge>
    );
  };

  const getSyncStatusBadge = (status: ChannelConfig['syncStatus']) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Active' },
      syncing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RefreshCw, text: 'Syncing...' },
      error: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, text: 'Error' },
      paused: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Paused' }
    };

    const { color, icon: Icon, text } = statusConfig[status];
    return (
      <Badge variant="outline" className={color}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'syncing' ? 'animate-spin' : ''}`} />
        {text}
      </Badge>
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const renderChannelContent = (channel: any, channelConfig: ChannelConfig) => {
    return (
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-base font-medium">Enable {channel.displayName}</Label>
            <p className="text-sm text-gray-600 mt-1">
              {channelConfig.enabled ? 'Channel is active and ready to sync' : 'Channel is disabled'}
            </p>
          </div>
          <Switch
            checked={channelConfig.enabled}
            onCheckedChange={(enabled) => {
              const updatedConfig = { ...channelConfig, enabled };
              saveChannelConfig(updatedConfig);
            }}
          />
        </div>

        {channelConfig.enabled && (
          <>
            {/* Credentials Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">API Credentials</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCredentialVisibility(channel.name)}
                >
                  {showCredentials[channel.name] ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show
                    </>
                  )}
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                {channel.fields.map((field: any) => (
                  <div key={field.key} className="space-y-2">
                    <Label className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                      type={field.type === 'password' && !showCredentials[channel.name] ? 'password' : 'text'}
                      value={channelConfig.credentials[field.key as keyof OTACredentials] || ''}
                      onChange={(e) => {
                        const updatedConfig = {
                          ...channelConfig,
                          credentials: {
                            ...channelConfig.credentials,
                            [field.key]: e.target.value
                          }
                        };
                        setChannels(prev => prev.map(ch => 
                          ch.channelName === channel.name ? updatedConfig : ch
                        ));
                      }}
                      placeholder={`Enter your ${field.label.toLowerCase()}`}
                      className="bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Channel Settings */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Channel Settings</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm">Currency Code</Label>
                  <Select 
                    value={channelConfig.channelSettings.currencyCode}
                    onValueChange={(value) => {
                      const updatedConfig = {
                        ...channelConfig,
                        channelSettings: {
                          ...channelConfig.channelSettings,
                          currencyCode: value
                        }
                      };
                      setChannels(prev => prev.map(ch => 
                        ch.channelName === channel.name ? updatedConfig : ch
                      ));
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Default Meal Plan</Label>
                  <Select 
                    value={channelConfig.channelSettings.defaultMealPlan}
                    onValueChange={(value) => {
                      const updatedConfig = {
                        ...channelConfig,
                        channelSettings: {
                          ...channelConfig.channelSettings,
                          defaultMealPlan: value
                        }
                      };
                      setChannels(prev => prev.map(ch => 
                        ch.channelName === channel.name ? updatedConfig : ch
                      ));
                    }}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EP">EP - European Plan (Room Only)</SelectItem>
                      <SelectItem value="CP">CP - Continental Plan (Room + Breakfast)</SelectItem>
                      <SelectItem value="MAP">MAP - Modified American Plan (Room + 2 meals)</SelectItem>
                      <SelectItem value="AP">AP - American Plan (Room + All meals)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Sync Frequency (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={channelConfig.channelSettings.syncFrequencyMinutes}
                    onChange={(e) => {
                      const updatedConfig = {
                        ...channelConfig,
                        channelSettings: {
                          ...channelConfig.channelSettings,
                          syncFrequencyMinutes: parseInt(e.target.value) || 30
                        }
                      };
                      setChannels(prev => prev.map(ch => 
                        ch.channelName === channel.name ? updatedConfig : ch
                      ));
                    }}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div>
                <p className="text-sm font-medium text-blue-900">Channel Actions</p>
                <p className="text-xs text-blue-700 mt-1">
                  Last tested: {formatDate(channelConfig.lastTestAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testConnection(channel.name)}
                  disabled={testing === channel.name}
                >
                  {testing === channel.name ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </Button>
                <Button
                  onClick={() => saveChannelConfig(channelConfig)}
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Config
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loading OTA Configuration</h2>
            <p className="text-gray-600">Please wait while we fetch your channel settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Property not found or you don't have access to this property.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Settings className="h-8 w-8 text-blue-600" />
                OTA Channel Manager
              </h1>
              <p className="text-gray-600 mt-1">
                {property.title} • Manage your online travel agency integrations
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {message && (
          <Alert 
            className={`mb-6 ${
              message.type === 'error' 
                ? 'bg-red-50 border-red-200 text-red-800' 
                : 'bg-green-50 border-green-200 text-green-800'
            }`}
          >
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* OTA Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Channels</p>
                  <p className="text-3xl font-bold text-blue-900">{availableChannels.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Available integrations</p>
                </div>
                <Link className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Connected</p>
                  <p className="text-3xl font-bold text-green-900">
                    {channels.filter(ch => ch.connectionStatus === 'connected').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Active connections</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Syncing</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {channels.filter(ch => ch.syncStatus === 'active' || ch.syncStatus === 'syncing').length}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Auto-syncing channels</p>
                </div>
                <RefreshCw className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Categories</p>
                  <p className="text-3xl font-bold text-purple-900">3</p>
                  <p className="text-xs text-purple-600 mt-1">International, Indian, Domestic</p>
                </div>
                <MapPin className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <TabsList className="w-full grid grid-cols-4 rounded-none bg-gray-50 h-14">
              <TabsTrigger value="channels" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Channels
              </TabsTrigger>
              <TabsTrigger value="mapping" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Room Mapping
              </TabsTrigger>
              <TabsTrigger value="sync" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Sync Control
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Sync Logs
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Channels Tab */}
          <TabsContent value="channels" className="space-y-8">
            {/* International OTAs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">🌍 International OTAs</h2>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {availableChannels.filter(ch => ch.category === 'international').length} channels
                </Badge>
              </div>
              <div className="grid gap-6">
                {availableChannels.filter(ch => ch.category === 'international').map((channel) => {
                  const channelConfig = getChannelConfig(channel.name) || createDefaultChannelConfig(channel.name);
                  
                  return (
                    <Card key={channel.name} className="border-l-4 border-l-blue-500 shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{channel.logo}</span>
                            <div>
                              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                {channel.displayName}
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                  International
                                </Badge>
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getConnectionStatusBadge(testing === channel.name ? 'testing' : channelConfig.connectionStatus)}
                            {getSyncStatusBadge(channelConfig.syncStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      {renderChannelContent(channel, channelConfig)}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Indian OTAs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">🇮🇳 Indian OTAs</h2>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  {availableChannels.filter(ch => ch.category === 'indian').length} channels
                </Badge>
              </div>
              <div className="grid gap-6">
                {availableChannels.filter(ch => ch.category === 'indian').map((channel) => {
                  const channelConfig = getChannelConfig(channel.name) || createDefaultChannelConfig(channel.name);
                  
                  return (
                    <Card key={channel.name} className="border-l-4 border-l-orange-500 shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{channel.logo}</span>
                            <div>
                              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                {channel.displayName}
                                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                  Indian
                                </Badge>
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getConnectionStatusBadge(testing === channel.name ? 'testing' : channelConfig.connectionStatus)}
                            {getSyncStatusBadge(channelConfig.syncStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      {renderChannelContent(channel, channelConfig)}
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Domestic OTAs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-semibold text-gray-900">🏠 Domestic OTAs</h2>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {availableChannels.filter(ch => ch.category === 'domestic').length} channels
                </Badge>
              </div>
              <div className="grid gap-6">
                {availableChannels.filter(ch => ch.category === 'domestic').map((channel) => {
                  const channelConfig = getChannelConfig(channel.name) || createDefaultChannelConfig(channel.name);
                  
                  return (
                    <Card key={channel.name} className="border-l-4 border-l-green-500 shadow-sm">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{channel.logo}</span>
                            <div>
                              <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                                {channel.displayName}
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                  Domestic
                                </Badge>
                              </CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{channel.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            {getConnectionStatusBadge(testing === channel.name ? 'testing' : channelConfig.connectionStatus)}
                            {getSyncStatusBadge(channelConfig.syncStatus)}
                          </div>
                        </div>
                      </CardHeader>
                      {renderChannelContent(channel, channelConfig)}
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* Room Mapping Tab */}
          <TabsContent value="mapping" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Room Type Mapping</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Map your property's room types to OTA-specific room type codes
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {property?.roomTypes && property.roomTypes.length > 0 ? (
                    <div className="grid gap-4">
                      {property.roomTypes.map((roomType) => (
                        <div key={roomType.id} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="font-medium text-gray-900">{roomType.name}</h3>
                              <p className="text-sm text-gray-600">Code: {roomType.code}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {availableChannels.map((channel) => {
                              const channelConfig = getChannelConfig(channel.name);
                              const mapping = channelConfig?.roomTypeMappings.find(m => m.localRoomTypeId === roomType.id);
                              
                              return (
                                <div key={channel.name} className="space-y-2">
                                  <Label className="text-sm font-medium flex items-center gap-2">
                                    <span>{channel.logo}</span>
                                    {channel.displayName}
                                  </Label>
                                  <Input
                                    placeholder={`${channel.displayName} room type ID`}
                                    value={mapping?.channelRoomTypeId || ''}
                                    onChange={(e) => {
                                      // Handle room type mapping updates
                                      console.log('Room type mapping update:', {
                                        roomType: roomType.id,
                                        channel: channel.name,
                                        value: e.target.value
                                      });
                                    }}
                                    className="text-sm"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No room types defined for this property.</p>
                      <p className="text-sm mt-1">Add room types in your property settings first.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sync Control Tab */}
          <TabsContent value="sync" className="space-y-6">
            <div className="grid gap-6">
              {/* Sync Control Panel */}
              <Card className="shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>Sync Control Panel</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Manually trigger syncs and monitor real-time sync status
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {channels.filter(ch => ch.enabled).map((channel) => (
                      <div key={channel.channelName} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {availableChannels.find(ac => ac.name === channel.channelName)?.logo}
                            </span>
                            <div>
                              <h3 className="font-medium text-gray-900">{channel.channelDisplayName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                {getConnectionStatusBadge(channel.connectionStatus)}
                                {getSyncStatusBadge(channel.syncStatus)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => syncInventory(channel.channelName)}
                              disabled={syncing === channel.channelName || channel.connectionStatus !== 'connected'}
                            >
                              {syncing === channel.channelName ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Sync Now
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium text-gray-700">Last Sync</p>
                            <p className="text-gray-600">{formatDate(channel.lastSyncAt)}</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium text-gray-700">Sync Errors</p>
                            <p className="text-gray-600">{channel.syncErrorCount} errors</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="font-medium text-gray-700">Auto Sync</p>
                            <p className="text-gray-600">
                              {channel.channelSettings.autoSync ? 
                                `Every ${channel.channelSettings.syncFrequencyMinutes}min` : 
                                'Disabled'
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {channels.filter(ch => ch.enabled).length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No channels are currently enabled.</p>
                        <p className="text-sm mt-1">Enable channels in the Channels tab to start syncing.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sync Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-6 w-6 text-blue-600" />
                    <div>
                      <CardTitle>Sync History & Logs</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Monitor sync operations and troubleshoot issues
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchSyncLogs}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {syncLogs.length > 0 ? (
                    <>
                      {syncLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">
                                {availableChannels.find(ac => ac.name === log.channelName)?.logo}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {log.channelName} • {log.syncType} sync
                                </p>
                                <p className="text-sm text-gray-600">
                                  {formatDate(log.startTime)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {log.status === 'completed' && (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {log.status === 'failed' && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                              {log.status === 'running' && (
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Running
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600">Records Processed</p>
                              <p className="font-medium">{log.recordsProcessed}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Successful</p>
                              <p className="font-medium text-green-600">{log.successfulRecords}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Failed</p>
                              <p className="font-medium text-red-600">{log.failedRecords}</p>
                            </div>
                          </div>
                          
                          {log.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                              <p className="text-sm font-medium text-red-800 mb-2">Errors:</p>
                              {log.errors.slice(0, 3).map((error, index) => (
                                <p key={index} className="text-xs text-red-700">{error}</p>
                              ))}
                              {log.errors.length > 3 && (
                                <p className="text-xs text-red-600 mt-1">
                                  ...and {log.errors.length - 3} more errors
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {syncLogs.length > 10 && (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600">
                            Showing latest 10 sync logs • {syncLogs.length} total logs
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No sync logs available.</p>
                      <p className="text-sm mt-1">Sync logs will appear here after you run syncs.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}