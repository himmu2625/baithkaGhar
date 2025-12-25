"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OwnerSidebarProps {
  session: any;
}

const navigation = [
  { name: 'Dashboard', href: '/os/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/os/properties', icon: Building2 },
  { name: 'Bookings', href: '/os/bookings', icon: Calendar },
  { name: 'Payments', href: '/os/payments', icon: CreditCard },
  { name: 'Reports', href: '/os/reports', icon: FileText },
  { name: 'Profile', href: '/os/profile', icon: User },
];

export default function OwnerSidebar({ session }: OwnerSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/os/login' });
  };

  return (
    <div
      className={cn(
        'bg-white border-r border-gray-200 flex flex-col transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <div className="ml-3">
              <h1 className="text-lg font-bold text-gray-900">Baithaka OS</h1>
              <p className="text-xs text-gray-500">Owner Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <Building2 className="w-8 h-8 text-indigo-600 mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={collapsed ? item.name : undefined}
            >
              <Icon className={cn('w-5 h-5 flex-shrink-0', collapsed ? 'mx-auto' : 'mr-3')} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="border-t border-gray-200 p-4">
        {!collapsed ? (
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || 'Owner'}
            </p>
            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {session?.user?.role === 'property_owner' ? 'Property Owner' : session?.user?.role}
            </span>
          </div>
        ) : (
          <div className="mb-3 flex justify-center">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        )}

        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className={cn('w-5 h-5', !collapsed && 'mr-3')} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full mt-2 flex items-center justify-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5 mr-2" />
          )}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </div>
  );
}
