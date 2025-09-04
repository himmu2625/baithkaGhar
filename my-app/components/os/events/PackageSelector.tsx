'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Check, Star, Users, Clock, Utensils, Music } from 'lucide-react';

interface EventPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  inclusions: string[];
  isPopular: boolean;
  duration?: string;
  guestRange?: {
    min: number;
    max: number;
  };
  category?: string;
  features?: string[];
}

interface PackageSelectorProps {
  packages: EventPackage[];
  selectedPackage: string;
  onPackageSelect: (packageId: string) => void;
}

const getPackageIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'wedding': return '💒';
    case 'birthday': return '🎂';
    case 'corporate': return '💼';
    case 'anniversary': return '💕';
    default: return '🎉';
  }
};

export function PackageSelector({ packages, selectedPackage, onPackageSelect }: PackageSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...new Set(packages.map(pkg => pkg.category).filter(Boolean))];
  
  const filteredPackages = selectedCategory === 'all' 
    ? packages 
    : packages.filter(pkg => pkg.category === selectedCategory);

  const popularPackages = filteredPackages.filter(pkg => pkg.isPopular);
  const regularPackages = filteredPackages.filter(pkg => !pkg.isPopular);

  const PackageCard = ({ pkg }: { pkg: EventPackage }) => {
    const isSelected = selectedPackage === pkg.id;
    const hasDiscount = pkg.originalPrice && pkg.originalPrice > pkg.price;
    const discountPercentage = hasDiscount 
      ? Math.round(((pkg.originalPrice! - pkg.price) / pkg.originalPrice!) * 100)
      : 0;

    return (
      <div
        key={pkg.id}
        className={`border rounded-lg p-6 cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-500 bg-blue-50 shadow-md'
            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        } ${pkg.isPopular ? 'ring-2 ring-yellow-200' : ''}`}
        onClick={() => onPackageSelect(pkg.id)}
      >
        {/* Package Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-semibold text-lg">{pkg.name}</h4>
              {isSelected && <Check className="h-5 w-5 text-blue-600" />}
            </div>
            <p className="text-sm text-gray-600">{pkg.description}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {pkg.isPopular && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
            {pkg.category && (
              <span className="text-lg" title={pkg.category}>
                {getPackageIcon(pkg.category)}
              </span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-4">
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              ₹{pkg.price.toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-500 line-through">
                  ₹{pkg.originalPrice!.toLocaleString()}
                </span>
                <Badge variant="destructive" className="text-xs">
                  {discountPercentage}% OFF
                </Badge>
              </>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {pkg.duration && `${pkg.duration} • `}
            {pkg.guestRange && `${pkg.guestRange.min}-${pkg.guestRange.max} guests`}
          </p>
        </div>

        {/* Inclusions */}
        <div className="mb-4">
          <h5 className="font-medium text-sm mb-2">What's Included:</h5>
          <div className="space-y-1">
            {pkg.inclusions.slice(0, 4).map((inclusion, index) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>{inclusion}</span>
              </div>
            ))}
            {pkg.inclusions.length > 4 && (
              <div className="text-sm text-gray-500">
                +{pkg.inclusions.length - 4} more inclusions
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        {pkg.features && pkg.features.length > 0 && (
          <div className="mb-4">
            <h5 className="font-medium text-sm mb-2">Key Features:</h5>
            <div className="flex flex-wrap gap-2">
              {pkg.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {pkg.features.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{pkg.features.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="bg-blue-100 rounded-lg p-3 mt-4">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Package Selected</span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              This package will be included in your event booking.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Select Package</span>
        </CardTitle>
        <CardDescription>
          Choose a package that best fits your event requirements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        {categories.length > 1 && (
          <div>
            <h5 className="font-medium text-sm mb-3">Filter by Category:</h5>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="text-xs"
                >
                  {category === 'all' ? 'All Packages' : category}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Popular Packages */}
        {popularPackages.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Star className="h-4 w-4 text-yellow-500" />
              <h5 className="font-medium">Popular Packages</h5>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {popularPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {/* Regular Packages */}
        {regularPackages.length > 0 && (
          <div>
            {popularPackages.length > 0 && (
              <h5 className="font-medium mb-4">Other Packages</h5>
            )}
            <div className="grid grid-cols-1 gap-4">
              {regularPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </div>
        )}

        {filteredPackages.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No packages available</p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedCategory !== 'all' 
                ? `No packages found in "${selectedCategory}" category`
                : 'Contact us to create a custom package'
              }
            </p>
          </div>
        )}

        {/* Custom Package Option */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h5 className="font-medium mb-2">Need a Custom Package?</h5>
          <p className="text-sm text-gray-600 mb-4">
            Don't see what you're looking for? We can create a personalized package just for you.
          </p>
          <Button variant="outline" size="sm">
            Request Custom Package
          </Button>
        </div>

        {/* Selected Package Summary */}
        {selectedPackage && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Package Selected</span>
            </div>
            {(() => {
              const pkg = packages.find(p => p.id === selectedPackage);
              return pkg ? (
                <div className="text-sm text-green-700">
                  <p className="font-medium">{pkg.name}</p>
                  <p>₹{pkg.price.toLocaleString()} • {pkg.inclusions.length} inclusions</p>
                </div>
              ) : null;
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}