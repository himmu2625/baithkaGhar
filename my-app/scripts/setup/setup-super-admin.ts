/**
 * This script sets up a super admin user for the Baithak Ghar website.
 * It finds the user with the specified email address and promotes them to super_admin.
 * 
 * Usage:
 * npx ts-node scripts/setup-super-admin.ts
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.MONGODB_URI) {
  config(); // Try loading from .env if .env.local doesn't have it
}

// The email of the user to set as super admin
const SUPER_ADMIN_EMAIL = 'anuragsingh@baithakaghar.com';

// MongoDB connection
const connectDB = async () => {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    console.error('MongoDB URI not found in environment variables');
    process.exit(1);
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// Define User Schema
interface IUser extends mongoose.Document {
  name: string;
  email: string;
  isAdmin: boolean;
  role?: string;
  permissions?: string[];
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isAdmin: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'user'],
    default: 'user'
  },
  permissions: [{ type: String }]
});

// Get all permissions for super_admin
const getAllPermissions = () => [
  // User management
  'view:users', 'create:user', 'edit:user', 'delete:user',
  
  // Admin management
  'view:admins', 'create:admin', 'edit:admin', 'delete:admin', 'approve:admin',
  
  // Content management
  'view:content', 'create:content', 'edit:content', 'delete:content', 'publish:content',
  
  // Site settings
  'view:settings', 'edit:settings',
  
  // Property listings
  'view:properties', 'create:property', 'edit:property', 'delete:property', 'publish:property',
  
  // Bookings
  'view:bookings', 'create:booking', 'edit:booking', 'delete:booking', 'confirm:booking',
  
  // Analytics
  'view:analytics', 'export:analytics',
  
  // System
  'manage:system',
];

async function setupSuperAdmin() {
  try {
    await connectDB();
    
    // Get User model (or create it if it doesn't exist)
    const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
    
    // Find the user to promote
    const user = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    
    if (!user) {
      console.error(`User with email ${SUPER_ADMIN_EMAIL} not found`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.name} (${user.email})`);
    
    // Update user to super_admin
    user.isAdmin = true;
    user.role = 'super_admin';
    user.permissions = getAllPermissions();
    
    await user.save();
    
    console.log(`✅ Successfully set ${user.name} as super admin`);
    
    // Save the user ID to a file for reference
    const superAdminInfo = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    fs.writeFileSync(
      path.resolve(process.cwd(), 'super-admin-info.json'), 
      JSON.stringify(superAdminInfo, null, 2)
    );
    
    console.log('Super admin info saved to super-admin-info.json');
    
    // Exit successfully
    process.exit(0);
  } catch (error) {
    console.error('Error setting up super admin:', error);
    process.exit(1);
  }
}

// Run the script
setupSuperAdmin(); 