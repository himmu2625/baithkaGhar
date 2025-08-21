'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronDown, 
  ChevronRight, 
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  DollarSign,
  UserCheck,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  FileText,
  Bed,
  Hotel,
  Wifi,
  Wrench,
  Sparkles,
  Building,
  BedSingle,
  BedDouble,
  Phone,
  Globe,
  LogIn,
  MessageSquare,
  Smartphone,
  CreditCard,
  Receipt,
  RotateCcw,
  TrendingUp,
  Percent,
  ShoppingCart,
  Calculator,
  Shield,
  Clock,
  Target,
  GraduationCap,
  Building2,
  CalendarDays,
  BarChart,
  Download,
  Link as LinkIcon,
  Database
} from 'lucide-react';
import { menuStructure, MenuSection, MenuItem, getActiveMenuItem } from './menu-structure';
import { useParams } from 'next/navigation';

interface EnhancedSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  isTablet?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  LayoutDashboard,
  BarChart3,
  FileText,
  Bed,
  Hotel,
  Wifi,
  Wrench,
  Sparkles,
  Building,
  Calendar,
  BedSingle,
  BedDouble,
  Users,
  Phone,
  Globe,
  LogIn,
  LogOut,
  User,
  MessageSquare,
  Bell,
  Smartphone,
  CreditCard,
  Receipt,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Percent,
  ShoppingCart,
  Calculator,
  UserCheck,
  Shield,
  Clock,
  Target,
  GraduationCap,
  Building2,
  CalendarDays,
  BarChart,
  Download,
  Settings,
  Link: LinkIcon,
  Database
};

interface MenuItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  level?: number;
  resolveHref?: (href: string) => string;
}

const MenuItemComponent: React.FC<MenuItemProps> = ({
  item,
  isCollapsed,
  isActive,
  isExpanded,
  onToggle,
  level = 0,
  resolveHref = (href) => href
}) => {
  const IconComponent = item.icon ? iconMap[item.icon] : null;
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = level * 16 + 16;

  if (isCollapsed) {
    return (
      <div className="relative group">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full h-10 p-0 justify-center relative",
            isActive && "bg-primary text-primary-foreground"
          )}
          asChild={!hasChildren}
        >
          {hasChildren ? (
            <div onClick={onToggle} className="w-full h-full flex items-center justify-center">
              {IconComponent && <IconComponent className="h-4 w-4" />}
            </div>
          ) : (
            <Link href={resolveHref(item.href || '#')}>
              {IconComponent && <IconComponent className="h-4 w-4" />}
            </Link>
          )}
        </Button>
        
        {/* Tooltip for collapsed state */}
        <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          {item.label}
          {item.badge && (
            <Badge variant={item.badgeColor || 'default'} className="ml-1 text-xs">
              {item.badge}
            </Badge>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "w-full justify-start h-10 px-3",
          isActive && "bg-primary text-primary-foreground",
          "hover:bg-accent hover:text-accent-foreground"
        )}
        asChild={!hasChildren}
        onClick={hasChildren ? onToggle : undefined}
      >
        {hasChildren ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {IconComponent && <IconComponent className="h-4 w-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <Badge variant={item.badgeColor || 'default'} className="text-xs">
                  {item.badge}
                </Badge>
              )}
              {hasChildren && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </div>
        ) : (
          <Link href={resolveHref(item.href || '#')} className="flex items-center gap-3 w-full">
            {IconComponent && <IconComponent className="h-4 w-4" />}
            <span className="text-sm font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant={item.badgeColor || 'default'} className="ml-auto text-xs">
                {item.badge}
              </Badge>
            )}
          </Link>
        )}
      </Button>
      
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children?.map((child) => (
            <MenuItemComponent
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              isActive={false}
              isExpanded={false}
              onToggle={() => {}}
              level={level + 1}
              resolveHref={resolveHref}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const EnhancedSidebar: React.FC<EnhancedSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobile = false,
  isTablet = false
}) => {
  const pathname = usePathname();
  const params = useParams();
  const propertyId = params.id as string;
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Helper function to resolve dynamic routes
  const resolveHref = (href: string) => {
    if (href.includes('[id]') && propertyId) {
      return href.replace('[id]', propertyId);
    }
    return href;
  };

  // Auto-expand sections based on current path
  useEffect(() => {
    const activeItem = getActiveMenuItem(pathname);
    if (activeItem) {
      const section = menuStructure.find(section => 
        section.items.some(item => item.id === activeItem.id)
      );
      if (section) {
        setExpandedSections(prev => new Set([...prev, section.id]));
      }
    }
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isItemActive = (item: MenuItem): boolean => {
    const resolvedHref = resolveHref(item.href || '');
    return resolvedHref === pathname;
  };

  const isSectionActive = (section: MenuSection): boolean => {
    return section.items.some(item => isItemActive(item));
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-background border-r",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">BG</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Baithaka GHAR OS</h2>
              <p className="text-xs text-muted-foreground">Property Management</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {menuStructure.map((section) => {
            const isActive = isSectionActive(section);
            const isExpanded = expandedSections.has(section.id);

            return (
              <div key={section.id} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3 py-2">
                    <h3 className={cn(
                      "text-xs font-semibold uppercase tracking-wider",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                      {section.label}
                    </h3>
                  </div>
                )}
                
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <MenuItemComponent
                      key={item.id}
                      item={item}
                      isCollapsed={isCollapsed}
                      isActive={isItemActive(item)}
                      isExpanded={isExpanded}
                      onToggle={() => toggleSection(section.id)}
                      resolveHref={resolveHref}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Menu */}
      <div className="border-t p-4">
        {isCollapsed ? (
          <div className="flex flex-col items-center space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Property Manager</p>
                <p className="text-xs text-muted-foreground truncate">manager@baithakaghar.com</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex-1">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 