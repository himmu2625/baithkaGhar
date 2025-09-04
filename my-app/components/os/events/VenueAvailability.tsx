'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Users, Check, Clock, Wifi, Car, Music, Utensils } from 'lucide-react';

interface Venue {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  amenities: string[];
  isAvailable: boolean;
  images?: string[];
  description?: string;
  location?: string;
  features?: string[];
}

interface VenueAvailabilityProps {
  venues: Venue[];
  selectedDate: Date | null;
  selectedVenue: string;
  onVenueSelect: (venueId: string) => void;
}

const amenityIcons: Record<string, any> = {
  'wifi': Wifi,
  'parking': Car,
  'audio_system': Music,
  'catering': Utensils,
  'air_conditioning': Clock,
};

export function VenueAvailability({ venues, selectedDate, selectedVenue, onVenueSelect }: VenueAvailabilityProps) {
  const [availableVenues, setAvailableVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!selectedDate) {
        setAvailableVenues(venues);
        return;
      }

      setLoading(true);
      try {
        // Simulate API call to check venue availability
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Filter venues based on availability (this would be real API data)
        const available = venues.map(venue => ({
          ...venue,
          isAvailable: Math.random() > 0.3 // 70% chance of being available
        }));
        
        setAvailableVenues(available);
      } catch (error) {
        console.error('Error checking availability:', error);
        setAvailableVenues(venues);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, [venues, selectedDate]);

  const getVenueStatusColor = (isAvailable: boolean) => {
    return isAvailable 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getVenueStatusText = (isAvailable: boolean) => {
    return isAvailable ? 'Available' : 'Booked';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Select Venue</span>
          </CardTitle>
          <CardDescription>Checking availability...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Select Venue</span>
        </CardTitle>
        <CardDescription>
          Choose an available venue for your event
          {selectedDate && (
            <span className="block text-sm mt-1">
              For {selectedDate.toLocaleDateString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableVenues.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No venues available</p>
          </div>
        ) : (
          availableVenues.map((venue) => (
            <div
              key={venue.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${
                selectedVenue === venue.id
                  ? 'border-blue-500 bg-blue-50'
                  : venue.isAvailable
                  ? 'border-gray-200 hover:border-gray-300'
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
              }`}
              onClick={() => venue.isAvailable && onVenueSelect(venue.id)}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-lg flex items-center space-x-2">
                    <span>{venue.name}</span>
                    {selectedVenue === venue.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </h4>
                  {venue.location && (
                    <p className="text-sm text-gray-600 flex items-center space-x-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{venue.location}</span>
                    </p>
                  )}
                </div>
                <Badge className={getVenueStatusColor(venue.isAvailable)}>
                  {getVenueStatusText(venue.isAvailable)}
                </Badge>
              </div>

              {venue.description && (
                <p className="text-sm text-gray-600 mb-3">{venue.description}</p>
              )}

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>Capacity: {venue.capacity} guests</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">₹{venue.pricePerHour.toLocaleString()}</span>
                  <span className="text-gray-500"> /hour</span>
                </div>
              </div>

              {venue.amenities && venue.amenities.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity) => {
                      const IconComponent = amenityIcons[amenity.toLowerCase()] || Clock;
                      return (
                        <div
                          key={amenity}
                          className="flex items-center space-x-1 text-xs bg-gray-100 rounded-full px-2 py-1"
                        >
                          <IconComponent className="h-3 w-3" />
                          <span>{amenity.replace('_', ' ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {venue.features && venue.features.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium mb-1">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {venue.features.slice(0, 3).map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {venue.features.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{venue.features.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {!venue.isAvailable && (
                <div className="mt-3 p-2 bg-red-50 rounded text-sm text-red-700">
                  This venue is not available for the selected date and time.
                </div>
              )}
            </div>
          ))
        )}

        {selectedVenue && (
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">Venue Selected</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              {availableVenues.find(v => v.id === selectedVenue)?.name} has been selected for your event.
            </p>
          </div>
        )}

        {!selectedDate && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              💡 Select an event date first to check real-time venue availability.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}