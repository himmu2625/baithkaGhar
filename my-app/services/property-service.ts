import { dbConnect, convertDocToObj } from "@/lib/db"
import Property, { IProperty } from "@/models/Property"
import mongoose from "mongoose"
import { cityService } from "@/services/cityService"

/**
 * Service for property-related operations
 */
export const PropertyService = {
  /**
   * Get all properties
   * @param {Object} options - Query options
   * @returns {Promise<IProperty[]>} - List of properties
   */
  getAllProperties: async (
    options: {
      limit?: number
      page?: number
      sortBy?: string
      sortOrder?: "asc" | "desc"
      filter?: Record<string, any>
    } = {}
  ): Promise<{ properties: any[]; total: number; pages: number }> => {
    await dbConnect()
    
    const { 
      limit = 12, 
      page = 1, 
      sortBy = "createdAt", 
      sortOrder = "desc",
      filter = {}
    } = options
    
    const skip = (page - 1) * limit
    
    // Ensure filter only contains valid properties
    const validFilter = { 
      status: "available",
      isPublished: true,
      verificationStatus: { $in: ["approved", "pending"] }, // Include both approved and pending
      ...filter 
    }
    
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1
    
    const [properties, total] = await Promise.all([
      Property.find(validFilter).sort(sort).skip(skip).limit(limit).lean(),
      Property.countDocuments(validFilter)
    ])
    
    const pages = Math.ceil(total / limit)
    
    return {
      properties: properties.map(p => convertDocToObj(p)),
      total,
      pages
    }
  },
  
  /**
   * Get property by ID
   * @param {string} id - Property ID
   * @returns {Promise<IProperty | null>} - Property data
   */
  getPropertyById: async (id: string): Promise<any | null> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId format: ${id}`)
      return null
    }
    
    try {
      console.log(`Looking up property with ID: ${id}`)
      const property = await Property.findById(id).lean()
      
      if (!property) {
        console.log(`No property found with ID: ${id}`)
        return null
      }
      
      // Ensure we have all the required data fields with defaults
      const processedProperty = {
        ...property,
        _id: property._id || id, // Ensure ID is always present
        images: property.images || [],
        categorizedImages: property.categorizedImages || [],
        legacyGeneralImages: property.legacyGeneralImages || [],
        amenities: property.amenities || [],
        rules: property.rules || [],
        rating: property.rating || 0,
        reviewCount: property.reviewCount || 0,
        price: property.price || { base: 0 },
        address: property.address || {
          street: "",
          city: "",
          state: "",
          country: "",
          zipCode: ""
        }
      }
      
      // Perform a final check on the processed data
      const convertedProperty = convertDocToObj(processedProperty)
      
      // Ensure ID is properly set in the final object
      if (!convertedProperty.id && !convertedProperty._id) {
        convertedProperty.id = id
      }
      
      return convertedProperty
    } catch (error) {
      console.error(`Error fetching property by ID ${id}:`, error)
      return null
    }
  },
  
  /**
   * Search properties by location or name
   * @param {string} query - Search query
   * @returns {Promise<IProperty[]>} - List of matching properties
   */
  searchProperties: async (query: string): Promise<any[]> => {
    await dbConnect()
    
    const properties = await Property.find({
      status: "available",
      isPublished: true,
      verificationStatus: { $in: ["approved", "pending"] }, // Include both approved and pending
      $or: [
        { title: { $regex: query, $options: "i" } },
        { "address.city": { $regex: query, $options: "i" } },
        { "address.state": { $regex: query, $options: "i" } }
      ]
    }).limit(20).lean()
    
    return properties.map(p => convertDocToObj(p))
  },
  
  /**
   * Get properties by city
   * @param {string} cityName - City name
   * @returns {Promise<IProperty[]>} - List of matching properties
   */
  getPropertiesByCity: async (cityName: string): Promise<any[]> => {
    await dbConnect()
    
    const properties = await Property.find({
      "address.city": { $regex: new RegExp(`^${cityName}$`, 'i') },
      status: "available",
      isPublished: true,
      verificationStatus: { $in: ["approved", "pending"] } // Include both approved and pending
    }).lean()
    
    return properties.map(p => convertDocToObj(p))
  },
  
  /**
   * Create a new property
   * @param {Partial<IProperty>} propertyData - Property data
   * @returns {Promise<IProperty>} - Created property
   */
  createProperty: async (propertyData: Partial<IProperty>): Promise<any> => {
    await dbConnect()
    
    const property = await Property.create(propertyData)
    
    // City property count will be automatically updated by the Property model's post-save hook
    // No manual city count updates needed here to avoid double-counting
    
    return convertDocToObj(property)
  },
  
  /**
   * Update a property
   * @param {string} id - Property ID
   * @param {Partial<IProperty>} propertyData - Property data to update
   * @returns {Promise<IProperty | null>} - Updated property
   */
  updateProperty: async (id: string, propertyData: Partial<IProperty>): Promise<any | null> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null
    }
    
    // City property count changes will be automatically handled by the Property model's post-save hook
    // No manual city count updates needed here to avoid double-counting
    
    const property = await Property.findByIdAndUpdate(
      id,
      { $set: propertyData },
      { new: true }
    ).lean()
    
    return property ? convertDocToObj(property) : null
  },
  
  /**
   * Delete a property
   * @param {string} id - Property ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteProperty: async (id: string): Promise<boolean> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false
    }
    
    // Get property before deletion to update city count
    const property = await Property.findById(id)
    if (!property) {
      return false
    }
    
    // Delete the property
    const result = await Property.findByIdAndDelete(id)
    
    // City property count will be automatically updated by the Property model's post-remove hook
    // No manual city count updates needed here to avoid double-counting
    
    return !!result
  },
  
  /**
   * Check if user is property owner
   * @param {string} propertyId - Property ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - True if user is owner
   */
  isPropertyOwner: async (propertyId: string, userId: string): Promise<boolean> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return false
    }
    
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: userId
    })
    
    return !!property
  }
} 