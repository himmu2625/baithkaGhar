"use client"

import { SessionProvider } from "@/components/common/session-provider"
import { Toaster } from "@/components/ui/toaster"

export const dynamic = 'force-dynamic';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
}