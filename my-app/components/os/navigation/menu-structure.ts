export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  href?: string;
  children?: MenuItem[];
  badge?: string;
  badgeColor?: 'default' | 'secondary' | 'destructive' | 'outline';
  isActive?: boolean;
  permissions?: string[];
}

export interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
}

export const menuStructure: MenuSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: 'LayoutDashboard',
        href: '/os/dashboard/[id]',
        isActive: true
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: 'BarChart3',
        href: '/os/analytics'
      },
      {
        id: 'reports',
        label: 'Quick Reports',
        icon: 'FileText',
        href: '/os/quick-reports'
      }
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    items: [
      {
        id: 'rooms',
        label: 'Rooms',
        icon: 'Bed',
        href: '/os/inventory/[id]'
      },
      {
        id: 'room-types',
        label: 'Room Types',
        icon: 'Hotel',
        href: '/os/inventory/room-types'
      },
      {
        id: 'amenities',
        label: 'Amenities',
        icon: 'Wifi',
        href: '/os/inventory/amenities'
      },
      {
        id: 'maintenance',
        label: 'Maintenance',
        icon: 'Wrench',
        href: '/os/maintenance/[id]',
        badge: '3',
        badgeColor: 'destructive'
      },
      {
        id: 'housekeeping',
        label: 'Housekeeping',
        icon: 'Sparkles',
        href: '/os/inventory/housekeeping'
      },
      {
        id: 'facilities',
        label: 'Facilities',
        icon: 'Building',
        href: '/os/inventory/facilities'
      }
    ]
  },
  {
    id: 'booking',
    label: 'Booking Engine',
    items: [
      {
        id: 'reservations',
        label: 'Reservations',
        icon: 'Calendar',
        href: '/os/bookings/[id]'
      },
      {
        id: 'single-room',
        label: 'Single Room Booking',
        icon: 'BedSingle',
        href: '/os/booking/single-room'
      },
      {
        id: 'multiple-room',
        label: 'Multiple Room Booking',
        icon: 'BedDouble',
        href: '/os/booking/multiple-room'
      },
      {
        id: 'travel-agents',
        label: 'Travel Agents',
        icon: 'Users',
        href: '/os/booking/travel-agents'
      },
      {
        id: 'offline-bookings',
        label: 'Offline Bookings',
        icon: 'Phone',
        href: '/os/booking/offline'
      },
      {
        id: 'booking-channels',
        label: 'Booking Channels',
        icon: 'Globe',
        href: '/os/booking/channels'
      }
    ]
  },
  {
    id: 'guest-services',
    label: 'Guest Services',
    items: [
      {
        id: 'check-in',
        label: 'Check-in',
        icon: 'LogIn',
        href: '/os/guest-services/check-in',
        badge: '5',
        badgeColor: 'secondary'
      },
      {
        id: 'check-out',
        label: 'Check-out',
        icon: 'LogOut',
        href: '/os/guest-services/check-out',
        badge: '2',
        badgeColor: 'secondary'
      },
      {
        id: 'guest-profiles',
        label: 'Guest Profiles',
        icon: 'User',
        href: '/os/guest-services/profiles'
      },
      {
        id: 'guest-journey',
        label: 'Guest Journey',
        icon: 'Users',
        href: '/os/guests/[id]'
      },
      {
        id: 'guest-requests',
        label: 'Guest Requests',
        icon: 'MessageSquare',
        href: '/os/guest-services/requests',
        badge: '8',
        badgeColor: 'destructive'
      },
      {
        id: 'concierge',
        label: 'Concierge',
        icon: 'Bell',
        href: '/os/guest-services/concierge'
      },
      {
        id: 'web-checkin',
        label: 'Web Check-in',
        icon: 'Smartphone',
        href: '/os/guest-services/web-checkin'
      }
    ]
  },
  {
    id: 'financial',
    label: 'Financial Management',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        icon: 'CreditCard',
        href: '/os/financial/[id]'
      },
      {
        id: 'invoices',
        label: 'Invoices',
        icon: 'Receipt',
        href: '/os/financial/invoices'
      },
      {
        id: 'refunds',
        label: 'Refunds',
        icon: 'RotateCcw',
        href: '/os/financial/refunds'
      },
      {
        id: 'rates-pricing',
        label: 'Rates & Pricing',
        icon: 'DollarSign',
        href: '/os/financial/rates'
      },
      {
        id: 'dynamic-rates',
        label: 'Dynamic Rates',
        icon: 'TrendingUp',
        href: '/os/financial/dynamic-rates'
      },
      {
        id: 'commission',
        label: 'Commission',
        icon: 'Percent',
        href: '/os/financial/commission'
      },
      {
        id: 'pos',
        label: 'Point of Sale',
        icon: 'ShoppingCart',
        href: '/os/financial/pos'
      },
      {
        id: 'accounts',
        label: 'Accounts',
        icon: 'Calculator',
        href: '/os/financial/accounts'
      }
    ]
  },
  {
    id: 'staff',
    label: 'Staff Management',
    items: [
      {
        id: 'staff-profiles',
        label: 'Staff Profiles',
        icon: 'Users',
        href: '/os/staff/profiles'
      },
      {
        id: 'roles-permissions',
        label: 'Roles & Permissions',
        icon: 'Shield',
        href: '/os/staff/roles'
      },
      {
        id: 'schedules',
        label: 'Schedules',
        icon: 'Calendar',
        href: '/os/staff/schedules'
      },
      {
        id: 'attendance',
        label: 'Attendance',
        icon: 'Clock',
        href: '/os/staff/attendance'
      },
      {
        id: 'payroll',
        label: 'Payroll',
        icon: 'DollarSign',
        href: '/os/staff/payroll'
      },
      {
        id: 'performance',
        label: 'Performance',
        icon: 'Target',
        href: '/os/staff/performance'
      },
      {
        id: 'training',
        label: 'Training',
        icon: 'GraduationCap',
        href: '/os/staff/training'
      },
      {
        id: 'departments',
        label: 'Departments',
        icon: 'Building2',
        href: '/os/staff/departments'
      }
    ]
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    items: [
      {
        id: 'daily-reports',
        label: 'Daily Reports',
        icon: 'Calendar',
        href: '/os/reports/daily'
      },
      {
        id: 'monthly-reports',
        label: 'Monthly Reports',
        icon: 'CalendarDays',
        href: '/os/reports/monthly'
      },
      {
        id: 'occupancy-reports',
        label: 'Occupancy Reports',
        icon: 'BarChart',
        href: '/os/reports/occupancy'
      },
      {
        id: 'revenue-reports',
        label: 'Revenue Reports',
        icon: 'TrendingUp',
        href: '/os/reports/revenue'
      },
      {
        id: 'guest-reports',
        label: 'Guest Reports',
        icon: 'Users',
        href: '/os/reports/guests'
      },
      {
        id: 'staff-reports',
        label: 'Staff Reports',
        icon: 'UserCheck',
        href: '/os/reports/staff'
      },
      {
        id: 'custom-reports',
        label: 'Custom Reports',
        icon: 'FileText',
        href: '/os/reports/custom'
      },
      {
        id: 'export-data',
        label: 'Export Data',
        icon: 'Download',
        href: '/os/reports/export'
      }
    ]
  },
  {
    id: 'fb',
    label: 'Food & Beverage',
    items: [
      {
        id: 'fb-dashboard',
        label: 'F&B Dashboard',
        icon: 'LayoutDashboard',
        href: '/os/fb/dashboard/[id]'
      },
      {
        id: 'fb-menu',
        label: 'Menu Management',
        icon: 'FileText',
        href: '/os/fb/menu/[id]'
      },
      {
        id: 'fb-orders',
        label: 'Orders',
        icon: 'ShoppingCart',
        href: '/os/fb/orders/[id]'
      },
      {
        id: 'fb-reservations',
        label: 'Reservations',
        icon: 'Calendar',
        href: '/os/fb/reservations/[id]'
      },
      {
        id: 'fb-tables',
        label: 'Table Management',
        icon: 'Building',
        href: '/os/fb/tables/[id]'
      },
      {
        id: 'fb-kitchen',
        label: 'Kitchen Display',
        icon: 'Sparkles',
        href: '/os/fb/kitchen/[id]'
      },
      {
        id: 'fb-inventory',
        label: 'Inventory',
        icon: 'Package',
        href: '/os/fb/inventory/[id]'
      },
      {
        id: 'fb-pos',
        label: 'Point of Sale',
        icon: 'Calculator',
        href: '/os/fb/pos/[id]'
      },
      {
        id: 'fb-reports',
        label: 'F&B Reports',
        icon: 'BarChart3',
        href: '/os/fb/reports/[id]'
      }
    ]
  },
  {
    id: 'events',
    label: 'Event Management',
    items: [
      {
        id: 'events-dashboard',
        label: 'Events Dashboard',
        icon: 'LayoutDashboard',
        href: '/os/events/dashboard/[id]'
      },
      {
        id: 'event-bookings',
        label: 'Event Bookings',
        icon: 'Calendar',
        href: '/os/events/bookings/[id]'
      },
      {
        id: 'event-venues',
        label: 'Venues',
        icon: 'Building2',
        href: '/os/events/venues/[id]'
      },
      {
        id: 'event-packages',
        label: 'Event Packages',
        icon: 'Package',
        href: '/os/events/packages/[id]'
      },
      {
        id: 'event-services',
        label: 'Services',
        icon: 'Wrench',
        href: '/os/events/services/[id]'
      },
      {
        id: 'event-staff',
        label: 'Event Staff',
        icon: 'Users',
        href: '/os/events/staff/[id]'
      },
      {
        id: 'event-calendar',
        label: 'Event Calendar',
        icon: 'CalendarDays',
        href: '/os/events/calendar/[id]'
      },
      {
        id: 'event-billing',
        label: 'Event Billing',
        icon: 'Receipt',
        href: '/os/events/billing/[id]'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Settings & Configuration',
    items: [
      {
        id: 'property-settings',
        label: 'Property Settings',
        icon: 'Settings',
        href: '/os/settings/[id]'
      },
      {
        id: 'booking-settings',
        label: 'Booking Settings',
        icon: 'Calendar',
        href: '/os/settings/booking'
      },
      {
        id: 'payment-settings',
        label: 'Payment Settings',
        icon: 'CreditCard',
        href: '/os/settings/payment'
      },
      {
        id: 'notification-settings',
        label: 'Notifications',
        icon: 'Bell',
        href: '/os/settings/notifications'
      },
      {
        id: 'integration-settings',
        label: 'Integrations',
        icon: 'Link',
        href: '/os/settings/integrations'
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: 'Users',
        href: '/os/settings/users'
      },
      {
        id: 'security-settings',
        label: 'Security',
        icon: 'Shield',
        href: '/os/settings/security'
      },
      {
        id: 'backup-restore',
        label: 'Backup & Restore',
        icon: 'Database',
        href: '/os/settings/backup'
      }
    ]
  },
  {
    id: 'accessibility',
    label: 'Accessibility & UX',
    items: [
      {
        id: 'accessibility-demo',
        label: 'Accessibility Demo',
        icon: 'Accessibility',
        href: '/os/accessibility-demo'
      },
      {
        id: 'keyboard-shortcuts',
        label: 'Keyboard Shortcuts',
        icon: 'Keyboard',
        href: '/os/accessibility/shortcuts'
      },
      {
        id: 'help-documentation',
        label: 'Help & Documentation',
        icon: 'HelpCircle',
        href: '/os/accessibility/help'
      },
      {
        id: 'user-onboarding',
        label: 'User Onboarding',
        icon: 'GraduationCap',
        href: '/os/accessibility/onboarding'
      }
    ]
  }
];

export const getMenuSectionById = (sectionId: string): MenuSection | undefined => {
  return menuStructure.find(section => section.id === sectionId);
};

export const getMenuItemById = (sectionId: string, itemId: string): MenuItem | undefined => {
  const section = getMenuSectionById(sectionId);
  return section?.items.find(item => item.id === itemId);
};

export const getAllMenuItems = (): MenuItem[] => {
  return menuStructure.flatMap(section => section.items);
};

export const getActiveMenuItem = (pathname: string): MenuItem | undefined => {
  return getAllMenuItems().find(item => item.href === pathname);
}; 