'use client';

import { ThemeProvider } from "../ui/theme-provider";
import { ToastProvider } from "../ui/toast";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { applyPolyfills } from "../../public/polyfills";

// Load polyfills for browser compatibility
const loadPolyfills = () => {
  if (typeof window !== 'undefined') {
    // Apply polyfills
    applyPolyfills();

    // Fix common hydration issues
    window.setTimeout(() => {
      if (document.body.classList.contains('hydration-error')) {
        document.body.classList.remove('hydration-error');
      }
    }, 0);
  }
};

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    loadPolyfills();
  }, []);

  return (
    <>
      <SessionProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}
