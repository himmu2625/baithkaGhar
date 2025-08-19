'use client';

import React from 'react';
import { EnhancedBreadcrumb } from '@/components/os/navigation';

interface BreadcrumbProps {
  className?: string;
  showHome?: boolean;
  maxItems?: number;
}

export function Breadcrumb({ 
  className, 
  showHome = true, 
  maxItems = 5 
}: BreadcrumbProps) {
  return (
    <EnhancedBreadcrumb 
      className={className}
      showHome={showHome}
      maxItems={maxItems}
    />
  );
} 