/**
 * Permission configuration for the admin system
 * Defines all possible permissions and role-based access control
 */

// All possible permissions in the system
export const PERMISSIONS = {
  // User management
  VIEW_USERS: 'view:users',
  CREATE_USER: 'create:user',
  EDIT_USER: 'edit:user',
  DELETE_USER: 'delete:user',

  // Admin management
  VIEW_ADMINS: 'view:admins',
  CREATE_ADMIN: 'create:admin',
  EDIT_ADMIN: 'edit:admin',
  DELETE_ADMIN: 'delete:admin',
  APPROVE_ADMIN: 'approve:admin',

  // Content management
  VIEW_CONTENT: 'view:content',
  CREATE_CONTENT: 'create:content',
  EDIT_CONTENT: 'edit:content',
  DELETE_CONTENT: 'delete:content',
  PUBLISH_CONTENT: 'publish:content',

  // Site settings
  VIEW_SETTINGS: 'view:settings',
  EDIT_SETTINGS: 'edit:settings',
  
  // Property listings
  VIEW_PROPERTIES: 'view:properties',
  CREATE_PROPERTY: 'create:property',
  EDIT_PROPERTY: 'edit:property',
  DELETE_PROPERTY: 'delete:property',
  PUBLISH_PROPERTY: 'publish:property',

  // Bookings
  VIEW_BOOKINGS: 'view:bookings',
  CREATE_BOOKING: 'create:booking',
  EDIT_BOOKING: 'edit:booking',
  DELETE_BOOKING: 'delete:booking',
  CONFIRM_BOOKING: 'confirm:booking',

  // Analytics
  VIEW_ANALYTICS: 'view:analytics',
  EXPORT_ANALYTICS: 'export:analytics',

  // System
  MANAGE_SYSTEM: 'manage:system',

  // Influencer management
  VIEW_INFLUENCERS: 'view:influencers',
  CREATE_INFLUENCER: 'create:influencer',
  EDIT_INFLUENCER: 'edit:influencer',
  DELETE_INFLUENCER: 'delete:influencer',
  APPROVE_INFLUENCER: 'approve:influencer',
  SUSPEND_INFLUENCER: 'suspend:influencer',
  
  // Payout management
  VIEW_PAYOUTS: 'view:payouts',
  CREATE_PAYOUT: 'create:payout',
  PROCESS_PAYOUT: 'process:payout',
  APPROVE_PAYOUT: 'approve:payout',
};

// Default permissions for each role
export const ROLE_PERMISSIONS = {
  'super_admin': Object.values(PERMISSIONS), // Super admin has all permissions
  
  'admin': [
    // User management (limited)
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.EDIT_USER,
    
    // Content management
    PERMISSIONS.VIEW_CONTENT,
    PERMISSIONS.CREATE_CONTENT,
    PERMISSIONS.EDIT_CONTENT,
    PERMISSIONS.DELETE_CONTENT,
    PERMISSIONS.PUBLISH_CONTENT,
    
    // Property and booking management
    PERMISSIONS.VIEW_PROPERTIES,
    PERMISSIONS.CREATE_PROPERTY,
    PERMISSIONS.EDIT_PROPERTY,
    PERMISSIONS.DELETE_PROPERTY,
    PERMISSIONS.PUBLISH_PROPERTY,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.CREATE_BOOKING,
    PERMISSIONS.EDIT_BOOKING,
    PERMISSIONS.CONFIRM_BOOKING,
    
    // Analytics
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_ANALYTICS,
    
    // Influencer management
    PERMISSIONS.VIEW_INFLUENCERS,
    PERMISSIONS.CREATE_INFLUENCER,
    PERMISSIONS.EDIT_INFLUENCER,
    PERMISSIONS.APPROVE_INFLUENCER,
    PERMISSIONS.SUSPEND_INFLUENCER,
    
    // Payout management  
    PERMISSIONS.VIEW_PAYOUTS,
    PERMISSIONS.CREATE_PAYOUT,
    PERMISSIONS.PROCESS_PAYOUT,
    PERMISSIONS.APPROVE_PAYOUT,
  ],
  
  'user': [
    // Regular users have no admin permissions
  ],
};

// Helper function to check if a user has a specific permission
export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermission: string
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission);
}

// Helper function to get default permissions for a role
export function getDefaultPermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS] || [];
} 