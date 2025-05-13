"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import React from "react";
import { Toaster } from "react-hot-toast";

export function ListPropertyClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [showContent, setShowContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Clear any potential navigation flags
    sessionStorage.removeItem("navigateToListProperty");

    // If still loading, wait
    if (status === "loading") return;

    // If not authenticated, redirect directly without middleware
    if (status === "unauthenticated") {
      console.log("Not authenticated, redirecting directly to login");
      // Set flag for direct navigation after login
      sessionStorage.setItem("navigateToListProperty", "true");
      // Use router for more reliable navigation instead of window.location
      window.location.href = `/login?callbackUrl=${encodeURIComponent('/list-property')}`;
      return;
    }

    // If here, user is authenticated, show content
    setShowContent(true);
  }, [status]);

  // If there was an error in the navigation process
  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
        <Button
          onClick={() => (window.location.href = "/")}
          className="bg-mediumGreen text-lightYellow mt-4"
        >
          Go to Home Page
        </Button>
      </div>
    );
  }

  // Loading state
  if (!showContent) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 border-4 border-lightGreen border-t-transparent rounded-full animate-spin"></div>
          <p className="text-mediumGreen mt-4">
            Preparing property listing page...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated and ready
  return (
    <>
      <Toaster position="top-center" />
      {children}
    </>
  );
}
