"use client"

import type React from "react"

import { useEffect, createContext, useContext } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useSession, signOut } from "next-auth/react"

/**
 * @deprecated - This hook is deprecated. Use NextAuth's useSession and signIn/signOut functions instead.
 * It's currently maintained only for backward compatibility with existing code.
 */

interface User {
  id: string
  name: string
  email: string
  phone?: string
}

interface LoginContextType {
  isLoggedIn: boolean
  user: User | null
  setIsLoggedIn: (value: boolean) => void
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>
  logout: () => void
  promptLogin: () => boolean
}

const LoginContext = createContext<LoginContextType>({
  isLoggedIn: false,
  user: null,
  setIsLoggedIn: () => {},
  setUser: () => {},
  login: async () => false,
  register: async () => false,
  logout: () => {},
  promptLogin: () => false,
})

export function LoginProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Show a deprecation warning in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "DEPRECATED: The LoginProvider using localStorage is deprecated and will be removed in future versions. " +
        "Use NextAuth's SessionProvider instead."
      );
    }
  }, []);

  // Bridge to NextAuth session
  const isLoggedIn = !!session
  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
  } : null;

  const setIsLoggedIn = () => {
    console.warn("setIsLoggedIn is deprecated. Use NextAuth's signIn/signOut instead.");
  };
  
  const setUser = () => {
    console.warn("setUser is deprecated. User data is managed by NextAuth.");
  };

  // Forward to NextAuth signIn
  const login = async (email: string, password: string): Promise<boolean> => {
    console.warn("The login method is deprecated. Use NextAuth's signIn instead.");
    router.push(`/login?email=${encodeURIComponent(email)}`);
    return false;
  }

  // Forward to signup page
  const register = async (name: string, email: string, phone: string, password: string): Promise<boolean> => {
    console.warn("The register method is deprecated. Use NextAuth's signup flow instead.");
    router.push(`/signup?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    return false;
  }

  // Forward to NextAuth signOut
  const logout = () => {
    console.warn("The logout method is deprecated. Use NextAuth's signOut instead.");
    signOut({ redirect: true, callbackUrl: "/" });
  }

  // Redirect to login page if not logged in
  const promptLogin = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return false;
    }
    return true;
  }

  return (
    <LoginContext.Provider value={{ 
      isLoggedIn, 
      user, 
      setIsLoggedIn, 
      setUser, 
      login, 
      register, 
      logout, 
      promptLogin 
    }}>
      {children}
    </LoginContext.Provider>
  )
}

export function useLoginPrompt() {
  const context = useContext(LoginContext)
  if (context === undefined) {
    throw new Error("useLoginPrompt must be used within a LoginProvider")
  }

  return context
}
