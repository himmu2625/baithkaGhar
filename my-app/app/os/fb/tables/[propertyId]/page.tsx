'use client';

import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Users,
  Clock,
  IndianRupee,
  Settings,
  RotateCcw,
  Eye,
  EyeOff,
  Move,
  Square,
  Circle,
  Triangle,
  ArrowLeft,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { TableLayout } from '@/components/os/fb/tables/TableLayout';
import { TableAssignment } from '@/components/os/fb/tables/TableAssignment';
import { WaitlistManager } from '@/components/os/fb/tables/WaitlistManager';

interface Table {
  id: string;
  name: string;
  capacity: number;
  shape: 'square' | 'circle' | 'rectangle';
  position: { x: number; y: number };
  rotation: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
  isActive: boolean;
  section: string;
  currentOrder?: {
    id: string;
    orderNumber: string;
    customerName: string;
    partySize: number;
    startTime: string;
    totalAmount: number;
  };
  reservation?: {
    id: string;
    customerName: string;
    partySize: number;
    reservationTime: string;
    phone: string;
  };
}

interface TableSection {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface TableStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  totalCapacity: number;
  currentOccupancy: number;
  occupancyRate: number;
  averageTurnoverTime: number;
  totalRevenue: number;
}

export default function TableManagement() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const propertyId = params?.propertyId as string;
  
  const [tables, setTables] = useState<Table[]>([]);
  const [sections, setSections] = useState<TableSection[]>([]);
  const [tableStats, setTableStats] = useState<TableStats>({
    totalTables: 0,
    availableTables: 0,
    occupiedTables: 0,
    reservedTables: 0,
    totalCapacity: 0,
    currentOccupancy: 0,
    occupancyRate: 0,
    averageTurnoverTime: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('layout');
  const [layoutMode, setLayoutMode] = useState<'view' | 'edit'>('view');
  const [showCapacity, setShowCapacity] = useState(true);
  const [showStatus, setShowStatus] = useState(true);

  useEffect(() => {
    const fetchTableData = async () => {
      try {
        setLoading(true);
        
        const [tablesRes, sectionsRes, statsRes] = await Promise.all([
          fetch(`/api/fb/tables?propertyId=${propertyId}&withDetails=true`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/tables/sections?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          }),
          fetch(`/api/fb/tables/stats?propertyId=${propertyId}`, {
            headers: {
              'Authorization': `Bearer ${session?.accessToken}`,
            },
          })
        ]);

        if (!tablesRes.ok || !sectionsRes.ok || !statsRes.ok) {
          const errorMsg = `Failed to fetch table data: Tables(${tablesRes.status}), Sections(${sectionsRes.status}), Stats(${statsRes.status})`;
          throw new Error(errorMsg);
        }

        const [tablesData, sectionsData, statsData] = await Promise.all([
          tablesRes.json(),
          sectionsRes.json(),
          statsRes.json()
        ]);
        
        if (tablesData.success && sectionsData.success && statsData.success) {
          setTables(tablesData.tables || []);
          setSections(sectionsData.sections || []);
          setTableStats(statsData.stats || tableStats);
        } else {
          throw new Error('API returned error responses');
        }
      } catch (err) {
        console.error('Error fetching table data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load table data');
      } finally {
        setLoading(false);
      }
    };

    if (propertyId && session) {
      fetchTableData();
    }
  }, [propertyId, session]);

  const filteredTables = tables.filter(table => {
    const matchesSearch = table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         table.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'all' || table.section === selectedSection;
    const matchesStatus = selectedStatus === 'all' || table.status === selectedStatus;
    
    return matchesSearch && matchesSection && matchesStatus;
  });

  const handleUpdateTableStatus = async (tableId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/fb/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTables(tables =>
            tables.map(table =>
              table.id === tableId ? { ...table, status: newStatus as any } : table
            )
          );
          // Refresh stats to reflect the change
          const statsRes = await fetch(`/api/fb/tables/stats?propertyId=${propertyId}`, {
            headers: { 'Authorization': `Bearer ${session?.accessToken}` }
          });
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            if (statsData.success) {
              setTableStats(statsData.stats);
            }
          }
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update table status:', errorData.message);
        setError(errorData.message || 'Failed to update table status');
      }
    } catch (err) {
      console.error('Error updating table status:', err);
      setError('Network error while updating table status');
    }
  };

  const handleUpdateTablePosition = (tableId: string, position: { x: number; y: number }) => {
    setTables(tables =>
      tables.map(table =>
        table.id === tableId ? { ...table, position } : table
      )
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <Users className="w-4 h-4 text-green-500" />;
      case 'occupied': return <Users className="w-4 h-4 text-red-500" />;
      case 'reserved': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cleaning': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'maintenance': return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-yellow-100 text-yellow-800';
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'square': return <Square className="w-4 h-4" />;
      case 'circle': return <Circle className="w-4 h-4" />;
      case 'rectangle': return <Square className="w-4 h-4 scale-x-150" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
                className="flex items-center space-x-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to F&B Dashboard</span>
              </Button>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Table Management</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <Square className="h-4 w-4" />
                    <span className="text-purple-100">Restaurant Seating & Layout</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-200 font-medium">Live Status</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{tableStats.totalTables}</div>
              <div className="text-purple-200 text-sm">Total Tables</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{tableStats.occupancyRate}%</div>
              <div className="text-purple-200 text-sm">Occupancy</div>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-capacity"
                  checked={showCapacity}
                  onCheckedChange={setShowCapacity}
                  className="data-[state=checked]:bg-white/30"
                />
                <label htmlFor="show-capacity" className="text-sm text-white/80">Capacity</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-status"
                  checked={showStatus}
                  onCheckedChange={setShowStatus}
                  className="data-[state=checked]:bg-white/30"
                />
                <label htmlFor="show-status" className="text-sm text-white/80">Status</label>
              </div>
            </div>
            <Button 
              onClick={() => setLayoutMode(layoutMode === 'view' ? 'edit' : 'view')}
              className={layoutMode === 'edit' 
                ? 'bg-white text-purple-600 hover:bg-white/90' 
                : 'bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm'
              }
            >
              <Move className="w-4 h-4 mr-2" />
              {layoutMode === 'edit' ? 'Exit Edit' : 'Edit Layout'}
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Key Metrics - OS Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-blue-50 to-indigo-100 hover:from-blue-100 hover:to-indigo-200">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">Total Tables</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-blue-900 mb-1">{tableStats.totalTables}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-blue-600">{tableStats.availableTables} available</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-emerald-50 to-green-100 hover:from-emerald-100 hover:to-green-200">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-emerald-700">Occupancy Rate</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-emerald-900 mb-1">{tableStats.occupancyRate}%</div>
            <div className="space-y-2">
              <div className="w-full bg-emerald-200 rounded-full h-2">
                <div
                  className="bg-emerald-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${tableStats.occupancyRate}%` }}
                ></div>
              </div>
              <span className="text-xs text-emerald-600">{tableStats.currentOccupancy} / {tableStats.totalCapacity} seats</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">Avg Turnover</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-colors">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-amber-900 mb-1">{tableStats.averageTurnoverTime}m</div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-amber-600">Per table today</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-br from-purple-50 to-pink-100 hover:from-purple-100 hover:to-pink-200">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10"></div>
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-purple-700">Today's Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
              <IndianRupee className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold text-purple-900 mb-1">₹{tableStats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-purple-600">From table service</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="layout" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-50 data-[state=active]:to-indigo-100 data-[state=active]:text-purple-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-purple-100 hover:to-indigo-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                <MapPin className="h-4 w-4 text-purple-600" />
              </div>
              <span>Floor Plan</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="assignment" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <span>Table Assignment</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="waitlist" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-50 data-[state=active]:to-orange-100 data-[state=active]:text-yellow-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-yellow-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <span>Waitlist</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Enhanced Floor Plan Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-purple-800 flex items-center space-x-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Square className="h-5 w-5 text-purple-600" />
                    </div>
                    <span>Restaurant Floor Plan</span>
                  </CardTitle>
                  <CardDescription className="text-purple-600">
                    {layoutMode === 'edit' ? 'Drag tables to rearrange the layout' : 'Current table layout and status'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-64 border-0 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:from-purple-100 hover:to-indigo-100 group backdrop-blur-sm">
                      <div className="flex items-center space-x-3 w-full">
                        <div className="p-2 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 text-left">
                          <SelectValue placeholder="Section" className="text-purple-800 font-medium" />
                        </div>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                      <SelectItem value="all" className="rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-slate-100">
                            <Users className="w-4 h-4 text-gray-600" />
                          </div>
                          <span className="font-medium text-gray-800">All Sections</span>
                        </div>
                      </SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id} className="rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100">
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                                style={{ backgroundColor: section.color }}
                              ></div>
                            </div>
                            <span className="font-medium text-purple-800">{section.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <TableLayout
                tables={filteredTables}
                sections={sections}
                isEditMode={layoutMode === 'edit'}
                showCapacity={showCapacity}
                showStatus={showStatus}
                onTablePositionChange={handleUpdateTablePosition}
                onTableStatusChange={handleUpdateTableStatus}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          <TableAssignment
            propertyId={propertyId}
            tables={tables}
            sections={sections}
            onTableUpdate={(updatedTable) => {
              setTables(tables =>
                tables.map(table =>
                  table.id === updatedTable.id ? updatedTable : table
                )
              );
            }}
          />
        </TabsContent>

        {/* Waitlist Tab */}
        <TabsContent value="waitlist" className="space-y-6">
          <WaitlistManager
            propertyId={propertyId}
            availableTables={tables.filter(t => t.status === 'available')}
            onTableAssign={handleUpdateTableStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Modernized Table Status Legend - OS Style */}
      <Card className="border-0 shadow-2xl bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-indigo-100/80 via-blue-100/80 to-purple-100/80 border-b border-indigo-200/50 backdrop-blur-sm">
          <CardTitle className="text-xl flex items-center space-x-3 text-indigo-900">
            <div className="p-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl shadow-lg">
              <Eye className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <span className="font-bold">Table Status Legend</span>
              <div className="text-sm font-normal text-indigo-700 mt-1">Live status indicators and table availability</div>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Real-time Updates</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { 
                status: 'available', 
                label: 'Available', 
                count: tableStats.availableTables,
                description: 'Ready for seating',
                gradient: 'from-green-50 to-emerald-100',
                iconBg: 'from-green-500/20 to-emerald-500/30',
                textColor: 'text-green-900',
                subTextColor: 'text-green-700',
                badgeColor: 'from-green-200 to-emerald-200 text-green-800'
              },
              { 
                status: 'occupied', 
                label: 'Occupied', 
                count: tableStats.occupiedTables,
                description: 'Currently in use',
                gradient: 'from-red-50 to-pink-100',
                iconBg: 'from-red-500/20 to-pink-500/30',
                textColor: 'text-red-900',
                subTextColor: 'text-red-700',
                badgeColor: 'from-red-200 to-pink-200 text-red-800'
              },
              { 
                status: 'reserved', 
                label: 'Reserved', 
                count: tableStats.reservedTables,
                description: 'Booking confirmed',
                gradient: 'from-yellow-50 to-orange-100',
                iconBg: 'from-yellow-500/20 to-orange-500/30',
                textColor: 'text-yellow-900',
                subTextColor: 'text-yellow-700',
                badgeColor: 'from-yellow-200 to-orange-200 text-yellow-800'
              },
              { 
                status: 'cleaning', 
                label: 'Cleaning', 
                count: 2,
                description: 'Being sanitized',
                gradient: 'from-blue-50 to-indigo-100',
                iconBg: 'from-blue-500/20 to-indigo-500/30',
                textColor: 'text-blue-900',
                subTextColor: 'text-blue-700',
                badgeColor: 'from-blue-200 to-indigo-200 text-blue-800'
              },
              { 
                status: 'maintenance', 
                label: 'Maintenance', 
                count: 1,
                description: 'Under repair',
                gradient: 'from-gray-50 to-slate-100',
                iconBg: 'from-gray-500/20 to-slate-500/30',
                textColor: 'text-gray-900',
                subTextColor: 'text-gray-700',
                badgeColor: 'from-gray-200 to-slate-200 text-gray-800'
              }
            ].map(({ status, label, count, description, gradient, iconBg, textColor, subTextColor, badgeColor }) => (
              <div key={status} className={`relative overflow-hidden group bg-gradient-to-br ${gradient} border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${iconBg} shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                      {getStatusIcon(status)}
                    </div>
                    <Badge className={`bg-gradient-to-r ${badgeColor} border-0 shadow-sm group-hover:shadow-md transition-all duration-300 font-semibold px-3 py-1`}>
                      {count}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className={`font-bold text-lg ${textColor} group-hover:text-opacity-90 transition-colors`}>
                      {label}
                    </h3>
                    <p className={`text-sm font-medium ${subTextColor} opacity-80`}>
                      {description}
                    </p>
                    <div className="pt-2">
                      <div className={`text-xs ${subTextColor} font-medium flex items-center space-x-1`}>
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'available' ? 'bg-green-500' :
                          status === 'occupied' ? 'bg-red-500 animate-pulse' :
                          status === 'reserved' ? 'bg-yellow-500' :
                          status === 'cleaning' ? 'bg-blue-500 animate-spin' :
                          'bg-gray-500'
                        } ${status === 'occupied' || status === 'cleaning' ? 'animate-pulse' : ''}`}></div>
                        <span>
                          {count === 0 ? 'None' : 
                           count === 1 ? '1 table' : 
                           `${count} tables`}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress indicator for occupied tables */}
                  {status === 'occupied' && count > 0 && (
                    <div className="mt-4 pt-3 border-t border-red-200/50">
                      <div className="flex items-center justify-between text-xs text-red-700 mb-1">
                        <span>Occupancy</span>
                        <span>{Math.round((count / tableStats.totalTables) * 100)}%</span>
                      </div>
                      <div className="w-full bg-red-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-red-500 to-pink-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(count / tableStats.totalTables) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Availability indicator for available tables */}
                  {status === 'available' && count > 0 && (
                    <div className="mt-4 pt-3 border-t border-green-200/50">
                      <div className="flex items-center justify-between text-xs text-green-700 mb-1">
                        <span>Available</span>
                        <span>{Math.round((count / tableStats.totalTables) * 100)}%</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(count / tableStats.totalTables) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary Stats */}
          <div className="mt-8 pt-6 border-t border-indigo-200/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 rounded-xl shadow-sm">
                <div className="text-2xl font-bold text-indigo-900 mb-1">{tableStats.totalTables}</div>
                <div className="text-sm font-medium text-indigo-700">Total Tables</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50/80 to-pink-50/80 rounded-xl shadow-sm">
                <div className="text-2xl font-bold text-purple-900 mb-1">{tableStats.occupancyRate}%</div>
                <div className="text-sm font-medium text-purple-700">Occupancy Rate</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-xl shadow-sm">
                <div className="text-2xl font-bold text-blue-900 mb-1">{tableStats.currentOccupancy}</div>
                <div className="text-sm font-medium text-blue-700">Current Guests</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}