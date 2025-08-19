'use client';

import React, { useState } from 'react';
import { EnhancedSidebar } from '@/components/os/navigation';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile: boolean;
  isTablet?: boolean;
}

export function Sidebar({ isOpen, onToggle, isMobile, isTablet }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out",
      "bg-white border-r border-gray-200 shadow-lg",
      isOpen ? "translate-x-0" : "-translate-x-full",
      !isMobile && "relative transform-none",
      isTablet && "w-80",
      !isTablet && !isMobile && "w-64"
    )}>
      <EnhancedSidebar 
        isCollapsed={isCollapsed} 
        onToggleCollapse={handleToggleCollapse}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
} 