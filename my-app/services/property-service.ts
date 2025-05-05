import { dbConnect, convertDocToObj } from "@/lib/db"
import Property, { IProperty } from "@/models/Property"
import mongoose from "mongoose"

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
    const validFilter = { isActive: true, ...filter }
    
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
      return null
    }
    
    const property = await Property.findById(id).lean()
    return property ? convertDocToObj(property) : null
  },
  
  /**
   * Search properties by location or name
   * @param {string} query - Search query
   * @returns {Promise<IProperty[]>} - List of matching properties
   */
  searchProperties: async (query: string): Promise<any[]> => {
    await dbConnect()
    
    const properties = await Property.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { "location.city": { $regex: query, $options: "i" } },
        { "location.state": { $regex: query, $options: "i" } }
      ]
    }).limit(20).lean()
    
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
    
    const property = await Property.findByIdAndUpdate(
      id,
      { $set: propertyData },
      { new: true }
    ).lean()
    
    return property ? convertDocToObj(property) : null
  }
} 