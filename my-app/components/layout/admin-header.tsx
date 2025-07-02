"use client"

import { useState, useEffect } from 'react';
import { 
  BellIcon, 
  FlagIcon, 
  MenuIcon, 
  CloseIcon, 
  LogOutIcon, 
  UserIcon, 
  HomeIcon, 
  SettingsIcon, 
  AnalyticsIcon, 
  UsersIcon, 
  ShieldIcon, 
  BuildingIcon 
} from '@/components/ui/enhanced-icons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ModeToggle } from '@/components/ui/mode-toggle';

// Add NotificationItem interface before the function
interface NotificationItemProps {
  title: string;
  description: string;
  time: string;
  isUnread?: boolean;
}

function NotificationItem({ title, description, time, isUnread = false }: NotificationItemProps) {
  return (
    <div className={`p-2 xs:p-3 hover:bg-gray-100 dark:hover:bg-darkGreen/50 cursor-pointer ${isUnread ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="font-medium text-xs xs:text-sm">{title}</div>
        {isUnread && <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-blue-500"></div>}
      </div>
      <div className="text-[10px] xs:text-xs text-gray-500 dark:text-gray-400 mt-0.5 xs:mt-1">{description}</div>
      <div className="text-[10px] xs:text-xs text-gray-400 dark:text-gray-500 mt-0.5 xs:mt-1">{time}</div>
    </div>
  );
}

export default function AdminHeader() {
  const [pendingReports, setPendingReports] = useState(0);
  const [notifications, setNotifications] = useState(3); // Example notification count
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchPendingReports = async () => {
      try {
        const response = await fetch('/api/admin/reports?status=PENDING&limit=1');
        const data = await response.json();
        if (response.ok) {
          setPendingReports(data.statusCounts?.PENDING || 0);
        }
      } catch (error) {
        console.error('Error fetching pending reports:', error);
      }
    };

    fetchPendingReports();
    // Set up polling every 5 minutes to check for new reports
    const interval = setInterval(fetchPendingReports, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navigationItems = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
    { name: 'Users', href: '/admin/users', icon: UsersIcon },
    { name: 'Properties', href: '/admin/properties', icon: BuildingIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: AnalyticsIcon },
    { name: 'Reports', href: '/admin/reports', icon: FlagIcon, badge: pendingReports },
    { name: 'Settings', href: '/admin/settings', icon: SettingsIcon },
  ];

  return (
    <header className="bg-white dark:bg-darkGreen border-b border-gray-200 dark:border-lightGreen/20 sticky top-0 z-40">
      <div className="container mx-auto px-3 xs:px-4">
        <div className="flex h-12 xs:h-14 sm:h-16 items-center justify-between">
          {/* Logo and site name */}
          <div className="flex items-center">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-1.5 xs:gap-2 text-darkGreen dark:text-lightYellow font-semibold"
            >
              <ShieldIcon className="h-5 xs:h-6 w-5 xs:w-6 text-lightGreen" size="md" />
              <span className="text-base xs:text-lg hidden md:block">Baithaka Admin</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-2 lg:px-3 py-1.5 lg:py-2 rounded-md text-xs lg:text-sm font-medium flex items-center gap-1 lg:gap-1.5 relative
                  ${pathname === item.href
                    ? 'bg-lightGreen/10 text-lightGreen'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-lightYellow/70 dark:hover:bg-darkGreen/50'
                  } transition-colors duration-200`}
              >
                <item.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                <span>{item.name}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] xs:text-xs rounded-full w-3.5 h-3.5 xs:w-4 xs:h-4 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-1.5 xs:space-x-3">
            <ModeToggle />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-7 w-7 xs:h-8 xs:w-8">
                  <BellIcon className="h-4 w-4 xs:h-5 xs:w-5" size="sm" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] xs:text-xs rounded-full w-3.5 h-3.5 xs:w-4 xs:h-4 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 xs:w-80">
                <DropdownMenuLabel className="text-xs xs:text-sm">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[250px] xs:max-h-[300px] overflow-y-auto">
                  <NotificationItem
                    title="New User Registration"
                    description="John Doe just signed up as a new host."
                    time="10 minutes ago"
                  />
                  <NotificationItem
                    title="Property Report"
                    description="A new property has been reported for review."
                    time="1 hour ago"
                    isUnread
                  />
                  <NotificationItem
                    title="System Update"
                    description="The system has been updated to version 2.3.0"
                    time="2 days ago"
                  />
                </div>
                <DropdownMenuSeparator />
                <Link href="/admin/notifications" className="w-full">
                  <DropdownMenuItem className="cursor-pointer text-center text-xs xs:text-sm font-medium text-lightGreen">
                    View all notifications
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 xs:h-8 xs:w-8">
                  <Avatar className="h-7 w-7 xs:h-8 xs:w-8">
                    <AvatarImage src="/admin-avatar.png" alt="Admin" />
                    <AvatarFallback className="bg-lightGreen text-darkGreen text-xs xs:text-sm">AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 xs:w-56">
                <DropdownMenuLabel className="text-xs xs:text-sm">My Account</DropdownMenuLabel>
                <DropdownMenuItem className="text-xs xs:text-sm">
                  <UserIcon className="mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" size="sm" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs xs:text-sm">
                  <SettingsIcon className="mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" size="sm" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400 text-xs xs:text-sm">
                  <LogOutIcon className="mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4" size="sm" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-7 w-7 xs:h-8 xs:w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseIcon className="h-4 w-4 xs:h-5 xs:w-5" size="sm" /> : <MenuIcon className="h-4 w-4 xs:h-5 xs:w-5" size="sm" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white dark:bg-darkGreen border-t border-gray-200 dark:border-lightGreen/20"
          >
            <div className="px-2 pt-1.5 pb-2 xs:py-2 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`className="flex items-center gap-1.5 xs:gap-2 px-2.5 py-1.5 xs:py-2 rounded-md text-xs xs:text-base font-medium relative"
                    ${pathname === item.href
                      ? 'bg-lightGreen/10 text-lightGreen'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-lightYellow/70 dark:hover:bg-darkGreen/50'
                    }`}
                >
                  <item.icon className="h-3.5 w-3.5 xs:h-5 xs:w-5" />
                  <span>{item.name}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] xs:text-xs rounded-full px-1.5 xs:px-2 py-0.5 min-w-[16px] xs:min-w-[20px] text-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              ))}
              <div className="pt-1 mt-1 xs:pt-2 xs:mt-2 border-t border-gray-200 dark:border-lightGreen/20">
                <button
                  className="w-full px-2.5 py-1.5 xs:py-2 rounded-md text-xs xs:text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1.5 xs:gap-2"
                >
                  <LogOutIcon className="h-3.5 w-3.5 xs:h-5 xs:w-5" size="sm" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
