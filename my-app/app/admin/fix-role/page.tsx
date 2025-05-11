"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCcw, Shield, CheckCircle, XCircle, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

export default function FixRolePage() {
  const { data: session, status, update } = useSession();
  const [roleData, setRoleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/check-role?t=${Date.now()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const data = await res.json();
      setRoleData(data);

      if (data.success && data.user?.fixed) {
        toast({
          title: "Role Fixed",
          description:
            "Your role has been updated in the database. Please sign out and sign back in.",
        });
      }

      // If user email is the super admin email but doesn't have correct role
      if (data.success && 
          data.user?.email === "anuragsingh@baithakaghar.com" && 
          (data.user?.dbRole !== "super_admin" || data.user?.sessionRole !== "super_admin")) {
        
        // Automatically run setup super admin
        try {
          const setupRes = await fetch(`/api/admin/setup-super-admin?t=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'include'
          });
          const setupData = await setupRes.json();
          
          if (setupData.success) {
            toast({
              title: "Super Admin Role Applied",
              description: "Your account has been set as Super Admin. Please sign out and sign back in.",
            });
          }
        } catch (setupError) {
          console.error("Error setting up super admin:", setupError);
        }
      }
    } catch (error) {
      console.error("Error checking role:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run on initial load
  useEffect(() => {
    if (status === "authenticated") {
      checkRole();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/admin/login" });
  };

  const updateSession = async () => {
    setLoading(true);
    try {
      await update();
      toast({
        title: "Session Updated",
        description:
          "Your session has been refreshed. Please check if your role is correct now.",
      });
      await checkRole();
    } catch (error) {
      console.error("Error updating session:", error);
      toast({
        title: "Error",
        description:
          "Failed to update session. Please try signing out and in again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">
            Admin Role Troubleshooter
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen mx-auto"></div>
              <p className="mt-4 text-gray-500">Checking role information...</p>
            </div>
          ) : status === "unauthenticated" ? (
            <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-md">
              <XCircle className="h-12 w-12 text-amber-500 mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-2">Not Signed In</h3>
              <p className="text-sm text-gray-600 mb-4">
                You need to be signed in to check your role information.
              </p>
              <Link href="/admin/login">
                <Button className="bg-darkGreen hover:bg-darkGreen/90">
                  Go to Admin Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="border rounded-md p-4">
                <h3 className="font-semibold text-lg mb-2">
                  Current Session Info
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <span className="font-medium">Name:</span>
                  <span>{session?.user?.name}</span>
                  <span className="font-medium">Email:</span>
                  <span>{session?.user?.email}</span>
                  <span className="font-medium">Role:</span>
                  <span
                    className={
                      session?.user?.role === "super_admin"
                        ? "text-emerald-600 font-semibold"
                        : session?.user?.role === "admin"
                        ? "text-blue-600 font-semibold"
                        : "text-gray-600"
                    }
                  >
                    {session?.user?.role || "none"}
                  </span>
                </div>
              </div>

              {roleData && (
                <div
                  className={`border rounded-md p-4 ${
                    roleData.user?.dbRole !== roleData.user?.sessionRole
                      ? "bg-red-50 border-red-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {roleData.user?.dbRole === roleData.user?.sessionRole ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <h3 className="font-semibold">Role Consistency Check</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                    <span className="font-medium">Database Role:</span>
                    <span
                      className={
                        roleData.user?.dbRole === "super_admin"
                          ? "text-emerald-600 font-semibold"
                          : roleData.user?.dbRole === "admin"
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600"
                      }
                    >
                      {roleData.user?.dbRole}
                    </span>
                    <span className="font-medium">Session Role:</span>
                    <span
                      className={
                        roleData.user?.sessionRole === "super_admin"
                          ? "text-emerald-600 font-semibold"
                          : roleData.user?.sessionRole === "admin"
                          ? "text-blue-600 font-semibold"
                          : "text-gray-600"
                      }
                    >
                      {roleData.user?.sessionRole}
                    </span>
                    <span className="font-medium">isAdmin Flag:</span>
                    <span>{roleData.user?.isAdmin ? "true" : "false"}</span>
                    {roleData.user?.fixed && (
                      <>
                        <span className="font-medium">Fixed:</span>
                        <span className="text-emerald-600">
                          Yes - Role updated in database
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-4">
                    {roleData.message}
                  </p>
                </div>
              )}

              <div className="grid gap-3 mt-6">
                <Button
                  onClick={checkRole}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh Role Info
                </Button>

                <Button onClick={updateSession} className="w-full">
                  Update Session
                </Button>

                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>

                <Link href="/admin/dashboard">
                  <Button variant="link" className="w-full">
                    Try Admin Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
