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

        // User is authenticated, return user data
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.isAdmin ? "admin" : "user",
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
    }: {
      token: JWT
      user?: NextAuthUser
      account?: Account | null
    }) {
      if (account && user) {
        if (account.provider === "google") {
          await dbConnect()

          const existingUser = await User.findOne({ email: user.email }) as UserDocument

          if (existingUser) {
            if (!existingUser.googleId && account.providerAccountId) {
              existingUser.googleId = account.providerAccountId
              await existingUser.save()
            }

            token.id = existingUser._id.toString()
            token.role = existingUser.isAdmin ? "admin" : "user"
            token.profileComplete = existingUser.profileComplete ?? false
          } else {
            // Create new user with Google auth
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              googleId: account.providerAccountId,
              isAdmin: false,
              profileComplete: false,
            }) as UserDocument

            token.id = newUser._id.toString()
            token.role = "user"
            token.profileComplete = false
            
            // Try to send welcome email (don't block auth flow if it fails)
            try {
              const { sendWelcomeEmail } = await import("./services/email")
              await sendWelcomeEmail({
                to: user.email as string,
                name: user.name as string
              })
            } catch (error) {
              console.error("Failed to send welcome email:", error)
            }
          }
        }

        // For credentials provider
        if (user.id) token.id = user.id
        if ((user as any).role) token.role = (user as any).role
        if ((user as any).profileComplete !== undefined) {
          token.profileComplete = (user as any).profileComplete
        }
      }

      return token
    },

    async session({
      session,
      token,
    }: {
      session: Session
      token: JWT
    }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.profileComplete = token.profileComplete ?? false
      }

      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },

  events: {
    async signIn({ user }) {
      // Log successful sign-in
      console.log(`User signed in: ${user.email}`)
    },
  },

  secret: NEXTAUTH_SECRET,
}
