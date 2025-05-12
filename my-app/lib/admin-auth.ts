/**
 * Admin authentication configuration
 * This provides specialized authentication handling for the admin panel
 */

import { auth } from './auth';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Helper function to check if a user is an admin
 * @param user The user object from the session
 * @returns True if the user is an admin or super_admin
 */
export function isAdmin(user: any) {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'super_admin';
}

/**
 * Helper function to check if a user is a super admin
 * @param user The user object from the session
 * @returns True if the user is a super_admin
 */
export function isSuperAdmin(user: any) {
  if (!user) return false;
  return user.role === 'super_admin' || user.email === 'anuragsingh@baithakaghar.com';
}

/**
 * Auth handler for admin pages - use this in admin route handlers
 * This will verify that the user is logged in and has admin privileges
 * If not, it will redirect to the admin login page
 */
export async function adminAuth() {
  const session = await auth();
  
  // If there's no session or no user, redirect to admin login
  if (!session || !session.user) {
    redirect('/admin/login?error=NotSignedIn');
  }
  
  // If the user is not an admin, redirect to unauthorized page
  if (!isAdmin(session.user)) {
    redirect('/unauthorized?reason=NotAdmin');
  }
  
  // User is authenticated and has admin privileges
  return session;
}

/**
 * Auth middleware for admin API routes
 * This will verify that the user is logged in and has admin privileges
 * If not, it will return an unauthorized response
 */
export async function adminApiAuth(req: Request) {
  const session = await auth();
  
  // If there's no session or no user, return unauthorized
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }
  
  // If the user is not an admin, return forbidden
  if (!isAdmin(session.user)) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }
  
  // User is authenticated and has admin privileges
  return session;
}

/**
 * Debug function to log admin authentication issues
 */
export async function debugAdminAuth(session: unknown) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  console.log('Admin Auth Debug:');
  console.log('Cookies present:', allCookies.map(c => c.name).join(', '));
  
  return {
    cookies: allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 10) + '...' })),
    timestamp: new Date().toISOString()
  };
}

// Export the base auth for use in admin components
export { auth }; 