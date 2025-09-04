'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  Plus, 
  Minus, 
  Music, 
  Camera, 
  Utensils, 
  Car, 
  Flower2, 
  Users,
  Shield,
  Sparkles,
  Palette
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  unit?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isPopular?: boolean;
  isRequired?: boolean;
}

interface SelectedService {
  serviceId: string;
  quantity: number;
  customizations?: Record<string, any>;
}

interface ServiceCustomizerProps {
  services: Service[];
  selectedServices: string[];
  onServicesChange: (services: string[]) => void;
}

const categoryIcons: Record<string, any> = {
  'catering': Utensils,
  'decoration': Palette,
  'audio_visual': Music,
  'photography': Camera,
  'transportation': Car,
  'security': Shield,
  'entertainment': Sparkles,
  'floral': Flower2,
  'coordination': Users,
};

const categoryLabels: Record<string, string> = {
  'catering': 'Catering & Food',
  'decoration': 'Decoration',
  'audio_visual': 'Audio & Visual',
  'photography': 'Photography & Videography',
  'transportation': 'Transportation',
  'security': 'Security',
  'entertainment': 'Entertainment',
  'floral': 'Floral Arrangements',
  'coordination': 'Event Coordination',
};

export function ServiceCustomizer({ services, selectedServices, onServicesChange }: ServiceCustomizerProps) {
  const [serviceQuantities, setServiceQuantities] = useState<Record<string, number>>({});
  const [serviceCustomizations, setServiceCustomizations] = useState<Record<string, any>>({});

  const categories = [...new Set(services.map(service => service.category))];

  const getServicesInCategory = (category: string) => {
    return services.filter(service => service.category === category);
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.includes(serviceId);
  };

  const toggleService = (serviceId: string) => {
    if (isServiceSelected(serviceId)) {
      onServicesChange(selectedServices.filter(id => id !== serviceId));
      // Remove quantity and customizations
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[serviceId];
      setServiceQuantities(newQuantities);
      
      const newCustomizations = { ...serviceCustomizations };
      delete newCustomizations[serviceId];
      setServiceCustomizations(newCustomizations);
    } else {
      onServicesChange([...selectedServices, serviceId]);
      // Set default quantity
      const service = services.find(s => s.id === serviceId);
      if (service) {
        setServiceQuantities(prev => ({
          ...prev,
          [serviceId]: service.minQuantity || 1
        }));
      }
    }
  };

  const updateQuantity = (serviceId: string, quantity: number) => {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const minQty = service.minQuantity || 1;
    const maxQty = service.maxQuantity || 999;
    const validQuantity = Math.max(minQty, Math.min(maxQty, quantity));

    setServiceQuantities(prev => ({
      ...prev,
      [serviceId]: validQuantity
    }));
  };

  const updateCustomization = (serviceId: string, key: string, value: any) => {
    setServiceCustomizations(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [key]: value
      }
    }));
  };

  const getTotalCost = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      const quantity = serviceQuantities[serviceId] || 1;
      return total + (service ? service.price * quantity : 0);
    }, 0);
  };

  const ServiceCard = ({ service }: { service: Service }) => {
    const isSelected = isServiceSelected(service.id);
    const quantity = serviceQuantities[service.id] || service.minQuantity || 1;
    const totalPrice = service.price * quantity;

    return (
      <div
        className={`border rounded-lg p-4 transition-all ${
          isSelected 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => toggleService(service.id)}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium flex items-center space-x-2">
                  <span>{service.name}</span>
                  {service.isPopular && (
                    <Badge variant="secondary" className="text-xs">Popular</Badge>
                  )}
                  {service.isRequired && (
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  )}
                </h5>
                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              </div>
              <div className="text-right">
                <div className="font-semibold">₹{service.price.toLocaleString()}</div>
                {service.unit && (
                  <div className="text-xs text-gray-500">per {service.unit}</div>
                )}
              </div>
            </div>

            {isSelected && (
              <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                {/* Quantity Selector */}
                <div className="flex items-center space-x-3">
                  <Label htmlFor={`quantity-${service.id}`} className="text-sm">Quantity:</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(service.id, quantity - 1)}
                      disabled={quantity <= (service.minQuantity || 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      id={`quantity-${service.id}`}
                      type="number"
                      value={quantity}
                      onChange={(e) => updateQuantity(service.id, parseInt(e.target.value) || 1)}
                      className="w-20 text-center"
                      min={service.minQuantity || 1}
                      max={service.maxQuantity || 999}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(service.id, quantity + 1)}
                      disabled={service.maxQuantity && quantity >= service.maxQuantity}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total: ₹{totalPrice.toLocaleString()}
                  </div>
                </div>

                {/* Service-specific customizations */}
                {service.category === 'catering' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Dietary Preferences:</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Jain'].map((diet) => (
                        <div key={diet} className="flex items-center space-x-1">
                          <Checkbox
                            id={`${service.id}-${diet}`}
                            checked={serviceCustomizations[service.id]?.dietary?.includes(diet)}
                            onCheckedChange={(checked) => {
                              const current = serviceCustomizations[service.id]?.dietary || [];
                              const updated = checked 
                                ? [...current, diet]
                                : current.filter((d: string) => d !== diet);
                              updateCustomization(service.id, 'dietary', updated);
                            }}
                          />
                          <Label htmlFor={`${service.id}-${diet}`} className="text-xs">{diet}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {service.category === 'decoration' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Theme Color:</Label>
                    <div className="flex space-x-2">
                      {['Red', 'Blue', 'Gold', 'Silver', 'Pink', 'Purple'].map((color) => (
                        <Button
                          key={color}
                          variant={serviceCustomizations[service.id]?.themeColor === color ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateCustomization(service.id, 'themeColor', color)}
                          className="text-xs"
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {service.category === 'photography' && (
                  <div className="space-y-2">
                    <Label className="text-sm">Package Type:</Label>
                    <div className="flex space-x-2">
                      {['Photos Only', 'Video Only', 'Photos + Video'].map((type) => (
                        <Button
                          key={type}
                          variant={serviceCustomizations[service.id]?.packageType === type ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateCustomization(service.id, 'packageType', type)}
                          className="text-xs"
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Additional Services</span>
        </CardTitle>
        <CardDescription>
          Customize your event with additional services and amenities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {categories.length > 1 ? (
          <Tabs defaultValue={categories[0]} className="space-y-4">
            <TabsList className="grid grid-cols-3 lg:grid-cols-5 w-full">
              {categories.slice(0, 5).map((category) => {
                const Icon = categoryIcons[category] || Package;
                return (
                  <TabsTrigger key={category} value={category} className="flex items-center space-x-1">
                    <Icon className="h-3 w-3" />
                    <span className="hidden sm:inline text-xs">
                      {categoryLabels[category] || category}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {categories.map((category) => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  {(() => {
                    const Icon = categoryIcons[category] || Package;
                    return <Icon className="h-4 w-4" />;
                  })()}
                  <h4 className="font-semibold">{categoryLabels[category] || category}</h4>
                </div>
                <div className="space-y-4">
                  {getServicesInCategory(category).map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="space-y-4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        {services.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No additional services available</p>
            <p className="text-sm text-gray-500 mt-2">
              Contact us to add custom services to your event.
            </p>
          </div>
        )}

        {/* Selected Services Summary */}
        {selectedServices.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Selected Services Summary</h4>
            <div className="space-y-2">
              {selectedServices.map((serviceId) => {
                const service = services.find(s => s.id === serviceId);
                const quantity = serviceQuantities[serviceId] || 1;
                const totalPrice = service ? service.price * quantity : 0;

                return service ? (
                  <div key={serviceId} className="flex justify-between items-center text-sm">
                    <span>
                      {service.name} × {quantity}
                      {service.unit && ` ${service.unit}${quantity > 1 ? 's' : ''}`}
                    </span>
                    <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                  </div>
                ) : null;
              })}
              <div className="border-t pt-2 flex justify-between items-center font-semibold">
                <span>Total Additional Services:</span>
                <span>₹{getTotalCost().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}