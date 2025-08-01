import { getServerSession } from "next-auth/next"
import { authOptions } from "./auth"

// Helper function to get a session using NextAuth v4 API
export const getSession = async () => {
  return await getServerSession(authOptions)
} 