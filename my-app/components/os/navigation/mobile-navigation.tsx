'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Package,
  Calendar,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  Home,
  Bed,
  CreditCard,
  FileText,
  Bell,
  Search,
  Plus,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { menuStructure, MenuSection, MenuItem } from './menu-structure';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number;
}

const bottomNavItems: BottomNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/os/dashboard'
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: Package,
    href: '/os/inventory'
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: Calendar,
    href: '/os/bookings'
  },
  {
    id: 'guests',
    label: 'Guests',
    icon: Users,
    href: '/os/guests'
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: DollarSign,
    href: '/os/finance'
  }
];

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Update active tab based on current path
  useEffect(() => {
    const currentTab = bottomNavItems.find(item => 
      pathname.startsWith(item.href)
    )?.id || 'dashboard';
    setActiveTab(currentTab);
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
    return item.href === pathname;
  };

  const isSectionActive = (section: MenuSection): boolean => {
    return section.items.some(item => isItemActive(item));
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">BG</span>
            </div>
            <div>
              <h2 className="font-semibold text-sm">Baithaka GHAR OS</h2>
              <p className="text-xs text-gray-500">Property Management</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-4 space-y-4">
            {menuStructure.map((section) => {
              const isActive = isSectionActive(section);
              const isExpanded = expandedSections.has(section.id);

              return (
                <div key={section.id} className="space-y-2">
                  {/* Section Header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      "flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors",
                      isActive ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                    )}
                  >
                    <span className="font-medium text-sm">{section.label}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {/* Section Items */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {section.items.map((item) => {
                        const isItemActive = item.href === pathname;
                        
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg text-sm transition-colors",
                              isItemActive 
                                ? "bg-blue-100 text-blue-700 font-medium" 
                                : "text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.badge && (
                              <Badge variant="secondary" className="ml-auto">
                                {item.badge}
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-2">
            <Button className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Button>
            <Button variant="outline" className="w-full" size="sm">
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-0 flex-1",
                  isActive 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
                    >
                      {item.badge > 9 ? '9+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-50 lg:hidden">
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => {
            // Quick action - could open a modal or navigate
            console.log('Quick action');
          }}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
}

// Mobile-specific navigation hook
export function useMobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen(!isOpen);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return { isOpen, open, close, toggle };
}

// Mobile gesture navigation component
export function MobileGestureNavigation() {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      // Swipe left - could be used for next page or close sidebar
      console.log('Swipe left');
    }
    if (isRightSwipe) {
      // Swipe right - could be used for previous page or open sidebar
      console.log('Swipe right');
    }
  };

  return (
    <div
      className="fixed inset-0 z-30 pointer-events-none lg:hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    />
  );
} 