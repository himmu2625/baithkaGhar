"use client";

import { useEffect } from "react";

/**
 * This component handles the body class changes after hydration
 * to prevent hydration mismatches between server and client.
 */
export default function BodyClassHandler() {
  useEffect(() => {
    // Apply loaded class after initial hydration
    document.body.classList.add("loaded");
  }, []);

  // This component doesn't render anything
  return null;
}
