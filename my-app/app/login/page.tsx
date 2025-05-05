"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Phone, Mail, ArrowLeft, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { signIn, useSession } from "next-auth/react"
import { GoogleButton } from "@/components/auth/google-button"
import { useToast } from "@/hooks/use-toast"

// Define the OTP types directly
type OtpMethod = 'email' | 'sms';
type OtpPurpose = 'login' | 'registration' | 'password-reset' | 'email-verification' | 'phone-verification';

// Define the enum values directly in the client component to avoid importing from server-only module
const OTP_PURPOSE = {
  LOGIN: 'login',
  REGISTRATION: 'registration',
  PASSWORD_RESET: 'password-reset',
  EMAIL_VERIFICATION: 'email-verification',
  PHONE_VERIFICATION: 'phone-verification',
} as const

const OTP_METHOD = {
  EMAIL: 'email',
  SMS: 'sms',
} as const

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  const [activeTab, setActiveTab] = useState("email")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [cooldown, setCooldown] = useState(0)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      router.push('/')
    }
  }, [session, status, router])

  // Timer for OTP cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [cooldown])

  const handleSendOtp = useCallback(async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Call API to send OTP
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          destination: phoneNumber,
          purpose: OTP_PURPOSE.LOGIN,
          method: OTP_METHOD.SMS,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for cooldown error
        if (data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds)
        }
        throw new Error(data.message || data.error || "Failed to send OTP")
      }

      setOtpSent(true)
      // Set initial otp array to empty values
      setOtp(["", "", "", "", "", ""])
      
      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your phone.",
      })
    } catch (error: any) {
      setError(error.message || "Failed to send OTP")
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [phoneNumber, setError, setIsLoading, setCooldown, setOtpSent, setOtp, toast])

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Verify OTP
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp: otpValue,
          destination: phoneNumber,
          purpose: OTP_PURPOSE.LOGIN,
          method: OTP_METHOD.SMS,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to verify OTP")
      }

      // On successful verification, use hard navigation to reload with new session
      toast({
        title: "Success",
        description: "Successfully logged in",
      })
      window.location.href = "/"
    } catch (error: any) {
      setError(error.message || "Failed to verify OTP. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to verify OTP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = useCallback(() => {
    if (cooldown > 0) return
    handleSendOtp()
  }, [cooldown, handleSendOtp])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError("Please enter both email and password")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // Use NextAuth login
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        setError(result.error)
        toast({
          title: "Login failed",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Successfully logged in",
        })
        // Force a hard navigation to reload the page entirely with the new session
        window.location.href = "/"
      }
    } catch (error: any) {
      setError("Login failed. Please check your credentials.")
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1)
    }

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement
      if (nextInput) {
        nextInput.focus()
      }
    }
  }

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement
      if (prevInput) {
        prevInput.focus()
      }
    }
  }

  // If already signed in, don't show login form
  if (status === 'authenticated') {
    return (
      <main className="pt-24 pb-16 min-h-screen flex items-center justify-center bg-lightYellow/20">
        <div className="container max-w-md px-4 text-center">
          <h2 className="text-xl font-semibold">You are already logged in</h2>
          <p className="mt-2 mb-4">Redirecting you to the homepage...</p>
          <Button 
            onClick={() => router.push('/')}
            className="mt-4"
          >
            Go to Homepage
          </Button>
        </div>
      </main>
    )
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
            <CardTitle className="text-2xl font-bold text-darkGreen">Welcome Back</CardTitle>
            <CardDescription>Sign in to continue to Baithaka Ghar</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger
                  value="phone"
                  className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
                >
                  Phone
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="data-[state=active]:bg-lightGreen data-[state=active]:text-darkGreen"
                >
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="phoneNumber" className="text-sm font-medium">
                        Phone Number
                      </Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                          id="phoneNumber"
                          placeholder="Enter your phone number"
                          type="tel"
                          className="pl-10"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                      </div>
                    </div>

                    <Button
                      className="w-full bg-darkGreen hover:bg-darkGreen/90"
                      onClick={handleSendOtp}
                      disabled={isLoading || !phoneNumber}
                    >
                      {isLoading ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send OTP"
                      )}
                    </Button>

                    <div className="relative flex py-5 items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <GoogleButton className="w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="otp" className="text-sm font-medium">
                        Verification Code
                      </Label>
                      <p className="text-sm text-gray-500 mb-2">
                        We've sent a 6-digit code to {phoneNumber}
                      </p>
                      <div className="flex justify-between gap-2">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Input
                            key={index}
                            id={`otp-${index}`}
                            className="w-10 h-12 text-center text-lg font-bold p-0"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={otp[index]}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                          />
                        ))}
                      </div>
                    </div>

                    <Button
                      className="w-full bg-darkGreen hover:bg-darkGreen/90"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otp.join("").length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Verify & Login"
                      )}
                    </Button>

                    <Button
                      variant="link"
                      className="w-full p-0 h-auto text-sm text-gray-500"
                      onClick={handleResendOtp}
                      disabled={cooldown > 0}
                    >
                      {cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : "Didn't receive code? Resend"}
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        id="email"
                        placeholder="Enter your email"
                        type="email"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-darkGreen hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-1">
                      <Input
                        id="password"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        className="pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    type="submit"
                    className="w-full bg-darkGreen hover:bg-darkGreen/90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>

                  <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-200"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">or</span>
                    <div className="flex-grow border-t border-gray-200"></div>
                  </div>

                  <GoogleButton className="w-full" />
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/signup" className="text-darkGreen hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  )
}
