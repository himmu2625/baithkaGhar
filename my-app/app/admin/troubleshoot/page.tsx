"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, ArrowRight, RefreshCcw, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminTroubleshootPage() {
  const [redirectCount, setRedirectCount] = useState(0);
  const [sessionData, setSessionData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for any redirects to happen before showing content
    const timer = setTimeout(() => {
      setLoading(false);

      // Collect session storage data related to navigation
      try {
        const navItems: Record<string, string> = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          if (key) {
            navItems[key] = window.sessionStorage.getItem(key) || "";
          }
        }
        setSessionData(navItems);
      } catch (e) {
        console.error("Failed to access sessionStorage:", e);
      }

      // Check cookie for redirect count
      const redirectCountMatch = document.cookie.match(/redirect_count=(\d+)/);
      if (redirectCountMatch) {
        setRedirectCount(parseInt(redirectCountMatch[1]));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const clearNavigationTracking = () => {
    window.sessionStorage.removeItem("lastNavPath");
    window.sessionStorage.removeItem("lastNavTime");
    window.sessionStorage.removeItem("adminLoginInfo");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">
            Admin Access Troubleshooter
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex gap-2 items-center mb-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-medium text-amber-800">
                Troubleshooting Information
              </h3>
            </div>
            <p className="text-sm text-amber-700 mb-2">
              Redirect count: {redirectCount}
            </p>
            <div className="text-xs text-amber-600 overflow-auto max-h-24 p-2 bg-amber-100 rounded">
              <pre>{JSON.stringify(sessionData, null, 2)}</pre>
            </div>
          </div>

          <div className="grid gap-4">
            <Button
              onClick={clearNavigationTracking}
              variant="outline"
              className="flex items-center justify-between"
            >
              <span>Clear Navigation Tracking</span>
              <RefreshCcw className="h-4 w-4 ml-2" />
            </Button>

            <Link href="/admin/setup" passHref>
              <Button className="w-full flex items-center justify-between">
                <span>Standard Setup Page</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/admin-setup-direct.html" passHref>
              <Button
                variant="secondary"
                className="w-full flex items-center justify-between"
              >
                <span>Direct Access Setup Page</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/admin/login" passHref>
              <Button
                variant="outline"
                className="w-full flex items-center justify-between"
              >
                <span>Admin Login</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>

            <Link href="/" passHref>
              <Button variant="link" className="w-full">
                Return to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
