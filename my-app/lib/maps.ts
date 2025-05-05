import axios from 'axios'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

type Coordinates = {
  lat: number
  lng: number
}

type GeocodeResult = {
  success: boolean
  coordinates?: Coordinates
  error?: string
}

type DistanceResult = {
  distance: string
  duration: string
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: 'Mapbox token is not defined',
    }
  }

  try {
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${MAPBOX_TOKEN}`
    
    const response = await axios.get(endpoint)

    const features = response.data.features
    if (features.length === 0) {
      return {
        success: false,
        error: 'No results found',
      }
    }

    const [lng, lat] = features[0].center

    return {
      success: true,
      coordinates: { lat, lng },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error occurred while geocoding address',
    }
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  if (!MAPBOX_TOKEN) return null

  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
    )
    return response.data.features[0]?.place_name ?? null
  } catch (error) {
    return null
  }
}

export async function calculateDistance(
  origin: Coordinates,
  destination: Coordinates
): Promise<{
  success: boolean
  result?: DistanceResult
  error?: string
}> {
  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: 'Mapbox token is not defined',
    }
  }

  try {
    const endpoint = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?access_token=${MAPBOX_TOKEN}`
    
    const response = await axios.get(endpoint)
    const route = response.data.routes[0]

    return {
      success: true,
      result: {
        distance: (route.distance / 1000).toFixed(2) + ' km',
        duration: Math.ceil(route.duration / 60) + ' mins',
      },
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error occurred while calculating distance',
    }
  }
}

export function generateDirectionsUrl(
  destinationLat: number,
  destinationLng: number,
  destinationName?: string
): string {
  const destination = destinationName
    ? encodeURIComponent(destinationName)
    : `${destinationLat},${destinationLng}`
    
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&destination_place_id=&travelmode=driving`
}
