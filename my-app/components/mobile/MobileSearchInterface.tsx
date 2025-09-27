"use client"

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Home,
  Filter,
  X,
  ChevronRight,
  Utensils
} from 'lucide-react';
import { AdvancedSearch } from '@/components/ui/advanced-search';
import MobilePlanSelector from './MobilePlanSelector';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface MobileSearchInterfaceProps {
  className?: string;
  onSearch?: (searchData: SearchData) => void;
  showFilters?: boolean;
  initialData?: Partial<SearchData>;
}

interface SearchData {
  location: string;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  rooms: number;
  planType: string;
  occupancyType: string;
}

const availablePlans = [
  {
    code: 'EP',
    name: 'Room Only',
    description: 'European Plan - Room accommodation only',
    inclusions: ['Room accommodation', 'Basic amenities', 'Housekeeping', 'Wi-Fi']
  },
  {
    code: 'CP',
    name: 'Room + Breakfast',
    description: 'Continental Plan - Room with breakfast included',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Basic amenities', 'Housekeeping', 'Wi-Fi']
  },
  {
    code: 'MAP',
    name: 'Room + Breakfast + 1 Meal',
    description: 'Modified American Plan - Room with breakfast and one main meal',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Lunch or dinner', 'Basic amenities', 'Housekeeping', 'Wi-Fi']
  },
  {
    code: 'AP',
    name: 'Room + All Meals',
    description: 'American Plan - Room with all meals included',
    inclusions: ['Room accommodation', 'Daily breakfast', 'Lunch', 'Dinner', 'Basic amenities', 'Housekeeping', 'Wi-Fi']
  }
];

const availableOccupancies = [
  { type: 'SINGLE', label: 'Single', description: 'Single Sharing', maxGuests: 1 },
  { type: 'DOUBLE', label: 'Double', description: 'Double Sharing', maxGuests: 2 },
  { type: 'TRIPLE', label: 'Triple', description: 'Triple Sharing', maxGuests: 3 },
  { type: 'QUAD', label: 'Quad', description: 'Quad Sharing', maxGuests: 4 }
];

export default function MobileSearchInterface({
  className = "",
  onSearch,
  showFilters = true,
  initialData
}: MobileSearchInterfaceProps) {
  const router = useRouter();
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchData, setSearchData] = useState<SearchData>({
    location: initialData?.location || '',
    checkIn: initialData?.checkIn || null,
    checkOut: initialData?.checkOut || null,
    guests: initialData?.guests || 2,
    rooms: initialData?.rooms || 1,
    planType: initialData?.planType || 'EP',
    occupancyType: initialData?.occupancyType || 'DOUBLE'
  });

  const handleInputChange = (field: keyof SearchData, value: any) => {
    setSearchData(prev => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    if (!searchData.location) {
      alert('Please enter a location');
      return;
    }

    // Construct search URL
    const searchParams = new URLSearchParams();
    searchParams.append('location', searchData.location);

    if (searchData.checkIn) {
      searchParams.append('checkIn', searchData.checkIn.toISOString());
    }
    if (searchData.checkOut) {
      searchParams.append('checkOut', searchData.checkOut.toISOString());
    }

    searchParams.append('guests', searchData.guests.toString());
    searchParams.append('rooms', searchData.rooms.toString());
    searchParams.append('planType', searchData.planType);
    searchParams.append('occupancyType', searchData.occupancyType);

    // Navigate to search results
    router.push(`/search?${searchParams.toString()}`);

    // Call optional callback
    if (onSearch) {
      onSearch(searchData);
    }
  };

  const isSearchReady = searchData.location && searchData.checkIn && searchData.checkOut;

  return (
    <div className={`w-full ${className}`}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-blue-600" />
            Find Your Perfect Stay
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Location Search */}
          <div>
            <Label htmlFor="location" className="text-sm font-medium mb-2 block">
              Where do you want to stay?
            </Label>
            <AdvancedSearch
              placeholder="City, region or hotel"
              value={searchData.location}
              onChange={(value) => handleInputChange('location', value)}
              onSelectResult={(result) => {
                if (result.type === 'city') {
                  handleInputChange('location', result.name);
                } else {
                  handleInputChange('location', result.name);
                }
              }}
              variant="mobile"
              className="w-full"
            />
          </div>

          {/* Date Selection */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              When are you staying?
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="checkin" className="text-xs text-gray-600 mb-1 block">
                  Check-in
                </Label>
                <Input
                  id="checkin"
                  type="date"
                  value={searchData.checkIn ? format(searchData.checkIn, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleInputChange('checkIn', date);
                  }}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="h-12"
                />
              </div>
              <div>
                <Label htmlFor="checkout" className="text-xs text-gray-600 mb-1 block">
                  Check-out
                </Label>
                <Input
                  id="checkout"
                  type="date"
                  value={searchData.checkOut ? format(searchData.checkOut, 'yyyy-MM-dd') : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    handleInputChange('checkOut', date);
                  }}
                  min={searchData.checkIn ? format(new Date(searchData.checkIn.getTime() + 24*60*60*1000), 'yyyy-MM-dd') : format(new Date(Date.now() + 24*60*60*1000), 'yyyy-MM-dd')}
                  className="h-12"
                />
              </div>
            </div>
          </div>

          {/* Guests and Rooms */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Guests & Rooms
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Guests</Label>
                <div className="flex items-center border rounded-lg h-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('guests', Math.max(1, searchData.guests - 1))}
                    disabled={searchData.guests <= 1}
                    className="h-full px-3"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center font-medium">
                    {searchData.guests}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('guests', Math.min(20, searchData.guests + 1))}
                    disabled={searchData.guests >= 20}
                    className="h-full px-3"
                  >
                    +
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Rooms</Label>
                <div className="flex items-center border rounded-lg h-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('rooms', Math.max(1, searchData.rooms - 1))}
                    disabled={searchData.rooms <= 1}
                    className="h-full px-3"
                  >
                    -
                  </Button>
                  <div className="flex-1 text-center font-medium">
                    {searchData.rooms}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleInputChange('rooms', Math.min(10, searchData.rooms + 1))}
                    disabled={searchData.rooms >= 10}
                    className="h-full px-3"
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Plan-Based Filters Toggle */}
          {showFilters && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium">Plan & Occupancy Filters</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="text-blue-600"
                >
                  {showAdvancedFilters ? (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-1" />
                      Show
                    </>
                  )}
                </Button>
              </div>

              <AnimatePresence>
                {showAdvancedFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Separator className="mb-4" />
                    <MobilePlanSelector
                      plans={availablePlans}
                      occupancies={availableOccupancies}
                      selectedPlan={searchData.planType}
                      selectedOccupancy={searchData.occupancyType}
                      onPlanSelect={(plan) => handleInputChange('planType', plan)}
                      onOccupancySelect={(occupancy) => handleInputChange('occupancyType', occupancy)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          {/* Search Button */}
          <Button
            onClick={handleSearch}
            disabled={!isSearchReady}
            className="w-full h-14 text-lg font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            <Search className="h-5 w-5 mr-2" />
            Search Properties
          </Button>

          {/* Current Selection Summary */}
          {showAdvancedFilters && (
            <Card className="bg-gray-50 border-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Utensils className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Filter Summary</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {availablePlans.find(p => p.code === searchData.planType)?.name}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {availableOccupancies.find(o => o.type === searchData.occupancyType)?.label} Sharing
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}