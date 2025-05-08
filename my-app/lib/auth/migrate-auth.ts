"use client"

import { signIn } from "next-auth/react"

/**
 * Migrates a user from the old localStorage-based auth system to NextAuth
 * Call this function on app init to ensure smooth transition for existing users
 */
export async function migrateLocalStorageAuth() {
  if (typeof window === "undefined") return

  // Store the intended URL to navigate to after migration - DON'T force homepage redirect
  const currentPath = window.location.pathname;
  const isAuthPage = currentPath === '/login' || currentPath === '/signup';
  
  // Check for callbackUrl in search params - this is used when redirected from protected routes
  const urlParams = new URLSearchParams(window.location.search);
  const callbackUrl = urlParams.get('callbackUrl');
  
  // Priority: callbackUrl from URL params > current path (if not auth page)
  const redirectTarget = callbackUrl || (isAuthPage ? '/' : currentPath);

  try {
    // Check if we have local storage auth data
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")
    
    if (isLoggedIn && token && userData) {
      // Parse user data
      const user = JSON.parse(userData)
      const email = user.email
      
      if (!email) {
        console.error("Migration failed: No email found in localStorage user data")
        cleanupLocalStorage()
        return
      }
      
      console.log(`Migrating localStorage auth to NextAuth session for user: ${email}`)
      
      // We found localStorage auth data, attempt to sign in with credentials API
      // This will create a proper NextAuth session
      const result = await signIn("credentials", {
        redirect: false,
        email,
        token, // Use token instead of password
      })
      
      if (result?.ok) {
        console.log("Successfully migrated localStorage auth to NextAuth session")
        cleanupLocalStorage()
        
        // Redirect to the appropriate destination
        console.log("Redirecting after auth migration to:", redirectTarget);
        window.location.href = redirectTarget;
      } else {
        console.error("Migration failed:", result?.error)
        
        // If migration fails, clean up localStorage auth data to prevent infinite migration attempts
        cleanupLocalStorage()
      }
    }
  } catch (error) {
    console.error("Error migrating localStorage auth:", error)
    cleanupLocalStorage()
  }
}

/**
 * Helper function to clean up localStorage auth data
 */
function cleanupLocalStorage() {
  try {
    localStorage.removeItem("isLoggedIn")
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    
    // Also clear any other potential auth-related items
    localStorage.removeItem("auth")
    localStorage.removeItem("session")
    localStorage.removeItem("userInfo")
    
    console.log("Cleaned up localStorage auth data")
  } catch (e) {
    console.error("Error cleaning up localStorage:", e)
  }
} 