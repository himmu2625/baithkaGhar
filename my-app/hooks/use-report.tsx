"use client";

import { useState, useCallback, ReactNode, createContext, useContext } from 'react';
import { ReportForm } from '@/components/forms/report-form';
import Report from '@/models/Report';
import { ReportTargetType } from '@/models/reportTypes';

interface ReportContextType {
  openReportDialog: (params: {
    targetType: ReportTargetType;
    targetId: string;
    targetName: string;
    onSuccess?: () => void;
  }) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export interface ReportProviderProps {
  children: ReactNode;
}

export function ReportProvider({ children }: ReportProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportParams, setReportParams] = useState<{
    targetType: ReportTargetType;
    targetId: string;
    targetName: string;
    onSuccess?: () => void;
  } | null>(null);

  const openReportDialog = useCallback(
    (params: {
      targetType: ReportTargetType;
      targetId: string;
      targetName: string;
      onSuccess?: () => void;
    }) => {
      setReportParams(params);
      setIsOpen(true);
    },
    []
  );

  return (
    <ReportContext.Provider value={{ openReportDialog }}>
      {children}
      {reportParams && (
        <ReportForm
          open={isOpen}
          onOpenChange={setIsOpen}
          targetType={reportParams.targetType}
          targetId={reportParams.targetId}
          targetName={reportParams.targetName}
          onSuccess={reportParams.onSuccess}
        />
      )}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);
  
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  
  return context;
} 