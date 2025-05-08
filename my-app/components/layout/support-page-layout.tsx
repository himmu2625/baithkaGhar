"use client";

import Link from "next/link";
import { ArrowLeft, HelpCircle, MapPin, Shield, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportPageLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  currentPath: string;
}

export default function SupportPageLayout({
  children,
  title,
  description,
  currentPath,
}: SupportPageLayoutProps) {
  // Support links for sidebar navigation
  const supportLinks = [
    { label: "Help Center", href: "/help", icon: HelpCircle },
    { label: "Cancellation Policy", href: "/cancellation", icon: MapPin },
    { label: "Safety Resources", href: "/safety", icon: Shield },
    { label: "Accessibility", href: "/accessibility", icon: Sparkles },
  ];

  return (
    <main className="pt-24 pb-16 min-h-screen">
      <div className="container mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center text-darkGreen hover:text-mediumGreen mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        <div className="flex flex-col md:flex-row md:gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 mb-6 md:mb-0">
            <div className="bg-lightGreen/10 rounded-lg p-4">
              <h3 className="text-darkGreen font-semibold mb-4">Support</h3>
              <nav className="space-y-2">
                {supportLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center p-2 rounded-md text-sm transition-colors",
                      currentPath === link.href
                        ? "bg-lightGreen/20 text-darkGreen font-medium"
                        : "text-gray-600 hover:bg-lightGreen/10 hover:text-darkGreen"
                    )}
                  >
                    <link.icon className="mr-2 h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-darkGreen/20 rounded-lg shadow p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-darkGreen mb-2">
                {title}
              </h1>
              {description && (
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  {description}
                </p>
              )}
              <div className="prose dark:prose-invert max-w-none">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
