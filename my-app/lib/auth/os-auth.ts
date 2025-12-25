// OS (Owner System) Authentication and Authorization utilities
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';

export interface OSUser {
  id: string;
  email: string;
  name: string;
  role: string;
  propertyIds?: string[];
  ownerProfile?: any;
}

/**
 * Get owner session - Returns session only if user is property_owner, admin, or super_admin
 */
export async function getOwnerSession() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return null;
  }

  const allowedRoles = ['property_owner', 'admin', 'super_admin'];

  if (!allowedRoles.includes(session.user.role || '')) {
    return null;
  }

  return session;
}

/**
 * Require owner authentication - Redirects to login if not authenticated or not an owner
 */
export async function requireOwnerAuth() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect('/os/login');
  }

  const allowedRoles = ['property_owner', 'admin', 'super_admin'];

  if (!allowedRoles.includes(session.user.role || '')) {
    redirect('/os/login?error=unauthorized');
  }

  return session;
}

/**
 * Check if user is an owner (has owner role)
 */
export function isOwner(role?: string): boolean {
  if (!role) return false;
  return ['property_owner', 'admin', 'super_admin'].includes(role);
}

/**
 * Check if user can access a specific property
 */
export async function canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) return false;

    // Super admins can access everything
    if (user.role === 'super_admin') {
      return true;
    }

    // Admins can access everything
    if (user.role === 'admin') {
      return true;
    }

    // Property owners can only access their own properties
    if (user.role === 'property_owner' && user.ownerProfile) {
      const ownerPropertyIds = user.ownerProfile.propertyIds?.map((id: any) => id.toString()) || [];
      return ownerPropertyIds.includes(propertyId);
    }

    return false;
  } catch (error) {
    console.error('Error checking property access:', error);
    return false;
  }
}

/**
 * Get all properties that the owner can access
 */
export async function getOwnerPropertyIds(userId: string): Promise<string[]> {
  try {
    await dbConnect();
    const user = await User.findById(userId);

    if (!user) return [];

    // Super admins and admins can access all properties
    if (user.role === 'super_admin' || user.role === 'admin') {
      return ['*']; // Special indicator for all properties
    }

    // Property owners can only access their assigned properties
    if (user.role === 'property_owner' && user.ownerProfile) {
      return user.ownerProfile.propertyIds?.map((id: any) => id.toString()) || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting owner property IDs:', error);
    return [];
  }
}

/**
 * Validates if a user has access to a specific property in the OS
 */
export async function validateOSAccess(userEmail?: string | null, propertyId?: string): Promise<boolean> {
  if (!userEmail || !propertyId) {
    return false;
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user?.email !== userEmail) {
      return false;
    }

    if (!session.user.id) {
      return false;
    }

    return await canAccessProperty(session.user.id, propertyId);
  } catch (error) {
    console.error('Error validating OS access:', error);
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