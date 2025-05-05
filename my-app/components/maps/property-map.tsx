"use client"

import React, { useEffect, useState, useRef } from "react"
import { Loader } from "@googlemaps/js-api-loader"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, ExternalLink } from "lucide-react"
import { generateDirectionsUrl } from "@/lib/maps"
import Image from "next/image"

interface PropertyMapProps {
  lat: number
  lng: number
  zoom?: number
  propertyTitle?: string
  showDirectionsLink?: boolean
  height?: string
  width?: string
  className?: string
  mapId?: string
}

export function PropertyMap({
  lat,
  lng,
  zoom = 14,
  propertyTitle,
  showDirectionsLink = true,
  height = "400px",
  width = "100%",
  className = "",
  mapId = "property-map",
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

        if (!apiKey) {
          console.error("Google Maps API key not found")
          setIsError(true)
          return
        }

        // Load Google Maps JS API
        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["places"],
        })

        const google = await loader.load()
        setIsLoaded(true)

        // Create the map
        const mapOptions: google.maps.MapOptions = {
          center: { lat, lng },
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        }

        const newMap = new google.maps.Map(mapRef.current!, mapOptions)
        setMap(newMap)

        // Add a marker for the property
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: newMap,
          title: propertyTitle || "Property Location",
          animation: google.maps.Animation.DROP,
        })

        // Add a circle around the property to mask exact location
        const circle = new google.maps.Circle({
          strokeColor: "#4CAF50",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4CAF50",
          fillOpacity: 0.15,
          map: newMap,
          center: { lat, lng },
          radius: 100, // in meters
        })

        // Add info window if property title is provided
        if (propertyTitle) {
          const infoWindow = new google.maps.InfoWindow({
            content: `<div style="font-family: Arial, sans-serif; padding: 5px;">
                        <strong>${propertyTitle}</strong>
                        <p style="margin-top: 5px; margin-bottom: 0;">Approximate location</p>
                      </div>`,
          })

          marker.addListener("click", () => {
            infoWindow.open(newMap, marker)
          })

          // Open info window by default
          infoWindow.open(newMap, marker)
        }
      } catch (error) {
        console.error("Error loading Google Maps:", error)
        setIsError(true)
      }
    }

    initMap()
  }, [lat, lng, zoom, propertyTitle])

  // Handle map error state
  if (isError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <MapPin className="h-10 w-10 text-medium Green mb-2" />
        <p className="text-sm text-gray-600 text-center px-4">
          Map could not be loaded. Please check your connection or try again later.
        </p>
      </div>
    )
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height, width }}
      >
        <div className="h-8 w-8 border-4 border-mediumGreen border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600 mt-2">Loading map...</p>
      </div>
    )
  }

  return (
    <div className={`property-map-container ${className}`}>
      <div
        id={mapId}
        ref={mapRef}
        className="rounded-lg overflow-hidden"
        style={{ height, width }}
      />
      
      {showDirectionsLink && (
        <div className="mt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="text-sm gap-2"
            onClick={() => window.open(generateDirectionsUrl(lat, lng, propertyTitle), "_blank")}
          >
            <Navigation className="h-4 w-4" />
            <span>Directions</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      )}
    </div>
  )
}

// Static map fallback component
export function StaticPropertyMap({
  lat,
  lng,
  zoom = 14,
  width = 600,
  height = 300,
  className = "",
}: {
  lat: number
  lng: number
  zoom?: number
  width?: number
  height?: number
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ height: `${height}px`, width: `${width}px` }}
      >
        <MapPin className="h-10 w-10 text-mediumGreen mb-2" />
        <p className="text-sm text-gray-600 text-center px-4">
          Map could not be loaded. API key not found.
        </p>
      </div>
    )
  }

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&markers=color:green%7C${lat},${lng}&key=${apiKey}`

  return (
    <div className={`static-property-map ${className}`}>
      <Image
        src={mapUrl}
        alt="Property location map"
        width={width}
        height={height}
        className="rounded-lg"
      />
    </div>
  )
} 