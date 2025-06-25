"use client";

import type React from "react";

import { useState } from "react";
import { X, Phone, Mail, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "@/hooks/use-toast";
import { Link } from "@/components/ui/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LoginSignupProps {
  onClose: () => void;
  onLogin: (name: string) => void;
}

// OTP constants
const OTP_PURPOSE = {
  LOGIN: "login",
  REGISTRATION: "registration",
} as const;

const OTP_METHOD = {
  EMAIL: "email",
  SMS: "sms",
} as const;

export default function LoginSignup({ onClose, onLogin }: LoginSignupProps) {
  const router = useRouter();
  // Enable SMS login with verified Twilio caller ID
  const smsEnabled = true;
  const [activeView, setActiveView] = useState<"phone" | "email">(smsEnabled ? "email" : "email");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setError("");
    setIsLoading(true);

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtp(["", "", "", "", "", ""]);
    } catch (error: any) {
      setError(error.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setIsLoading(true);

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
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to verify OTP");
      }

      // Close the modal and notify parent
      onLogin("User");
      onClose();

      // Force a hard navigation to reload the page entirely with the new session
      window.location.href = window.location.pathname;
    } catch (error: any) {
      setError(error.message || "Failed to verify OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Use NextAuth login
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        // Close the modal
        onLogin(email.split("@")[0]);
        onClose();

        // Force a hard navigation to reload the page entirely with the new session
        window.location.href = window.location.pathname;
      }
    } catch (error: any) {
      setError("Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      // Use NextAuth's signIn function for Google with a hard redirect
      await signIn("google", { callbackUrl: window.location.pathname });
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.");
      setIsLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(0, 1);
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(
        `otp-${index + 1}`
      ) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-lightYellow border-lightGreen relative max-h-[90vh] overflow-y-auto">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 text-darkGreen hover:text-mediumGreen"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <CardHeader className="text-center">
          <CardTitle className="text-xl sm:text-2xl font-bold text-darkGreen">
            Welcome Back
          </CardTitle>
          <p className="text-xs sm:text-sm text-mediumGreen">
            Sign in to your account
          </p>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4">
          {error && (
            <div className="text-red-600 text-xs sm:text-sm bg-red-50 p-2 sm:p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {smsEnabled ? (
            <div className="flex bg-lightGreen rounded-lg p-1">
              <Button
                variant={activeView === "email" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 text-xs sm:text-sm ${
                  activeView === "email"
                    ? "bg-mediumGreen text-lightYellow"
                    : "text-darkGreen hover:text-mediumGreen"
                }`}
                onClick={() => {
                  setActiveView("email");
                  setOtpSent(false);
                  setError("");
                }}
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Email
              </Button>
              <Button
                variant={activeView === "phone" ? "default" : "ghost"}
                size="sm"
                className={`flex-1 text-xs sm:text-sm ${
                  activeView === "phone"
                    ? "bg-mediumGreen text-lightYellow"
                    : "text-darkGreen hover:text-mediumGreen"
                }`}
                onClick={() => {
                  setActiveView("phone");
                  setOtpSent(false);
                  setError("");
                }}
              >
                <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Phone
              </Button>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-mediumGreen">Email Login Only</p>
              <p className="text-xs text-gray-500">(SMS temporarily disabled)</p>
            </div>
          )}

          {activeView === "email" ? (
            <motion.form
              onSubmit={handleEmailLogin}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="space-y-3 sm:space-y-4">
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
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 text-mediumGreen hover:text-darkGreen"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-mediumGreen hover:bg-mediumGreen/80 text-lightYellow font-medium text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </motion.form>
          ) : (
            !otpSent ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
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
            ) :
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
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
                          onChange={(e) =>
                            handleOtpChange(index, e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Backspace" && !value && index > 0) {
                              document
                                .getElementById(`otp-${index - 1}`)
                                ?.focus();
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
              <span className="relative bg-lightYellow px-2 text-xs sm:text-sm text-mediumGreen">
                OR
              </span>
            </div>

            <Button
              variant="outline"
              className="w-full border-lightGreen text-darkGreen hover:bg-lightGreen text-sm"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              Continue with Google
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
