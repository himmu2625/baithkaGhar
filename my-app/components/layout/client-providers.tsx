"use client";

import { ReactNode, useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import { migrateLocalStorageAuth } from "@/lib/auth/migrate-auth";
import { ReportProvider } from "@/hooks/use-report";

interface ClientProvidersProps {
  children: ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  // Run migration on client-side only
  useEffect(() => {
    // Check if we need to migrate localStorage auth data to NextAuth session
    const checkAndMigrateAuth = async () => {
      try {
        if (typeof window !== "undefined") {
          const isLoggedInStorage = localStorage.getItem("isLoggedIn");
          const tokenStorage = localStorage.getItem("token");
          
          // Only attempt migration if we have localStorage auth data
          if (isLoggedInStorage === "true" && tokenStorage) {
            console.log("Starting migration from localStorage auth to NextAuth");
            await migrateLocalStorageAuth();
          }
        }
      } catch (error) {
        console.error("Failed to migrate localStorage auth:", error);
      }
    };

    checkAndMigrateAuth();
  }, []);

  return (
    <SessionProvider>
      <ReportProvider>
        {children}
        <Toaster />
      </ReportProvider>
    </SessionProvider>
  );
} 