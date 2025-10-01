/**
 * EXAMPLE: How to integrate hidePrices in your frontend components
 *
 * This file shows example code snippets for displaying prices conditionally
 * based on the hidePrices field from the Property model
 */

import React from 'react';

// ========================================
// Example 1: Simple Property Card
// ========================================
interface Property {
  id: string;
  title: string;
  price: number;
  hidePrices?: boolean; // Add this field to your Property interface
}

export function PropertyCard({ property }: { property: Property }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="property-card">
      <h3>{property.title}</h3>

      {/* Conditional Price Display */}
      <div className="price">
        {property.hidePrices ? (
          <span className="text-gray-500 italic">Price on request</span>
        ) : (
          <span className="font-bold text-lg">{formatCurrency(property.price)}</span>
        )}
      </div>
    </div>
  );
}

// ========================================
// Example 2: Property Details Page
// ========================================
export function PropertyDetailsPage({ property }: { property: Property }) {
  return (
    <div className="property-details">
      <h1>{property.title}</h1>

      <div className="pricing-section">
        {property.hidePrices ? (
          <div className="price-hidden-message">
            <p className="text-xl font-semibold text-gray-600">
              Price Available on Request
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact us for pricing information
            </p>
            <button className="mt-4 btn-primary">
              Request Quote
            </button>
          </div>
        ) : (
          <div className="price-visible">
            <p className="text-sm text-gray-600">Starting from</p>
            <p className="text-3xl font-bold text-green-600">
              {formatCurrency(property.price)}
            </p>
            <p className="text-sm text-gray-500">per night</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ========================================
// Example 3: Property List with Filters
// ========================================
export function PropertyList({ properties }: { properties: Property[] }) {
  return (
    <div className="property-list">
      {properties.map((property) => (
        <div key={property.id} className="property-item">
          <div className="property-info">
            <h3>{property.title}</h3>
          </div>

          <div className="property-price">
            {property.hidePrices ? (
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span>Contact for price</span>
              </div>
            ) : (
              <span className="text-xl font-bold">
                {formatCurrency(property.price)}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ========================================
// Example 4: Booking Form
// ========================================
export function BookingForm({ property }: { property: Property }) {
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [totalPrice, setTotalPrice] = React.useState(0);

  return (
    <div className="booking-form">
      <h2>Book Now</h2>

      <input
        type="date"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
        placeholder="Check-in"
      />

      <input
        type="date"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
        placeholder="Check-out"
      />

      {/* Price Summary */}
      <div className="price-summary">
        {property.hidePrices ? (
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-center text-gray-600">
              Price will be provided after submitting your inquiry
            </p>
            <button className="w-full mt-3 btn-primary">
              Submit Inquiry
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span>Price per night</span>
              <span>{formatCurrency(property.price)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            <button className="w-full mt-3 btn-primary">
              Book Now
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ========================================
// Example 5: API Response Handler
// ========================================
async function fetchPropertyDetails(propertyId: string) {
  const response = await fetch(`/api/properties/${propertyId}`);
  const data = await response.json();

  if (data.success && data.property) {
    // The property object will include hidePrices field
    const property = data.property;

    console.log('Property:', property.title);
    console.log('Hide Prices:', property.hidePrices);

    if (property.hidePrices) {
      console.log('Prices are hidden for this property');
    } else {
      console.log('Price:', property.price);
    }

    return property;
  }

  throw new Error('Failed to fetch property');
}

// ========================================
// Example 6: Search Results with Badge
// ========================================
export function SearchResultCard({ property }: { property: Property }) {
  return (
    <div className="search-result">
      <div className="property-image">
        {/* Image here */}
      </div>

      <div className="property-details">
        <h3>{property.title}</h3>

        <div className="price-badge">
          {property.hidePrices ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-700">
              Contact for pricing
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {formatCurrency(property.price)} / night
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================
// Helper function to format currency
// ========================================
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
