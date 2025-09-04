'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Clock, Users, MapPin, Package, DollarSign, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { EventBookingForm } from '@/components/os/events/EventBookingForm';
import { VenueAvailability } from '@/components/os/events/VenueAvailability';
import { PackageSelector } from '@/components/os/events/PackageSelector';
import { ServiceCustomizer } from '@/components/os/events/ServiceCustomizer';

interface Venue {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  amenities: string[];
  isAvailable: boolean;
}

interface EventPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  inclusions: string[];
  isPopular: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
}

export default function NewEventBooking() {
  const { propertyId } = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('basic');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [packages, setPackages] = useState<EventPackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Information
    eventName: '',
    eventType: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    eventDate: null as Date | null,
    eventTime: '',
    guestCount: '',
    
    // Venue & Package
    selectedVenue: '',
    selectedPackage: '',
    selectedServices: [] as string[],
    
    // Additional Details
    specialRequests: '',
    dietaryRequirements: '',
    decorationPreferences: '',
    
    // Financial
    totalAmount: 0,
    advanceAmount: 0,
    paymentMethod: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, packagesRes, servicesRes] = await Promise.all([
          fetch(`/api/events/venues?propertyId=${propertyId}`),
          fetch(`/api/events/packages?propertyId=${propertyId}`),
          fetch(`/api/events/services?propertyId=${propertyId}`)
        ]);

        if (venuesRes.ok) setVenues(await venuesRes.json());
        if (packagesRes.ok) setPackages(await packagesRes.json());
        if (servicesRes.ok) setServices(await servicesRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (propertyId) {
      fetchData();
    }
  }, [propertyId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/events/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, propertyId }),
      });

      if (response.ok) {
        router.push(`/os/events/bookings/${propertyId}`);
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const stepTabs = [
    { id: 'basic', label: 'Basic Details', icon: Users },
    { id: 'venue', label: 'Venue & Package', icon: MapPin },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'details', label: 'Additional Details', icon: Clock },
    { id: 'payment', label: 'Payment', icon: DollarSign }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="ghost" asChild>
          <Link href={`/os/events/bookings/${propertyId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Event Booking</h1>
          <p className="text-gray-600">Create a new event booking for your property</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              {stepTabs.map((tab, index) => (
                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{index + 1}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Basic Details Tab */}
            <TabsContent value="basic" className="space-y-6 mt-6">
              <EventBookingForm
                formData={formData}
                updateFormData={updateFormData}
                onNext={() => setCurrentStep('venue')}
              />
            </TabsContent>

            {/* Venue & Package Tab */}
            <TabsContent value="venue" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <VenueAvailability
                  venues={venues}
                  selectedDate={formData.eventDate}
                  selectedVenue={formData.selectedVenue}
                  onVenueSelect={(venueId) => updateFormData({ selectedVenue: venueId })}
                />
                <PackageSelector
                  packages={packages}
                  selectedPackage={formData.selectedPackage}
                  onPackageSelect={(packageId) => updateFormData({ selectedPackage: packageId })}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('basic')}>
                  Previous
                </Button>
                <Button onClick={() => setCurrentStep('services')}>
                  Next
                </Button>
              </div>
            </TabsContent>

            {/* Services Tab */}
            <TabsContent value="services" className="space-y-6 mt-6">
              <ServiceCustomizer
                services={services}
                selectedServices={formData.selectedServices}
                onServicesChange={(services) => updateFormData({ selectedServices: services })}
              />
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('venue')}>
                  Previous
                </Button>
                <Button onClick={() => setCurrentStep('details')}>
                  Next
                </Button>
              </div>
            </TabsContent>

            {/* Additional Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Additional Requirements</CardTitle>
                  <CardDescription>
                    Specify any special requirements or preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      placeholder="Any special requests for the event..."
                      value={formData.specialRequests}
                      onChange={(e) => updateFormData({ specialRequests: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dietaryRequirements">Dietary Requirements</Label>
                    <Textarea
                      id="dietaryRequirements"
                      placeholder="Any dietary restrictions or preferences..."
                      value={formData.dietaryRequirements}
                      onChange={(e) => updateFormData({ dietaryRequirements: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="decorationPreferences">Decoration Preferences</Label>
                    <Textarea
                      id="decorationPreferences"
                      placeholder="Theme, colors, decoration style..."
                      value={formData.decorationPreferences}
                      onChange={(e) => updateFormData({ decorationPreferences: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('services')}>
                  Previous
                </Button>
                <Button onClick={() => setCurrentStep('payment')}>
                  Next
                </Button>
              </div>
            </TabsContent>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    Configure payment terms and advance amount
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="totalAmount">Total Amount</Label>
                      <Input
                        id="totalAmount"
                        type="number"
                        placeholder="Total event cost"
                        value={formData.totalAmount}
                        onChange={(e) => updateFormData({ totalAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="advanceAmount">Advance Amount</Label>
                      <Input
                        id="advanceAmount"
                        type="number"
                        placeholder="Advance payment"
                        value={formData.advanceAmount}
                        onChange={(e) => updateFormData({ advanceAmount: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData({ paymentMethod: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span>₹{formData.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Advance Amount:</span>
                        <span>₹{formData.advanceAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-1">
                        <span>Balance Due:</span>
                        <span>₹{(formData.totalAmount - formData.advanceAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('details')}>
                  Previous
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creating Booking...' : 'Create Booking'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}