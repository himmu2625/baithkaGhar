import { dbConnect } from "@/lib/db"
import User from "@/models/User"
import jwt from "jsonwebtoken"

/**
 * Service for authentication-related operations
 */
export const AuthService = {
  /**
   * Login a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<{success: boolean, token?: string, user?: any, message?: string}>} - Login result
   */
  login: async (email: string, password: string): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    message?: string;
  }> => {
    await dbConnect()
    
    try {
      // Find user by email
      const user = await User.findOne({ email })
      
      if (!user) {
        return { success: false, message: "User not found" }
      }
      
      // Check if the user has a password (might be Google auth only)
      if (!user.password) {
        return { success: false, message: "Please use Google signin for this account" }
      }
      
      // Check password
      const isMatch = await user.comparePassword(password)
      if (!isMatch) {
        return { success: false, message: "Invalid credentials" }
      }
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: String(user._id), 
          email: user.email, 
          role: user.isAdmin ? "admin" : "user" 
        }, 
        process.env.NEXTAUTH_SECRET || "fallback_secret", 
        { expiresIn: "7d" }
      )
      
      return {
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.isAdmin ? "admin" : "user",
          profileComplete: user.profileComplete || false
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "An error occurred during login" }
    }
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User data
   * @returns {Promise<{success: boolean, user?: any, token?: string, message?: string}>} - Registration result
   */
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{
    success: boolean;
    user?: any;
    token?: string;
    message?: string;
  }> => {
    await dbConnect()
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email })
      
      if (existingUser) {
        return { success: false, message: "User already exists" }
      }
      
      // Create new user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        phone: userData.phone,
        profileComplete: false
      })
      
      // Create JWT token
      const token = jwt.sign(
        { 
          id: String(user._id), 
          email: user.email, 
          role: "user" 
        }, 
        process.env.NEXTAUTH_SECRET || "fallback_secret", 
        { expiresIn: "7d" }
      )
      
      return {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: "user",
          profileComplete: false
        },
        token
      }
    } catch (error) {
      console.error("Registration error:", error)
      return { success: false, message: "An error occurred during registration" }
    }
  },
  
  /**
   * Verify a user's token
   * @param {string} token - JWT token
   * @returns {Promise<{success: boolean, user?: any, message?: string}>} - Verification result
   */
  verifyToken: async (token: string): Promise<{
    success: boolean;
    user?: any;
    message?: string;
  }> => {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || "fallback_secret") as {
        id: string;
        email: string;
        role: string;
      }
      
      await dbConnect()
      
      // Find user
      const user = await User.findById(decoded.id)
      
      if (!user) {
        return { success: false, message: "User not found" }
      }
      
      return {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.isAdmin ? "admin" : "user",
          profileComplete: user.profileComplete || false
        }
      }
    } catch (error) {
      console.error("Token verification error:", error)
      return { success: false, message: "Invalid or expired token" }
    }
  },
  
  /**
   * Send password reset email
   * @param {string} email - User email
   * @returns {Promise<{success: boolean, message: string}>} - Result
   */
  sendPasswordResetEmail: async (email: string): Promise<{
    success: boolean;
    message: string;
  }> => {
    await dbConnect()
    
    try {
      // Find user by email
      const user = await User.findOne({ email })
      
      if (!user) {
        // For security reasons, don't reveal that the user doesn't exist
        return { success: true, message: "If your email is registered, you will receive a password reset link" }
      }
      
      // In a real implementation, generate a reset token and send email
      // For now, we'll just return a success message
      
      return { success: true, message: "If your email is registered, you will receive a password reset link" }
    } catch (error) {
      console.error("Password reset error:", error)
      return { success: false, message: "An error occurred while processing your request" }
    }
  }
}
