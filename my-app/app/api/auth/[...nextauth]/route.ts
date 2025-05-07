import 'server-only'
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import type { NextAuthConfig } from 'next-auth'
import type { User as NextAuthUser, Account, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

import { connectMongo } from '@/lib/db/mongodb'
import User, { IUser } from '@/models/User'

// Extend the default session user type
interface ExtendedUser extends NextAuthUser {
  profileComplete?: boolean
}

// Define the auth options
const authOptions: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectMongo()

        const user = await User.findOne({ email: credentials.email }) as IUser | null

        if (!user || !user.password) return null

        const isValid = await user.comparePassword(credentials.password as string)

        if (!isValid) return null

        return {
          id: String(user._id),
          email: user.email,
          name: user.name,
          profileComplete: user.profileComplete || false,
          role: user.isAdmin ? 'admin' : 'user',
        }
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async signIn(params) {
      const { user, account } = params;
      
      if (account?.provider === 'google') {
        try {
          await connectMongo()

          const existingUser = await User.findOne({ email: user.email })

          if (existingUser) {
            if (!existingUser.googleId && account.providerAccountId) {
              existingUser.googleId = account.providerAccountId
              await existingUser.save()
            }

            user.profileComplete = existingUser.profileComplete || false
          } else {
            const newUser = await User.create({
              name: user.name,
              email: user.email,
              googleId: account.providerAccountId,
              profileComplete: false,
            })

            user.id = String(newUser._id)
            user.profileComplete = false
          }
        } catch (error) {
          console.error('Error in signIn callback:', error)
          return false
        }
      }

      return true
    },

    async jwt({
      token,
      user,
      account,
      trigger,
      session,
    }: {
      token: JWT
      user?: ExtendedUser
      account?: Account | null
      trigger?: 'signIn' | 'update' | 'signUp'
      session?: Session
    }) {
      if (account && user) {
        token.profileComplete = user.profileComplete || false
      }
    
      if (trigger === 'update' && session?.user) {
        if (session.user.profileComplete !== undefined) {
          token.profileComplete = session.user.profileComplete
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
      if (token) {
        session.user.id = token.sub!
        session.user.profileComplete = token.profileComplete as boolean
      }

      return session
    },
  },
  pages: {
    signIn: '/login',
    newUser: '/complete-profile',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Create the handler for NextAuth v5
const { handlers } = NextAuth(authOptions)

// Export the handler functions as GET and POST
export const GET = handlers.GET
export const POST = handlers.POST
