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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Table Assignment</h2>
          <p className="text-gray-600">Assign waiting customers to available tables</p>
        </div>
        <Button onClick={() => setShowCustomerDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assignment">Table Assignment</TabsTrigger>
          <TabsTrigger value="waiting">Waiting List</TabsTrigger>
        </TabsList>

        {/* Table Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterSection} onValueChange={setFilterSection}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Waiting Customers */}
            <Card>
              <CardHeader>
                <CardTitle>Waiting Customers ({filteredCustomers.filter(c => c.status === 'waiting').length})</CardTitle>
                <CardDescription>Customers waiting to be seated</CardDescription>
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
                          className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            selectedCustomer?.id === customer.id ? 'border-blue-500 bg-blue-50' : ''
                          } ${isLongWait ? 'border-red-200 bg-red-50' : ''}`}
                          onClick={() => setSelectedCustomer(customer)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{customer.name}</span>
                              <Badge variant="outline">
                                {customer.partySize} people
                              </Badge>
                            </div>
                            <Badge className={isLongWait ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
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
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                              <strong>Special Requests:</strong> {customer.specialRequests}
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

            {/* Available Tables */}
            <Card>
              <CardHeader>
                <CardTitle>Available Tables ({availableTables.length})</CardTitle>
                <CardDescription>
                  {selectedCustomer ? 
                    `Suitable tables for ${selectedCustomer.name} (${selectedCustomer.partySize} people)` :
                    'Select a customer to see suitable tables'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedCustomer ? (
                    getSuitableTables(selectedCustomer.partySize).map((table) => (
                      <div
                        key={table.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                          selectedTable === table.id ? 'border-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{table.name}</span>
                            <Badge variant="outline">
                              {table.capacity} seats
                            </Badge>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Section: {sections.find(s => s.id === table.section)?.name}
                        </div>
                      </div>
                    ))
                  ) : (
                    availableTables.map((table) => (
                      <div
                        key={table.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{table.name}</span>
                            <Badge variant="outline">
                              {table.capacity} seats
                            </Badge>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Available
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600">
                          Section: {sections.find(s => s.id === table.section)?.name}
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

        {/* Waiting List Tab */}
        <TabsContent value="waiting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Waiting List</CardTitle>
              <CardDescription>All customers and their current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customers.map((customer) => {
                  const waitTime = getWaitTime(customer.arrivalTime);
                  
                  return (
                    <div key={customer.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium">{customer.name}</span>
                          <Badge variant="outline">{customer.partySize} people</Badge>
                          <Badge className={
                            customer.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                            customer.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {customer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>{customer.phone}</span>
                          {customer.email && <span>{customer.email}</span>}
                          <span>Wait: {waitTime}m</span>
                          {customer.estimatedWaitTime && (
                            <span>Est: {customer.estimatedWaitTime}m</span>
                          )}
                        </div>
                        {customer.specialRequests && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Special Requests:</strong> {customer.specialRequests}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        {customer.status === 'waiting' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCustomer(customer)}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Seat
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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