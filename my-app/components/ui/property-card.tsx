"use client"

import React, { useState, memo } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Star, MapPin, Eye, ChevronLeft, ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import DynamicPriceIndicator from "@/components/search/DynamicPriceIndicator"
import EventPromotionTags from "@/components/search/EventPromotionTags"

interface CategorizedImage {
  category: string;
  files: Array<{ url: string; public_id: string }>;
}

interface Property {
  id: string
  title: string
  location: string
  price: number
  rating: number
  thumbnail?: string | null
  categorizedImages?: CategorizedImage[]
  legacyGeneralImages?: Array<{ url: string; public_id: string }>
  amenities?: string[]
  type: string
  bedrooms?: number
  bathrooms?: number
  maxGuests?: number
  city?: string
}

interface PropertyCardProps {
  property: Property
  onFavoriteToggle?: (id: string) => void
  isFavorite?: boolean
  showCategorizedImages?: boolean
  className?: string
  // Search enhancement props
  checkIn?: Date
  checkOut?: Date
  guests?: number
  rooms?: number
  showDynamicPricing?: boolean
  showEventTags?: boolean
  // Plan-based pricing props
  planType?: string
  occupancyType?: string
  showPlanPricing?: boolean
  // Performance optimization
  priority?: boolean
}

const PropertyCardComponent = ({
  property,
  onFavoriteToggle,
  isFavorite = false,
  showCategorizedImages = true,
  className = "",
  checkIn,
  checkOut,
  guests,
  rooms,
  showDynamicPricing = true,
  showEventTags = true,
  planType,
  occupancyType,
  showPlanPricing = false,
  priority = false
}: PropertyCardProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageCategories, setShowImageCategories] = useState(false)

  // Helper function to get the best image for display
  const getPropertyImage = (): string => {
    // Try categorizedImages first - prefer exterior images
    if (property.categorizedImages && Array.isArray(property.categorizedImages)) {
      // First try to find exterior images
      const exteriorCategory = property.categorizedImages.find(cat => cat.category === 'exterior');
      if (exteriorCategory && exteriorCategory.files && exteriorCategory.files.length > 0) {
        return exteriorCategory.files[0].url;
      }
      
      // Then try interior images
      const interiorCategory = property.categorizedImages.find(cat => cat.category === 'interior');
      if (interiorCategory && interiorCategory.files && interiorCategory.files.length > 0) {
        return interiorCategory.files[0].url;
      }
      
      // Finally, try any available categorized image
      for (const category of property.categorizedImages) {
        if (category.files && category.files.length > 0) {
          return category.files[0].url;
        }
      }
    }
    
    // Try legacyGeneralImages
    if (property.legacyGeneralImages && Array.isArray(property.legacyGeneralImages) && property.legacyGeneralImages.length > 0) {
      return property.legacyGeneralImages[0].url;
    }
    
    // Fallback to thumbnail or placeholder
    return property.thumbnail || "/placeholder.svg";
  }

  // Get all available images with categories
  const getAllImages = () => {
    const images: Array<{ url: string; category: string; index: number }> = [];
    
    if (property.categorizedImages) {
      property.categorizedImages.forEach((category) => {
        category.files.forEach((file, index) => {
          images.push({
            url: file.url,
            category: category.category,
            index: index
          });
        });
      });
    }
    
    if (property.legacyGeneralImages) {
      property.legacyGeneralImages.forEach((image, index) => {
        images.push({
          url: image.url,
          category: 'general',
          index: index
        });
      });
    }
    
    return images;
  }

  const allImages = getAllImages();
  const hasMultipleImages = allImages.length > 1;

  const nextImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % allImages.length);
    }
  };

  const prevImage = () => {
    if (hasMultipleImages) {
      setCurrentImageIndex((prevIndex) => (prevIndex - 1 + allImages.length) % allImages.length);
    }
  };

  // Get current image with category info
  const getCurrentImage = () => {
    if (allImages.length > 0) {
      return allImages[currentImageIndex];
    }
    return { url: getPropertyImage(), category: 'main', index: 0 };
  };

  const currentImage = getCurrentImage();

  return (
    <Link href={`/property/${property.id}`} className="block">
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative group flex flex-col ${className}`}>
        <div className="relative h-[240px] bg-gray-100 flex-shrink-0">
          {/* Main Image Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0"
            >
              <Image
                src={currentImage.url}
                alt={`${property.title} - ${currentImage.category}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                priority={priority}
                onError={(e) => {
                  console.log("Image load error, replacing with placeholder");
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
            </motion.div>
          </AnimatePresence>

          {/* Category Label */}
          {showCategorizedImages && currentImage.category !== 'main' && (
            <div className="absolute top-2 left-2 z-20">
              <Badge className="bg-black/70 text-white text-xs px-2 py-1 capitalize">
                {currentImage.category === 'general' ? 'Property' : currentImage.category}
              </Badge>
            </div>
          )}

          {/* Property Type Badge */}
          <div className="absolute top-2 right-2 z-20">
            <Badge className="bg-lightGreen text-darkGreen font-medium shadow-lg border border-lightGreen/30">
              {property.type}
            </Badge>
          </div>

          {/* Navigation Arrows - only show if multiple images */}
          {hasMultipleImages && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  prevImage();
                }}
              >
                <ChevronLeft className="h-4 w-4 text-darkGreen" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  nextImage();
                }}
              >
                <ChevronRight className="h-4 w-4 text-darkGreen" />
              </Button>
            </>
          )}

          {/* Image Indicators */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentImageIndex === index ? "bg-white w-4" : "bg-white/50"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                />
              ))}
            </div>
          )}

          {/* Favorite Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 bg-white/80 hover:bg-white rounded-full z-10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onFavoriteToggle?.(property.id);
            }}
          >
            <Heart
              className={`h-4 w-4 ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"}`}
            />
          </Button>

          {/* View Categories Button */}
          {showCategorizedImages && property.categorizedImages && property.categorizedImages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 left-2 bg-white/80 hover:bg-white rounded-full z-10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowImageCategories(!showImageCategories);
              }}
            >
              <Eye className="h-4 w-4 text-darkGreen" />
            </Button>
          )}
        </div>

        {/* Categorized Images Preview */}
        {showImageCategories && showCategorizedImages && property.categorizedImages && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-30 max-h-48 overflow-y-auto">
            {property.categorizedImages.map((category) => (
              <div key={category.category} className="p-3 border-b border-gray-100 last:border-b-0">
                <h4 className="text-sm font-medium text-darkGreen mb-2 capitalize">
                  {category.category} ({category.files.length})
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {category.files.slice(0, 4).map((file, index) => (
                    <div key={index} className="relative h-16 rounded overflow-hidden">
                      <Image
                        src={file.url}
                        alt={`${category.category} ${index + 1}`}
                        fill
                        className="object-cover hover:scale-110 transition-transform cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          const imageIndex = allImages.findIndex(img => img.url === file.url);
                          if (imageIndex !== -1) {
                            setCurrentImageIndex(imageIndex);
                            setShowImageCategories(false);
                          }
                        }}
                      />
                    </div>
                  ))}
                  {category.files.length > 4 && (
                    <div className="h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                      +{category.files.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 flex flex-col">
          <CardHeader className="pb-2 flex-shrink-0">
            <CardTitle className="line-clamp-1 text-lg">{property.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="mr-1 h-4 w-4" />
              <span className="line-clamp-1">{property.city || property.location}</span>
            </div>
          </CardHeader>

          <CardContent className="pb-2 flex-1 flex flex-col">
            <div className="flex items-center mb-2 flex-shrink-0">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
              <span className="font-medium">{property.rating || 0}</span>
              <span className="text-muted-foreground text-sm ml-1">(Reviews)</span>
            </div>
            
            {/* Event/Promotion Tags */}
            {showEventTags && (
              <div className="mb-3 flex-shrink-0">
                <EventPromotionTags
                  propertyId={property.id}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  rooms={rooms}
                  maxTags={2}
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
              {property.bedrooms && (
                <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                  {property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                </span>
              )}
              {property.bathrooms && (
                <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                  {property.bathrooms} {property.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                </span>
              )}
              {property.maxGuests && (
                <span className="text-xs bg-lightGreen/10 text-darkGreen px-2 py-1 rounded-full">
                  Up to {property.maxGuests} guests
                </span>
              )}
            </div>
            
            {/* Enhanced Dynamic Pricing - Horizontal Layout */}
            <div className="flex-1 flex items-end">
              {showDynamicPricing ? (
                <DynamicPriceIndicator
                  propertyId={property.id}
                  basePrice={typeof property.price === 'object' ? (property.price as any).base : property.price}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                  rooms={rooms}
                  planType={planType}
                  occupancyType={occupancyType}
                  usePlanPricing={showPlanPricing}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    From ₹{typeof property.price === 'object' ? (property.price as any).base : property.price}
                  </span>
                  <span className="text-sm font-normal text-gray-600">/night</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex-shrink-0">
            <Button 
              className="w-full bg-gradient-to-r from-lightGreen to-mediumGreen text-darkGreen transition-all duration-300 hover:brightness-110"
              onClick={(e) => {
                // Prevent the card link from being triggered when the button is clicked
                e.stopPropagation();
              }}
            >
              View Details
            </Button>
          </CardFooter>
        </div>
      </Card>
    </Link>
  )
}

// Memoized version for performance optimization
export const PropertyCard = memo(PropertyCardComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.property.id === nextProps.property.id &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.property.price === nextProps.property.price &&
    prevProps.checkIn?.getTime() === nextProps.checkIn?.getTime() &&
    prevProps.checkOut?.getTime() === nextProps.checkOut?.getTime()
  )
})

PropertyCard.displayName = 'PropertyCard'
