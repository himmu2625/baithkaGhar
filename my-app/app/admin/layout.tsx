"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import {
  Users,
  Home,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  DollarSign,
  Star,
  Calendar,
  MessageSquare,
  Flag,
  UserPlus,
  RefreshCw,
  LayoutDashboard,
  Building,
  ClipboardCheck,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { SessionProvider } from "@/components/common/session-provider";
import { toast } from "react-hot-toast";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  badge?: number;
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);

  const navigation: NavItem[] = [
    { name: "Dashboard", href: "/admin/dashboard", icon: BarChart2 },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "User Migration", href: "/admin/users/migration", icon: RefreshCw },
    { name: "Properties", href: "/admin/properties", icon: Home },
    {
      name: "Property Requests",
      href: "/admin/property-requests",
      icon: ClipboardCheck,
      badge: pendingRequests
    },
    { name: "Bookings", href: "/admin/bookings", icon: CalendarDays },
    { name: "Payments", href: "/admin/payments", icon: DollarSign },
    { name: "Reviews", href: "/admin/reviews", icon: Star },
    { name: "Messages", href: "/admin/messages", icon: MessageSquare },
    { name: "Reports", href: "/admin/reports", icon: Flag },
    {
      name: "Access Requests",
      href: "/admin/requests",
      icon: UserPlus,
      adminOnly: true,
    },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  // Check if current path is login page or setup page to prevent redirect loops
  const isLoginPage = pathname === "/admin/login";
  const isSetupPage = pathname === "/admin/setup";

  // Protect admin routes
  useEffect(() => {
    console.log(
      `AdminLayout useEffect: Path: ${pathname}, Status: ${status}, Role: ${session?.user?.role}`
    );

    // Don't redirect if already on login page, setup page, or loading
    if (isLoginPage || isSetupPage || status === "loading") {
      console.log("AdminLayout: Exiting early (login, setup, or loading).");
      return;
    }

    // Function to navigate with loop prevention
    const safeDirect = (path: string) => {
      const lastPath = sessionStorage.getItem("lastNavPath");
      const now = new Date().getTime();
      const lastNavTime = parseInt(
        sessionStorage.getItem("lastNavTime") || "0"
      );
      const timeDiff = now - lastNavTime;

      if (lastPath === path && timeDiff < 1000) {
        console.warn(
          `AdminLayout: Navigation loop detected for ${path}, redirecting to home.`
        );
        window.location.href = "/";
        return;
      }

      sessionStorage.setItem("lastNavPath", path);
      sessionStorage.setItem("lastNavTime", now.toString());
      console.log(`AdminLayout: Safely redirecting to ${path}`);
      window.location.href = path;
    };

    // Prevent excessive redirects by adding debounce
    const lastRedirectTime = sessionStorage.getItem("lastRedirectTime");
    const now = Date.now();
    
    // Only redirect if we haven't redirected in the last 5 seconds
    const shouldRedirect = !lastRedirectTime || (now - parseInt(lastRedirectTime)) > 5000;
    
    // Redirect unauthenticated users to login
    if (status === "unauthenticated" && shouldRedirect) {
      console.log("AdminLayout: Unauthenticated, redirecting to login.");
      sessionStorage.setItem("lastRedirectTime", now.toString());
      safeDirect("/admin/login");
    }
    // Redirect non-admin authenticated users to home
    else if (
      status === "authenticated" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super_admin" &&
      shouldRedirect
    ) {
      console.log(
        "AdminLayout: Authenticated but not admin/super_admin, redirecting to login."
      );
      console.error("Access denied: User is not an admin", session?.user);
      sessionStorage.setItem("adminLoginInfo", "unauthorized");
      sessionStorage.setItem("lastRedirectTime", now.toString());
      safeDirect("/admin/login");
    } else {
      console.log(
        "AdminLayout: User is authenticated and has appropriate role or no redirection needed."
      );
    }
  }, [status, session, pathname, isLoginPage, isSetupPage]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user) {
      fetchPendingRequestsCount();
    }
  }, [session, status]);

  const fetchPendingRequestsCount = async () => {
    try {
      const response = await fetch("/api/admin/property-requests?status=pending&limit=1");
      const data = await response.json();
      if (data.success) {
        setPendingRequests(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching pending requests count:", error);
    }
  };

  // Special case for login page or setup page - don't apply admin layout
  if (isLoginPage || isSetupPage) {
    return children;
  }

  // Show loading state while checking auth
  if (
    status === "loading" ||
    (status === "authenticated" &&
      session?.user?.role !== "admin" &&
      session?.user?.role !== "super_admin")
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-darkGreen"></div>
      </div>
    );
  }

  // If user is not authenticated, don't render admin layout
  if (status === "unauthenticated") {
    return null;
  }

  // Check if user is super admin
  const isSuperAdmin = session?.user?.role === "super_admin";

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push("/login");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-darkGreen text-white transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-lightGreen mr-2" />
              <div>
                <h1 className="text-xl font-bold text-lightGreen">
                  Admin Panel
                </h1>
                {isSuperAdmin && (
                  <span className="text-xs text-emerald-400">Super Admin</span>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                // Skip admin-only items for regular admins
                if (item.adminOnly && !isSuperAdmin) {
                  return null;
                }

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center py-2 px-3 rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="ml-2 text-xs bg-red-500 text-white px-1 rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-white/10">
            <div className="text-sm text-white/70 mb-3">
              <p className="truncate">
                {session?.user?.name || "Administrator"}
              </p>
              <p className="truncate text-xs">{session?.user?.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center py-2 px-3 rounded-md text-white/70 hover:text-white hover:bg-white/10 w-full"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          sidebarOpen ? "lg:ml-64" : "ml-0"
        )}
      >
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

// Wrapper component that provides the session
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SessionProvider>
  );
}
