"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

interface GoogleButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function GoogleButton({ callbackUrl = "/", className = "" }: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl });
    } catch (error) {
      console.error("Google sign in error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleSignIn}
    >
      {isLoading ? (
        <span className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full mr-2"></span>
      ) : (
        <FcGoogle className="h-5 w-5" />
      )}
      Continue with Google
    </Button>
  );
} 