import { getDefaultPermissions, PERMISSIONS } from "@/config/permissions";
import User from "@/models/User";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Permission check utility for API routes
export async function checkPermission(
  req: NextRequest,
  requiredPermission: string
): Promise<boolean> {
  try {
    // Get the token
    const token = await getToken({ req });
    
    if (!token || !token.id) {
      return false;
    }
    
    // Get the user
    const user = await User.findById(token.id);
    
    if (!user) {
      return false;
    }
    
    // Super admin always has permission
    if (user.role === "super_admin") {
      return true;
    }
    
    // Check if the user has the required permission
    if (user.permissions && user.permissions.includes(requiredPermission)) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

// Get user with permissions
export async function getUserWithPermissions(userId: string) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return null;
    }
    
    // If user doesn't have permissions assigned yet, assign default based on role
    if (!user.permissions || user.permissions.length === 0) {
      user.permissions = getDefaultPermissions(user.role || 'user');
      await user.save();
    }
    
    return user;
  } catch (error) {
    console.error("Error getting user with permissions:", error);
    return null;
  }
}

// Set a user as super_admin with all permissions
export async function setUserAsSuperAdmin(userId: string) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    user.role = "super_admin";
    user.isAdmin = true;
    user.permissions = getDefaultPermissions("super_admin");
    
    await user.save();
    return user;
  } catch (error) {
    console.error("Error setting user as super admin:", error);
    throw error;
  }
}

// Set a user as admin with standard admin permissions
export async function setUserAsAdmin(userId: string) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    user.role = "admin";
    user.isAdmin = true;
    user.permissions = getDefaultPermissions("admin");
    
    await user.save();
    return user;
  } catch (error) {
    console.error("Error setting user as admin:", error);
    throw error;
  }
}

// Update a user's permissions
export async function updateUserPermissions(userId: string, permissions: string[]) {
  try {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    user.permissions = permissions;
    await user.save();
    return user;
  } catch (error) {
    console.error("Error updating user permissions:", error);
    throw error;
  }
} 