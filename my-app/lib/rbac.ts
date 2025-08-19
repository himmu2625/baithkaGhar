import { Session } from 'next-auth';

// Define all possible permissions
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  DASHBOARD_EXPORT: 'dashboard:export',

  // Property management
  PROPERTY_VIEW: 'property:view',
  PROPERTY_CREATE: 'property:create',
  PROPERTY_EDIT: 'property:edit',
  PROPERTY_DELETE: 'property:delete',
  PROPERTY_APPROVE: 'property:approve',
  PROPERTY_REJECT: 'property:reject',

  // Booking management
  BOOKING_VIEW: 'booking:view',
  BOOKING_CREATE: 'booking:create',
  BOOKING_EDIT: 'booking:edit',
  BOOKING_CANCEL: 'booking:cancel',
  BOOKING_APPROVE: 'booking:approve',
  BOOKING_REJECT: 'booking:reject',

  // User management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_EDIT: 'user:edit',
  USER_DELETE: 'user:delete',
  USER_ROLE_MANAGE: 'user:role_manage',

  // Financial management
  FINANCIAL_VIEW: 'financial:view',
  FINANCIAL_CREATE: 'financial:create',
  FINANCIAL_EDIT: 'financial:edit',
  FINANCIAL_DELETE: 'financial:delete',
  FINANCIAL_APPROVE: 'financial:approve',

  // System administration
  SYSTEM_SETTINGS: 'system:settings',
  SYSTEM_BACKUP: 'system:backup',
  SYSTEM_RESTORE: 'system:restore',
  SYSTEM_LOGS: 'system:logs',

  // OS Dashboard specific
  OS_DASHBOARD_ACCESS: 'os:dashboard:access',
  OS_ANALYTICS_ACCESS: 'os:analytics:access',
  OS_INVENTORY_ACCESS: 'os:inventory:access',
  OS_FINANCIAL_ACCESS: 'os:financial:access',
  OS_STAFF_ACCESS: 'os:staff:access',
  OS_REPORTS_ACCESS: 'os:reports:access',
  OS_SETTINGS_ACCESS: 'os:settings:access',

  // Admin panel access
  ADMIN_PANEL_ACCESS: 'admin:panel:access',
  ADMIN_USER_MANAGEMENT: 'admin:user:management',
  ADMIN_SYSTEM_CONFIG: 'admin:system:config',
  ADMIN_ANALYTICS: 'admin:analytics',
  ADMIN_REPORTS: 'admin:reports',

  // API access
  API_READ: 'api:read',
  API_WRITE: 'api:write',
  API_DELETE: 'api:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Define roles and their permissions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  PROPERTY_OWNER: 'property_owner',
  PROPERTY_MANAGER: 'property_manager',
  STAFF: 'staff',
  USER: 'user',
  TRAVEL_AGENT: 'travel_agent',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Role hierarchy (higher roles inherit permissions from lower roles)
export const ROLE_HIERARCHY: Record<Role, Role[]> = {
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.PROPERTY_OWNER, ROLES.PROPERTY_MANAGER, ROLES.STAFF, ROLES.USER],
  [ROLES.ADMIN]: [ROLES.PROPERTY_OWNER, ROLES.PROPERTY_MANAGER, ROLES.STAFF, ROLES.USER],
  [ROLES.PROPERTY_OWNER]: [ROLES.PROPERTY_MANAGER, ROLES.STAFF, ROLES.USER],
  [ROLES.PROPERTY_MANAGER]: [ROLES.STAFF, ROLES.USER],
  [ROLES.STAFF]: [ROLES.USER],
  [ROLES.USER]: [],
  [ROLES.TRAVEL_AGENT]: [ROLES.USER],
};

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: [
    // All permissions
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.ADMIN]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.DASHBOARD_EXPORT,

    // Property management
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_EDIT,
    PERMISSIONS.PROPERTY_DELETE,
    PERMISSIONS.PROPERTY_APPROVE,
    PERMISSIONS.PROPERTY_REJECT,

    // Booking management
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_CANCEL,
    PERMISSIONS.BOOKING_APPROVE,
    PERMISSIONS.BOOKING_REJECT,

    // User management
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_EDIT,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_ROLE_MANAGE,

    // Financial management
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.FINANCIAL_EDIT,
    PERMISSIONS.FINANCIAL_DELETE,
    PERMISSIONS.FINANCIAL_APPROVE,

    // System administration
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.SYSTEM_BACKUP,
    PERMISSIONS.SYSTEM_RESTORE,
    PERMISSIONS.SYSTEM_LOGS,

    // OS Dashboard
    PERMISSIONS.OS_DASHBOARD_ACCESS,
    PERMISSIONS.OS_ANALYTICS_ACCESS,
    PERMISSIONS.OS_INVENTORY_ACCESS,
    PERMISSIONS.OS_FINANCIAL_ACCESS,
    PERMISSIONS.OS_STAFF_ACCESS,
    PERMISSIONS.OS_REPORTS_ACCESS,
    PERMISSIONS.OS_SETTINGS_ACCESS,

    // Admin panel
    PERMISSIONS.ADMIN_PANEL_ACCESS,
    PERMISSIONS.ADMIN_USER_MANAGEMENT,
    PERMISSIONS.ADMIN_SYSTEM_CONFIG,
    PERMISSIONS.ADMIN_ANALYTICS,
    PERMISSIONS.ADMIN_REPORTS,

    // API access
    PERMISSIONS.API_READ,
    PERMISSIONS.API_WRITE,
    PERMISSIONS.API_DELETE,
  ],

  [ROLES.PROPERTY_OWNER]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,

    // Property management (own properties only)
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.PROPERTY_CREATE,
    PERMISSIONS.PROPERTY_EDIT,

    // Booking management (own properties only)
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_CANCEL,

    // Financial management (own properties only)
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.FINANCIAL_EDIT,

    // OS Dashboard
    PERMISSIONS.OS_DASHBOARD_ACCESS,
    PERMISSIONS.OS_ANALYTICS_ACCESS,
    PERMISSIONS.OS_INVENTORY_ACCESS,
    PERMISSIONS.OS_FINANCIAL_ACCESS,
    PERMISSIONS.OS_REPORTS_ACCESS,
    PERMISSIONS.OS_SETTINGS_ACCESS,

    // API access (read only)
    PERMISSIONS.API_READ,
  ],

  [ROLES.PROPERTY_MANAGER]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,

    // Property management (assigned properties only)
    PERMISSIONS.PROPERTY_VIEW,
    PERMISSIONS.PROPERTY_EDIT,

    // Booking management (assigned properties only)
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_CANCEL,

    // Financial management (assigned properties only)
    PERMISSIONS.FINANCIAL_VIEW,
    PERMISSIONS.FINANCIAL_CREATE,
    PERMISSIONS.FINANCIAL_EDIT,

    // OS Dashboard
    PERMISSIONS.OS_DASHBOARD_ACCESS,
    PERMISSIONS.OS_ANALYTICS_ACCESS,
    PERMISSIONS.OS_INVENTORY_ACCESS,
    PERMISSIONS.OS_FINANCIAL_ACCESS,
    PERMISSIONS.OS_REPORTS_ACCESS,

    // API access (read only)
    PERMISSIONS.API_READ,
  ],

  [ROLES.STAFF]: [
    // Dashboard (limited view)
    PERMISSIONS.DASHBOARD_VIEW,

    // Property management (view only)
    PERMISSIONS.PROPERTY_VIEW,

    // Booking management (limited)
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,

    // Financial management (view only)
    PERMISSIONS.FINANCIAL_VIEW,

    // OS Dashboard (limited access)
    PERMISSIONS.OS_DASHBOARD_ACCESS,
    PERMISSIONS.OS_INVENTORY_ACCESS,

    // API access (read only)
    PERMISSIONS.API_READ,
  ],

  [ROLES.USER]: [
    // Basic dashboard view
    PERMISSIONS.DASHBOARD_VIEW,

    // Property view only
    PERMISSIONS.PROPERTY_VIEW,

    // Booking management (own bookings only)
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_CANCEL,

    // API access (read only)
    PERMISSIONS.API_READ,
  ],

  [ROLES.TRAVEL_AGENT]: [
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,

    // Property view
    PERMISSIONS.PROPERTY_VIEW,

    // Booking management (with special privileges)
    PERMISSIONS.BOOKING_VIEW,
    PERMISSIONS.BOOKING_CREATE,
    PERMISSIONS.BOOKING_EDIT,
    PERMISSIONS.BOOKING_CANCEL,

    // Financial view
    PERMISSIONS.FINANCIAL_VIEW,

    // API access
    PERMISSIONS.API_READ,
    PERMISSIONS.API_WRITE,
  ],
};

// Helper functions
export class RBAC {
  /**
   * Get all permissions for a role (including inherited permissions)
   */
  static getRolePermissions(role: Role): Permission[] {
    const directPermissions = ROLE_PERMISSIONS[role] || [];
    const inheritedRoles = ROLE_HIERARCHY[role] || [];
    
    const inheritedPermissions = inheritedRoles.flatMap(inheritedRole => 
      this.getRolePermissions(inheritedRole)
    );

    // Combine and remove duplicates
    const allPermissions = [...new Set([...directPermissions, ...inheritedPermissions])];
    return allPermissions;
  }

  /**
   * Check if a role has a specific permission
   */
  static hasPermission(role: Role, permission: Permission): boolean {
    const rolePermissions = this.getRolePermissions(role);
    return rolePermissions.includes(permission);
  }

  /**
   * Check if a user has a specific permission
   */
  static userHasPermission(user: { role: Role }, permission: Permission): boolean {
    return this.hasPermission(user.role, permission);
  }

  /**
   * Check if a session has a specific permission
   */
  static sessionHasPermission(session: Session | null, permission: Permission): boolean {
    if (!session?.user?.role) return false;
    return this.hasPermission(session.user.role as Role, permission);
  }

  /**
   * Get all roles that have a specific permission
   */
  static getRolesWithPermission(permission: Permission): Role[] {
    return Object.values(ROLES).filter(role => 
      this.hasPermission(role, permission)
    );
  }

  /**
   * Check if a role can access a specific route
   */
  static canAccessRoute(role: Role, route: string): boolean {
    const routePermissions: Record<string, Permission[]> = {
      '/os/dashboard': [PERMISSIONS.OS_DASHBOARD_ACCESS],
      '/os/analytics': [PERMISSIONS.OS_ANALYTICS_ACCESS],
      '/os/inventory': [PERMISSIONS.OS_INVENTORY_ACCESS],
      '/os/financial': [PERMISSIONS.OS_FINANCIAL_ACCESS],
      '/os/staff': [PERMISSIONS.OS_STAFF_ACCESS],
      '/os/reports': [PERMISSIONS.OS_REPORTS_ACCESS],
      '/os/settings': [PERMISSIONS.OS_SETTINGS_ACCESS],
      '/admin': [PERMISSIONS.ADMIN_PANEL_ACCESS],
      '/admin/users': [PERMISSIONS.ADMIN_USER_MANAGEMENT],
      '/admin/settings': [PERMISSIONS.ADMIN_SYSTEM_CONFIG],
      '/admin/analytics': [PERMISSIONS.ADMIN_ANALYTICS],
      '/admin/reports': [PERMISSIONS.ADMIN_REPORTS],
    };

    const requiredPermissions = routePermissions[route] || [];
    return requiredPermissions.every(permission => 
      this.hasPermission(role, permission)
    );
  }

  /**
   * Get all accessible routes for a role
   */
  static getAccessibleRoutes(role: Role): string[] {
    const allRoutes = [
      '/os/dashboard',
      '/os/analytics',
      '/os/inventory',
      '/os/financial',
      '/os/staff',
      '/os/reports',
      '/os/settings',
      '/admin',
      '/admin/users',
      '/admin/settings',
      '/admin/analytics',
      '/admin/reports',
    ];

    return allRoutes.filter(route => this.canAccessRoute(role, route));
  }

  /**
   * Validate if a role is valid
   */
  static isValidRole(role: string): role is Role {
    return Object.values(ROLES).includes(role as Role);
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: Role): string {
    const displayNames: Record<Role, string> = {
      [ROLES.SUPER_ADMIN]: 'Super Administrator',
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.PROPERTY_OWNER]: 'Property Owner',
      [ROLES.PROPERTY_MANAGER]: 'Property Manager',
      [ROLES.STAFF]: 'Staff',
      [ROLES.USER]: 'User',
      [ROLES.TRAVEL_AGENT]: 'Travel Agent',
    };

    return displayNames[role] || role;
  }

  /**
   * Get role description
   */
  static getRoleDescription(role: Role): string {
    const descriptions: Record<Role, string> = {
      [ROLES.SUPER_ADMIN]: 'Full system access with all permissions',
      [ROLES.ADMIN]: 'Administrative access to manage the platform',
      [ROLES.PROPERTY_OWNER]: 'Can manage their own properties and bookings',
      [ROLES.PROPERTY_MANAGER]: 'Can manage assigned properties and bookings',
      [ROLES.STAFF]: 'Limited access to assigned properties and basic operations',
      [ROLES.USER]: 'Basic user access to view and book properties',
      [ROLES.TRAVEL_AGENT]: 'Special access for travel agency operations',
    };

    return descriptions[role] || 'No description available';
  }

  /**
   * Get all available roles
   */
  static getAllRoles(): Role[] {
    return Object.values(ROLES);
  }

  /**
   * Get roles that can be assigned by a specific role
   */
  static getAssignableRoles(assignerRole: Role): Role[] {
    const assignableRoles: Record<Role, Role[]> = {
      [ROLES.SUPER_ADMIN]: Object.values(ROLES),
      [ROLES.ADMIN]: [ROLES.PROPERTY_OWNER, ROLES.PROPERTY_MANAGER, ROLES.STAFF, ROLES.USER, ROLES.TRAVEL_AGENT],
      [ROLES.PROPERTY_OWNER]: [ROLES.PROPERTY_MANAGER, ROLES.STAFF],
      [ROLES.PROPERTY_MANAGER]: [ROLES.STAFF],
      [ROLES.STAFF]: [],
      [ROLES.USER]: [],
      [ROLES.TRAVEL_AGENT]: [],
    };

    return assignableRoles[assignerRole] || [];
  }
} 