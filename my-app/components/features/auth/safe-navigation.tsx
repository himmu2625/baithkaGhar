"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

export function SafeNavigation() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have a stored navigation request after auth
    const navigateToListProperty = sessionStorage.getItem(
      "navigateToListProperty"
    );

    // Only proceed if authenticated and we have a navigation request
    if (status === "authenticated" && navigateToListProperty === "true") {
      // Clear the navigation flag first
      sessionStorage.removeItem("navigateToListProperty");

      // Check if the user is authenticated
      if (session?.user) {
        console.log(
          "SafeNavigation: Authenticated user attempting to go to list-property"
        );

        // Use direct navigation to bypass any middleware issues
        toast({
          title: "Redirecting...",
          description: "Taking you to property listing page",
        });

        // Use timeout to ensure the session is fully established
        setTimeout(() => {
          window.location.href = "/list-property";
        }, 500);
      }
    }
  }, [session, status, router, toast]);

  // This component doesn't render anything visible
  return null;
}
