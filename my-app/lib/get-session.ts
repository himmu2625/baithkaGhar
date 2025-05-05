import NextAuth from "next-auth"
import { authOptions } from "./auth"

// Helper function to get a session using NextAuth v5 beta API
export const getSession = async () => {
  return await NextAuth(authOptions).auth()
} 