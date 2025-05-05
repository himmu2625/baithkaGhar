"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Please enter your email address")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSuccess(true)
    } catch (error) {
      setError("Failed to send reset link. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-lightYellow/20">
      <div className="container max-w-md px-4">
        <Button
          variant="ghost"
          className="mb-4 text-darkGreen hover:text-mediumGreen hover:bg-transparent"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="border-lightGreen shadow-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-darkGreen">Forgot Password</CardTitle>
            <CardDescription>Enter your email to reset your password</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-4">
                <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded mb-4 text-sm">
                  Password reset link has been sent to your email.
                </div>
                <p className="text-sm text-mediumGreen mb-4">
                  Please check your inbox and follow the instructions to reset your password.
                </p>
                <Button
                  className="bg-mediumGreen hover:bg-darkGreen text-lightYellow"
                  onClick={() => router.push("/login")}
                >
                  Return to Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-darkGreen">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 border-lightGreen focus:border-lightGreen"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-mediumGreen">
              Remember your password?{" "}
              <Link href="/login" className="text-darkGreen hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
