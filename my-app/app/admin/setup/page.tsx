"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Check, AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useRouter } from "next/navigation";

export default function SetupSuperAdmin() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    user?: any;
  } | null>(null);
  const router = useRouter();

  // Enhanced setup to prevent auto-redirect
  useEffect(() => {
    // Immediately clear any navigation tracking that could trigger redirects
    sessionStorage.removeItem("lastNavPath");
    sessionStorage.removeItem("lastNavTime");

    // Prevent layout-based redirections by setting a flag
    sessionStorage.setItem("adminSetupInProgress", "true");

    // Add no-redirect flag to body for any global handlers
    document.body.setAttribute("data-no-redirect", "true");

    // Clear admin login info that might trigger redirects
    sessionStorage.removeItem("adminLoginInfo");

    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1000); // Slightly longer timeout to ensure page is fully mounted

    return () => {
      clearTimeout(timer);
      document.body.removeAttribute("data-no-redirect");
      sessionStorage.removeItem("adminSetupInProgress");
    };
  }, []);

  const setupSuperAdmin = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/setup-super-admin");
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Error setting up super admin:", error);
      setResult({
        success: false,
        message: "An unexpected error occurred. Check console for details.",
      });
    } finally {
      setLoading(false);
    }
  };

  // If the page is initially loading, show a more robust loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-darkGreen" />
            <p className="mt-4 text-lg text-gray-700">Loading setup page...</p>
            <p className="mt-2 text-sm text-gray-500">
              This page is setting up admin configuration.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">
            Super Admin Setup
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-gray-600">
            This page will set up <strong>anuragsingh@baithakaghar.com</strong>{" "}
            as a super admin with full permissions.
          </p>

          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className="mb-4"
            >
              <div className="flex items-center gap-2">
                {result.success ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              </div>
              <AlertDescription>{result.message}</AlertDescription>

              {result.success && result.user && (
                <div className="mt-4 text-sm border-t pt-2">
                  <p>
                    <strong>Name:</strong> {result.user.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {result.user.email}
                  </p>
                  <p>
                    <strong>Role:</strong> {result.user.role}
                  </p>
                </div>
              )}
            </Alert>
          )}

          <div className="flex justify-center">
            <Button
              onClick={setupSuperAdmin}
              disabled={loading || result?.success}
              size="lg"
              className="px-6"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set as Super Admin"
              )}
            </Button>
          </div>

          {result?.success && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => router.push("/admin/login")}
              >
                Go to Admin Login
              </Button>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <Button variant="link" onClick={() => router.push("/")} size="sm">
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
