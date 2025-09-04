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
  ArrowLeft
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
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/os/fb/dashboard/${propertyId}`)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to F&B Dashboard</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Table Management</h1>
            <p className="text-gray-600 mt-2">Manage restaurant seating and table assignments</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-capacity"
              checked={showCapacity}
              onCheckedChange={setShowCapacity}
            />
            <label htmlFor="show-capacity" className="text-sm">Show Capacity</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="show-status"
              checked={showStatus}
              onCheckedChange={setShowStatus}
            />
            <label htmlFor="show-status" className="text-sm">Show Status</label>
          </div>
          <Button 
            onClick={() => setLayoutMode(layoutMode === 'view' ? 'edit' : 'view')}
            variant={layoutMode === 'edit' ? 'default' : 'outline'}
            className={layoutMode === 'edit' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            <Move className="w-4 h-4 mr-2" />
            {layoutMode === 'edit' ? 'Exit Edit' : 'Edit Layout'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableStats.totalTables}</div>
            <p className="text-xs text-muted-foreground">
              {tableStats.availableTables} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableStats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {tableStats.currentOccupancy} / {tableStats.totalCapacity} seats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Turnover</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableStats.averageTurnoverTime}m</div>
            <p className="text-xs text-muted-foreground">
              Per table today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{tableStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From table service
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="layout">Floor Plan</TabsTrigger>
          <TabsTrigger value="assignment">Table Assignment</TabsTrigger>
          <TabsTrigger value="waitlist">Waitlist</TabsTrigger>
        </TabsList>

        {/* Floor Plan Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Restaurant Floor Plan</CardTitle>
                  <CardDescription>
                    {layoutMode === 'edit' ? 'Drag tables to rearrange the layout' : 'Current table layout and status'}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Section" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sections</SelectItem>
                      {sections.map(section => (
                        <SelectItem key={section.id} value={section.id}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: section.color }}
                            ></div>
                            <span>{section.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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

      {/* Table Status Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Table Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { status: 'available', label: 'Available', count: tableStats.availableTables },
              { status: 'occupied', label: 'Occupied', count: tableStats.occupiedTables },
              { status: 'reserved', label: 'Reserved', count: tableStats.reservedTables },
              { status: 'cleaning', label: 'Cleaning', count: 2 },
              { status: 'maintenance', label: 'Maintenance', count: 1 }
            ].map(({ status, label, count }) => (
              <div key={status} className="flex items-center space-x-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
                <div>
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-gray-500">{count} tables</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}