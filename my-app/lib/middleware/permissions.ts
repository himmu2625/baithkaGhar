import { AuthenticatedRequest } from './auth';
import { NextApiResponse } from 'next';

export function requirePermission(permission: string | string[]) {
  return (req: AuthenticatedRequest, res: NextApiResponse, next: () => void) => {
    return new Promise<void>((resolve, reject) => {
      try {
        if (!req.user) {
          res.status(401).json({
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Authentication required'
            }
          });
          return reject();
        }

        const requiredPermissions = Array.isArray(permission) ? permission : [permission];
        const userPermissions = req.user.permissions || [];

        const hasPermission = requiredPermissions.some(perm => 
          userPermissions.includes(perm) || req.user.role === 'manager'
        );

        if (!hasPermission) {
          res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: `Permission(s) '${requiredPermissions.join(', ')}' required`
            }
          });
          return reject();
        }

        next();
        resolve();
      } catch (error) {
        console.error('Permission middleware error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        });
        reject();
      }
    });
  };
}

// Specific permission functions for different modules
export const requireFBPermissions = (action: string) => {
  const permissions: { [key: string]: string[] } = {
    view_menu: ['view_dashboard', 'manage_inventory'],
    manage_menu: ['manage_inventory', 'manage_settings'],
    view_orders: ['view_dashboard', 'manage_bookings'],
    manage_orders: ['manage_bookings', 'checkin_checkout'],
    view_tables: ['view_dashboard'],
    manage_tables: ['manage_settings'],
    view_reservations: ['view_dashboard', 'manage_bookings'],
    manage_reservations: ['manage_bookings'],
    view_inventory: ['view_inventory', 'view_dashboard'],
    manage_inventory: ['manage_inventory'],
    view_reports: ['view_analytics', 'view_financial'],
    manage_reports: ['view_analytics', 'view_financial']
  };

  return requirePermission(permissions[action] || []);
};

export const requireEventPermissions = (action: string) => {
  const permissions: { [key: string]: string[] } = {
    view_events: ['view_dashboard', 'manage_bookings'],
    manage_events: ['manage_bookings'],
    view_venues: ['view_dashboard'],
    manage_venues: ['manage_settings'],
    view_packages: ['view_dashboard'],
    manage_packages: ['manage_settings'],
    view_services: ['view_dashboard'],
    manage_services: ['manage_settings'],
    view_equipment: ['view_inventory'],
    manage_equipment: ['manage_inventory'],
    view_timeline: ['view_dashboard'],
    manage_timeline: ['manage_bookings'],
    view_staff: ['view_dashboard', 'manage_staff'],
    manage_staff: ['manage_staff'],
    view_billing: ['view_financial'],
    manage_billing: ['view_financial', 'manage_payments']
  };

  return requirePermission(permissions[action] || []);
};