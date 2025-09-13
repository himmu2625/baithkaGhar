'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Users, 
  Clock, 
  Search, 
  Filter,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  partySize: number;
  arrivalTime: string;
  specialRequests?: string;
  status: 'waiting' | 'seated' | 'completed';
  estimatedWaitTime?: number;
}

interface TableAssignmentProps {
  propertyId: string;
  tables: Table[];
  sections: TableSection[];
  onTableUpdate: (table: Table) => void;
}

export function TableAssignment({ propertyId, tables, sections, onTableUpdate }: TableAssignmentProps) {
  const { data: session } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('assignment');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSection, setFilterSection] = useState<string>('all');
  
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    partySize: 2,
    specialRequests: '',
  });

  useEffect(() => {
    // Fetch waiting customers
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`/api/fb/customers/waiting?propertyId=${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCustomers(data.customers || []);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        // Mock data for development
        setCustomers([
          {
            id: '1',
            name: 'John Smith',
            phone: '+91 9876543210',
            email: 'john@example.com',
            partySize: 4,
            arrivalTime: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            status: 'waiting',
            estimatedWaitTime: 15,
            specialRequests: 'High chair needed'
          },
          {
            id: '2',
            name: 'Alice Johnson',
            phone: '+91 9876543211',
            partySize: 2,
            arrivalTime: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            status: 'waiting',
            estimatedWaitTime: 10
          },
          {
            id: '3',
            name: 'Bob Wilson',
            phone: '+91 9876543212',
            partySize: 6,
            arrivalTime: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
            status: 'waiting',
            estimatedWaitTime: 25,
            specialRequests: 'Vegetarian preferences'
          }
        ]);
      }
    };

    if (propertyId && session) {
      fetchCustomers();
    }
  }, [propertyId, session]);

  const availableTables = tables.filter(table => 
    table.status === 'available' && 
    table.isActive &&
    (filterSection === 'all' || table.section === filterSection)
  );

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getWaitTime = (arrivalTime: string) => {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    return Math.floor((now.getTime() - arrival.getTime()) / 60000);
  };

  const getSuitableTables = (partySize: number) => {
    return availableTables
      .filter(table => table.capacity >= partySize && table.capacity <= partySize + 2)
      .sort((a, b) => a.capacity - b.capacity);
  };

  const handleAssignTable = async () => {
    if (!selectedCustomer || !selectedTable) return;

    try {
      const response = await fetch(`/api/fb/tables/${selectedTable}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          partySize: selectedCustomer.partySize,
          propertyId,
        }),
      });

      if (response.ok) {
        const table = tables.find(t => t.id === selectedTable);
        if (table) {
          const updatedTable = {
            ...table,
            status: 'occupied' as const,
            currentOrder: {
              id: Date.now().toString(),
              orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
              customerName: selectedCustomer.name,
              partySize: selectedCustomer.partySize,
              startTime: new Date().toISOString(),
              totalAmount: 0,
            }
          };
          onTableUpdate(updatedTable);
        }

        // Update customer status
        setCustomers(customers =>
          customers.map(c =>
            c.id === selectedCustomer.id ? { ...c, status: 'seated' as const } : c
          )
        );

        setShowAssignDialog(false);
        setSelectedCustomer(null);
        setSelectedTable('');
      }
    } catch (error) {
      console.error('Error assigning table:', error);
    }
  };

  const handleAddCustomer = async () => {
    try {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: customerForm.name,
        phone: customerForm.phone,
        email: customerForm.email,
        partySize: customerForm.partySize,
        arrivalTime: new Date().toISOString(),
        status: 'waiting',
        specialRequests: customerForm.specialRequests,
        estimatedWaitTime: Math.ceil(Math.random() * 20 + 10), // 10-30 minutes
      };

      const response = await fetch('/api/fb/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({ ...newCustomer, propertyId }),
      });

      if (response.ok) {
        setCustomers(customers => [...customers, newCustomer]);
      } else {
        // For development, add anyway
        setCustomers(customers => [...customers, newCustomer]);
      }

      setCustomerForm({
        name: '',
        phone: '',
        email: '',
        partySize: 2,
        specialRequests: '',
      });
      setShowCustomerDialog(false);
    } catch (error) {
      console.error('Error adding customer:', error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-700">
      {/* Enhanced Header - OS Dashboard Style */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-0 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-green-900 tracking-tight">Table Assignment</h2>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700">Smart Customer-Table Matching</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-600 font-medium">Live Updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-800">{filteredCustomers.filter(c => c.status === 'waiting').length}</div>
              <div className="text-green-600 text-sm">Waiting</div>
            </div>
            <div className="w-px h-12 bg-green-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-800">{availableTables.length}</div>
              <div className="text-emerald-600 text-sm">Available</div>
            </div>
            <Button 
              onClick={() => setShowCustomerDialog(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gradient-to-r from-gray-100 to-gray-50 backdrop-blur-sm border-0 shadow-md p-1">
          <TabsTrigger 
            value="assignment" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-50 data-[state=active]:to-emerald-100 data-[state=active]:text-green-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-green-100 hover:to-emerald-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <span>Table Assignment</span>
            </div>
          </TabsTrigger>
          <TabsTrigger 
            value="waiting" 
            className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-yellow-50 data-[state=active]:to-orange-100 data-[state=active]:text-yellow-700 data-[state=active]:shadow-lg font-semibold relative overflow-hidden transition-all duration-300 hover:from-yellow-100 hover:to-orange-200 group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center space-x-2">
              <div className="p-1 rounded bg-yellow-500/20 group-hover:bg-yellow-500/30 transition-colors">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <span>Waiting List</span>
            </div>
          </TabsTrigger>
        </TabsList>

        {/* Table Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          {/* Enhanced Filters */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border-b border-green-200/50">
              <CardTitle className="text-lg flex items-center space-x-2 text-green-900">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Filter className="h-4 w-4 text-green-600" />
                </div>
                <span>Smart Filters & Search</span>
              </CardTitle>
              <CardDescription className="text-green-700">Find and match customers with available tables</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
                  <Input
                    placeholder="Search customers by name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 border-0 bg-gradient-to-r from-green-50/80 to-emerald-50/80 shadow-md hover:shadow-lg transition-all duration-300 focus:shadow-lg focus:from-green-100/80 focus:to-emerald-100/80 font-medium text-green-900 placeholder:text-green-500"
                  />
                </div>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger className="w-64 h-12 border-0 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md hover:shadow-lg transition-all duration-300 hover:from-blue-100 hover:to-indigo-100 group">
                    <div className="flex items-center space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <SelectValue placeholder="Select Section" className="text-blue-800 font-medium" />
                      </div>
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg border-0 shadow-2xl rounded-xl p-2">
                    <SelectItem value="all" className="rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 transition-all duration-200 p-3 cursor-pointer">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-full bg-gradient-to-r from-gray-100 to-slate-100">
                          <MapPin className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-gray-800">All Sections</span>
                      </div>
                    </SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id} className="rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 p-3 cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                              style={{ backgroundColor: section.color }}
                            ></div>
                          </div>
                          <span className="font-medium text-blue-800">{section.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enhanced Waiting Customers */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50/80 to-orange-50/80 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-yellow-100/60 to-orange-100/60 border-b border-yellow-200/50">
                <CardTitle className="text-lg flex items-center space-x-2 text-yellow-900">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>Waiting Customers</span>
                  <Badge className="bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800 border-0 shadow-sm ml-2">
                    {filteredCustomers.filter(c => c.status === 'waiting').length} waiting
                  </Badge>
                </CardTitle>
                <CardDescription className="text-yellow-700">Select a customer to find suitable tables</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredCustomers
                    .filter(customer => customer.status === 'waiting')
                    .map((customer) => {
                      const waitTime = getWaitTime(customer.arrivalTime);
                      const isLongWait = waitTime > 20;

                      return (
                        <div
                          key={customer.id}
                          className={`p-4 border-0 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                            selectedCustomer?.id === customer.id 
                              ? 'bg-gradient-to-r from-green-50 to-emerald-100 shadow-lg ring-2 ring-green-200' 
                              : isLongWait 
                                ? 'bg-gradient-to-r from-red-50 to-pink-100 shadow-md hover:shadow-lg' 
                                : 'bg-gradient-to-r from-gray-50 to-slate-50 hover:from-yellow-50 hover:to-orange-100 shadow-sm'
                          }`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{customer.name}</span>
                              <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
                                {customer.partySize} people
                              </Badge>
                            </div>
                            <Badge className={isLongWait ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-0 shadow-sm animate-pulse' : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-0 shadow-sm'}>
                              {waitTime}m wait
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>{customer.phone}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Est. {customer.estimatedWaitTime}m</span>
                            </div>
                          </div>
                          {customer.specialRequests && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-100 border-0 rounded-lg text-sm shadow-sm">
                              <div className="flex items-center space-x-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <strong className="text-amber-800">Special Requests:</strong>
                              </div>
                              <span className="text-amber-700">{customer.specialRequests}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  
                  {filteredCustomers.filter(c => c.status === 'waiting').length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No customers waiting</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Available Tables */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/80 to-indigo-50/80 hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-100/60 to-indigo-100/60 border-b border-blue-200/50">
                <CardTitle className="text-lg flex items-center space-x-2 text-blue-900">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <span>Available Tables</span>
                  <Badge className="bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800 border-0 shadow-sm ml-2">
                    {availableTables.length} available
                  </Badge>
                </CardTitle>
                <CardDescription className="text-blue-700">
                  {selectedCustomer ? 
                    `Perfect matches for ${selectedCustomer.name} (${selectedCustomer.partySize} people)` :
                    'Select a customer above to see perfectly suited tables'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCustomer ? (
                    getSuitableTables(selectedCustomer.partySize).map((table) => (
                      <div
                        key={table.id}
                        className={`p-4 border-0 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-md ${
                          selectedTable === table.id 
                            ? 'bg-gradient-to-r from-green-100 to-emerald-100 shadow-lg ring-2 ring-green-300' 
                            : 'bg-gradient-to-r from-white to-slate-50 hover:from-blue-50 hover:to-indigo-50 shadow-sm'
                        }`}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${selectedTable === table.id ? 'bg-green-500/20' : 'bg-blue-500/20'} transition-colors`}>
                              <Users className={`w-4 h-4 ${selectedTable === table.id ? 'text-green-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 text-lg">{table.name}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm text-xs">
                                  {table.capacity} seats
                                </Badge>
                                {table.capacity === selectedCustomer.partySize && (
                                  <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-0 shadow-sm text-xs">
                                    Perfect Fit
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge className={`${selectedTable === table.id ? 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800' : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'} border-0 shadow-sm font-medium`}>
                            {selectedTable === table.id ? 'Selected' : 'Available'}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>Section: {sections.find(s => s.id === table.section)?.name}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    availableTables.map((table) => (
                      <div
                        key={table.id}
                        className="p-4 border-0 rounded-xl bg-gradient-to-r from-white to-slate-50 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{table.name}</span>
                              <div className="mt-1">
                                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm text-xs">
                                  {table.capacity} seats
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-0 shadow-sm">
                            Available
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>Section: {sections.find(s => s.id === table.section)?.name}</span>
                        </div>
                      </div>
                    ))
                  )}

                  {availableTables.length === 0 && (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No tables available</p>
                    </div>
                  )}
                </div>

                {selectedCustomer && selectedTable && (
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      className="w-full"
                      onClick={() => setShowAssignDialog(true)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Assign {selectedCustomer.name} to {tables.find(t => t.id === selectedTable)?.name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Waiting List Tab */}
        <TabsContent value="waiting" className="space-y-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-orange-50/80 to-red-50/80 border-b border-orange-200/50">
              <CardTitle className="text-xl flex items-center space-x-2 text-orange-900">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <span>Complete Waiting List</span>
                <Badge className="bg-gradient-to-r from-orange-200 to-red-200 text-orange-800 border-0 shadow-sm ml-2">
                  {customers.length} total customers
                </Badge>
              </CardTitle>
              <CardDescription className="text-orange-700">Comprehensive view of all customers and their current status</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {customers.map((customer) => {
                  const waitTime = getWaitTime(customer.arrivalTime);
                  const isLongWait = waitTime > 20;
                  
                  return (
                    <div key={customer.id} className={`p-6 border-0 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
                      customer.status === 'waiting' && isLongWait
                        ? 'bg-gradient-to-r from-red-50 to-pink-50 shadow-red-100'
                        : customer.status === 'waiting'
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                          : customer.status === 'seated'
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50'
                            : 'bg-gradient-to-r from-green-50 to-emerald-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className={`p-2 rounded-lg ${
                              customer.status === 'waiting' 
                                ? 'bg-yellow-500/20' 
                                : customer.status === 'seated'
                                  ? 'bg-blue-500/20'
                                  : 'bg-green-500/20'
                            }`}>
                              <User className={`w-4 h-4 ${
                                customer.status === 'waiting' 
                                  ? 'text-yellow-600' 
                                  : customer.status === 'seated'
                                    ? 'text-blue-600'
                                    : 'text-green-600'
                              }`} />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 text-lg">{customer.name}</span>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 shadow-sm">
                                  {customer.partySize} people
                                </Badge>
                                <Badge className={`border-0 shadow-sm font-medium ${
                                  customer.status === 'waiting' && isLongWait
                                    ? 'bg-gradient-to-r from-red-200 to-pink-200 text-red-800 animate-pulse'
                                    : customer.status === 'waiting' 
                                      ? 'bg-gradient-to-r from-yellow-200 to-orange-200 text-yellow-800'
                                      : customer.status === 'seated'
                                        ? 'bg-gradient-to-r from-blue-200 to-indigo-200 text-blue-800'
                                        : 'bg-gradient-to-r from-green-200 to-emerald-200 text-green-800'
                                }`}>
                                  {customer.status === 'waiting' && isLongWait && <AlertCircle className="w-3 h-3 mr-1" />}
                                  {customer.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Phone className="w-3 h-3" />
                                <span className="font-medium">{customer.phone}</span>
                              </div>
                              {customer.email && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Mail className="w-3 h-3" />
                                  <span>{customer.email}</span>
                                </div>
                              )}
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Clock className="w-3 h-3" />
                                <span>Waiting: <span className={`font-medium ${isLongWait ? 'text-red-600' : ''}`}>{waitTime}m</span></span>
                              </div>
                              {customer.estimatedWaitTime && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Calendar className="w-3 h-3" />
                                  <span>Estimated: {customer.estimatedWaitTime}m</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {customer.specialRequests && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-yellow-100 border-0 rounded-lg shadow-sm">
                              <div className="flex items-center space-x-2 mb-1">
                                <AlertCircle className="w-4 h-4 text-amber-600" />
                                <span className="font-semibold text-amber-800 text-sm">Special Requests:</span>
                              </div>
                              <p className="text-amber-700 text-sm">{customer.specialRequests}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" size="sm" className="bg-white/60 hover:bg-green-50 border-green-200 hover:border-green-300 transition-colors">
                            <Phone className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button variant="outline" size="sm" className="bg-white/60 hover:bg-blue-50 border-blue-200 hover:border-blue-300 transition-colors">
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          {customer.status === 'waiting' && (
                            <Button 
                              size="sm"
                              onClick={() => setSelectedCustomer(customer)}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                            >
                              <Users className="w-4 h-4 mr-1" />
                              Seat Now
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {isLongWait && customer.status === 'waiting' && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-red-100 to-pink-100 border-0 rounded-lg">
                          <div className="flex items-center space-x-2 text-red-800">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-semibold text-sm">Priority Customer - Long Wait Time</span>
                          </div>
                          <p className="text-red-700 text-xs mt-1">Customer has been waiting {waitTime - 20} minutes longer than expected</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {customers.length === 0 && (
                  <div className="text-center py-16">
                    <div className="p-6 bg-gray-100 rounded-full w-fit mx-auto mb-6">
                      <Users className="w-16 h-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No customers in waitlist</h3>
                    <p className="text-gray-500">Add customers to the waitlist to see them here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assignment Confirmation Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Table Assignment</DialogTitle>
            <DialogDescription>
              Assign {selectedCustomer?.name} to {tables.find(t => t.id === selectedTable)?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && selectedTable && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium mb-2">Customer Details</h4>
                <div className="space-y-1 text-sm">
                  <div>Name: {selectedCustomer.name}</div>
                  <div>Phone: {selectedCustomer.phone}</div>
                  <div>Party Size: {selectedCustomer.partySize} people</div>
                  <div>Wait Time: {getWaitTime(selectedCustomer.arrivalTime)} minutes</div>
                  {selectedCustomer.specialRequests && (
                    <div>Special Requests: {selectedCustomer.specialRequests}</div>
                  )}
                </div>
              </div>
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium mb-2">Table Details</h4>
                <div className="space-y-1 text-sm">
                  <div>Table: {tables.find(t => t.id === selectedTable)?.name}</div>
                  <div>Capacity: {tables.find(t => t.id === selectedTable)?.capacity} seats</div>
                  <div>Section: {sections.find(s => s.id === tables.find(t => t.id === selectedTable)?.section)?.name}</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignTable}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Add a customer to the waiting list
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                placeholder="Enter customer name"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="customerPhone">Phone Number *</Label>
              <Input
                id="customerPhone"
                placeholder="Enter phone number"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                placeholder="Enter email address"
                value={customerForm.email}
                onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="partySize">Party Size *</Label>
              <Select value={customerForm.partySize.toString()} onValueChange={(value) => setCustomerForm({ ...customerForm, partySize: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party size" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                    <SelectItem key={size} value={size.toString()}>
                      {size} {size === 1 ? 'person' : 'people'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="specialRequests">Special Requests</Label>
              <Textarea
                id="specialRequests"
                placeholder="Any special requirements or preferences"
                value={customerForm.specialRequests}
                onChange={(e) => setCustomerForm({ ...customerForm, specialRequests: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddCustomer}
              disabled={!customerForm.name || !customerForm.phone}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}