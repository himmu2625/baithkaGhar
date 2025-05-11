"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession, signOut } from "next-auth/react";
import { Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AdminLoginContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [accessError, setAccessError] = useState<string | null>(null);

  // Check for unauthorized access message
  useEffect(() => {
    const adminLoginInfo = sessionStorage.getItem("adminLoginInfo");
    if (adminLoginInfo === "unauthorized") {
      setAccessError(
        "You don't have admin privileges. Please log in with an admin account."
      );
      sessionStorage.removeItem("adminLoginInfo");
    }
  }, []);

  // Only redirect if authenticated as admin
  useEffect(() => {
    // Prevent too frequent redirects
    const lastNavTime = parseInt(sessionStorage.getItem("lastNavTime") || "0");
    const now = Date.now();
    
    if (
      status === "authenticated" &&
      (session?.user?.role === "admin" || session?.user?.role === "super_admin") &&
      // Only redirect if we haven't redirected in the last 3 seconds
      (!lastNavTime || (now - lastNavTime) > 3000)
    ) {
      console.log(
        `${session.user.role} authenticated, navigating to dashboard`
      );

      // Clear any navigation tracking to ensure fresh navigation
      sessionStorage.removeItem("lastNavPath");
      sessionStorage.setItem("lastNavTime", now.toString());
      sessionStorage.setItem("adminAuthenticated", "true");

      // Force direct navigation to dashboard
      window.location.href = `/admin/dashboard?t=${new Date().getTime()}`;
    }
    
    // Check for role issues when first loaded with a session
    if (status === "authenticated" && session?.user?.email === "anuragsingh@baithakaghar.com") {
      // Auto-verify super admin status
      fetch('/api/admin/check-role?t=' + Date.now(), {
        credentials: 'include',
        cache: 'no-store'
      })
      .then(res => res.json())
      .then(data => {
        // If role needs fixing, redirect to fix-role page
        if (data.success && 
            (data.user?.dbRole !== "super_admin" || 
             data.user?.sessionRole !== "super_admin")) {
          window.location.href = `/admin/fix-role?t=${Date.now()}`;
        }
      })
      .catch(err => console.error("Error checking admin role:", err));
    }
  }, [status, session]);

  // Add this useEffect to detect unauthorized access from response headers
  useEffect(() => {
    // Check if we were redirected from an admin page due to unauthorized access
    const checkHeaders = async () => {
      try {
        // Make a request to check headers (Next.js doesn't expose headers directly in client)
        const res = await fetch("/api/auth/session");
        const unauthorized =
          res.headers.get("x-admin-access") === "unauthorized";

        if (unauthorized) {
          setAccessError(
            "You don't have admin privileges. Please log in with an admin account."
          );
          sessionStorage.removeItem("adminLoginInfo");
        }
      } catch (error) {
        console.error("Error checking headers:", error);
      }
    };

    checkHeaders();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Log authentication attempt
      console.log("Attempting admin login with:", formData.email);

      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        toast({
          title: "Authentication Error",
          description: "Invalid email or password or insufficient permissions.",
          variant: "destructive",
        });
        setIsLoading(false);
      } else if (result?.ok) {
        // Success message
        toast({
          title: "Success",
          description: "Login successful! Checking permissions...",
        });

        // Wait a moment for session to update fully
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Force a session refresh to ensure we have the latest user roles
        const sessionRes = await fetch(
          "/api/auth/session?t=" + new Date().getTime()
        );
        const sessionData = await sessionRes.json();

        console.log("Session data after login:", sessionData);

        // Check if the user has admin privileges
        if (
          sessionData?.user?.role === "admin" ||
          sessionData?.user?.role === "super_admin"
        ) {
          toast({
            title: "Access Granted",
            description: `Welcome, ${sessionData?.user?.role.toUpperCase()} user!`,
          });

          // Clear any navigation tracking to ensure fresh navigation
          sessionStorage.removeItem("lastNavPath");
          sessionStorage.removeItem("lastNavTime");
          sessionStorage.setItem("adminAuthenticated", "true");

          // Force direct navigation to dashboard with timestamp to avoid caching
          window.location.href = `/admin/dashboard?t=${new Date().getTime()}`;
        } else {
          // Not an admin user
          console.error("Access denied - User role:", sessionData?.user?.role);
          toast({
            title: "Access Denied",
            description: "You don't have admin privileges.",
            variant: "destructive",
          });
          setIsLoading(false);

          // Log out the user if they don't have admin permissions
          await signOut({ redirect: false });
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-darkGreen" />
          </div>
          <CardTitle className="text-2xl text-center">Admin Portal</CardTitle>
          <CardDescription className="text-center">
            Access the company administration dashboard
          </CardDescription>
        </CardHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <CardContent>
              {accessError && (
                <div className="bg-red-50 p-3 rounded-md mb-4 text-sm text-red-600 border border-red-200">
                  <strong>Access denied:</strong> {accessError}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/admin/forgot-password"
                      className="text-xs text-darkGreen hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-darkGreen hover:bg-darkGreen/90"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Lock className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Admin Panel"
                  )}
                </Button>
              </form>
            </CardContent>
          </TabsContent>

          <TabsContent value="register">
            <CardContent className="space-y-4">
              <p className="text-sm text-center text-muted-foreground">
                New admin accounts require approval from a Super Admin. Register
                below to request access.
              </p>
              <Button
                className="w-full bg-darkGreen hover:bg-darkGreen/90"
                onClick={() => router.push("/admin/register")}
              >
                Continue to Registration
              </Button>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex justify-center">
          <Link
            href="/"
            className="text-sm text-darkGreen hover:underline flex items-center"
          >
            Return to homepage
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

// Remove the nested SessionProvider since it's already provided by the layout
export default AdminLoginContent;
