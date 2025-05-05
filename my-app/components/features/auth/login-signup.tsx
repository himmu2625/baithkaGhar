"use client"

import type React from "react"

import { useState } from "react"
import { X, Phone, Mail, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "@/hooks/use-toast"

interface LoginSignupProps {
  onClose: () => void
  onLogin: (name: string) => void
}

export default function LoginSignup({ onClose, onLogin }: LoginSignupProps) {
  const router = useRouter()
  const [activeView, setActiveView] = useState<'phone' | 'email'>('email')
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number")
      return
    }

    setError("")
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setOtpSent(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP")
      return
    }

    setError("")
    setIsLoading(true)

    try {
      // In a real app, this would verify the OTP and sign in the user
      // For now, we'll simulate a successful login
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Close the modal and notify parent
      onLogin("User")
      onClose()
    } catch (error) {
      setError("Failed to verify OTP. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
      } else {
        // Close the modal
        onLogin(email.split('@')[0])
        onClose()
        
        // Force a hard navigation to reload the page entirely with the new session
        window.location.href = window.location.pathname
      }
    } catch (error: any) {
      setError("Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true)
      // Use NextAuth's signIn function for Google with a hard redirect
      await signIn("google", { callbackUrl: window.location.pathname })
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.")
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

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-lightYellow w-full max-w-md rounded-lg shadow-2xl overflow-hidden"
      >
        <div className="relative p-4 sm:p-6">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 sm:right-4 sm:top-4 text-darkGreen hover:text-mediumGreen hover:bg-transparent"
            onClick={onClose}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="text-center mb-4 sm:mb-6">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold text-darkGreen">Welcome to Baithaka Ghar</h2>
              <p className="text-sm text-mediumGreen">Your home away from home</p>
            </motion.div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 text-sm rounded mb-4"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-4 sm:space-y-6">
            <div className="flex space-x-2 bg-lightGreen/20 p-1 rounded-lg">
              <Button
                variant={activeView === "email" ? "default" : "ghost"}
                className={`w-full ${activeView === "email" ? "bg-mediumGreen text-lightYellow" : "text-darkGreen"}`}
                onClick={() => setActiveView("email")}
              >
                Email
              </Button>
              <Button
                variant={activeView === "phone" ? "default" : "ghost"}
                className={`w-full ${activeView === "phone" ? "bg-mediumGreen text-lightYellow" : "text-darkGreen"}`}
                onClick={() => setActiveView("phone")}
              >
                Phone
              </Button>
            </div>

            {activeView === "email" ? (
              <form onSubmit={handleEmailLogin} className="space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-darkGreen text-sm">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 border-lightGreen focus:border-lightGreen text-sm"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-darkGreen text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pr-10 border-lightGreen focus:border-lightGreen text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mediumGreen"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            ) : !otpSent ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-darkGreen text-sm">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-mediumGreen h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="Enter your phone number"
                        className="pl-10 border-lightGreen focus:border-lightGreen text-sm"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium text-sm"
                    onClick={handleSendOtp}
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-darkGreen text-sm">
                      Enter OTP
                    </Label>
                    <p className="text-xs text-mediumGreen">
                      A 6-digit code has been sent to {phoneNumber}
                    </p>
                    <div className="flex justify-between gap-1 sm:gap-2">
                      {otp.map((value, index) => (
                        <Input
                          key={index}
                          className="w-1/6 text-center border-lightGreen focus:border-mediumGreen"
                          type="text"
                          maxLength={1}
                          value={value}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !value && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus();
                            }
                          }}
                          id={`otp-${index}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium text-sm"
                      onClick={handleVerifyOtp}
                      disabled={isLoading || otp.join("").length !== 6}
                    >
                      {isLoading ? "Verifying..." : "Verify & Sign In"}
                    </Button>
                    <Button
                      variant="link"
                      className="w-full p-0 text-xs text-mediumGreen"
                      onClick={() => setOtpSent(false)}
                    >
                      Change Phone Number
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="relative flex items-center justify-center my-2 sm:my-3">
              <div className="absolute border-t border-mediumGreen w-full"></div>
              <span className="relative bg-lightYellow px-2 text-xs sm:text-sm text-mediumGreen">OR</span>
            </div>

            <Button
              variant="outline"
              className="w-full border-mediumGreen text-darkGreen hover:bg-mediumGreen/10 font-medium text-sm"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
