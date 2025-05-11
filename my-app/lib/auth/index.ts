import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { ExtendedJWT } from "@/types/auth";

// Re-export OTP functionality
export * from './otp';

/**
 * Type representing a mock session user object.
 */
interface MockUserSession {
  user: {
    isLoggedIn: boolean;
    role?: 'admin' | 'host' | 'user';
    id?: string;
    profileComplete?: boolean;
  };
}

/**
 * Get the current user's session
 * @returns User session or null if not logged in
 */
export async function getSession(): Promise<MockUserSession | null> {
  const sessionCookie = (await cookies()).get('next-auth.session-token')?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    // Mock session structure
    return {
      user: {
        isLoggedIn: true,
        role: 'admin', // change as needed
        id: 'mock-user-id',
        profileComplete: true,
      }
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if a user is authenticated
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Check if user has admin role
 * @returns True if user is admin, false otherwise
 */
export async function isAdmin() {
  const session = await getSession();
  return session?.user?.role === 'admin';
}

/**
 * Check if user has host role
 * @returns True if user is host, false otherwise
 */
export async function isHost() {
  const session = await getSession();
  return session?.user?.role === 'host' || session?.user?.role === 'admin';
}

/**
 * Get current user ID
 * @returns User ID or null if not logged in
 */
export async function getCurrentUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Check if a user has completed their profile
 * @returns True if profile is complete, false otherwise
 */
export async function hasCompletedProfile() {
  const session = await getSession();
  return !!session?.user?.profileComplete;
}

/**
 * Verify if a JWT token is valid
 * @param token - The JWT token to verify
 * @returns The decoded token or null if invalid
 */
export function verifyToken(token: string): ExtendedJWT | null {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.error("JWT secret is not defined");
      return null;
    }

    const decodedToken = jwt.verify(token, process.env.NEXTAUTH_SECRET) as ExtendedJWT;
    return decodedToken;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

// Export session getter alias for backwards compatibility
export { getSession as getServerSession };
