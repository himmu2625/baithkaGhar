"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GoogleButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function GoogleButton({
  callbackUrl = "/",
  className = "",
}: GoogleButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);

      // Add explicit redirection and more specific options
      const result = await signIn("google", {
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        console.error("Google sign in error:", result.error);
        toast({
          title: "Sign in failed",
          description: "Could not sign in with Google. Please try again.",
          variant: "destructive",
        });
      } else if (result?.url) {
        // Force a hard navigation to reload with the new session
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
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
