import "server-only"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { User as NextAuthUser, Account } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import User from "@/models/User"
import { dbConnect } from "./db"
import type { NextAuthOptions } from "next-auth"
import jwt from "jsonwebtoken"
import { getServerSession } from "next-auth/next"

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

export const authOptions: NextAuthOptions = {
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
        try {
          console.log('[Auth] Authorization attempt for:', credentials?.email);

          if (!credentials?.email) {
            console.log('[Auth] Error: Email is required');
            throw new Error("Email is required")
          }

          if (!credentials.password && !credentials.token) {
            console.log('[Auth] Error: Either password or token is required');
            throw new Error("Either password or token is required")
          }

          await dbConnect()

          const user = await User.findOne({ email: credentials.email }) as UserDocument

          if (!user) {
            console.log('[Auth] Error: User not found for email:', credentials.email);
            throw new Error("User not found")
          }

          console.log('[Auth] User found:', user.email, 'Role:', user.role);

          // Special handling for super admin
          if (credentials.email === "anuragsingh@baithakaghar.com") {
            console.log("Super admin login detected for", credentials.email);
            // Force the role to be super_admin regardless of DB value
            user.role = "super_admin";
            user.isAdmin = true;
            
            // Ensure this gets saved if it's not already set
            try {
              if (user.role !== "super_admin" || !user.isAdmin) {
                user.role = "super_admin";
                user.isAdmin = true;
                await user.save();
                console.log("Super admin role updated in database");
              }
            } catch (err) {
              console.error("Error updating super admin role:", err);
            }
          }

          // Case 1: Login with password
          if (credentials.password) {
            console.log('[Auth] Validating password for:', user.email);

            if (!user.password) {
              console.log('[Auth] Error: User has no password set');
              throw new Error("This account doesn't have a password. Please use Google sign-in or contact support")
            }

            const isPasswordMatch = await user.comparePassword(credentials.password as string)
            console.log('[Auth] Password match result:', isPasswordMatch);

            if (!isPasswordMatch) {
              console.log('[Auth] Error: Invalid password');
              throw new Error("Invalid email or password")
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

          // Determine the user's role
          let userRole = "user";
          if (user.email === "anuragsingh@baithakaghar.com") {
            userRole = "super_admin";
          } else if (user.role) {
            userRole = user.role;
          } else if (user.isAdmin) {
            userRole = "admin";
          }

          // Log the actual user role from the database for debugging
          console.log(`[Auth] Authenticating ${user.email} with role:`, userRole);

          // User is authenticated, return user data
          const returnData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: userRole,
            profileComplete: user.profileComplete ?? false,
          };

          console.log('[Auth] Successfully authenticated, returning:', returnData);
          return returnData;
        } catch (error) {
          console.error("[Auth] Authorization error:", error);
          // Return null to indicate failed authentication
          return null;
        }
      }
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        // Check if user is signing in with Google and redirect to profile completion if needed
        if (account?.provider === "google") {
          await dbConnect()
          
          // Check if user exists and profile is complete
          const dbUser = await User.findOne({ email: user.email }) as UserDocument | null
          
          // Special handling for super admin with Google login
          if (user.email === "anuragsingh@baithakaghar.com") {
            if (dbUser) {
              dbUser.role = "super_admin";
              dbUser.isAdmin = true;
              await dbUser.save().catch(err => console.error("Error updating super admin role:", err));
            }
            return true;
          }
          
          if (dbUser && dbUser.profileComplete === false) {
            // We'll let them sign in, but NextAuth will redirect to complete profile based on the profileComplete flag
            return true
          }
        }
        
        return true
      } catch (error) {
        console.error("SignIn callback error:", error);
        return false;
      }
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
      try {
        // Initial sign in
        if (user && account) {
          console.log(`JWT callback: Initial sign in for ${user.email}`);
          console.log(`JWT callback: User ID: ${user.id}, User object:`, user);
          
          // Set role based on email or user data
          let userRole = "user";
          if (user.email === "anuragsingh@baithakaghar.com") {
            userRole = "super_admin";
          } else if (user.role) {
            userRole = user.role;
          }
          
          token.role = userRole;
          token.profileComplete = user.profileComplete ?? false;
          
          console.log(`JWT callback: Set role to ${userRole} for ${user.email}`);
          console.log(`JWT callback: Token sub (user ID): ${token.sub}`);
        }

        // Always check database for current user data on each token refresh
        if (token.sub && trigger !== "signIn") {
          try {
            await dbConnect();
            const dbUser = await User.findById(token.sub);
            if (dbUser) {
              console.log(`JWT callback: Found user in DB: ${dbUser._id}, email: ${dbUser.email}`);
              
              // Update profile complete status
              if (dbUser.profileComplete === true && token.profileComplete !== true) {
                console.log(`Updating JWT profileComplete to true for user ${token.email || token.sub}`);
                token.profileComplete = true;
              }
              
              // Update role from database if it has changed
              let currentRole = "user";
              if (dbUser.email === "anuragsingh@baithakaghar.com") {
                currentRole = "super_admin";
              } else if (dbUser.role) {
                currentRole = dbUser.role;
              } else if (dbUser.isAdmin) {
                currentRole = "admin";
              }
              
              if (token.role !== currentRole) {
                console.log(`Updating JWT role from ${token.role} to ${currentRole} for user ${token.email}`);
                token.role = currentRole;
              }
            } else {
              console.log(`JWT callback: User not found in DB for sub: ${token.sub}`);
            }
          } catch (error) {
            console.error("Error checking user data in JWT callback:", error);
            // Continue with existing token data if DB check fails
          }
        }

        return token
      } catch (error) {
        console.error("JWT callback error:", error);
        return token;
      }
    },

    async session({
      session,
      token,
    }: {
      session: Session & { user: { role?: string; id?: string; profileComplete?: boolean } }
      token: JWT & { role?: string; sub?: string; profileComplete?: boolean; email?: string; name?: string }
    }) {
      try {
        console.log(`Session callback: Token sub: ${token.sub}, email: ${token.email}`);
        
        // Transfer properties from token to session.user
        if (token.sub) session.user.id = token.sub;
        if (token.email) session.user.email = token.email;
        if (token.name) session.user.name = token.name;
        
        // Set role in session
        if (token.email === "anuragsingh@baithakaghar.com") {
          session.user.role = "super_admin";
          console.log("Setting super_admin role in session for anuragsingh@baithakaghar.com");
        } else if (token.role) {
          session.user.role = token.role;
        } else {
          session.user.role = "user";
        }
        
        if (token.profileComplete !== undefined) session.user.profileComplete = token.profileComplete;
        
        // Log for debugging role in session
        console.log(`Session callback: user ${session.user.email}, role set to ${session.user.role}, id: ${session.user.id}`);

        return session
      } catch (error) {
        console.error("Session callback error:", error);
        return session;
      }
    },
  },

  pages: {
    signIn: "/login",
    newUser: "/complete-profile",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 24 * 60 * 60, // 60 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Simplified cookies configuration to avoid issues
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },

  events: {
    async signIn({ user }) {
      // Log successful sign-in
      console.log(`User signed in: ${user.email}`)
    },
  },

  secret: NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Only enable debug in development
}

// NextAuth v4 compatibility helpers
export async function auth() {
  return await getServerSession(authOptions)
}

// Export for NextAuth v4 compatibility
export default authOptions
