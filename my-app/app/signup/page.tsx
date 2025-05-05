"use client"
export const dynamic = 'force-dynamic';

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Phone, Mail, ArrowLeft, User, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { GoogleButton } from "@/components/auth/google-button"
import { useToast } from "@/hooks/use-toast"
import { signIn } from "next-auth/react"

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !email || !phone || !password) {
      setError("Please fill in all required fields")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      console.log("Making registration request...")
      
      // Register user through the API
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, phone, password }),
      })

      console.log("Response status:", response.status)
      console.log("Response status text:", response.statusText)
      console.log("Content-Type:", response.headers.get("content-type"))
      
      // For debugging - log the raw response text
      const rawText = await response.text()
      console.log("Raw response:", rawText)
      
      // If not okay, handle the error
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`
        
        try {
          // Try to parse the error response if it looks like JSON
          if (rawText.trim().startsWith('{')) {
            const errorData = JSON.parse(rawText)
            errorMessage = errorData.message || errorData.error || errorMessage
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }
        
        throw new Error(errorMessage)
      }
      
      // Parse as JSON for success case
      let data
      try {
        data = JSON.parse(rawText)
      } catch (parseError) {
        console.error("Failed to parse success response:", parseError)
        throw new Error("Invalid response from server")
      }

      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please sign in.",
      })

      // Redirect to login page after successful registration
      router.push(`/login?email=${encodeURIComponent(email)}`)
    } catch (error: any) {
      console.error("Signup error:", error)
      setError(error.message || "Signup failed. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      })
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
            <CardTitle className="text-2xl font-bold text-darkGreen">Create an Account</CardTitle>
            <CardDescription>Join Baithaka Ghar to find your perfect stay</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-darkGreen">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    className="pl-10 border-lightGreen focus:border-lightGreen"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-darkGreen">
                  Phone Number
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    className="pl-10 border-lightGreen focus:border-lightGreen"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-darkGreen">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="border-lightGreen focus:border-lightGreen pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-mediumGreen" />
                    ) : (
                      <Eye className="h-4 w-4 text-mediumGreen" />
                    )}
                    <span className="sr-only">Toggle password visibility</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-darkGreen">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="border-lightGreen focus:border-lightGreen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-mediumGreen hover:bg-darkGreen text-lightYellow"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Sign Up"
                )}
              </Button>

              <div className="relative flex items-center justify-center my-4">
                <div className="absolute border-t border-mediumGreen/30 w-full"></div>
                <span className="relative bg-white px-2 text-sm text-mediumGreen">OR</span>
              </div>

              <GoogleButton callbackUrl="/login" />
            </form>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-mediumGreen">
              Already have an account?{" "}
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
