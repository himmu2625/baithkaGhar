"use client";

import React, { createContext, useState, ReactNode } from 'react';
import GlobalLoader from '@/components/common/GlobalLoader';

interface LoaderContextType {
  showLoader: () => void;
  hideLoader: () => void;
}

export const LoaderContext = createContext<LoaderContextType | undefined>(undefined);

export const LoaderProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  const showLoader = () => setLoading(true);
  const hideLoader = () => setLoading(false);

  return (
    <LoaderContext.Provider value={{ showLoader, hideLoader }}>
      {loading && <GlobalLoader />}
      {children}
    </LoaderContext.Provider>
  );
}; 