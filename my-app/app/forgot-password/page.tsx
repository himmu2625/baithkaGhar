"use client";

export const dynamic = "force-dynamic";

import React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Handle cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown(cooldown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.cooldownSeconds) {
          setCooldown(data.cooldownSeconds);
          throw new Error(
            `Please wait ${data.cooldownSeconds} seconds before requesting another code`
          );
        }
        throw new Error(data.message || "Failed to send reset code");
      }

      setSuccess(true);
      setShowResetForm(true);
      toast({
        title: "Code sent",
        description: "A password reset code has been sent to your email",
      });
    } catch (error: any) {
      setError(error.message || "Failed to send reset code. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to send reset code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Your password has been reset successfully",
      });

      // Redirect to login page after successful password reset
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Failed to reset password. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
            <CardTitle className="text-2xl font-bold text-darkGreen">
              Forgot Password
            </CardTitle>
            <CardDescription>
              {showResetForm
                ? "Enter the code sent to your email and create a new password"
                : "Enter your email to reset your password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {error}
              </div>
            )}

            {!showResetForm ? (
              <form onSubmit={handleSendCode} className="space-y-4">
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
                  disabled={isLoading || cooldown > 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Sending...
                    </>
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    "Send Reset Code"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-darkGreen">
                    Reset Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter the 6-digit code"
                    className="border-lightGreen focus:border-lightGreen"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-darkGreen">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="border-lightGreen focus:border-lightGreen pr-10"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
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

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-darkGreen">
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="border-lightGreen focus:border-lightGreen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowResetForm(false);
                      setOtp("");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-mediumGreen hover:bg-darkGreen text-lightYellow"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </div>

                <div className="text-center mt-4">
                  <Button
                    type="button"
                    variant="link"
                    className="text-mediumGreen hover:text-darkGreen p-0 h-auto"
                    onClick={handleSendCode}
                    disabled={isLoading || cooldown > 0}
                  >
                    {cooldown > 0
                      ? `Resend code in ${cooldown}s`
                      : "Didn't receive the code? Resend"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex justify-center">
            <p className="text-sm text-mediumGreen">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-darkGreen hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}
