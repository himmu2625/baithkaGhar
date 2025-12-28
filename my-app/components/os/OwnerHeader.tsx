"use client";

import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

interface OwnerHeaderProps {
  session: any;
  onMenuClick?: () => void;
}

export default function OwnerHeader({ session, onMenuClick }: OwnerHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      {/* Left Side - Menu Button (Mobile) + Search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-gray-700" />
        </button>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Notifications & User */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Notifications Bell */}
        <NotificationBell />

        {/* User Avatar */}
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {session?.user?.name?.charAt(0)?.toUpperCase() || 'O'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
