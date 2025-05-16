"use client";
import { useState } from "react";
import type React from "react";
import { useSession } from "next-auth/react";

import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  Sparkles,
  MapPin,
  HelpCircle,
  Building,
  BarChart3,
  Shield,
  Send,
  ArrowRight,
  Linkedin,
  Youtube,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { data: session } = useSession();

  // Direct navigation function using window.open
  const navigateTo = (path: string) => {
    // Check for previously recorded navigation attempt to avoid loops
    const lastPath = sessionStorage.getItem("lastNavPath");
    const now = new Date().getTime();
    const lastNavTime = parseInt(sessionStorage.getItem("lastNavTime") || "0");
    const timeDiff = now - lastNavTime;

    // If we're trying to navigate to the same path within 1 second, it might be a loop
    if (lastPath === path && timeDiff < 1000) {
      console.warn(
        "Navigation loop detected in footer, redirecting to home instead"
      );
      window.location.href = "/";
      return;
    }

    // Record this navigation attempt
    sessionStorage.setItem("lastNavPath", path);
    sessionStorage.setItem("lastNavTime", now.toString());

    // Use normal navigation
    window.location.href = path;
  };

  // Improved protected link handler with forced navigation
  const handleProtectedLink = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Clear session check
    if (session?.user) {
      console.log(
        `Footer: User is authenticated, forcefully navigating to ${path}`
      );
      // Use window.open with _self to force a fresh page load
      window.open(path, "_self");
    } else {
      console.log(
        `Footer: User is not authenticated, redirecting to login with callback to ${path}`
      );
      // Redirect to login page with callback URL
      window.open(`/login?callbackUrl=${encodeURIComponent(path)}`, "_self");
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  // Improved rendering for quick links with clearer auth handling
  const renderQuickLink = (link: any) => {
    // Special handling for "List Your Property" which needs auth
    if (link.label === "List Your Property") {
      return (
        <a
          href={link.href}
          className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
          onClick={(e) => handleProtectedLink(link.href, e)}
        >
          <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </span>
          <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
            {link.label}
          </span>
        </a>
      );
    }

    // Host Dashboard also needs auth
    if (link.label === "Host Dashboard") {
      return (
        <a
          href={link.href}
          className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
          onClick={(e) => handleProtectedLink(link.href, e)}
        >
          <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </span>
          <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
            {link.label}
          </span>
        </a>
      );
    }

    // Standard public links
    return (
      <a
        href={link.href}
        className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
        onClick={(e) => {
          e.preventDefault();
          navigateTo(link.href);
        }}
      >
        <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
        </span>
        <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
          {link.label}
        </span>
      </a>
    );
  };

  return (
    <footer className="bg-darkGreen text-lightYellow relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-lightGreen/10 via-lightGreen to-lightGreen/10"></div>
      <div className="absolute -top-12 right-20 w-32 h-32 rounded-full bg-lightGreen/15 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-lightGreen/15 blur-xl"></div>
      <div className="absolute top-1/3 left-1/2 w-24 h-24 rounded-full bg-lightGreen/10 blur-lg"></div>

      <div className="container mx-auto px-3 xs:px-4 py-10 xs:py-12 sm:py-16 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-8 xs:gap-10 md:gap-8 mb-8 xs:mb-10 sm:mb-12">
          {/* Company info and social - 3 columns on md+ */}
          <div className="md:col-span-3 border-l-2 border-lightGreen/20 pl-4">
            <div className="mb-5 xs:mb-7">
              <a
                href="/"
                className="text-xl xs:text-2xl font-bold flex items-center gap-1.5 xs:gap-2 group mb-3 xs:mb-4"
                onClick={(e) => {
                  e.preventDefault();
                  navigateTo("/");
                }}
              >
                <Sparkles className="h-5 w-5 xs:h-6 xs:w-6 text-lightGreen group-hover:animate-pulse-light transition-all duration-300" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-lightYellow to-lightGreen">
                  Baithaka Ghar
                </span>
              </a>
              <p className="text-lightYellow/80 mb-4 xs:mb-5 max-w-md text-sm xs:text-base leading-relaxed">
                Experience premium stays across India with Baithaka Ghar. We
                offer exceptional accommodations with a focus on comfort,
                convenience, and unforgettable experiences.
              </p>

              {/* Newsletter subscription with enhanced styling */}
              <div className="bg-lightGreen/5 backdrop-blur-md rounded-lg p-4 border border-lightGreen/20">
                <h3 className="text-base xs:text-lg font-semibold mb-3 text-lightGreen flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Subscribe to Our Newsletter
                </h3>
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col xs:flex-row gap-2"
                >
                  <div className="relative flex-1">
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-darkGreen/50 border-lightGreen/30 text-lightYellow placeholder:text-lightYellow/50 pr-8 xs:pr-10 h-9 xs:h-10 text-xs xs:text-sm"
                      required
                    />
                    <Send className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-lightGreen/50" />
                  </div>
                  <Button
                    type="submit"
                    className="bg-lightGreen hover:bg-lightGreen/80 text-darkGreen font-medium h-9 xs:h-10 text-xs xs:text-sm px-3 xs:px-4"
                  >
                    {isSubscribed ? "Subscribed!" : "Subscribe"}
                  </Button>
                </form>
                {isSubscribed && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs xs:text-sm text-lightGreen mt-2"
                  >
                    Thank you for subscribing to our newsletter!
                  </motion.p>
                )}
              </div>
            </div>

            {/* Social media links */}
            <div className="flex flex-wrap gap-3 xs:gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-lightGreen/10 hover:bg-lightGreen/20 p-2 rounded-full text-lightGreen hover:text-white transition-all duration-300 hover:scale-110 group"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4 xs:h-5 xs:w-5 group-hover:animate-pulse-light" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - 2 columns on md+ */}
          <div className="md:col-span-2 sm:col-start-1 md:col-start-auto border-l-2 border-lightGreen/20 pl-4">
            <h3 className="text-base xs:text-xl font-bold mb-3 xs:mb-5 text-lightGreen flex items-center gap-1.5 xs:gap-2">
              <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Quick Links
            </h3>
            <ul className="space-y-1.5 xs:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>{renderQuickLink(link)}</li>
              ))}
            </ul>
          </div>

          {/* Support Links - 2 columns on md+ */}
          <div className="md:col-span-2 border-l-2 border-lightGreen/20 pl-4">
            <h3 className="text-base xs:text-xl font-bold mb-3 xs:mb-5 text-lightGreen flex items-center gap-1.5 xs:gap-2">
              <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Support
            </h3>
            <ul className="space-y-1.5 xs:space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateTo(link.href);
                    }}
                  >
                    <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </span>
                    <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
                      {link.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-5 xs:mt-8">
              <h3 className="text-base xs:text-xl font-bold mb-2 xs:mb-4 text-lightGreen flex items-center gap-1.5 xs:gap-2">
                <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                Contact Us
              </h3>
              <ul className="space-y-1.5 xs:space-y-3">
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <Mail className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-lightGreen" />
                  <a
                    href="mailto:anuragsingh@baithakaghar.com"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                  >
                    anuragsingh@baithakaghar.com
                  </a>
                </li>
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <Phone className="mr-1.5 xs:mr-2 h-3.5 w-3.5 xs:h-4 xs:w-4 text-lightGreen" />
                  <a
                    href="tel:+91 9356547176"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                  >
                    +91 9356547176
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="border-t border-lightGreen/30 pt-6 xs:pt-8 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-lightYellow/70 text-xs xs:text-sm mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} Baithaka Ghar. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 xs:gap-5 md:gap-8 text-xs xs:text-sm text-lightYellow/70">
            <a
              href="/terms"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("/terms");
              }}
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("/privacy");
              }}
            >
              Privacy Policy
            </a>
            <a
              href="/cookies"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault();
                navigateTo("/cookies");
              }}
            >
              Cookie Policy
            </a>
            <a
              href="/admin/login"
              className="flex items-center text-xs xs:text-sm hover:text-lightGreen transition-colors ml-1 xs:ml-2"
              onClick={(e) => {
                e.preventDefault();
                // Check if user is already authenticated
                if (session?.user) {
                  // If user has admin role, send to dashboard directly
                  if (
                    session.user.role === "admin" ||
                    session.user.role === "super_admin"
                  ) {
                    navigateTo("/admin/dashboard");
                  } else {
                    // Non-admin users go to login with an unauthorized message
                    sessionStorage.setItem("adminLoginInfo", "unauthorized");
                    navigateTo("/admin/login");
                  }
                } else {
                  // Unauthenticated users go to the login page
                  navigateTo("/admin/login");
                }
              }}
            >
              <Shield className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
              Admin Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social media links data
const socialLinks = [
  { name: "Facebook", icon: Facebook, url: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, url: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, url: "https://twitter.com" },
  { name: "LinkedIn", icon: Linkedin, url: "https://linkedin.com" },
  { name: "YouTube", icon: Youtube, url: "https://youtube.com" },
];

// Quick links data
const quickLinks = [
  { label: "About Us", href: "/about", icon: Sparkles },
  { label: "Contact Us", href: "/contact", icon: MapPin },
  { label: "FAQs", href: "/faq", icon: HelpCircle },
  { label: "List Your Property", href: "/list-property", icon: Building },
  { label: "Host Dashboard", href: "/host/dashboard", icon: BarChart3 },
];

// Support links data
const supportLinks = [
  { label: "Help Center", href: "/help", icon: HelpCircle },
  { label: "Cancellation Policy", href: "/cancellation", icon: MapPin },
  { label: "Safety Resources", href: "/safety", icon: Shield },
  { label: "Accessibility", href: "/accessibility", icon: Sparkles },
];
