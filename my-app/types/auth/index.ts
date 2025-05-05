import { Session, User } from "next-auth"
import { JWT } from "next-auth/jwt"

// Extended Session type - don't extend Session directly to avoid type conflicts
export interface ExtendedSession {
  expires: string
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: string
    profileComplete: boolean
  }
}

// Extended User type
export interface ExtendedUser extends User {
  id: string
  role: string
  profileComplete: boolean
}

// Extended JWT type
export interface ExtendedJWT extends JWT {
  id: string
  role: string
  profileComplete: boolean
}

// Auth state type for context
export interface AuthState {
  isLoggedIn: boolean
  user: {
    id: string
    name: string
    email: string
    role: string
    profileComplete: boolean
  } | null
  loading: boolean
  error: string | null
}

// Auth context type
export interface AuthContextType {
  auth: AuthState
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<ExtendedUser>) => void
}
