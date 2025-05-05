import { dbConnect } from "./db"
import Property from "@/models/Property"
import { Types } from "mongoose"

/**
 * Advanced search utility for property listings
 */

export interface PropertySearchFilters {
  location?: string
  checkIn?: Date
  checkOut?: Date
  guests?: number
  priceMin?: number
  priceMax?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  propertyType?: string
  instant?: boolean
  nearbyPlaces?: {
    type: string
    distance: number
  }[]
  rating?: number
  sort?: "price_asc" | "price_desc" | "rating" | "newest"
  page?: number
  limit?: number
}

export interface PropertySearchResult {
  properties: any[] // Using any[] since we're reshaping the properties
  total: number
  page: number
  totalPages: number
  hasMore: boolean
}

// Define our property interface for returned results
export interface PropertyResult {
  _id: string
  id: string
  location: {
    city: string
    state: string
    address: string
  }
  price: number
  bedrooms: number
  bathrooms: number
  type: string
  maxGuests: number
  rating: number
  amenities: {
    name: string
  }[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  [key: string]: any // Add index signature for additional properties
}

export async function searchProperties(
  filters: PropertySearchFilters
): Promise<PropertySearchResult> {
  try {
    await dbConnect()
    
    const query: any = { isActive: true }

    if (filters.location) {
      query.$or = [
        { "location.city": { $regex: filters.location, $options: "i" } },
        { "location.state": { $regex: filters.location, $options: "i" } },
        { "location.address": { $regex: filters.location, $options: "i" } },
      ]
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      query.price = {}
      if (filters.priceMin !== undefined) {
        query.price.$gte = filters.priceMin
      }
      if (filters.priceMax !== undefined) {
        query.price.$lte = filters.priceMax
      }
    }

    if (filters.bedrooms !== undefined) {
      query.bedrooms = { $gte: filters.bedrooms }
    }

    if (filters.bathrooms !== undefined) {
      query.bathrooms = { $gte: filters.bathrooms }
    }

    if (filters.propertyType) {
      query.type = filters.propertyType
    }

    if (filters.guests !== undefined) {
      query.maxGuests = { $gte: filters.guests }
    }

    if (filters.rating !== undefined) {
      query.rating = { $gte: filters.rating }
    }

    if (filters.amenities && filters.amenities.length > 0) {
      query["amenities.name"] = { $all: filters.amenities }
    }

    const page = filters.page || 1
    const limit = filters.limit || 10
    const skip = (page - 1) * limit

    let sortOptions: any = { createdAt: -1 }

    if (filters.sort) {
      switch (filters.sort) {
        case "price_asc":
          sortOptions = { price: 1 }
          break
        case "price_desc":
          sortOptions = { price: -1 }
          break
        case "rating":
          sortOptions = { rating: -1 }
          break
        case "newest":
          sortOptions = { createdAt: -1 }
          break
      }
    }

    // Get the results from MongoDB
    const properties = await Property.find(query)
      .select("-__v")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Property.countDocuments(query)

    // Transform properties for consistent return type
    const transformedProperties = properties.map(property => ({
      ...property,
      id: property._id ? property._id.toString() : '',
      _id: property._id ? property._id.toString() : '',
    }))

    return {
      properties: transformedProperties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit),
    }
  } catch (error: any) {
    console.error("Error searching properties:", error)
    throw new Error(error.message || "Failed to search properties")
  }
}
