"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

interface ViewTrackerProps {
  propertyId: string;
}

export default function ViewTracker({ propertyId }: ViewTrackerProps) {
  const { data: session } = useSession();

  useEffect(() => {
    // Only track views if we have a property ID
    if (!propertyId) return;

    const trackView = async () => {
      try {
        // Record the view
        await fetch("/api/properties/track-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            propertyId,
            userId: session?.user?.id || null,
          }),
        });
      } catch (error) {
        // Silently fail - view tracking is non-critical
      }
    };

    // Small delay to ensure the page has loaded
    const timeoutId = setTimeout(trackView, 2000);

    return () => clearTimeout(timeoutId);
  }, [propertyId, session?.user?.id]);

  // This component doesn't render anything
  return null;
}
