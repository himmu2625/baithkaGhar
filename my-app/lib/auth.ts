import "server-only"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { User as NextAuthUser, Account } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import User from "@/models/User"
import { dbConnect } from "./db"
import type { NextAuthConfig } from "next-auth"
import jwt from "jsonwebtoken"
import NextAuth from "next-auth"

// Define the User document interface
interface UserDocument {
  _id: any;
  name: string;
  email: string;
  password?: string;
  isAdmin: boolean;
  profileComplete?: boolean;
  googleId?: string;
  comparePassword: (password: string) => Promise<boolean>;
  save: () => Promise<UserDocument>;
  role?: string;
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET as string
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET as string

export const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password", optional: true },
        token: { label: "Token", type: "text", optional: true },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required")
        }

        if (!credentials.password && !credentials.token) {
          throw new Error("Either password or token is required")
        }

        await dbConnect()

        const user = await User.findOne({ email: credentials.email }) as UserDocument

        if (!user) {
          throw new Error("User not found")
        }

        // Case 1: Login with password
        if (credentials.password) {
          if (!user.password) {
            throw new Error("This account doesn't have a password. Please use Google sign-in")
          }

          const isPasswordMatch = await user.comparePassword(credentials.password as string)

          if (!isPasswordMatch) {
            throw new Error("Invalid password")
          }
        }
        // Case 2: Login with token (for migration from localStorage auth)
        else if (credentials.token) {
          try {
            // Verify the token
            const decoded = jwt.verify(credentials.token as string, NEXTAUTH_SECRET) as any
            
            // Ensure the token belongs to this user
            if (decoded.email !== user.email && decoded.id !== user._id.toString()) {
              throw new Error("Invalid token")
            }
          } catch (error) {
            console.error("Token verification failed:", error)
            throw new Error("Invalid or expired token")
          }
        }

        // Log the actual user role from the database for debugging
        console.log(`Authenticating ${user.email} with role:`, user.role || (user.isAdmin ? "admin" : "user"));

        // User is authenticated, return user data
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role || (user.isAdmin ? "admin" : "user"),
          profileComplete: user.profileComplete ?? false,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      // Check if user is signing in with Google and redirect to profile completion if needed
      if (account?.provider === "google") {
        await dbConnect()
        
        // Check if user exists and profile is complete
        const dbUser = await User.findOne({ email: user.email }) as UserDocument | null
        
        if (dbUser && dbUser.profileComplete === false) {
          // We'll let them sign in, but NextAuth will redirect to complete profile based on the profileComplete flag
          return true
        }
      }
      
      return true
    },

    async jwt({
      token,
      user,
      account,
      trigger
    }: {
      token: JWT
      user?: { id: string; role?: string; profileComplete?: boolean; email?: string | null; name?: string | null } & NextAuthUser
      account?: Account | null
      trigger?: "signIn" | "update" | "signUp"
    }) {
      // When user object is available (e.g., at sign-in or sign-up)
      if (user) {
        token.sub = user.id;
        if (user.email) token.email = user.email;
        if (user.name) token.name = user.name;
        if (user.role) token.role = user.role;
        token.profileComplete = user.profileComplete ?? false;

        // Log for debugging role in JWT
        console.log(`JWT callback: user ${user.email}, role set to ${user.role}`);
      }

      return token
    },

    async session({
      session,
      token,
    }: {
      session: Session & { user: { role?: string; id?: string; profileComplete?: boolean } }
      token: JWT & { role?: string; sub?: string; profileComplete?: boolean; email?: string; name?: string }
    }) {
      // Transfer properties from token to session.user
      if (token.sub) session.user.id = token.sub;
      if (token.email) session.user.email = token.email;
      if (token.name) session.user.name = token.name;
      if (token.role) session.user.role = token.role;
      if (token.profileComplete !== undefined) session.user.profileComplete = token.profileComplete;
      
      // Log for debugging role in session
      console.log(`Session callback: user ${session.user.email}, role set to ${session.user.role}`);

      return session
    },
  },

  pages: {
    signIn: "/login",
    newUser: "/complete-profile",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // Increase from 30 to 60 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  events: {
    async signIn({ user }) {
      // Log successful sign-in
      console.log(`User signed in: ${user.email}`)
    },
  },

  secret: NEXTAUTH_SECRET,
  trustHost: true,
  debug: true,
}

// Export the auth function from NextAuth v5
export const { handlers, auth, signIn, signOut } = NextAuth(authOptions)

// For backward compatibility
export default authOptions
