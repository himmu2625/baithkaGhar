"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This page serves as a redirect from /admin to /admin/dashboard
export default function AdminIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard immediately
    router.push("/admin/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to admin dashboard...</p>
      </div>
    </div>
  );
} 