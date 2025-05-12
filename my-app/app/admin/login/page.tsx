"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const errorParam = searchParams?.get('error');
  const callbackUrl = searchParams?.get('callbackUrl') || '/admin/dashboard';
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [accessError, setAccessError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

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

  // Check if user is already logged in as admin and redirect
  useEffect(() => {
    const checkAdminStatus = async () => {
      // If user is already logged in and is an admin, redirect to dashboard
      if (status === 'authenticated') {
        const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'super_admin';
        
        if (isAdmin) {
          console.log('Already logged in as admin, redirecting to dashboard');
          router.push('/admin/dashboard');
        } else {
          setAccessError('You do not have admin privileges');
          console.log('Logged in but not an admin');
        }
      }
    };
    
    checkAdminStatus();
  }, [session, status, router]);
  
  // Check for errors from URL
  useEffect(() => {
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setAccessError('Invalid credentials');
          break;
        case 'AccessDenied':
        case 'NotAdmin':
          setAccessError('You do not have admin privileges');
          break;
        case 'SessionRequired':
          setAccessError('You must be logged in');
          break;
        default:
          setAccessError(`Authentication error: ${errorParam}`);
      }
    }
  }, [errorParam]);
  
  // Load debug info
  useEffect(() => {
    const loadDebugInfo = async () => {
      try {
        const response = await fetch('/api/admin/debug-auth');
        const data = await response.json();
        setDebugInfo(data);
      } catch (error) {
        console.error('Error loading debug info:', error);
      }
    };
    
    if (showDebug) {
      loadDebugInfo();
    }
  }, [showDebug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAccessError('');

    try {
      // Special handling for the super admin email
      const isSuperAdmin = formData.email === 'anuragsingh@baithakaghar.com';
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });
      
      if (!result?.ok) {
        setAccessError(result?.error || 'Login failed');
      } else {
        // Check if admin role is set before redirecting
        const response = await fetch('/api/admin/debug-auth');
        const data = await response.json();
        
        if (data.adminStatus.isAdmin || isSuperAdmin) {
          // Successfully logged in as admin, redirect
          router.push(callbackUrl);
        } else {
          setAccessError('You do not have admin privileges');
          setDebugInfo(data);
          setShowDebug(true);
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setAccessError('An unexpected error occurred');
    } finally {
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

      {showDebug && debugInfo && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Hide Debug Info
          </button>
          
          <div className="mt-4 bg-gray-100 p-4 rounded-md text-xs overflow-auto max-h-64">
            <h3 className="font-bold mb-2">Debug Information</h3>
            <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Remove the nested SessionProvider since it's already provided by the layout
export default AdminLoginContent;
