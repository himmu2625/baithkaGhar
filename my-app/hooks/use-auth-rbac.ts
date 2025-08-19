import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RBAC, ROLES, PERMISSIONS, type Role, type Permission } from '@/lib/rbac';

interface UseAuthRBACReturn {
  // Session state
  session: any;
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Role information
  role: Role | null;
  roleDisplayName: string;
  roleDescription: string;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isPropertyOwner: boolean;
  isPropertyManager: boolean;
  isStaff: boolean;
  isUser: boolean;
  isTravelAgent: boolean;

  // Permission checks
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;

  // Route access
  canAccessRoute: (route: string) => boolean;
  getAccessibleRoutes: () => string[];

  // Role management
  canAssignRole: (targetRole: Role) => boolean;
  getAssignableRoles: () => Role[];

  // OS Dashboard specific
  canAccessOS: boolean;
  canAccessOSAnalytics: boolean;
  canAccessOSInventory: boolean;
  canAccessOSFinancial: boolean;
  canAccessOSStaff: boolean;
  canAccessOSReports: boolean;
  canAccessOSSettings: boolean;

  // Admin panel specific
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
  canViewAnalytics: boolean;
  canViewReports: boolean;

  // Utility functions
  requireAuth: () => boolean;
  requireRole: (requiredRole: Role) => boolean;
  requirePermission: (permission: Permission) => boolean;
  redirectIfUnauthorized: (redirectTo?: string) => void;
}

export function useAuthRBAC(): UseAuthRBACReturn {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Determine user role
  const role = session?.user?.role as Role || null;
  const isAuthenticated = !!session?.user;

  // Role checks
  const isSuperAdmin = role === ROLES.SUPER_ADMIN;
  const isAdmin = role === ROLES.ADMIN || isSuperAdmin;
  const isPropertyOwner = role === ROLES.PROPERTY_OWNER;
  const isPropertyManager = role === ROLES.PROPERTY_MANAGER;
  const isStaff = role === ROLES.STAFF;
  const isUser = role === ROLES.USER;
  const isTravelAgent = role === ROLES.TRAVEL_AGENT;

  // Permission check functions
  const hasPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return RBAC.hasPermission(role, permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Route access
  const canAccessRoute = (route: string): boolean => {
    if (!role) return false;
    return RBAC.canAccessRoute(role, route);
  };

  const getAccessibleRoutes = (): string[] => {
    if (!role) return [];
    return RBAC.getAccessibleRoutes(role);
  };

  // Role management
  const canAssignRole = (targetRole: Role): boolean => {
    if (!role) return false;
    const assignableRoles = RBAC.getAssignableRoles(role);
    return assignableRoles.includes(targetRole);
  };

  const getAssignableRoles = (): Role[] => {
    if (!role) return [];
    return RBAC.getAssignableRoles(role);
  };

  // OS Dashboard specific permissions
  const canAccessOS = hasPermission(PERMISSIONS.OS_DASHBOARD_ACCESS);
  const canAccessOSAnalytics = hasPermission(PERMISSIONS.OS_ANALYTICS_ACCESS);
  const canAccessOSInventory = hasPermission(PERMISSIONS.OS_INVENTORY_ACCESS);
  const canAccessOSFinancial = hasPermission(PERMISSIONS.OS_FINANCIAL_ACCESS);
  const canAccessOSStaff = hasPermission(PERMISSIONS.OS_STAFF_ACCESS);
  const canAccessOSReports = hasPermission(PERMISSIONS.OS_REPORTS_ACCESS);
  const canAccessOSSettings = hasPermission(PERMISSIONS.OS_SETTINGS_ACCESS);

  // Admin panel specific permissions
  const canAccessAdmin = hasPermission(PERMISSIONS.ADMIN_PANEL_ACCESS);
  const canManageUsers = hasPermission(PERMISSIONS.ADMIN_USER_MANAGEMENT);
  const canManageSystem = hasPermission(PERMISSIONS.ADMIN_SYSTEM_CONFIG);
  const canViewAnalytics = hasPermission(PERMISSIONS.ADMIN_ANALYTICS);
  const canViewReports = hasPermission(PERMISSIONS.ADMIN_REPORTS);

  // Utility functions
  const requireAuth = (): boolean => {
    if (!isAuthenticated) {
      router.push('/login');
      return false;
    }
    return true;
  };

  const requireRole = (requiredRole: Role): boolean => {
    if (!requireAuth()) return false;
    
    if (role !== requiredRole && !isSuperAdmin) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  const requirePermission = (permission: Permission): boolean => {
    if (!requireAuth()) return false;
    
    if (!hasPermission(permission)) {
      router.push('/unauthorized');
      return false;
    }
    return true;
  };

  const redirectIfUnauthorized = (redirectTo: string = '/login'): void => {
    if (!isAuthenticated) {
      router.push(redirectTo);
    }
  };

  // Loading state management
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [status]);

  return {
    // Session state
    session,
    user: session?.user,
    isLoading,
    isAuthenticated,

    // Role information
    role,
    roleDisplayName: role ? RBAC.getRoleDisplayName(role) : '',
    roleDescription: role ? RBAC.getRoleDescription(role) : '',
    isSuperAdmin,
    isAdmin,
    isPropertyOwner,
    isPropertyManager,
    isStaff,
    isUser,
    isTravelAgent,

    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,

    // Route access
    canAccessRoute,
    getAccessibleRoutes,

    // Role management
    canAssignRole,
    getAssignableRoles,

    // OS Dashboard specific
    canAccessOS,
    canAccessOSAnalytics,
    canAccessOSInventory,
    canAccessOSFinancial,
    canAccessOSStaff,
    canAccessOSReports,
    canAccessOSSettings,

    // Admin panel specific
    canAccessAdmin,
    canManageUsers,
    canManageSystem,
    canViewAnalytics,
    canViewReports,

    // Utility functions
    requireAuth,
    requireRole,
    requirePermission,
    redirectIfUnauthorized,
  };
} 