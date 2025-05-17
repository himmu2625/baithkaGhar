"use client";

import { usePathname } from "next/navigation";
import Footer from "./footer";

export default function FooterWrapper() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') && pathname !== '/admin/login' && pathname !== '/admin/setup';
  
  // Don't render the footer for admin routes - it's handled in the admin layout
  if (isAdminRoute) {
    return null;
  }
  
  return <Footer />;
} 