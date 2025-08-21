"use client"

import { useState, useEffect } from "react"
import { useOSAuth } from "@/hooks/use-os-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Building2, Shield, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function OSLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useOSAuth()

  // Check for remembered credentials on component mount
  useEffect(() => {
    const checkRememberedLogin = () => {
      const isRemembered = localStorage.getItem('osRememberMe')
      const expiryDate = localStorage.getItem('osRememberExpiry')
      const savedUsername = localStorage.getItem('osRememberUsername')
      const savedPassword = localStorage.getItem('osRememberPassword')

      if (isRemembered === 'true' && expiryDate && savedUsername) {
        const expiry = new Date(expiryDate)
        const now = new Date()

        // Check if the remember me period hasn't expired
        if (now < expiry) {
          setUsername(savedUsername)
          if (savedPassword) {
            setPassword(savedPassword)
          }
          setRememberMe(true)
        } else {
          // Clear expired remember me data
          localStorage.removeItem('osRememberMe')
          localStorage.removeItem('osRememberExpiry')
          localStorage.removeItem('osRememberUsername')
          localStorage.removeItem('osRememberPassword')
        }
      }
    }

    checkRememberedLogin()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const success = await login(username, password)
      if (!success) {
        setError("Invalid username or password. Please check your credentials and try again.")
      } else {
        // Handle remember me functionality
        if (rememberMe) {
          // Store remember me preference for 30 days
          const expiryDate = new Date()
          expiryDate.setDate(expiryDate.getDate() + 30)
          
          localStorage.setItem('osRememberMe', 'true')
          localStorage.setItem('osRememberExpiry', expiryDate.toISOString())
          localStorage.setItem('osRememberUsername', username)
          localStorage.setItem('osRememberPassword', password) // Note: In production, use encrypted storage
        } else {
          // Clear remember me data if unchecked
          localStorage.removeItem('osRememberMe')
          localStorage.removeItem('osRememberExpiry')
          localStorage.removeItem('osRememberUsername')
          localStorage.removeItem('osRememberPassword')
        }
      }
    } catch (err) {
      setError("Unable to connect to the system. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white w-full">
          <div className="max-w-lg text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-white/10 backdrop-blur-sm rounded-3xl mb-8 shadow-2xl p-4">
              <Image
                src="/Logo.png"
                alt="Baithaka GHAR Logo"
                width={128}
                height={128}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            
            <h1 className="text-5xl font-bold mb-6 leading-tight">
              Baithaka GHAR
              <span className="block text-3xl font-normal text-blue-100 mt-2">
                Operating System
              </span>
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Complete property management solution for modern hospitality businesses
            </p>
            
            <div className="grid grid-cols-1 gap-4 text-left">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Real-time booking management</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                <span className="text-blue-100">Multi-property support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 p-3">
              <Image
                src="/Logo.png"
                alt="Baithaka GHAR Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain filter brightness-0 invert"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Baithaka GHAR OS</h1>
            <p className="text-gray-600">Property Management System</p>
          </div>

          {/* Login Card */}
          <Card className="bg-white shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome Back
                </h2>
                <p className="text-gray-600">
                  Sign in to your property management dashboard
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-12 px-4 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 px-4 pr-12 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={setRememberMe}
                      className="rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <Label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me for 30 days
                    </Label>
                  </div>
                  
                  <Button 
                    variant="link" 
                    className="text-sm text-blue-600 hover:text-blue-800 p-0 h-auto font-medium"
                  >
                    Forgot password?
                  </Button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In to Dashboard"
                  )}
                </Button>
              </form>

              {/* Security Notice */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Secure Access
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Your login is protected by enterprise-grade security. All access attempts are monitored and logged.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              © 2024 Baithaka GHAR. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
