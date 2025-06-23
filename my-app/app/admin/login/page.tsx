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

  // Simplified authentication check
  useEffect(() => {
    console.log('AdminLogin: Status:', status, 'Session:', session?.user?.email, 'Role:', session?.user?.role);
    
    if (status === "authenticated" && session?.user) {
      const userRole = session.user.role;
      const userEmail = session.user.email;
      const isAdmin = userRole === "admin" || userRole === "super_admin" || userEmail === "anuragsingh@baithakaghar.com";
        
      if (isAdmin) {
        console.log(`Admin authenticated (${userRole}), redirecting to: ${callbackUrl}`);
        // Add a small delay to ensure session is fully loaded
        setTimeout(() => {
          router.push(callbackUrl);
        }, 100);
        return;
      } else {
        console.log(`Non-admin user logged in: ${userRole}`);
        setAccessError('You do not have admin privileges. Please contact an administrator.');
      }
    }
    
    // Handle URL error parameters
    if (errorParam) {
      console.log('AdminLogin: Error parameter:', errorParam);
      switch (errorParam) {
        case 'CredentialsSignin':
          setAccessError('Invalid email or password');
          break;
        case 'AccessDenied':
        case 'NotAdmin':
        case 'AdminAccessRequired':
          setAccessError('You do not have admin privileges');
          break;
        case 'SessionRequired':
          setAccessError('You must be logged in as an admin');
          break;
        default:
          setAccessError(`Authentication error: ${errorParam}`);
      }
    }
  }, [status, session, errorParam, callbackUrl, router]);
  
  // Load debug info when requested
  useEffect(() => {
    if (!showDebug) return;
    
    const loadDebugInfo = async () => {
      try {
        const response = await fetch('/api/admin/debug-auth');
        if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        } else {
          setDebugInfo({ error: 'Failed to load debug info', status: response.status });
        }
      } catch (error) {
        console.error('Error loading debug info:', error);
        setDebugInfo({ error: 'Network error loading debug info' });
      }
    };
    
      loadDebugInfo();
  }, [showDebug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAccessError('');

    console.log('AdminLogin: Starting sign in process...');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });
      
      console.log('AdminLogin: Sign in result:', result);
      
      if (result?.ok && !result.error) {
        console.log('AdminLogin: Sign in successful, waiting for session update...');
        // Give NextAuth time to update the session
        setTimeout(() => {
          window.location.href = callbackUrl;
        }, 500);
      } else {
        console.error('AdminLogin: Sign in failed:', result?.error);
        setAccessError(result?.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('AdminLogin: Exception during sign in:', error);
      setAccessError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverSession = async () => {
    if (!formData.email) {
      setAccessError('Please enter your email first');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/recover-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, forceRefresh: true })
      });
      const data = await response.json();
      if (data.success) {
        setAccessError('Session recovery initiated. Please try logging in again.');
      } else {
        setAccessError(data.message || 'Recovery failed');
      }
    } catch (error) {
      setAccessError('Failed to contact recovery service');
    }
  };

  const handleForceRoleCheck = async () => {
    try {
      const response = await fetch('/api/admin/check-role');
      const data = await response.json();
      
      if (data.success && data.user?.fixed) {
        setAccessError('Role has been fixed. Please try logging in again.');
      } else {
        setAccessError(data.message || 'Role check completed');
      }
    } catch (error) {
      setAccessError('Failed to check role');
    }
  };

  // Show loading only while session is actually loading
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
                <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
                  <p className="text-red-600 font-medium">Access denied: {accessError}</p>
                  <div className="mt-3 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/admin/debug-auth')
                          const data = await response.json()
                          console.log('Debug Auth Response:', data)
                          alert(JSON.stringify(data, null, 2))
                        } catch (err) {
                          console.error('Debug auth failed:', err)
                          alert('Debug failed - check console')
                        }
                      }}
                    >
                      Debug Auth
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                          try {
                          const response = await fetch('/api/admin/debug-env')
                          const data = await response.json()
                          console.log('Environment Debug Response:', data)
                          alert(JSON.stringify(data, null, 2))
                        } catch (err) {
                          console.error('Environment debug failed:', err)
                          alert('Environment debug failed - check console')
                          }
                      }}
                    >
                      Debug Environment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/api/admin/recover-session'
                      }}
                    >
                      Recover Session
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/admin/fix-role'
                      }}
                    >
                      Fix Role
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      {showDebug ? 'Hide' : 'Show'} Debug
                    </Button>
                  </div>
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
              <div className="space-y-3">
              <Button
                  onClick={() => router.push('/admin/register')}
                className="w-full bg-darkGreen hover:bg-darkGreen/90"
              >
                  Request Admin Access
              </Button>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-xs text-center text-muted-foreground">
            <Link href="/" className="hover:underline">
              ← Back to main site
          </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default AdminLoginContent;
