"use client";

import { ReactNode } from 'react';
import { ReportProvider } from '@/hooks/use-report';

export function PropertyDetailsWrapper({ children }: { children: ReactNode }) {
  return (
    <ReportProvider>
      {children}
    </ReportProvider>
  );
} 