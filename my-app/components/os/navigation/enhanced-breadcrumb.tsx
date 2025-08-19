'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight, 
  Home, 
  FolderOpen,
  Settings,
  Users,
  Calendar,
  Package,
  DollarSign,
  BarChart3,
  UserCheck
} from 'lucide-react';
import { menuStructure, getActiveMenuItem, getAllMenuItems } from './menu-structure';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<any>;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  FolderOpen,
  Settings,
  Users,
  Calendar,
  Package,
  DollarSign,
  BarChart3,
  UserCheck,
  LayoutDashboard: Home,
  Bed: Package,
  Hotel: Package,
  Wifi: Package,
  Wrench: Package,
  Sparkles: Package,
  Building: Package,
  BedSingle: Calendar,
  BedDouble: Calendar,
  Phone: Calendar,
  Globe: Calendar,
  LogIn: Users,
  LogOut: Users,
  User: Users,
  MessageSquare: Users,
  Bell: Users,
  Smartphone: Users,
  CreditCard: DollarSign,
  Receipt: DollarSign,
  RotateCcw: DollarSign,
  TrendingUp: DollarSign,
  Percent: DollarSign,
  ShoppingCart: DollarSign,
  Calculator: DollarSign,
  Shield: UserCheck,
  Clock: UserCheck,
  Target: UserCheck,
  GraduationCap: UserCheck,
  Building2: UserCheck,
  CalendarDays: BarChart3,
  BarChart: BarChart3,
  FileText: BarChart3,
  Download: BarChart3,
  Link: Settings,
  Database: Settings
};

const generateBreadcrumbs = (pathname: string): BreadcrumbItem[] => {
  const breadcrumbs: BreadcrumbItem[] = [];
  
  // Split pathname into segments
  const segments = pathname.split('/').filter(Boolean);
  
  // Remove 'os' from segments if present
  const osIndex = segments.indexOf('os');
  if (osIndex !== -1) {
    segments.splice(osIndex, 1);
  }

  let currentPath = '/os';
  
  // If we're at the root dashboard, just return the home breadcrumb
  if (pathname === '/os/dashboard' || pathname === '/os') {
    return [{
      label: 'Dashboard',
      href: '/os/dashboard',
      icon: Home
    }];
  }
  
  // Add home breadcrumb for other pages
  breadcrumbs.push({
    label: 'Dashboard',
    href: '/os/dashboard',
    icon: Home
  });
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    
    // Find the menu item for this path
    const menuItem = getAllMenuItems().find(item => item.href === currentPath);
    
    if (menuItem) {
      const IconComponent = menuItem.icon ? iconMap[menuItem.icon] : FolderOpen;
      breadcrumbs.push({
        label: menuItem.label,
        href: currentPath,
        icon: IconComponent
      });
    } else {
      // For dynamic segments or unknown paths, create a generic breadcrumb
      const capitalizedSegment = segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label: capitalizedSegment,
        href: currentPath,
        icon: FolderOpen
      });
    }
  });

  return breadcrumbs;
};

interface EnhancedBreadcrumbProps {
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export const EnhancedBreadcrumb: React.FC<EnhancedBreadcrumbProps> = ({
  className,
  showHome = true,
  maxItems = 5
}) => {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  
  // Limit the number of breadcrumbs shown
  const visibleBreadcrumbs = maxItems ? breadcrumbs.slice(-maxItems) : breadcrumbs;
  
  // If we're limiting and there are more breadcrumbs, add an ellipsis
  const hasHiddenBreadcrumbs = breadcrumbs.length > visibleBreadcrumbs.length;
  const startIndex = hasHiddenBreadcrumbs ? breadcrumbs.length - visibleBreadcrumbs.length : 0;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)}>
      {hasHiddenBreadcrumbs && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/os/dashboard">
              <Home className="h-3 w-3" />
            </Link>
          </Button>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">...</span>
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        </>
      )}
      
      {visibleBreadcrumbs.map((breadcrumb, index) => {
        const isLast = index === visibleBreadcrumbs.length - 1;
        const IconComponent = breadcrumb.icon;
        
        return (
          <React.Fragment key={breadcrumb.href || index}>
            <Button
              variant={isLast ? "default" : "ghost"}
              size="sm"
              className={cn(
                "h-6 px-2",
                isLast 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              asChild={!isLast}
            >
              {isLast ? (
                <div className="flex items-center gap-1">
                  {IconComponent && <IconComponent className="h-3 w-3" />}
                  <span className="font-medium">{breadcrumb.label}</span>
                </div>
              ) : (
                <Link href={breadcrumb.href || '#'} className="flex items-center gap-1">
                  {IconComponent && <IconComponent className="h-3 w-3" />}
                  <span>{breadcrumb.label}</span>
                </Link>
              )}
            </Button>
            
            {!isLast && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// Compact version for smaller spaces
export const CompactBreadcrumb: React.FC<EnhancedBreadcrumbProps> = (props) => {
  const pathname = usePathname();
  const breadcrumbs = generateBreadcrumbs(pathname);
  const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-muted-foreground hover:text-foreground"
        asChild
      >
        <Link href="/os/dashboard">
          <Home className="h-3 w-3" />
        </Link>
      </Button>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-sm font-medium">{currentBreadcrumb?.label || 'Dashboard'}</span>
    </div>
  );
};

// Breadcrumb with actions
interface BreadcrumbWithActionsProps extends EnhancedBreadcrumbProps {
  actions?: React.ReactNode;
}

export const BreadcrumbWithActions: React.FC<BreadcrumbWithActionsProps> = ({
  actions,
  ...props
}) => {
  return (
    <div className="flex items-center justify-between">
      <EnhancedBreadcrumb {...props} />
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}; 