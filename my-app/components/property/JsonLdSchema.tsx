"use client";

import { PropertyDetails } from "./types";

interface JsonLdSchemaProps {
  property: PropertyDetails;
  reviews: any[];
}

export function JsonLdSchema({ property, reviews }: JsonLdSchemaProps) {
  const hotelSchema: any = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": property.name,
    "description": property.description,
    "image": property.images,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": property.location,
      "addressLocality": property.location,
      "addressRegion": property.location,
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": property.locationCoords?.lat,
      "longitude": property.locationCoords?.lng
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": property.rating
    },
    "priceRange": `INR ${property.price}`,
  };

  // Only include aggregateRating if reviewCount is positive (Google Search Console requirement)
  if (property.reviewCount > 0) {
    hotelSchema.aggregateRating = {
      "@type": "AggregateRating",
      "ratingValue": property.rating,
      "reviewCount": property.reviewCount
    };
  }

  // Only include reviews if there are any
  if (reviews && reviews.length > 0) {
    hotelSchema.review = reviews.map(review => ({
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": review.user.name
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.rating
      },
      "reviewBody": review.comment,
      "datePublished": review.date
    }));
  }

  // Only include offers if there are categories
  if (property.categories && property.categories.length > 0) {
    hotelSchema.makesOffer = property.categories.map((category: any) => ({
      "@type": "Offer",
      "itemOffered": {
        "@type": "HotelRoom",
        "name": category.name,
        "description": category.description,
        "amenityFeature": category.amenities?.map((amenity: any) => ({
          "@type": "LocationFeatureSpecification",
          "name": amenity,
          "value": "True"
        }))
      }
    }));
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelSchema) }}
    />
  );
}
