// OS Authentication and Authorization utilities
import { getServerSession } from 'next-auth';

export interface OSUser {
  id: string;
  email: string;
  name: string;
  role: string;
  propertyId?: string;
  permissions: string[];
}

/**
 * Validates if a user has access to a specific property in the OS
 */
export async function validateOSAccess(userEmail?: string | null, propertyId?: string): Promise<boolean> {
  if (!userEmail || !propertyId) {
    return false;
  }

  try {
    // In a real implementation, this would check against your database
    // For now, we'll return true for authenticated users
    // You can enhance this with proper role-based access control
    
    // Basic validation - user must be authenticated
    const session = await getServerSession();
    if (!session || session.user?.email !== userEmail) {
      return false;
    }

    // Add your specific property access logic here
    // For example, check if user is assigned to this property
    return true;
  } catch (error) {
    console.error('Error validating OS access:', error);
    return false;
  }
}

/**
 * Get user's OS role and permissions
 */
export async function getOSUserRole(userEmail: string): Promise<{ role: string; permissions: string[] } | null> {
  try {
    // In a real implementation, fetch from database
    // For now, return default role
    return {
      role: 'manager',
      permissions: ['read', 'write', 'delete', 'admin']
    };
  } catch (error) {
    console.error('Error getting OS user role:', error);
    return null;
  }
}

/**
 * Check if user has specific permission
 */
export async function hasOSPermission(userEmail: string, permission: string): Promise<boolean> {
  try {
    const userRole = await getOSUserRole(userEmail);
    return userRole?.permissions.includes(permission) || false;
  } catch (error) {
    console.error('Error checking OS permission:', error);
    return false;
  }
}

/**
 * Middleware to check OS access in API routes
 */
export async function requireOSAccess(userEmail?: string | null, propertyId?: string) {
  const hasAccess = await validateOSAccess(userEmail, propertyId);
  
  if (!hasAccess) {
    throw new Error('Access denied');
  }
  
  return true;
}