import { dbConnect, convertDocToObj } from "@/lib/db"
import User from "@/models/User"
import mongoose from "mongoose"

/**
 * Service for user-related operations
 */
export const UserService = {
  /**
   * Get a user by ID
   * @param {string} id - User ID
   * @returns {Promise<any>} - User object
   */
  getUserById: async (id: string): Promise<any> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID")
    }
    
    const user = await User.findById(id).lean()
    
    if (!user) {
      return null
    }
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user
    
    return convertDocToObj(userWithoutPassword)
  },
  
  /**
   * Get a user by email
   * @param {string} email - User email
   * @returns {Promise<any>} - User object
   */
  getUserByEmail: async (email: string): Promise<any> => {
    await dbConnect()
    
    const user = await User.findOne({ email }).lean()
    
    if (!user) {
      return null
    }
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user
    
    return convertDocToObj(userWithoutPassword)
  },
  
  /**
   * Update a user
   * @param {string} id - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<any>} - Updated user
   */
  updateUser: async (id: string, updateData: any): Promise<any> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID")
    }
    
    // Prevent updating sensitive fields directly
    const { password, isAdmin, ...safeUpdateData } = updateData
    
    const user = await User.findByIdAndUpdate(
      id,
      safeUpdateData,
      { new: true, runValidators: true }
    ).lean()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Remove sensitive information
    const { password: userPassword, ...userWithoutPassword } = user
    
    return convertDocToObj(userWithoutPassword)
  },
  
  /**
   * Update user password
   * @param {string} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} - Success status
   */
  updatePassword: async (
    id: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID")
    }
    
    // Get user with password
    const user = await User.findById(id)
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword)
    
    if (!isMatch) {
      throw new Error("Current password is incorrect")
    }
    
    // Update password
    user.password = newPassword
    await user.save()
    
    return true
  },
  
  /**
   * Complete user profile
   * @param {string} id - User ID
   * @param {Object} profileData - Profile data
   * @returns {Promise<any>} - Updated user
   */
  completeProfile: async (id: string, profileData: any): Promise<any> => {
    await dbConnect()
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Invalid user ID")
    }
    
    const { address, phone, dob } = profileData
    
    const user = await User.findByIdAndUpdate(
      id,
      {
        address,
        phone,
        dob,
        profileComplete: true
      },
      { new: true, runValidators: true }
    ).lean()
    
    if (!user) {
      throw new Error("User not found")
    }
    
    // Remove sensitive information
    const { password, ...userWithoutPassword } = user
    
    return convertDocToObj(userWithoutPassword)
  },
  
  /**
   * Get all users (admin only)
   * @param {Object} options - Query options
   * @returns {Promise<{users: any[], total: number, pages: number}>} - List of users with pagination info
   */
  getAllUsers: async (
    options: {
      limit?: number
      page?: number
      sortBy?: string
      sortOrder?: "asc" | "desc"
      filter?: Record<string, any>
    } = {}
  ): Promise<{ users: any[]; total: number; pages: number }> => {
    await dbConnect()
    
    const { 
      limit = 20, 
      page = 1, 
      sortBy = "createdAt", 
      sortOrder = "desc",
      filter = {}
    } = options
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit
    
    // Create sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === "asc" ? 1 : -1
    
    // Get total count for pagination
    const total = await User.countDocuments(filter)
    
    // Get users
    const users = await User.find(filter)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
    
    return {
      users: users.map(u => convertDocToObj(u)),
      total,
      pages: Math.ceil(total / limit)
    }
  }
}
